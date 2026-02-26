import Order from '../models/Order.js';
import Product from "../models/Product.js";
import { isAddmin } from './userController.js';

export async function createOrder(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Unauthorized" }); // Fixed typo "Unaauthorized"
    }

    try {
        // Generate Order ID
        const latestOrder = await Order.findOne().sort({ orderId: -1 });
        let orderId = "ORD000001";
        
        if (latestOrder != null) {
            let latestOrderId = latestOrder.orderId;
            let latestOrderNumberString = latestOrderId.replace("ORD", "");
            let latestOrderNumber = parseInt(latestOrderNumberString);
            let newOrderNumber = latestOrderNumber + 1;
            let newOrderNumberString = newOrderNumber.toString().padStart(6, "0");
            orderId = "ORD" + newOrderNumberString;
        }

        const items = [];
        let totalAmount = 0;

        if (!req.body.items) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        for (let i = 0; i < req.body.items.length; i++) {
            const product = await Product.findOne({ productId: req.body.items[i].productId });
            
            if (product == null) {
                return res.status(404).json({
                    message: `Product with ID ${req.body.items[i].productId} not found`
                });
            }

            // Check if stock is available
            if (product.stock < req.body.items[i].quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product ${product.name}, Only ${product.stock} items left`
                });
            }

            // Image safety check
            const validImage = (product.images && product.images.length > 0) 
                ? product.images[0] 
                : "https://via.placeholder.com/150"; 

            items.push({
                productId: product.productId,
                name: product.name,
                price: product.price,
                quantity: req.body.items[i].quantity,
                image: validImage // FIXED: Now using the validImage variable
            });

            totalAmount += product.price * req.body.items[i].quantity;
        }

        // Handle Name Logic
        let name = req.body.name;
        if (!name || name.trim() === "") {
            name = (req.user.firstName || "") + " " + (req.user.lastName || "");
        }

        // Validation
        if (!req.body.address) return res.status(400).json({ message: "Address is required" });
        if (!req.body.phone) return res.status(400).json({ message: "Phone is required" });

        const newOrder = new Order({
            orderId: orderId,
            email: req.user.email,
            name: name.trim(),
            address: req.body.address,
            totalAmount: totalAmount,
            items: items,
            phone: req.body.phone,
            date: new Date()
        });

        await newOrder.save();

        // UPDATE PRODUCT STOCK
        for (let i = 0; i < items.length; i++) {
            await Product.updateOne(
                { productId: items[i].productId }, // FIXED: lowercase 'd' to match the object
                { $inc: { stock: -items[i].quantity } }
            );
        }

        return res.json({
            message: "Order Placed successfully",
            orderId: orderId
        });

    } catch (error) {
        console.error("Order Error: ", error);
        return res.status(500).json({
            message: "Error Placing Order",
            error: error.message
        });
    }
}

export async function getOrders(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        if (isAddmin(req)) {
            // Admin sorting fixed to use DB sort instead of .toSorted()
            const orders = await Order.find().sort({ date: -1 });
            res.json(orders);
        } else {
            const orders = await Order.find({ email: req.user.email }).sort({ date: -1 });
            res.json(orders);
        }
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
}
export async function updateOrderStatus(req, res) {
    if (!isAddmin(req)) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        const result = await Order.updateOne(
            { orderId: orderId }, 
            { status: status, notes: notes }
        );

        if (result.matchedCount === 0) {
            // If it reaches here, the URL was correct, but the ID doesn't exist in DB
            return res.status(404).json({ message: `Order ${orderId} not found in database` });
        }

        res.json({ message: "Order Status Updated Successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}