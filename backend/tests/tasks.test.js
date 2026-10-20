const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Task Management API Tests (Practical 12 CI/CD Pipeline)', () => {
  beforeAll(async () => {
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/tasks returns 200 and array of tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /tasks creates a new task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({
        title: 'CI/CD Automated Test Task',
        description: 'Verify automated pipeline testing',
        status: 'pending'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
