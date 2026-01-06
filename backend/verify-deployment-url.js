import { PrismaClient } from "@prisma/client";

const urls = [
    {
        name: "Original (as provided)",
        url: "postgresql://neondb_owner:npg_39DBTIsvwaZH@ep-purple-wind-adqiyqsy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    },
    {
        name: "With pgbouncer=true",
        url: "postgresql://neondb_owner:npg_39DBTIsvwaZH@ep-purple-wind-adqiyqsy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true"
    },
    {
        name: "Without channel_binding, with pgbouncer",
        url: "postgresql://neondb_owner:npg_39DBTIsvwaZH@ep-purple-wind-adqiyqsy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
    }
];

async function testConnection(name, url) {
    console.log(`\nTesting: ${name}`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });

    try {
        await prisma.$connect(); // Explicit connect to catch init errors
        const count = await prisma.restaurant.count();
        console.log(`✅ SUCCESS! Found ${count} restaurants.`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED`);
        console.log(e.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    console.log("Diagnosing Connection Strings...");
    for (const test of urls) {
        await testConnection(test.name, test.url);
    }
}

main();
