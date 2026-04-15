import { Kafka } from "kafkajs";
import { config } from "./config";

const kafka = new Kafka({ clientId: "restaurant-service", brokers: config.kafkaBrokers });
const producer = kafka.producer();
const reviewEventsConsumer = kafka.consumer({ groupId: "restaurant-rating-v1" });
const admin = kafka.admin();
let connected = false;
let consumerStarted = false;
const consumerRetryMs = 3000;
const reviewTopics = ["reviews.review.created", "reviews.review.updated", "reviews.review.deleted"];

export async function publish(topic: string, payload: object) {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
  await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
}

type ReviewEventPayload = {
  restaurantId?: string;
};

export function startReviewEventsConsumer(onReviewChanged: (restaurantId: string) => Promise<void>) {
  if (consumerStarted) return;
  consumerStarted = true;

  const run = async () => {
    while (true) {
      try {
        await admin.connect();
        await admin.createTopics({
          waitForLeaders: true,
          topics: reviewTopics.map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 }))
        });
        await admin.disconnect();

        await reviewEventsConsumer.connect();
        for (const topic of reviewTopics) {
          await reviewEventsConsumer.subscribe({ topic, fromBeginning: false });
        }

        console.log("KAFKA_BROKERS =", process.env.KAFKA_BROKERS);
        console.log("config.kafkaBrokers =", config.kafkaBrokers);

        await reviewEventsConsumer.run({
          eachMessage: async ({ topic, message }) => {
            if (!message.value) return;

            try {
              const payload = JSON.parse(message.value.toString()) as ReviewEventPayload;
              if (!payload.restaurantId) {
                console.warn(`[kafka] skip ${topic}: restaurantId is missing`);
                return;
              }

              await onReviewChanged(payload.restaurantId);
              console.log(`[kafka] handled ${topic} for restaurant ${payload.restaurantId}`);
            } catch (error) {
              console.error(`[kafka] failed to handle ${topic}`, error);
            }
          }
        });

        console.log("[kafka] review events consumer started");
        break;
      } catch (error) {
        console.error("[kafka] failed to start review consumer, retrying", error);
        try {
          await admin.disconnect();
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, consumerRetryMs));
      }
    }
  };

  void run();
}
