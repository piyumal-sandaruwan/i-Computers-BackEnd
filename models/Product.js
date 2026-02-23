import mongoose, { model } from "mongoose";

//creating a schema for the products collection in the database
const productSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true
        },
    
        name :{
            type: String,
            required: true,

        },
        altNames:{
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true

        },
        labledPrice: {
            type: Number,
            required: true  
        },
        images: {
            type: [String],
        },
        category:{
            type: String,
            required: true,
        },
        brand:{
            type: String,
            required: true,
            default: "standard"
        },
        model:{
            type: String,
            required: true,
            default: "generic"
        },
        stock: {
            type: Number,
            required: true,
            default: 0
        },
        isAvailable: {
            type: Boolean,
            default: true
        } 
    }
)

const Product = mongoose.model("Product", productSchema);//creating a model for the products collection in the database

export default Product;//exporting the model to be used in other files