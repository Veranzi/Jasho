const request = require('supertest');
const app = require('../server');

describe('API Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.environment).toBeDefined();
  });
});

describe('Authentication Endpoints', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      phoneNumber: '+254712345678',
      password: 'password123',
      fullName: 'Test User',
      location: 'Nairobi, Kenya'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe(userData.email);
  });

  test('POST /api/auth/login should authenticate user', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials');
  });
});

describe('Protected Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Register and login to get token
    const userData = {
      email: 'protected@example.com',
      phoneNumber: '+254712345679',
      password: 'password123',
      fullName: 'Protected User',
      location: 'Nairobi, Kenya'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    authToken = loginResponse.body.data.token;
  });

  test('GET /api/auth/me should return user profile with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('protected@example.com');
  });

  test('GET /api/auth/me should reject request without token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Access token required');
  });

  test('GET /api/wallet/balance should return wallet data', async () => {
    const response = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.kesBalance).toBeDefined();
    expect(response.body.data.usdtBalance).toBeDefined();
  });
});

describe('Error Handling', () => {
  test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Route not found');
  });

  test('POST /api/auth/register should validate required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });
});