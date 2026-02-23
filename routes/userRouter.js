import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { loginUser } from '../controllers/userController.js';
import { createUser } from '../controllers/userController.js';
const userRouter = express.Router();

userRouter.post("/register", createUser);

userRouter.get("/",getAllUsers);

userRouter.post("/login", loginUser);





export default userRouter;