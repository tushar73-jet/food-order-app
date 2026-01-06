import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.restaurant.deleteMany({});

  await prisma.restaurant.createMany({
    data: [
      {
        name: "Biryani Blues",
        description: "Authentic Hyderabadi Biryani and Mughlai cuisine",
        cuisine: "Mughlai",
        imageUrl: "https://cdn.dotpe.in/longtail/store-logo/8083669/caQzIq5G.webp",
        rating: 4.5,
        deliveryTime: 30,
        minOrder: 200,
      },
      {
        name: "Dosa Express",
        description: "South Indian specialties - Dosas, Idlis, Vadas",
        cuisine: "South Indian",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS9hfbv0cvIj_84-seP-fMKMOUXMaaKb7F0Q&s",
        rating: 4.3,
        deliveryTime: 25,
        minOrder: 150,
      },
      {
        name: "Butter Chicken House",
        description: "North Indian curries and tandoori delights",
        cuisine: "North Indian",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5WxDl6ZHmddeERvclizSYNUTsyy5lf54t7g&s",
        rating: 4.6,
        deliveryTime: 35,
        minOrder: 250,
      },
      {
        name: "Bombay Pav Bhaji",
        description: "Street food favorites - Pav Bhaji, Vada Pav, Chaat",
        cuisine: "Street Food",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbIvXKAgStqKjmYARPfKSRa7SZmnufc5Y8wQ&s",
        rating: 4.4,
        deliveryTime: 20,
        minOrder: 100,
      },
      {
        name: "Thali Special",
        description: "Complete meals with roti, dal, rice, sabzi",
        cuisine: "Gujarati",
        imageUrl: "https://file.aiquickdraw.com/imgcompressed/img/compressed_7ae0c341da44ee7212b4a6389d9e71bc.webp",
        rating: 4.2,
        deliveryTime: 25,
        minOrder: 180,
      },
      {
        name: "Bella Italia",
        description: "Authentic Italian and European cuisine - Pasta, Pizza, and Continental dishes",
        cuisine: "Italian",
        imageUrl: "https://www.agritalia.com/wp-content/uploads/2023/02/BELLAITALIA_LOGO.jpg",
        rating: 4.7,
        deliveryTime: 30,
        minOrder: 300,
      },
    ],
  });

  const allRestaurants = await prisma.restaurant.findMany();

  const products = [
    {
      restaurantId: allRestaurants[0].id,
      data: [
        {
          name: "Hyderabadi Biryani",
          description: "Aromatic basmati rice with tender chicken, spices, and fried onions",
          price: 280,
          category: "Biryani",
          imageUrl: "https://images.unsplash.com/photo-1701579231349-d7459c40919d?w=800&q=80"

          ,
        },
        {
          name: "Mutton Biryani",
          description: "Tender mutton pieces cooked with long-grain basmati rice",
          price: 320,
          category: "Biryani",
          imageUrl: "https://plus.unsplash.com/premium_photo-1694141252774-c937d97641da?w=800&q=80",
        },
        {
          name: "Chicken Kebab",
          description: "Tender chicken pieces marinated in spices, grilled to perfection",
          price: 220,
          category: "Starters",
          imageUrl: "https://plus.unsplash.com/premium_photo-1663854478639-1d72bce092b5?w=800&q=80"
          ,
        },
        {
          name: "Mutton Curry",
          description: "Rich and spicy mutton curry with onions and tomatoes",
          price: 280,
          category: "Curry",
          imageUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&q=80",
        },
      ],
    },
    {
      restaurantId: allRestaurants[1].id,
      data: [
        {
          name: "Masala Dosa",
          description: "Crispy dosa filled with spiced potato masala",
          price: 90,
          category: "Dosa",
          imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80",
        },
        {
          name: "Idli Sambar",
          description: "Soft idlis served with sambar and coconut chutney",
          price: 70,
          category: "Breakfast",
          imageUrl: "https://images.unsplash.com/photo-1632104667384-06f58cb7ad44?w=800&q=80",
        },
        {
          name: "Vada",
          description: "Crispy lentil fritters with sambar",
          price: 60,
          category: "Breakfast",
          imageUrl: "https://images.unsplash.com/photo-1730191843435-073792ba22bc?w=800&q=80",
        },
        {
          name: "Uttapam",
          description: "Thick pancake with vegetables, served with chutney",
          price: 85,
          category: "Dosa",
          imageUrl: "https://www.spiceupthecurry.com/wp-content/uploads/2016/08/uttapam-recipe-2-1-500x500.jpg"
          ,
        },
      ],
    },
    {
      restaurantId: allRestaurants[2].id,
      data: [
        {
          name: "Butter Chicken",
          description: "Creamy tomato-based curry with tender chicken pieces",
          price: 320,
          category: "Curry",
          imageUrl: "https://images.immediate.co.uk/production/volatile/sites/30/2021/02/butter-chicken-ac2ff98.jpg",
        },
        {
          name: "Dal Makhani",
          description: "Creamy black lentils cooked with butter and cream",
          price: 200,
          category: "Dal",
          imageUrl: "https://www.cookwithmanali.com/wp-content/uploads/2019/04/Restaurant-Style-Dal-Makhani.jpg",
        },
        {
          name: "Tandoori Roti",
          description: "Fresh baked roti from the tandoor",
          price: 25,
          category: "Bread",
          imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ0HPvKc7KyOVAkTJVtXQLFoyM1PLpSCcu5A&s",
        },
        {
          name: "Paneer Tikka",
          description: "Marinated paneer cubes grilled in tandoor",
          price: 240,
          category: "Starters",
          imageUrl: "https://images.unsplash.com/photo-1701579231320-cc2f7acad3cd?w=1740",
        },
      ],
    },
    {
      restaurantId: allRestaurants[3].id,
      data: [
        {
          name: "Pav Bhaji",
          description: "Spiced vegetable curry served with buttered pav",
          price: 120,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=1548",
        },
        {
          name: "Vada Pav",
          description: "Spicy potato fritter in a bun with chutneys",
          price: 40,
          category: "Street Food",
          imageUrl: "https://images.unsplash.com/photo-1750767396956-da1796f33ad1?w=1992",
        },
        {
          name: "Samosa (2 pcs)",
          description: "Crispy pastry filled with spiced potatoes",
          price: 50,
          category: "Street Food",
          imageUrl: "https://plus.unsplash.com/premium_photo-1695297515622-d0991a12efe3?w=774",
        },
        {
          name: "Chole Bhature",
          description: "Spiced chickpeas with fluffy fried bread",
          price: 140,
          category: "Street Food",
          imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzcAEHJpbYcroUmiNck1ueEJLW_PUJZeTUVA&s",
        },
      ],
    },
    {
      restaurantId: allRestaurants[4].id,
      data: [
        {
          name: "Gujarati Thali",
          description: "Complete meal with dal, sabzi, roti, rice, pickle, and sweet",
          price: 250,
          category: "Thali",
          imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlPZdgbA3LxQT3NFdXS_l86NiEQN8z5gyPWg",
        },
        {
          name: "Rajasthani Thali",
          description: "Dal Baati Churma with gatte ki sabzi and more",
          price: 280,
          category: "Thali",
          imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqFCfbHgRFFmdZ3hj_17z9Sbh3XPrxZtTWjg&s",
        },
        {
          name: "North Indian Thali",
          description: "Dal, sabzi, paneer, roti, rice, salad, and dessert",
          price: 300,
          category: "Thali",
          imageUrl: "https://images.unsplash.com/photo-1589778655375-3e622a9fc91c?w=1662",
        },
      ],
    },
    {
      restaurantId: allRestaurants[5].id,
      data: [
        {
          name: "Margherita Pizza",
          description: "Classic Italian pizza with tomato, mozzarella, and basil",
          price: 350,
          category: "Pizza",
          imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop&q=90",
        },
        {
          name: "Spaghetti Carbonara",
          description: "Creamy pasta with bacon, eggs, and parmesan cheese",
          price: 380,
          category: "Pasta",
          imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop&q=90",
        },
        {
          name: "Chicken Lasagna",
          description: "Layered pasta with chicken, cheese, and marinara sauce",
          price: 420,
          category: "Pasta",
          imageUrl: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&h=600&fit=crop&q=90",
        },
        {
          name: "Caesar Salad",
          description: "Fresh romaine lettuce with caesar dressing and croutons",
          price: 280,
          category: "Salad",
          imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop&q=90",
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

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
