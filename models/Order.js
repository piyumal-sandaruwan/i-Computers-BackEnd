import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId:{
            type:String,
            required :true,
            unique:true,
        },
        email:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },

        address:{
            type:String,
            required:true

        },
        date:{
            type:Date,
            required:true,
            default:Date.now
        },
        totalAmount:{
            type:Number,
            required:true,
            
        },
        status:{
            type:String,
            required:true,
            default:"pending"
        },
        notes:{
            type:String,
            required:false
        },
        phone:{
            type:String,
            required:false    
        },
        items:[
            {
                    productId:{
                        type:String,
                        required:true
                    },
                    name:{
                        type:String,
                        required:true
                    },
                    price:{
                        type:Number,
                        required:true
                    },
                    quantity:{
                        type:Number,
                        required:true
                    },
                    image:{
                        type:String,
                        required:true
                    }
            }
        ]



    }
)
const Order = mongoose.model("Order",orderSchema)
export default Order