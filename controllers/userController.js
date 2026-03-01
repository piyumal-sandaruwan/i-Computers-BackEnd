import User from "../models/User.js";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
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
        role: data.role,
        image: data.image
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
                    image: user.image
                };

                const token = jwt.sign(payload,process.env.JWT_SECRET, { expiresIn: "1666h" });

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

export function getUser(req,res){
    if(req.user==null){
        res.status(401).json({
            message:"Unauthorized"
        })
    }return
    res.json(req.user)
}
