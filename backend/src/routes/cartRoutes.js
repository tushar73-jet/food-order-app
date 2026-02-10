import express from "express";
import prisma from "../lib/prisma.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", protect, async (req, res) => {
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: req.userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart) {
            return res.json([]);
        }
        const formattedItems = cart.items.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            imageUrl: item.product.imageUrl,
            quantity: item.quantity,
        }));

        res.json(formattedItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//
router.post("/", protect, async (req, res) => {
    const { items } = req.body; // Array of { id, quantity }

    try {
        let cart = await prisma.cart.findUnique({
            where: { userId: req.userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: req.userId },
            });
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        if (items && items.length > 0) {
            await prisma.cartItem.createMany({
                data: items.map((item) => ({
                    cartId: cart.id,
                    productId: item.id,
                    quantity: item.quantity,
                })),
            });
        }

        res.json({ message: "Cart synced successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete("/", protect, async (req, res) => {
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: req.userId },
        });

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
        }

        res.json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
