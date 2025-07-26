import request from 'supertest';
import mongoose from 'mongoose';

describe('Order Service Health Check', () => {
  const api = request('http://localhost:3001');

  beforeAll(async () => {
    // Wait for service to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should return healthy status when all services are connected', async () => {
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'order-service');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks).toHaveProperty('rabbitmq');
  });

  it('should return proper health check structure', async () => {
    const res = await api.get('/api/health');

    expect(res.body).toMatchObject({
      status: expect.stringMatching(/healthy|unhealthy/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      service: 'order-service',
      checks: {
        database: expect.stringMatching(/connected|disconnected|error/),
        rabbitmq: expect.stringMatching(/connected|disconnected|error/)
      }
    });
  });
}); 