import prisma from "../lib/prisma.js";

export const restaurantRepository = {
  findAll: async (skip, take) => {
    return prisma.restaurant.findMany({
      skip,
      take,
      include: {
        products: {
          take: 1,
        },
      },
    });
  },

  findById: async (id) => {
    return prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true,
      },
    });
  }
};
