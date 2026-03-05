import express from 'express';
import { getUser, googleLogin, sendOTP, validateOtpAndUpdatePassword } from '../controllers/userController.js';
import { loginUser } from '../controllers/userController.js';
import { createUser } from '../controllers/userController.js';
const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/",getUser);
userRouter.post("/google-login",googleLogin)
userRouter.get("/send-otp/:email",sendOTP)
userRouter.post("/validate-otp",validateOtpAndUpdatePassword)








export default userRouter;