// ========================================
// Database Seeding Script
// Initializes SchoolProgress table with schools and default data
// ========================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCHOOLS = [
  'Admin',
  'Cottesloe',
  'Queensbury',
  'Aylesbury High',
  'Parmiters',
  'Stopsley',
  'Silverstone UTC',
  'Roundwood',
  'Watford Boys',
  'Watford Girls',
  'Chalk Hills',
  'St Clement Danes',
  'Lealands',
  'Chiltern Academy',
  'Shenley Brook End'
];

const PASSWORDS = [
  'lu13pg',
  'cottesloe37355',
  'queensbury67890',
  'aylesburyhigh54321',
  'parmiters98765',
  'stopsley11223',
  'silverstoneutc44556',
  'roundwood77889',
  'watfordboys99001',
  'watfordgirls22334',
  'chalkhills55667',
  'stclementdanes88990',
  'lealands33445',
  'chilternacademy66778',
  'shenleybrookend91402'
];

const INITIAL_COMMENT = {
  index: 0,
  sender: 'leonardo',
  text: 'Hi there! How can we help?',
  viewed: false
};

async function seedDatabase() {
  try {
    // Create school progress entries
    for (let i = 0; i < SCHOOLS.length; i++) {
      await prisma.schoolProgress.create({
        data: {
          school: SCHOOLS[i],
          password: PASSWORDS[i],
          progress: [],
          comments: i === 0 ? [] : [INITIAL_COMMENT]
        }
      });
    }

    console.log('Successfully seeded database with school data.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();