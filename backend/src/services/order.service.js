import { orderRepository } from "../repositories/order.repository.js";
import { paymentService } from "./payment.service.js";
import { AppError } from "../utils/AppError.js";

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

    return orderRepository.createOrderWithItems({
      userId,
      paymentId: razorpay_payment_id,
      paymentStatus: "PAID",
      deliveryAddress,
      contactNumber,
      items
    });
  },

  getUserOrders: async (userId) => {
    return orderRepository.findByUserId(userId);
  },

  getRiderActiveOrders: async () => {
    return orderRepository.findActiveForRider();
  },

  getAllAdminOrders: async () => {
    return orderRepository.findAllAdmin();
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
    return orderRepository.updateStatus(id, status);
  }
};
