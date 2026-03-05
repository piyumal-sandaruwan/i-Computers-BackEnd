import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Otp from "../models/Otp.js";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "piyumaltesting@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

//create user
export function createUser(req, res) {
    const data = req.body;
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const user = new User({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
    });

    user.save().then(() => {
        res.json({ message: "User created successfully" });
        console.log("User created successfully");
    });
}

export function getAllUsers(req, res) {

    if (req.user == null) {
        res.json({ message: "Unauthorized User" });
        return;
    }

    if (req.user.role !== "admin") {
        res.json({ message: "only admin can access details" });
        return;
    }

    User.find().then((users) => {
        res.json(users);
    });
}

//login user
export function loginUser(req, res) {

    const emaill = req.body.email;
    const password = req.body.password;

    User.find({ email: emaill }).then((users) => {

        if (users[0] == null) {
            res.status(404).json({ message: "user not found" });
        } else {

            const user = users[0];

            if (user.invalidTries >= 4) {
                user.isBlocked = true;

                user.save().then(() => {
                    res.json({
                        message: "user is blocked due to multiple invalid login attempts"
                    });
                });

                return;
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password);

            if (isPasswordValid) {

                const payload = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    image: user.image
                };

                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "150h" });

                res.json({
                    message: "Login successful",
                    token: token,
                    role: user.role
                });

            } else {

                user.invalidTries = user.invalidTries + 1;

                user.save().then(() => {
                    res.status(402).json({ message: "Invalid password" });
                });

            }
        }
    });
}

//check if the user is an admin
export function isAddmin(req) {

    if (req.user == null) {
        return false;
    }

    if (req.user.role != "admin") {
        return false;
    }

    return true;
}

export function getUser(req, res) {

    User.findOne({ email: req.user.email }).then((user) => {

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    }).catch(() => {
        res.status(500).json({ message: "Server error" });
    });
}

export async function googleLogin(req, res) {

    try {

        const response = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: { Authorization: `Bearer ${req.body.token}` }
            }
        );

        const googleUser = response.data;

        let user = await User.findOne({ email: googleUser.email });

        if (!user) {

            const newUser = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || "Unknown",
                lastName: googleUser.family_name || "Unknown",
                password: "123",
                image: googleUser.picture
            });

            user = await newUser.save();
        }

        const payload = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified || true,
            image: user.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "150h" });

        return res.json({
            message: "Login successful",
            token: token,
            role: user.role
        });

    } catch (error) {

        console.error("Google Login Error:", error.message);

        if (!res.headersSent) {
            return res.status(500).json({
                message: "Google Login failed",
                error: error.message
            });
        }
    }
}

//validate Otp
export async function validateOtpAndUpdatePassword(req,res){
    //from user inputs
    try{
    const otp = req.body.otp
    const email = req.body.email
    const newPassword = req.body.newpassword
   

     if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

    const otpRecord = await Otp.findOne({email:email,otp:otp})
    if(otpRecord==null){
        res.status(400).json({
            message:"Invalid OTP"
        });
        return
    }
    await Otp.deleteMany({email:email})

    const hashedPassword = bcrypt.hashSync(newPassword,10)
    await User.updateOne({email:email},{
        $set:{password:hashedPassword,isEmailVerified:true}
    })
    res.json({
        message:"Password Updated Successfully"
    })
 }catch(error){
    res.status(500).json({
        message:"Failed to Update Password",
        error:error.message
    });
 }
}

// Function to send OTP via email
export async function sendOTP(req, res) {

    try {

        const email = req.params.email;

        const user = await User.findOne({ email: email });

        if (!user) {
            res.status(404).json({
                message: "User Not Found"
            });
            return;
        }

        //delete current OTPs
        await Otp.deleteMany({ email });

        //Generate random 6 Digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const otp = new Otp({
            email: email,
            otp: otpCode
        });

        await otp.save();

        const message = {
            from: "piyumaltesting@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: "OTP Code Is " + otpCode
        };

        await transporter.sendMail(message);

        res.json({
            message: "OTP sent Successfully"
        });

    } catch (err) {

        console.error("Error sending OTP:", err.message);

        res.status(500).json({
            message: "Failed to Send OTP",
            error: err.message
        });
    }
}

