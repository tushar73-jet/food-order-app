import { cartService } from "../services/cart.service.js";

export const cartController = {
  getCart: async (req, res) => {
    const cart = await cartService.getCartByUserId(req.userId);
    res.json(cart);
  },

  syncCart: async (req, res) => {
    const { items } = req.body;
    const result = await cartService.syncCart(req.userId, items);
    res.json(result);
  },

  clearCart: async (req, res) => {
    const result = await cartService.clearCart(req.userId);
    res.json(result);
  }
};
