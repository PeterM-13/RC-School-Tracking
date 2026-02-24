// ========================================
// Database Cleanup Script
// Clears all data from SchoolProgress table
// ========================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    await prisma.schoolProgress.deleteMany();
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();