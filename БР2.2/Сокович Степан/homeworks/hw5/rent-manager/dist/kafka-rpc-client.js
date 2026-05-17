"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initKafkaRpcClient = initKafkaRpcClient;
exports.rpcCall = rpcCall;
const crypto_1 = __importDefault(require("crypto"));
const kafkajs_1 = require("kafkajs");
const config_1 = require("./config");
const pending = new Map();
let producer = null;
let consumer = null;
function parseResponse(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw.toString("utf8"));
    }
    catch {
        return null;
    }
}
async function initKafkaRpcClient() {
    const kafka = new kafkajs_1.Kafka({
        clientId: config_1.config.kafkaClientId,
        brokers: config_1.config.kafkaBrokers,
    });
    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: `${config_1.config.kafkaClientId}.replies.group` });
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: config_1.config.rpcReplyTopic, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ message }) => {
            const reply = parseResponse(message.value);
            if (!reply?.requestId)
                return;
            const task = pending.get(reply.requestId);
            if (!task)
                return;
            clearTimeout(task.timer);
            pending.delete(reply.requestId);
            if (reply.ok) {
                task.resolve(reply.payload);
            }
            else {
                task.reject(new Error(reply.error || "RPC call failed"));
            }
        },
    });
}
async function rpcCall(topic, type, payload) {
    if (!producer) {
        throw new Error("Kafka RPC producer is not initialized");
    }
    const requestId = crypto_1.default.randomUUID();
    const resultPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pending.delete(requestId);
            reject(new Error(`RPC timeout for ${type}`));
        }, config_1.config.rpcTimeoutMs);
        pending.set(requestId, { resolve: resolve, reject, timer });
    });
    await producer.send({
        topic,
        messages: [
            {
                key: requestId,
                value: JSON.stringify({
                    requestId,
                    replyTo: config_1.config.rpcReplyTopic,
                    type,
                    payload,
                }),
            },
        ],
    });
    return resultPromise;
}
