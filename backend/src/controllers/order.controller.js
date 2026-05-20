import { orderService } from "../services/order.service.js";
import { paymentService } from "../services/payment.service.js";

export const orderController = {
  createOrder: async (req, res) => {
    const { items } = req.validated.body;
    const result = await orderService.createOrder(req.userId, items);
    res.json(result);
  },

  verifyPayment: async (req, res) => {
    const result = await orderService.verifyAndCreateOrder(req.userId, req.validated.body);
    res.status(201).json(result);
  },

  razorpayWebhook: (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    paymentService.verifyWebhookSignature(req.body, signature);
    res.status(200).json({ received: true });
  },

  getMyOrders: async (req, res) => {
    const { page, limit } = req.query;
    const orders = await orderService.getUserOrders(req.userId, page, limit);
    res.json(orders);
  },

  getRiderActiveOrders: async (req, res) => {
    const orders = await orderService.getRiderActiveOrders();
    res.json(orders);
  },

  getAllAdminOrders: async (req, res) => {
    const { page, limit } = req.query;
    const orders = await orderService.getAllAdminOrders(page, limit);
    res.json(orders);
  },

  getOrderById: async (req, res) => {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    res.json(order);
  },

  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await orderService.updateOrderStatus(id, status);
    
    // Emit via socket
    req.io.to(`order_${id}`).emit("order_status_updated", { status });
    
    res.json(updatedOrder);
  },

  getAnalytics: async (req, res) => {
    const analytics = await orderService.getAnalytics();
    res.json(analytics);
  },

  dispatchOrder: async (req, res) => {
    const { id } = req.params;
    const { order, rider } = await orderService.dispatchToRider(id);
    
    // Emit to rider via socket if connected
    const { connectedRiders } = await import('../index.js');
    const riderSocketId = connectedRiders.get(rider.id);
    if (riderSocketId && req.io) {
      req.io.to(riderSocketId).emit("new_delivery_assigned", {
        orderId: order.id,
        customerName: order.user?.name,
        address: order.deliveryAddress,
        contactNumber: order.contactNumber,
        items: order.items,
        estimatedPickup: new Date().toISOString()
      });
    }
    
    // Also notify customer
    if (req.io) {
      req.io.to(`order_${id}`).emit("order_status_updated", { 
        status: 'OUT_FOR_DELIVERY',
        riderName: rider.name 
      });
    }
    
    res.json({ message: 'Rider dispatched', order, rider });
  }
};
