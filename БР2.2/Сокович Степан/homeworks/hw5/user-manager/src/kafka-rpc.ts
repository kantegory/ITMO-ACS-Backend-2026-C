import { Kafka, Producer, Consumer } from "kafkajs";
import { pool } from "./db";
import { config } from "./config";

type RpcRequest = {
  requestId?: string;
  replyTo?: string;
  type?: string;
  payload?: unknown;
};

let producer: Producer | null = null;
let consumer: Consumer | null = null;

function safeParse(value: Buffer | null): RpcRequest | null {
  if (!value) return null;
  try {
    return JSON.parse(value.toString("utf8")) as RpcRequest;
  } catch {
    return null;
  }
}

async function sendReply(replyTo: string, requestId: string, ok: boolean, payload?: unknown, error?: string): Promise<void> {
  if (!producer) return;
  await producer.send({
    topic: replyTo,
    messages: [
      {
        key: requestId,
        value: JSON.stringify({
          requestId,
          ok,
          payload,
          error,
        }),
      },
    ],
  });
}

async function usersExist(ids: unknown): Promise<Record<string, boolean>> {
  const parsed = Array.isArray(ids) ? ids.map((v) => String(v)).filter(Boolean) : [];
  if (!parsed.length || parsed.length > 100) {
    throw new Error("invalid id list");
  }
  const { rows } = await pool.query("SELECT id FROM users WHERE id = ANY($1::uuid[])", [parsed]);
  const found = new Set(rows.map((r) => (r as { id: string }).id));
  const exists: Record<string, boolean> = {};
  for (const id of parsed) {
    exists[id] = found.has(id);
  }
  return exists;
}

export async function startKafkaRpcServer(): Promise<void> {
  const kafka = new Kafka({
    clientId: config.kafkaClientId,
    brokers: config.kafkaBrokers,
  });
  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: `${config.kafkaClientId}.rpc.group` });

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: config.userRpcTopic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const req = safeParse(message.value);
      if (!req?.requestId || !req.replyTo || !req.type) return;
      if (req.type !== "users.exists") return;
      try {
        const exists = await usersExist((req.payload as { ids?: unknown })?.ids);
        await sendReply(req.replyTo, req.requestId, true, { exists });
      } catch (e) {
        await sendReply(req.replyTo, req.requestId, false, undefined, (e as Error).message || "rpc failed");
      }
    },
  });
}

