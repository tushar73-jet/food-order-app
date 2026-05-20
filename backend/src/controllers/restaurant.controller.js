import { restaurantService } from "../services/restaurant.service.js";

export const restaurantController = {
  getAllRestaurants: async (req, res) => {
    const { page, limit } = req.query;
    const restaurants = await restaurantService.getAllRestaurants(page, limit);
    res.json(restaurants);
  },

  getRestaurantById: async (req, res) => {
    const { id } = req.params;
    const restaurant = await restaurantService.getRestaurantById(id);
    res.json(restaurant);
  },

  getAllRestaurantsAdmin: async (req, res) => {
    const restaurants = await restaurantService.getAllRestaurantsAdmin();
    res.json(restaurants);
  },

  createProduct: async (req, res) => {
    const product = await restaurantService.createProduct(req.validated.body);
    res.status(201).json(product);
  },

  updateProduct: async (req, res) => {
    const { id } = req.params;
    const product = await restaurantService.updateProduct(id, req.validated.body);
    res.json(product);
  },

  deleteProduct: async (req, res) => {
    const { id } = req.params;
    await restaurantService.deleteProduct(id);
    res.json({ message: "Product deleted successfully" });
  }
};
