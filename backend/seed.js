import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with Indian restaurants...");

  // Create demo user
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: passwordHash,
    },
  });

  // Clear existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.restaurant.deleteMany({});

  // Create Indian restaurants with popular food
  const restaurants = await prisma.restaurant.createMany({
    data: [
      {
        name: "Biryani Blues",
        description: "Authentic Hyderabadi Biryani and Mughlai cuisine",
        cuisine: "Mughlai",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d29c?w=800&q=80",
        rating: 4.5,
        deliveryTime: 30,
        minOrder: 200,
      },
      {
        name: "Dosa Express",
        description: "South Indian specialties - Dosas, Idlis, Vadas",
        cuisine: "South Indian",
        imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
        rating: 4.3,
        deliveryTime: 25,
        minOrder: 150,
      },
      {
        name: "Butter Chicken House",
        description: "North Indian curries and tandoori delights",
        cuisine: "North Indian",
        imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
        rating: 4.6,
        deliveryTime: 35,
        minOrder: 250,
      },
      {
        name: "Pav Bhaji Corner",
        description: "Street food favorites - Pav Bhaji, Vada Pav, Chaat",
        cuisine: "Street Food",
        imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
        rating: 4.4,
        deliveryTime: 20,
        minOrder: 100,
      },
      {
        name: "Thali Special",
        description: "Complete meals with roti, dal, rice, sabzi",
        cuisine: "Gujarati",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        rating: 4.2,
        deliveryTime: 25,
        minOrder: 180,
      },
    ],
  });

  // Get restaurant IDs
  const allRestaurants = await prisma.restaurant.findMany();

  // Create products for each restaurant
  const products = [
    // Biryani Blues
    {
      restaurantId: allRestaurants[0].id,
      data: [
        {
          name: "Hyderabadi Biryani",
          description: "Aromatic basmati rice with tender chicken, spices, and fried onions",
          price: 280,
          category: "Biryani",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d29c?w=600&q=80",
        },
        {
          name: "Mutton Biryani",
          description: "Tender mutton pieces cooked with long-grain basmati rice",
          price: 320,
          category: "Biryani",
          imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229220b?w=600&q=80",
        },
        {
          name: "Chicken Kebab",
          description: "Tender chicken pieces marinated in spices, grilled to perfection",
          price: 220,
          category: "Starters",
          imageUrl: "https://images.unsplash.com/photo-1608039829570-de6a804b6b0d?w=600&q=80",
        },
        {
          name: "Mutton Curry",
          description: "Rich and spicy mutton curry with onions and tomatoes",
          price: 280,
          category: "Curry",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
      ],
    },
    // Dosa Express
    {
      restaurantId: allRestaurants[1].id,
      data: [
        {
          name: "Masala Dosa",
          description: "Crispy dosa filled with spiced potato masala",
          price: 90,
          category: "Dosa",
          imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80",
        },
        {
          name: "Idli Sambar",
          description: "Soft idlis served with sambar and coconut chutney",
          price: 70,
          category: "Breakfast",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
        {
          name: "Vada",
          description: "Crispy lentil fritters with sambar",
          price: 60,
          category: "Breakfast",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
        },
        {
          name: "Uttapam",
          description: "Thick pancake with vegetables, served with chutney",
          price: 85,
          category: "Dosa",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
      ],
    },
    // Butter Chicken House
    {
      restaurantId: allRestaurants[2].id,
      data: [
        {
          name: "Butter Chicken",
          description: "Creamy tomato-based curry with tender chicken pieces",
          price: 320,
          category: "Curry",
          imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
        },
        {
          name: "Dal Makhani",
          description: "Creamy black lentils cooked with butter and cream",
          price: 200,
          category: "Dal",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
        {
          name: "Tandoori Roti",
          description: "Fresh baked roti from the tandoor",
          price: 25,
          category: "Bread",
          imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
        },
        {
          name: "Paneer Tikka",
          description: "Marinated paneer cubes grilled in tandoor",
          price: 240,
          category: "Starters",
          imageUrl: "https://images.unsplash.com/photo-1608039829570-de6a804b6b0d?w=600&q=80",
        },
      ],
    },
    // Pav Bhaji Corner
    {
      restaurantId: allRestaurants[3].id,
      data: [
        {
          name: "Pav Bhaji",
          description: "Spiced vegetable curry served with buttered pav",
          price: 120,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
        },
        {
          name: "Vada Pav",
          description: "Spicy potato fritter in a bun with chutneys",
          price: 40,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
        {
          name: "Samosa (2 pcs)",
          description: "Crispy pastry filled with spiced potatoes",
          price: 50,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
        },
        {
          name: "Chole Bhature",
          description: "Spiced chickpeas with fluffy fried bread",
          price: 140,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80",
        },
      ],
    },
    // Thali Special
    {
      restaurantId: allRestaurants[4].id,
      data: [
        {
          name: "Gujarati Thali",
          description: "Complete meal with dal, sabzi, roti, rice, pickle, and sweet",
          price: 250,
          category: "Thali",
          imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
        },
        {
          name: "Rajasthani Thali",
          description: "Dal Baati Churma with gatte ki sabzi and more",
          price: 280,
          category: "Thali",
          imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
        },
        {
          name: "North Indian Thali",
          description: "Dal, sabzi, paneer, roti, rice, salad, and dessert",
          price: 300,
          category: "Thali",
          imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
        },
      ],
    },
  ];

  for (const restaurantProducts of products) {
    await prisma.product.createMany({
      data: restaurantProducts.data.map((p) => ({
        ...p,
        restaurantId: restaurantProducts.restaurantId,
      })),
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`   - Created ${allRestaurants.length} restaurants`);
  console.log(`   - Created products for each restaurant`);
  console.log(`   - Demo user: demo@example.com / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
