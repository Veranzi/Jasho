import request from 'supertest';
import { app } from '../src/server'; // Adjust the import based on your server setup
import { UserRepository } from '../src/repositories/user.repo';

jest.mock('../src/repositories/user.repo');

describe('User API', () => {
  const userRepo = new UserRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    const newUser = { username: 'testuser', password: 'password123' };
    userRepo.createUser = jest.fn().mockResolvedValue(newUser);

    const response = await request(app)
      .post('/api/users')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(newUser);
    expect(userRepo.createUser).toHaveBeenCalledWith(newUser);
  });

  it('should retrieve a user by ID', async () => {
    const userId = '1';
    const user = { id: userId, username: 'testuser' };
    userRepo.findUserById = jest.fn().mockResolvedValue(user);

    const response = await request(app)
      .get(`/api/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(user);
    expect(userRepo.findUserById).toHaveBeenCalledWith(userId);
  });

  it('should return 404 for a non-existent user', async () => {
    const userId = '999';
    userRepo.findUserById = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/users/${userId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });
});