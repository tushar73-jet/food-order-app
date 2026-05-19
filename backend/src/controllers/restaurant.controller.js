import { restaurantService } from "../services/restaurant.service.js";

export const restaurantController = {
  getAllRestaurants: async (req, res) => {
    const restaurants = await restaurantService.getAllRestaurants();
    res.json(restaurants);
  },

  getRestaurantById: async (req, res) => {
    const { id } = req.params;
    const restaurant = await restaurantService.getRestaurantById(id);
    res.json(restaurant);
  }
};
