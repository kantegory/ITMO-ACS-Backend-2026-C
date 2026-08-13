import amqp from 'amqplib';

let connection: any = null;
let channel: any = null;

export const connectRabbitMQ = async () => {
  try {
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    connection = await amqp.connect(rabbitMQUrl);
    channel = await connection.createChannel();
    

    return { connection, channel };
  } catch (error) {
    console.error(' Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

export const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
};