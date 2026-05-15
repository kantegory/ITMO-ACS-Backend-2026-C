import { Kafka, Producer, Consumer } from "kafkajs";
import settings from "../config/config";

type BaseEvent = { eventType: string; [k: string]: any };

const brokers = (settings.KAFKA_BROKERS ?? "kafka:9092").split(",");

let kafka: Kafka;
let producer: Producer;
let consumer: Consumer;
let initPromise: Promise<void> | null = null;

const handlers = new Map<string, ((msg: any) => Promise<void>)[]>();

export async function initKafka(
  clientId: string,
  groupId?: string,
): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    kafka = new Kafka({
      clientId: `${clientId}-${process.pid}`,
      brokers,
      retry: { retries: 8, initialRetryTime: 100 },
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: groupId ?? `${clientId}-group` });

    await Promise.all([producer.connect(), consumer.connect()]);
    console.info(`Kafka connected (client=${clientId})`);
  })();

  return initPromise;
}

export async function publish<T extends BaseEvent>(topic: string, payload: T): Promise<void> {
  if (!producer) throw new Error("Kafka producer not initialised");
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
}

export async function subscribe<T extends BaseEvent>(
  topic: string,
  handler: (msg: T) => Promise<void>,
): Promise<void> {
  if (!consumer) throw new Error("Kafka consumer not initialised");

  if (!handlers.has(topic)) handlers.set(topic, []);
  handlers.get(topic)!.push(handler as any);

  await consumer.subscribe({ topic, fromBeginning: false });
}

export async function startKafkaConsumer(): Promise<void> {
  if (!consumer) throw new Error("Kafka consumer not initialised");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      try {
        const parsed = JSON.parse(message.value.toString());
        const topicHandlers = handlers.get(topic) ?? [];
        await Promise.all(topicHandlers.map((h) => h(parsed)));
      } catch (e) {
        console.error(`Failed to process message from ${topic}`, e);
      }
    },
  });
}

export async function disconnectKafka(): Promise<void> {
  await Promise.all([producer?.disconnect(), consumer?.disconnect()]);
}