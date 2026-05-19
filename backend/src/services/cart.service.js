import { cartRepository } from "../repositories/cart.repository.js";

export const cartService = {
  getCartByUserId: async (userId) => {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      return [];
    }

    const formattedItems = cart.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
    }));

    return {
      items: formattedItems,
      updatedAt: cart.updatedAt,
    };
  },

  syncCart: async (userId, items) => {
    let cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      cart = await cartRepository.createCart(userId);
    }

    await cartRepository.clearCartItems(cart.id);
    await cartRepository.createCartItems(cart.id, items);

    return { message: "Cart synced successfully" };
  },

  clearCart: async (userId) => {
    const cart = await cartRepository.findByUserId(userId);

    if (cart) {
      await cartRepository.clearCartItems(cart.id);
    }

    return { message: "Cart cleared" };
  }
};
