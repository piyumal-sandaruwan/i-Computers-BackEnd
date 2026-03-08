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

// Create user
export function createUser(req, res) {
    const data = req.body;
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const user = new User({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: data.role || "customer",
    });

    user.save()
        .then(() => {
            res.json({ message: "User created successfully" });
            console.log("User created successfully");
        })
        .catch((err) => {
            res.status(500).json({ message: "Error creating user", error: err.message });
        });
}

// export function getAllUsers(req, res) {
//     if (req.user == null) {
//         return res.status(401).json({ message: "Unauthorized User" });
//     }

//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Only admin can access details" });
//     }

//     User.find().then((users) => {
//         res.json(users);
//     });
// }

// Login user
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. Check if user is already blocked
        if (user.isBlocked) {
            return res.status(403).json({
                message: "Account is blocked. Please contact support."
            });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            // Increment invalid tries
            user.invalidTries += 1;
            
            // 2. Block user if tries reach 4 or more
            if (user.invalidTries >= 4) {
                user.isBlocked = true;
                await user.save();
                return res.status(403).json({
                    message: "User is blocked due to multiple invalid login attempts"
                });
            }

            await user.save();
            return res.status(401).json({ message: "Invalid password" });
        }

        // 3. SUCCESSFUL LOGIN: Reset invalid tries
        user.invalidTries = 0;
        await user.save();

        const payload = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            image: user.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "150h" });

        // Ensure this role is sent so the frontend can redirect correctly

        res.json({
            message: "Login successful",
            token,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// Check if the user is an admin
export function isAddmin(req) {
    if (req.user == null || req.user.role != "admin") {
        return false;
    }
    return true;
}

// export function getUser(req, res) {
//     User.findOne({ email: req.user.email }).then((user) => {
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.json(user);
//     }).catch(() => {
//         res.status(500).json({ message: "Server error" });
//     });
// }
export function getUser(req, res) {
    if (!req.user) return res.status(401).json({ message: "Not logged in" });

    User.findOne({ email: req.user.email }).then((user) => {
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    }).catch(() => res.status(500).json({ message: "Server error" }));
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
            const hashedPassword = bcrypt.hashSync("123", 10);

            const newUser = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || "Unknown",
                lastName: googleUser.family_name || "Unknown",
                password: hashedPassword,
                image: googleUser.picture,
                isEmailVerified: true 
            });

            // FIXED: Assign the saved user to the 'user' variable
            user = await newUser.save();
        }

        // Now 'user' is guaranteed to exist (either found or newly created)
        if (user.isBlocked) {
            return res.status(403).json({ // 403 is more standard for "Blocked"
                message: "User is blocked. Please contact support."
            });
        }
        
        const payload = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
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
        return res.status(500).json({
            message: "Google Login failed",
            error: error.message
        });
    }
}

// Validate Otp
export async function validateOtpAndUpdatePassword(req, res) {
    try {
        const { otp, email, newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        const otpRecord = await Otp.findOne({ email: email, otp: otp });
        if (otpRecord == null) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        
        await Otp.deleteMany({ email: email });

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await User.updateOne({ email: email }, {
            $set: { password: hashedPassword, isEmailVerified: true, invalidTries: 0, isBlocked: false }
        });

        res.json({ message: "Password Updated Successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to Update Password",
            error: error.message
        });
    }
}

// Function to send OTP via email
export async function sendOTP(req, res) {
    try {
        const email = req.params.email;
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        await Otp.deleteMany({ email });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otp = new Otp({ email: email, otp: otpCode });
        await otp.save();

        const message = {
            from: "piyumaltesting@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: "Your OTP Code Is " + otpCode
        };

        await transporter.sendMail(message);

        res.json({ message: "OTP sent Successfully" });
    } catch (err) {
        console.error("Error sending OTP:", err.message);
        res.status(500).json({
            message: "Failed to Send OTP",
            error: err.message
        });
    }
}

// Get All Users (Admin Only)
export async function getAllUsers(req, res) {
    if (!isAddmin(req)) {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
}


// update user status
export async function updateUserStatus(req, res) {
    if (!isAddmin(req)) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const email = req.params.email;

    // Prevent admin from blocking themselves
    if (req.user.email === email) {
        return res.status(400).json({
            message: "Admin Cannot Change Their Own Status"
        });
    }

    const isBlocked = req.body.isBlocked; // Fixed typo from 'isBloked'

    try {
        // Corrected updateOne syntax: updateOne({filter}, {update})
        await User.updateOne(
            { email: email }, 
            { isBlocked: isBlocked }
        );

        res.json({
            message: "User status Updated Successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating user status",
            error: error.message
        });
    }
}