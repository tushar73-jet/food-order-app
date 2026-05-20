import { orderRepository } from "../repositories/order.repository.js";
import { paymentService } from "./payment.service.js";
import { AppError } from "../utils/AppError.js";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "../lib/mailer.js";
import prisma from "../lib/prisma.js";

export const orderService = {
  calculateTotal: async (items) => {
    let computedTotal = 0;
    for (const item of items) {
      const product = await orderRepository.findProductById(item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
      computedTotal += (Number(product.price) * item.quantity);
    }
    return Math.round(computedTotal + (computedTotal * 0.05));
  },

  createOrder: async (userId, items) => {
    const finalAmount = await orderService.calculateTotal(items);
    return paymentService.createRazorpayOrder(finalAmount, userId);
  },

  verifyAndCreateOrder: async (userId, body) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, deliveryAddress, contactNumber } = body;

    await paymentService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    const newOrder = await orderRepository.createOrderWithItems({
      userId,
      paymentId: razorpay_payment_id,
      paymentStatus: "PAID",
      deliveryAddress,
      contactNumber,
      items
    });

    const fullOrder = await orderRepository.findById(newOrder.id);
    if (fullOrder && fullOrder.user) {
      await sendOrderPlacedEmail(fullOrder.user.email, newOrder.id);
    }

    return newOrder;
  },

  getUserOrders: async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return orderRepository.findByUserId(userId, skip, Number(limit));
  },

  getRiderActiveOrders: async () => {
    return orderRepository.findActiveForRider();
  },

  getAllAdminOrders: async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return orderRepository.findAllAdmin(skip, Number(limit));
  },

  getOrderById: async (id) => {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return order;
  },

  updateOrderStatus: async (id, status) => {
    if (!status) {
      throw new AppError("Status is required", 400);
    }
    
    // Intercept DELIVERED status to trigger rider reset
    if (status === 'DELIVERED') {
      const updated = await orderService.markDelivered(id);
      const fullOrder = await orderRepository.findById(id);
      if (fullOrder && fullOrder.user) {
        await sendOrderStatusEmail(fullOrder.user.email, id, status);
      }
      return updated;
    }

    const updated = await orderRepository.updateStatus(id, status);
    
    const fullOrder = await orderRepository.findById(id);
    if (fullOrder && fullOrder.user) {
      await sendOrderStatusEmail(fullOrder.user.email, id, status);
    }
    
    return updated;
  },

  dispatchToRider: async (orderId) => {
    // 1. Find available rider with fewest active deliveries
    const availableRider = await prisma.user.findFirst({
      where: { role: 'RIDER', isAvailable: true },
      orderBy: { riderOrders: { _count: 'asc' } }
    });

    if (!availableRider) throw new AppError('No riders available', 503);

    // 2. Update order: set status=OUT_FOR_DELIVERY, assignedRiderId, dispatchedAt
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: 'OUT_FOR_DELIVERY',
        assignedRiderId: availableRider.id,
        dispatchedAt: new Date()
      },
      include: { user: true, assignedRider: true, items: { include: { product: true } } }
    });

    // 3. Mark rider as unavailable
    await prisma.user.update({
      where: { id: availableRider.id },
      data: { isAvailable: false }
    });

    return { order, rider: availableRider };
  },

  markDelivered: async (orderId) => {
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'DELIVERED', deliveredAt: new Date() }
    });

    if (order.assignedRiderId) {
      await prisma.user.update({
        where: { id: order.assignedRiderId },
        data: { isAvailable: true }
      });
    }
    return order;
  },

  estimateDelivery: (order) => {
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const prepTime = Math.max(15, itemCount * 3);
    const deliveryTime = 20;
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + prepTime + deliveryTime);
    return eta;
  },

  getAnalytics: async () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: 'DELIVERED'
      },
      include: { items: { include: { product: true } } }
    });

    const dailyRevenueMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dailyRevenueMap[d.toISOString().split('T')[0]] = 0;
    }
    
    let totalRevenueToday = 0;
    let totalOrdersToday = 0;

    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      const revenue = Number(order.totalPrice);
      if (dailyRevenueMap[dateStr] !== undefined) {
        dailyRevenueMap[dateStr] += revenue;
      }
      
      if (dateStr === today.toISOString().split('T')[0]) {
        totalRevenueToday += revenue;
        totalOrdersToday++;
      }
    });

    const dailyRevenue = Object.keys(dailyRevenueMap).map(date => ({
      date,
      revenue: dailyRevenueMap[date]
    }));

    const productCount = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        const pName = item.product.name;
        productCount[pName] = (productCount[pName] || 0) + item.quantity;
      });
    });

    const topProducts = Object.keys(productCount)
      .map(name => ({ name, quantity: productCount[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      dailyRevenue,
      topProducts,
      today: {
        totalOrders: totalOrdersToday,
        revenue: totalRevenueToday,
        averageOrderValue: totalOrdersToday > 0 ? Math.round(totalRevenueToday / totalOrdersToday) : 0
      }
    };
  }
};
