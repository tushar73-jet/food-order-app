import { restaurantRepository } from "../repositories/restaurant.repository.js";
import { AppError } from "../utils/AppError.js";

export const restaurantService = {
  getAllRestaurants: async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return restaurantRepository.findAll(skip, Number(limit));
  },

  getRestaurantById: async (id) => {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }
    return restaurant;
  }
};
