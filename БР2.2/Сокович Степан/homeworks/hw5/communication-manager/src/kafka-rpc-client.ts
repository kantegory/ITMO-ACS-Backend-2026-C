import crypto from "crypto";
import { Consumer, Kafka, Producer } from "kafkajs";
import { config } from "./config";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
};

type RpcResponse = {
  requestId?: string;
  ok?: boolean;
  payload?: unknown;
  error?: string;
};

const pending = new Map<string, PendingRequest>();

let producer: Producer | null = null;
let consumer: Consumer | null = null;

function parseResponse(raw: Buffer | null): RpcResponse | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw.toString("utf8")) as RpcResponse;
  } catch {
    return null;
  }
}

export async function initKafkaRpcClient(): Promise<void> {
  const kafka = new Kafka({
    clientId: config.kafkaClientId,
    brokers: config.kafkaBrokers,
  });
  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: `${config.kafkaClientId}.replies.group` });
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: config.rpcReplyTopic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const reply = parseResponse(message.value);
      if (!reply?.requestId) return;
      const task = pending.get(reply.requestId);
      if (!task) return;
      clearTimeout(task.timer);
      pending.delete(reply.requestId);
      if (reply.ok) {
        task.resolve(reply.payload);
      } else {
        task.reject(new Error(reply.error || "RPC call failed"));
      }
    },
  });
}

export async function rpcCall<TPayload, TResult>(topic: string, type: string, payload: TPayload): Promise<TResult> {
  if (!producer) {
    throw new Error("Kafka RPC producer is not initialized");
  }
  const requestId = crypto.randomUUID();
  const resultPromise = new Promise<TResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`RPC timeout for ${type}`));
    }, config.rpcTimeoutMs);
    pending.set(requestId, { resolve: resolve as (value: unknown) => void, reject, timer });
  });
  await producer.send({
    topic,
    messages: [
      {
        key: requestId,
        value: JSON.stringify({
          requestId,
          replyTo: config.rpcReplyTopic,
          type,
          payload,
        }),
      },
    ],
  });
  return resultPromise;
}

