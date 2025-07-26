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
    await mongoose.connect(config.mongoUri);
    console.log('Inventory Service: MongoDB connected');
    
    await connectRabbitMQ();
    console.log('Inventory Service: RabbitMQ connected');
    
    app.listen(PORT, () => {
      console.log(`Inventory Service: Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start inventory service:', error);
    process.exit(1);
  }
}

startServer();
