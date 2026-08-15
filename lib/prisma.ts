import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create adapter for Prisma 7
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Add this to your prisma.ts file for testing
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

export default prisma;
