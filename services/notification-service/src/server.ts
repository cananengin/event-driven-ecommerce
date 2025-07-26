import express from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { connectRabbitMQ } from './rabbitmq';
import routes from './api/routes';
import { applyErrorHandlers } from '@ecommerce/event-types';
import { NotificationSeeder } from './utils/notification-seeder';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Apply error handlers
applyErrorHandlers(app);

async function startServer() {
  try {
    // Connect to MongoDB first
    await mongoose.connect(config.mongoUri);
    console.log('Notification Service: MongoDB connected');
    
    // Connect to RabbitMQ
    await connectRabbitMQ();
    console.log('Notification Service: RabbitMQ connected');
    
    // Seed notification templates
    await NotificationSeeder.seedDefaultTemplates();
    console.log('Notification Service: Templates seeded');
    
    app.listen(PORT, () => {
      console.log(`Notification Service: Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

startServer(); 