import prisma from "../lib/prisma.js";

export const orderRepository = {
  findProductById: async (id) => {
    return prisma.product.findUnique({ where: { id: parseInt(id) } });
  },

  createOrderWithItems: async ({ userId, paymentId, paymentStatus, deliveryAddress, contactNumber, items }) => {
    return prisma.$transaction(async (tx) => {
      let computedTotal = 0;
      for (const item of items) {
         const product = await tx.product.findUnique({ where: { id: item.productId } });
         if (!product) throw new Error(`Product ${item.productId} not found`);
         computedTotal += (Number(product.price) * item.quantity);
      }
      const actualFinalAmount = computedTotal + (computedTotal * 0.05);

      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(actualFinalAmount.toFixed(2)),
          paymentId,
          paymentStatus,
          deliveryAddress,
          contactNumber,
        },
      });

      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      return order;
    });
  },

  findByUserId: async (userId) => {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findActiveForRider: async () => {
    return prisma.order.findMany({
      where: {
        status: "OUT_FOR_DELIVERY",
      },
      include: {
        user: {
           select: { name: true, email: true }
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findAllAdmin: async () => {
    return prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById: async (id) => {
    return prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
  },

  updateStatus: async (id, status) => {
    return prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });
  }
};
