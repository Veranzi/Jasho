import { UserRepository } from '../repositories/user.repo';
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    return this.userRepository.create(userData);
  }

  async login(email: string, password: string): Promise<string | null> {
    const user = await this.userRepository.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return this.generateToken(user);
    }
    return null;
  }

  private generateToken(user: User): string {
    const payload = { id: user.id, email: user.email };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
  }
}