import mongoose from 'mongoose';


const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Auto-delete after 10 minutes
    }
});

const Otp = mongoose.model("Otp",otpSchema)
export default Otp