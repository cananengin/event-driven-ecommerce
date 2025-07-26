import express from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { connectRabbitMQ } from './rabbitmq';
import orderRoutes from './api/routes';

const app = express();
app.use(express.json());
app.use('/api', orderRoutes);

async function startServer() {
  await mongoose.connect(config.mongoUri);
  console.log('Order Service: MongoDB connected');
  await connectRabbitMQ();
  app.listen(config.port, () => {
    console.log(`Order service listening on port ${config.port}`);
  });
}
startServer();
