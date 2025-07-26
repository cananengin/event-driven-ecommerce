import request from 'supertest';

describe('Order Service Integration', () => {
  const api = request('http://localhost:3001');

  it('should create an order and return a message', async () => {
    const res = await api.post('/api/orders')
      .send({
        userId: 'testuser',
        products: [
          { productId: 'prod1', quantity: 1 },
          { productId: 'prod2', quantity: 2 }
        ],
        totalPrice: 123.45
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Order created/);
    expect(res.body).toHaveProperty('orderId');
  });
}); 