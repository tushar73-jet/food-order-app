import { restaurantRepository } from "../repositories/restaurant.repository.js";
import { AppError } from "../utils/AppError.js";
import prisma from "../lib/prisma.js";

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
  },

  getAllRestaurantsAdmin: async () => {
    return prisma.restaurant.findMany({
      include: { products: true }
    });
  },

  createProduct: async (data) => {
    return prisma.product.create({ data });
  },

  updateProduct: async (id, data) => {
    return prisma.product.update({
      where: { id: parseInt(id) },
      data
    });
  },

  deleteProduct: async (id) => {
    // Soft-safe check for active orders
    const activeOrderItems = await prisma.orderItem.findFirst({
      where: {
        productId: parseInt(id),
        order: {
          status: {
            in: ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY']
          }
        }
      }
    });

    if (activeOrderItems) {
      throw new AppError("Cannot delete product that is currently in an active order.", 400);
    }

    try {
      return await prisma.product.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new AppError("Cannot delete product because it exists in past order history.", 400);
      }
      throw error;
    }
  }
};
