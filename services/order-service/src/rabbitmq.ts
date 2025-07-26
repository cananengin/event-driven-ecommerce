import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from './config';
import { handleInventoryStatusUpdate } from './events/consumers';

export const EXCHANGE_NAME = 'ecommerce_events';
const ORDER_QUEUE = 'orders_queue';
const ORDER_DLQ = 'orders_queue_dlq';

export let channel: Channel;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectRabbitMQ(retries = 10, backoffMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection: ChannelModel = await amqp.connect(config.rabbitmqUri);
      channel = await connection.createChannel();
      console.log('Order Service: RabbitMQ connected');

      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await channel.assertExchange(`${EXCHANGE_NAME}_dlx`, 'fanout', { durable: true });
      await channel.assertQueue(ORDER_DLQ, { durable: true });
      await channel.bindQueue(ORDER_DLQ, `${EXCHANGE_NAME}_dlx`, '');

      await channel.assertQueue(ORDER_QUEUE, {
        durable: true,
        deadLetterExchange: `${EXCHANGE_NAME}_dlx`,
      });

      await channel.bindQueue(ORDER_QUEUE, EXCHANGE_NAME, 'inventory.status.updated');

      channel.consume(ORDER_QUEUE, async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            await handleInventoryStatusUpdate(msg);
            channel.ack(msg);
          } catch (error) {
            console.error('Error processing message, sending to DLQ:', error);
            channel.nack(msg, false, false);
          }
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
