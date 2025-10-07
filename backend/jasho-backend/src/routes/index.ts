import { Router } from 'express';
import UserController from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

export const setRoutes = () => {
  router.post('/users', userController.createUser);
  router.get('/users/:id', userController.getUserById);
  router.get('/users', userController.getAllUsers);
  
  return router;
};