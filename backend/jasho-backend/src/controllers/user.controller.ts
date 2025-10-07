import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repo';

export class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async createUser(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.userRepository.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating user', error });
    }
  }

  public async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.userRepository.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving user', error });
    }
  }

  public async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.userRepository.findAll();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving users', error });
    }
  }
}