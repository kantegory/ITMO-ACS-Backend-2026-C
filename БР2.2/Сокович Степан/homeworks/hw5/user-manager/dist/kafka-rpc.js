"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKafkaRpcServer = startKafkaRpcServer;
const kafkajs_1 = require("kafkajs");
const db_1 = require("./db");
const config_1 = require("./config");
let producer = null;
let consumer = null;
function safeParse(value) {
    if (!value)
        return null;
    try {
        return JSON.parse(value.toString("utf8"));
    }
    catch {
        return null;
    }
}
async function sendReply(replyTo, requestId, ok, payload, error) {
    if (!producer)
        return;
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
async function usersExist(ids) {
    const parsed = Array.isArray(ids) ? ids.map((v) => String(v)).filter(Boolean) : [];
    if (!parsed.length || parsed.length > 100) {
        throw new Error("invalid id list");
    }
    const { rows } = await db_1.pool.query("SELECT id FROM users WHERE id = ANY($1::uuid[])", [parsed]);
    const found = new Set(rows.map((r) => r.id));
    const exists = {};
    for (const id of parsed) {
        exists[id] = found.has(id);
    }
    return exists;
}
async function startKafkaRpcServer() {
    const kafka = new kafkajs_1.Kafka({
        clientId: config_1.config.kafkaClientId,
        brokers: config_1.config.kafkaBrokers,
    });
    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: `${config_1.config.kafkaClientId}.rpc.group` });
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: config_1.config.userRpcTopic, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ message }) => {
            const req = safeParse(message.value);
            if (!req?.requestId || !req.replyTo || !req.type)
                return;
            if (req.type !== "users.exists")
                return;
            try {
                const exists = await usersExist(req.payload?.ids);
                await sendReply(req.replyTo, req.requestId, true, { exists });
            }
            catch (e) {
                await sendReply(req.replyTo, req.requestId, false, undefined, e.message || "rpc failed");
            }
        },
    });
}
