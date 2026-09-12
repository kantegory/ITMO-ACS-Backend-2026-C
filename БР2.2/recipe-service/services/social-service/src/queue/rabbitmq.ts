import amqp, { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { config } from '../config/config';
import { deleteInteractionsForRecipe } from '../services/internalSocialService';

const EXCHANGE = 'recipe_events';
const QUEUE = 'social_service.recipe_deleted';
const ROUTING_KEY = 'recipe.deleted';

let channelModel: ChannelModel | null = null;
let connecting = false;

// Подключаемся, создаём (если их ещё нет) обменник и свою очередь, привязываем
// очередь к обменнику по routing key и начинаем слушать. Всё идемпотентно —
// повторный вызов assertExchange/assertQueue/bindQueue безопасен, если они уже существуют.
export async function connectQueue(): Promise<void> {
  if (connecting || channelModel) return;
  connecting = true;

  try {
    channelModel = await amqp.connect(config.rabbitmqUrl);

    channelModel.on('error', (err) => {
      console.error('[social-service] Ошибка соединения с RabbitMQ:', err.message);
    });

    channelModel.on('close', () => {
      console.error('[social-service] Соединение с RabbitMQ закрыто, переподключаюсь через 5 секунд...');
      channelModel = null;
      connecting = false;
      setTimeout(() => {
        connectQueue().catch((err) => console.error('Повторное подключение не удалось:', err.message));
      }, 5000);
    });

    const channel: Channel = await channelModel.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // durable — очередь переживёт перезапуск RabbitMQ вместе с уже накопленными
    // в ней сообщениями (полезно, если Social Service был выключен дольше, чем брокер)
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    channel.consume(QUEUE, (msg) => handleMessage(channel, msg));

    console.log('[social-service] Подключено к RabbitMQ, слушаю очередь', QUEUE);
  } catch (err) {
    console.error('[social-service] Не удалось подключиться к RabbitMQ, повтор через 5 секунд:', (err as Error).message);
    setTimeout(() => {
      connectQueue().catch((e) => console.error('Повторное подключение не удалось:', e.message));
    }, 5000);
  } finally {
    connecting = false;
  }
}

async function handleMessage(channel: Channel, msg: ConsumeMessage | null): Promise<void> {
  if (!msg) return; // канал отменён сервером — сообщения не будет

  try {
    const { recipeId } = JSON.parse(msg.content.toString()) as { recipeId: number };
    console.log(`🐰 [social-service] Получено событие recipe.deleted (id=${recipeId})`);

    await deleteInteractionsForRecipe(recipeId);

    // ack — подтверждаем брокеру, что сообщение обработано и его можно удалить из очереди.
    // Без ack, при обрыве соединения, RabbitMQ отдал бы это же сообщение повторно.
    channel.ack(msg);
  } catch (err) {
    console.error('[social-service] Ошибка обработки recipe.deleted:', (err as Error).message);
    // requeue: true — вернуть сообщение в очередь и попробовать позже
    // (например, если ошибка была временной — БД была недоступна долю секунды)
    channel.nack(msg, false, true);
  }
}
