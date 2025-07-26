import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from './config';
import { handleOrderCreated } from './events/consumers';

export const EXCHANGE_NAME = 'ecommerce_events';
const ORDER_CREATED_ROUTING_KEY = 'order.created';

export let channel: Channel;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectRabbitMQ(retries = 10, backoffMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection: ChannelModel = await amqp.connect(config.rabbitmqUri);
      channel = await connection.createChannel();
      console.log('Inventory Service: RabbitMQ connected');

      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      // Listen for order.created events
      const queue = await channel.assertQueue('', { exclusive: true });
      await channel.bindQueue(queue.queue, EXCHANGE_NAME, ORDER_CREATED_ROUTING_KEY);

      channel.consume(queue.queue, async (msg: ConsumeMessage | null) => {
        if (msg) {
          await handleOrderCreated(msg);
          channel.ack(msg);
        }
      });
      return; // Success
    } catch (error) {
      console.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${retries})`, error);
      if (attempt < retries) {
        await delay(backoffMs);
      } else {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
} 