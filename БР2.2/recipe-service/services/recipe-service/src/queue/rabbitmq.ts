import amqp, { ChannelModel, Channel } from 'amqplib';
import { config } from '../config/config';

// topic-обменник: сейчас у нас только одно событие (recipe.deleted), но такой тип
// обменника позволяет в будущем добавлять другие события рецепта (например,
// recipe.published) без создания новых обменников — просто новый routing key.
const EXCHANGE = 'recipe_events';

let channelModel: ChannelModel | null = null;
let channel: Channel | null = null;
let connecting = false;

// Подключаемся один раз при старте сервиса и переиспользуем канал для всех
// последующих публикаций. При обрыве соединения — не роняем сервис,
// а пытаемся переподключиться в фоне каждые 5 секунд.
export async function connectQueue(): Promise<void> {
  if (connecting || channel) return;
  connecting = true;

  try {
    channelModel = await amqp.connect(config.rabbitmqUrl);

    channelModel.on('error', (err) => {
      console.error('[recipe-service] Ошибка соединения с RabbitMQ:', err.message);
    });

    channelModel.on('close', () => {
      console.error('[recipe-service] Соединение с RabbitMQ закрыто, переподключаюсь через 5 секунд...');
      channel = null;
      channelModel = null;
      connecting = false;
      setTimeout(() => {
        connectQueue().catch((err) => console.error('Повторное подключение не удалось:', err.message));
      }, 5000);
    });

    channel = await channelModel.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    console.log('[recipe-service] Подключено к RabbitMQ');
  } catch (err) {
    console.error('[recipe-service] Не удалось подключиться к RabbitMQ, повтор через 5 секунд:', (err as Error).message);
    setTimeout(() => {
      connectQueue().catch((e) => console.error('Повторное подключение не удалось:', e.message));
    }, 5000);
  } finally {
    connecting = false;
  }
}

// Публикуем событие "рецепт удалён". persistent: true — сообщение сохраняется
// на диске брокера и переживёт перезапуск самого RabbitMQ, пока его не забрал
// подписчик (Social Service).
export function publishRecipeDeleted(recipeId: number): void {
  if (!channel) {
    throw new Error('Соединение с RabbitMQ ещё не установлено — событие recipe.deleted не отправлено');
  }
  const payload = Buffer.from(JSON.stringify({ recipeId }));
  channel.publish(EXCHANGE, 'recipe.deleted', payload, {
    persistent: true,
    contentType: 'application/json',
  });
  console.log(`[recipe-service] Опубликовано событие recipe.deleted (id=${recipeId})`);
}
