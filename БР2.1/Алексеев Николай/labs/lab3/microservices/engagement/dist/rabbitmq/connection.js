"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPES = exports.QUEUES = exports.EXCHANGES = exports.RABBITMQ_URL = void 0;
exports.connectRabbitMQ = connectRabbitMQ;
exports.publishEvent = publishEvent;
exports.consumeEvents = consumeEvents;
const amqp = __importStar(require("amqplib"));
let channel = null;
exports.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
exports.EXCHANGES = {
    USER: 'user.events',
    RECIPE: 'recipe.events',
    ENGAGEMENT: 'engagement.events',
};
exports.QUEUES = {
    USER_RECIPE_DELETED: 'user.recipe.deleted',
    RECIPE_USER_DELETED: 'recipe.user.deleted',
    ENGAGEMENT_RECIPE_CREATED: 'engagement.recipe.created',
    ENGAGEMENT_RECIPE_DELETED: 'engagement.recipe.deleted',
    ENGAGEMENT_USER_DELETED: 'engagement.user.deleted',
    RECIPE_COMMENT_UPDATED: 'recipe.comment.updated',
    RECIPE_LIKE_UPDATED: 'recipe.like.updated',
    RECIPE_SAVE_UPDATED: 'recipe.save.updated',
};
exports.EVENT_TYPES = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    RECIPE_CREATED: 'recipe.created',
    RECIPE_UPDATED: 'recipe.updated',
    RECIPE_DELETED: 'recipe.deleted',
    RECIPE_PUBLISHED: 'recipe.published',
    RECIPE_LIKED: 'recipe.liked',
    RECIPE_COMMENTED: 'recipe.commented',
    RECIPE_SAVED: 'recipe.saved',
    RECIPE_COMMENT_DELETED: 'recipe.comment.deleted',
    RECIPE_UNLIKED: 'recipe.unliked',
    RECIPE_DISLIKED: 'recipe.disliked',
    RECIPE_UNDISLIKED: 'recipe.undisliked',
    RECIPE_UNSAVED: 'recipe.unsaved',
};
async function connectRabbitMQ() {
    if (channel)
        return channel;
    try {
        const connection = await amqp.connect(exports.RABBITMQ_URL);
        const ch = await connection.createChannel();
        await ch.assertExchange(exports.EXCHANGES.USER, 'topic', { durable: true });
        await ch.assertExchange(exports.EXCHANGES.RECIPE, 'topic', { durable: true });
        await ch.assertExchange(exports.EXCHANGES.ENGAGEMENT, 'topic', { durable: true });
        channel = ch;
        console.log('RabbitMQ connected');
        return channel;
    }
    catch (error) {
        console.error('RabbitMQ connection failed:', error);
        throw error;
    }
}
async function publishEvent(exchange, routingKey, data) {
    const ch = await connectRabbitMQ();
    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
        persistent: true,
    });
    console.log(`Event published: ${exchange} / ${routingKey}`, data);
}
async function consumeEvents(exchange, queueName, routingKeys, callback) {
    const ch = await connectRabbitMQ();
    await ch.assertQueue(queueName, { durable: true });
    for (const key of routingKeys) {
        await ch.bindQueue(queueName, exchange, key);
    }
    ch.consume(queueName, async (msg) => {
        if (msg) {
            try {
                const data = JSON.parse(msg.content.toString());
                await callback(data, msg.fields.routingKey);
                ch.ack(msg);
            }
            catch (error) {
                console.error('Error processing message:', error);
                ch.nack(msg, false, true);
            }
        }
    });
    console.log(`Consuming on queue: ${queueName}`, routingKeys);
}
