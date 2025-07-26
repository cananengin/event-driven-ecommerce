import express from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { connectRabbitMQ } from './rabbitmq';
import apiRoutes from './api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

async function startServer() {
  try {
    if (config.mongoUri) {
      await mongoose.connect(config.mongoUri);
      console.log('Notification Service: MongoDB connected');
    }
    
    await connectRabbitMQ();
    console.log('Notification Service: RabbitMQ connected');
    
    app.listen(PORT, () => {
      console.log(`Notification Service: Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

startServer(); 