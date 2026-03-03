import User from "../models/User.js";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import { response } from "express";
dotenv.config();

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
            if(user.invalidTries>=1000){
                user.isBlocked = true;
                user.save().then(() => {
                    
                    res.json({ message: "user is blocked due to multiple invalid login attempts" });
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
                    isEmailVerified:user.isEmailVerified,
                    image: user.image
                };

                const token = jwt.sign(payload,process.env.JWT_SECRET, { expiresIn: "150h" });

                res.json({ 
                    message: "Login successful", 
                    token: token ,
                    role: user.role
                });
            } else {
                
                // Corrected syntax: Update the attribute and call .save()
                user.invalidTries = user.invalidTries + 1;
                
                user.save().then(() => {
                  
                    res.status(402). json({ message: "Invalid password" });
                });
            }
        }
    });
}

//check if the user is an admin
export function isAddmin(req) {
     if (req.user == null) {     // Check if the user is authenticated
        return false
    }
    if (req.user.role !="admin") {// Check if the user has the admin role
    
        return false
    } 
    return true;

}

export function getUser(req, res) {
    // Assuming authMiddleware has set req.user.email
    User.findOne({ email: req.user.email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user); // Returns a SINGLE object
    }).catch((err) => {
        res.status(500).json({ message: "Server error" });
    });
}

export async function googleLogin(req, res) {
    try {
        const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${req.body.token}` }
        });

        const googleUser = response.data;
        let user = await User.findOne({ email: googleUser.email });

        // Logic for New User
        if (!user) {
            const newUser = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || "Unknown",
                lastName: googleUser.family_name || "Unknown", // Fallback if missing
                password: "123",
                image: googleUser.picture
            });
            user = await newUser.save();
        }

        // Prepare Payload
        const payload = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified || true,
            image: user.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "150h" });

        // Return immediately to stop further execution
        return res.json({ 
            message: "Login successful", 
            token: token, 
            role: user.role 
        });

    } catch (error) {
        console.error("Google Login Error:", error.message);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            return res.status(500).json({
                message: "Google Login failed",
                error: error.message
            });
        }
    }
}