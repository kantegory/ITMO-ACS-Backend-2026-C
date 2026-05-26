import { Kafka } from "kafkajs";
import { config } from "./config";

const kafka = new Kafka({ clientId: "bookings-service", brokers: config.kafkaBrokers });
const producer = kafka.producer();
let connected = false;

export async function publish(topic: string, payload: object) {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
  await producer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
}
