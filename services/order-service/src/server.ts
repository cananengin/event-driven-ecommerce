import express from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { connectRabbitMQ } from './rabbitmq';
import routes from './api/routes';
import { applyErrorHandlers } from '@ecommerce/event-types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Apply error handlers
applyErrorHandlers(app);

async function startServer() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Order Service: MongoDB connected');
    
    await connectRabbitMQ();
    console.log('Order Service: RabbitMQ connected');
    
    app.listen(PORT, () => {
      console.log(`Order Service: Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start order service:', error);
    process.exit(1);
  }
}

startServer();
