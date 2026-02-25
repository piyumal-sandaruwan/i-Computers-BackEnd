import express from 'express';
import userRouter from './routes/userRouter.js';
import productRouter from './routes/productRouter.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import orderRouter from './routes/orderRouter.js';
dotenv.config();
const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL).then(
    () => {
        console.log("Connected to MongoDB");
    }
);


const app = express();
app.use(cors());
app.use(express.json());

// This must run BEFORE the routes so req.user is populated
app.use(
    (req, res, next) => {
        // This checks for the "Authorization" header
        const authorizationHeader = req.header("Authorization");

        if (authorizationHeader != null) {
            // console.log("Authorization header found: " + authorizationHeader);
            const token = authorizationHeader.replace("Bearer ", "");// Extracts the token from the header
            
            jwt.verify(token, process.env.JWT_SECRET,
                (error, content) => {
                    if (error) {
                        console.log("invalid token");
                        res.json({ message: "invalid token" });
                    } else {
                        req.user = content; // Sets the user data
                        next();
                    }
                }
            );
        } else {
            next();  
        }
    }
);

// --- ROUTES MOVED DOWN ---
app.use('/api/users', userRouter); 
app.use('/api/products', productRouter);
app.use('/api/orders',orderRouter)


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});