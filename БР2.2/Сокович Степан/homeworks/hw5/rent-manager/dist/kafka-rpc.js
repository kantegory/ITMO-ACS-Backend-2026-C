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
async function listingExists(listingId) {
    if (!listingId || typeof listingId !== "string") {
        throw new Error("listingId required");
    }
    const { rows } = await db_1.pool.query("SELECT id FROM listings WHERE id = $1", [listingId]);
    return rows.length > 0;
}
async function dealVisibleToUser(dealId, userId) {
    if (!dealId || typeof dealId !== "string" || !userId || typeof userId !== "string") {
        throw new Error("dealId and userId required");
    }
    const { rows } = await db_1.pool.query(`SELECT id FROM deals WHERE id = $1 AND (landlord_id = $2 OR tenant_id = $2)`, [dealId, userId]);
    return rows.length > 0;
}
async function startKafkaRpcServer() {
    const kafka = new kafkajs_1.Kafka({
        clientId: `${config_1.config.kafkaClientId}.rpc`,
        brokers: config_1.config.kafkaBrokers,
    });
    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: `${config_1.config.kafkaClientId}.rpc.group` });
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: config_1.config.rentRpcTopic, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ message }) => {
            const req = safeParse(message.value);
            if (!req?.requestId || !req.replyTo || !req.type)
                return;
            try {
                if (req.type === "listings.exists") {
                    const exists = await listingExists(req.payload?.listingId);
                    await sendReply(req.replyTo, req.requestId, true, { exists });
                    return;
                }
                if (req.type === "deals.visible") {
                    const visible = await dealVisibleToUser(req.payload?.dealId, req.payload?.userId);
                    await sendReply(req.replyTo, req.requestId, true, { visible });
                    return;
                }
            }
            catch (e) {
                await sendReply(req.replyTo, req.requestId, false, undefined, e.message || "rpc failed");
            }
        },
    });
}
