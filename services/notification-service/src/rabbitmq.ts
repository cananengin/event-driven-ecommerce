import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from './config';
import { handleInventoryStatusUpdated } from './events/consumers';

export const EXCHANGE_NAME = 'ecommerce_events';
const INVENTORY_STATUS_UPDATED_ROUTING_KEY = 'inventory.status.updated';
const DLX_EXCHANGE = 'ecommerce_events_dlx';
const DLQ = 'notification_dlq';
const MAIN_QUEUE = 'notification_main_queue';

export let channel: Channel;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectRabbitMQ(retries = 10, backoffMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection: ChannelModel = await amqp.connect(config.rabbitmqUri);
      channel = await connection.createChannel();
      console.log('Notification Service: RabbitMQ connected');

      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
      await channel.assertQueue(DLQ, { durable: true });
      await channel.bindQueue(DLQ, DLX_EXCHANGE, '');

      await channel.assertQueue(MAIN_QUEUE, {
        durable: true,
        deadLetterExchange: DLX_EXCHANGE,
      });
      await channel.bindQueue(MAIN_QUEUE, EXCHANGE_NAME, INVENTORY_STATUS_UPDATED_ROUTING_KEY);

      channel.consume(MAIN_QUEUE, async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            await handleInventoryStatusUpdated(msg);
            channel.ack(msg);
          } catch (error) {
            console.error('Error processing message, sending to DLQ:', error);
            channel.nack(msg, false, false); // send to DLQ
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