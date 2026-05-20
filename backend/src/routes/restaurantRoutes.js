import express from "express";
import { z } from "zod";
import { restaurantController } from "../controllers/restaurant.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const ProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    price: z.coerce.number().positive(),
    imageUrl: z.string().url().optional(),
    category: z.string().min(1),
    restaurantId: z.coerce.number().int().positive()
  }).strict()
});

router.get("/admin/list", protect, admin, asyncHandler(restaurantController.getAllRestaurantsAdmin));
router.post("/admin/products", protect, admin, validate(ProductSchema), asyncHandler(restaurantController.createProduct));
router.put("/admin/products/:id", protect, admin, validate(ProductSchema), asyncHandler(restaurantController.updateProduct));
router.delete("/admin/products/:id", protect, admin, asyncHandler(restaurantController.deleteProduct));

router.get("/", asyncHandler(restaurantController.getAllRestaurants));
router.get("/:id", asyncHandler(restaurantController.getRestaurantById));

export default router;