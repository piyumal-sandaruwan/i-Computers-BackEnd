import express from "express";
import { createProduct, deleteProduct, getAllProducts, getProductById, searchProduct, updateProduct } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get('/',getAllProducts);
productRouter.get('/search/:query',searchProduct)
productRouter.post('/',createProduct);
productRouter.delete('/:id', deleteProduct);
productRouter.put('/:id', updateProduct); // Assuming you want to use the same function for updating as well, you can modify it accordingly in the controller.
productRouter.get('/:id', getProductById); // Add this line to handle GET requests for a specific product by ID.

//note : requests can be conflicting if we use the same endpoint for both getting all products and getting a product by ID, so we need to make sure that the order of the routes is correct. The route for getting a product by ID should be defined after the route for getting all products to avoid conflicts.


export default productRouter;