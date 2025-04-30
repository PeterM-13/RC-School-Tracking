const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTable() {
  try {
    await prisma.schoolProgress.deleteMany();
    console.log("Table cleared successfully.");
  } catch (error) {
    console.error("Error clearing table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTable();