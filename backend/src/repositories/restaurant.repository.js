import prisma from "../lib/prisma.js";

export const restaurantRepository = {
  findAll: async () => {
    return prisma.restaurant.findMany({
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
