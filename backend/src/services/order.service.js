import { orderRepository } from "../repositories/order.repository.js";
import { paymentService } from "./payment.service.js";
import { AppError } from "../utils/AppError.js";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "../lib/mailer.js";

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
    const updated = await orderRepository.updateStatus(id, status);
    
    const fullOrder = await orderRepository.findById(id);
    if (fullOrder && fullOrder.user) {
      await sendOrderStatusEmail(fullOrder.user.email, id, status);
    }
    
    return updated;
  }
};
