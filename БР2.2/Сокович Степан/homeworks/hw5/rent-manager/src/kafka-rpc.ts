import { Consumer, Kafka, Producer } from "kafkajs";
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

async function listingExists(listingId: unknown): Promise<boolean> {
  if (!listingId || typeof listingId !== "string") {
    throw new Error("listingId required");
  }
  const { rows } = await pool.query("SELECT id FROM listings WHERE id = $1", [listingId]);
  return rows.length > 0;
}

async function dealVisibleToUser(dealId: unknown, userId: unknown): Promise<boolean> {
  if (!dealId || typeof dealId !== "string" || !userId || typeof userId !== "string") {
    throw new Error("dealId and userId required");
  }
  const { rows } = await pool.query(
    `SELECT id FROM deals WHERE id = $1 AND (landlord_id = $2 OR tenant_id = $2)`,
    [dealId, userId]
  );
  return rows.length > 0;
}

export async function startKafkaRpcServer(): Promise<void> {
  const kafka = new Kafka({
    clientId: `${config.kafkaClientId}.rpc`,
    brokers: config.kafkaBrokers,
  });
  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: `${config.kafkaClientId}.rpc.group` });

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: config.rentRpcTopic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const req = safeParse(message.value);
      if (!req?.requestId || !req.replyTo || !req.type) return;
      try {
        if (req.type === "listings.exists") {
          const exists = await listingExists((req.payload as { listingId?: unknown })?.listingId);
          await sendReply(req.replyTo, req.requestId, true, { exists });
          return;
        }
        if (req.type === "deals.visible") {
          const visible = await dealVisibleToUser(
            (req.payload as { dealId?: unknown })?.dealId,
            (req.payload as { userId?: unknown })?.userId
          );
          await sendReply(req.replyTo, req.requestId, true, { visible });
          return;
        }
      } catch (e) {
        await sendReply(req.replyTo, req.requestId, false, undefined, (e as Error).message || "rpc failed");
      }
    },
  });
}

