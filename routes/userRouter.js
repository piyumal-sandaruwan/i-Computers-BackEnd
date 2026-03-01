import express from 'express';
import { getUser } from '../controllers/userController.js';
import { loginUser } from '../controllers/userController.js';
import { createUser } from '../controllers/userController.js';
const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/",getUser);








export default userRouter;