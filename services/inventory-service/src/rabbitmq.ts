import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from './config';
import { handleOrderCreated, handleOrderCancelled } from './events/consumers';

export const EXCHANGE_NAME = 'ecommerce_events';
const ORDER_CREATED_ROUTING_KEY = 'order.created';
const ORDER_CANCELLED_ROUTING_KEY = 'order.cancelled';
const INVENTORY_QUEUE = 'inventory_main_queue';

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
      // Use a persistent queue for inventory service
      await channel.assertQueue(INVENTORY_QUEUE, { durable: true });
      await channel.bindQueue(INVENTORY_QUEUE, EXCHANGE_NAME, ORDER_CREATED_ROUTING_KEY);
      await channel.bindQueue(INVENTORY_QUEUE, EXCHANGE_NAME, ORDER_CANCELLED_ROUTING_KEY);

      channel.consume(INVENTORY_QUEUE, async (msg: ConsumeMessage | null) => {
        if (msg) {
          const routingKey = msg.fields.routingKey;
          if (routingKey === ORDER_CREATED_ROUTING_KEY) {
            await handleOrderCreated(msg);
          } else if (routingKey === ORDER_CANCELLED_ROUTING_KEY) {
            await handleOrderCancelled(msg);
          }
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