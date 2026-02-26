import dotenv from "dotenv";
dotenv.config();

import Product from "../models/Product.js";
import { isAddmin } from "./userController.js";
import Order from "../models/Order.js";


export async function createProduct(req, res) {
    if (!isAddmin(req)) { // Check if the user is an admin
        res.status(403).json({ message: "Only admin can create products" });
        return;
    }

    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ message: "Product created successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
}

export async function getAllProducts(req, res) {
    // console.log("products fetching")//demonstrating that this function is being called
    try {
        let products;
        if (isAddmin(req)) { // Check if the user is an admin
            products = await Product.find();
        } else {
            products = await Product.find({ isAvailable: true });
        }
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
}

export async function deleteProduct(req, res) {
    if (!isAddmin(req)) { // Check if the user is an admin
        res.status(403).json({ message: "Only admin can delete products" });
        return;
    }

    const productId = req.params.id;

    try {
        await Product.deleteOne({ productId: productId });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
}

export async function updateProduct(req, res) {
    if (!isAddmin(req)) { // Check if the user is an admin
        res.status(403).json({ message: "Only admin can update products" });
        return;
    }

    const productId = req.params.id;

    try {
        await Product.updateOne({ productId: productId }, req.body);
        res.json({ message: "Product updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
}

export async function getProductById(req, res) {
    const productId = req.params.id;

    try {
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({ message: "Product not found" });
        } else {
            res.json(product);
        }
    } catch (error) {
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
}


