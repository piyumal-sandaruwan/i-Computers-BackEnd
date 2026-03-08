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

mongoose.connect(mongoURL).then(() => console.log("Connected to MongoDB"));

const app = express();
app.use(cors());
app.use(express.json());

// FIXED MIDDLEWARE: Does not block login if token is missing/invalid
app.use((req, res, next) => {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        
        // Handle "Bearer null" or "Bearer undefined" strings from frontend
        if (token === "null" || token === "undefined") return next();

        jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
            if (error) {
                // Only return 401 if they are trying to access protected data, 
                // but let the request continue so login/public routes still work.
                console.log("Token verification failed");
            } else {
                req.user = decoded;
            }
            next();
        });
    } else {
        next();
    }
});

app.use('/api/users', userRouter); 
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);

app.listen(3000, () => console.log('Server is running on port 3000'));