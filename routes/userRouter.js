import express from "express";
import {
  createUser,
  loginUser,
  getUser,
  getAllUsers,
  googleLogin,
  sendOTP,
  validateOtpAndUpdatePassword,
  updateUserStatus
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);                 // register
userRouter.post("/login", loginUser);             // login
userRouter.get("/me", getUser);                   // get logged user
userRouter.get("/all", getAllUsers);              // admin: get all users
userRouter.post("/google-login", googleLogin);
userRouter.get("/send-otp/:email", sendOTP);
userRouter.post("/validate-otp", validateOtpAndUpdatePassword);
userRouter.put("/toggle-block/:email",updateUserStatus)


export default userRouter;