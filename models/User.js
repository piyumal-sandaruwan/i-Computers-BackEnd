import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
    email: { 
        type: String, required: true, unique: true 
    
    },//one user can be created with one email
    firstName: { 
        type: String, required: true 
    },
    lastName: { 
        type: String, required: true 
    },
    password: { 
        type: String, required: true 
    },
    role :{
        type :String,
        default :"customer"
    },
    
    isBlocked: { 
        type: Boolean, default: false
    },
    
    isEmailVerified: { 
        type: Boolean, default: false 
    },
    image: { 
        type: String,
        required: true,
        default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",

    },

    invalidTries: {
        type: Number,
        default: 0
    }

   }
);

const User = mongoose.model("User", userSchema);

export default User;