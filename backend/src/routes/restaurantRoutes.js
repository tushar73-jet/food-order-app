import express from "express";
import { restaurantController } from "../controllers/restaurant.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(restaurantController.getAllRestaurants));
router.get("/:id", asyncHandler(restaurantController.getRestaurantById));

export default router;