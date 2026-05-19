import prisma from "../lib/prisma.js";

export const cartRepository = {
  findByUserId: async (userId) => {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  createCart: async (userId) => {
    return prisma.cart.create({
      data: { userId },
    });
  },

  clearCartItems: async (cartId) => {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  },

  createCartItems: async (cartId, items) => {
    if (!items || items.length === 0) return;
    
    return prisma.cartItem.createMany({
      data: items.map((item) => ({
        cartId,
        productId: item.id,
        quantity: item.quantity,
      })),
    });
  }
};
