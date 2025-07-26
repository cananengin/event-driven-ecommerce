import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from '../config';

const DLX_EXCHANGE = 'ecommerce_events_dlx';
const DLQ = 'notification_dlq';
const MAIN_QUEUE = 'notification_main_queue';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function replayDLQMessages() {
  try {
    const connection: ChannelModel = await amqp.connect(config.rabbitmqUri);
    const channel: Channel = await connection.createChannel();
    console.log('DLQ Replay: Connected to RabbitMQ');

    // Get message count from DLQ
    const queueInfo = await channel.checkQueue(DLQ);
    console.log(`DLQ has ${queueInfo.messageCount} messages to replay`);

    if (queueInfo.messageCount === 0) {
      console.log('No messages in DLQ to replay');
      await channel.close();
      await connection.close();
      return;
    }

    let replayedCount = 0;
    const maxReplay = queueInfo.messageCount;

    // Consume messages from DLQ and republish to main queue
    await channel.consume(DLQ, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          // Republish to main queue
          await channel.sendToQueue(MAIN_QUEUE, msg.content, {
            persistent: true,
            headers: {
              ...msg.properties.headers,
              'x-replayed': true,
              'x-replay-timestamp': new Date().toISOString()
            }
          });
          
          console.log(`[${++replayedCount}/${maxReplay}] Replayed message:`, msg.content.toString());
          
          // Acknowledge the message from DLQ
          channel.ack(msg);
          
          // Add small delay between replays
          await delay(100);
          
          if (replayedCount >= maxReplay) {
            console.log('All DLQ messages have been replayed');
            await channel.close();
            await connection.close();
            process.exit(0);
          }
        } catch (error) {
          console.error('Error replaying message:', error);
          // Reject the message back to DLQ
          channel.nack(msg, false, true);
        }
      }
    });

    // Set a timeout to close connection if no messages are processed
    setTimeout(async () => {
      console.log('Timeout reached, closing connection');
      await channel.close();
      await connection.close();
      process.exit(0);
    }, 30000); // 30 seconds timeout

  } catch (error) {
    console.error('Error in DLQ replay:', error);
    process.exit(1);
  }
}

// Run the replay if this script is executed directly
if (require.main === module) {
  replayDLQMessages();
} 