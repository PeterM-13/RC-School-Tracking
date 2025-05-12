const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schools = [
    "Admin",
    "Cottesloe",
    "Queensbury",
    "Aylesbury High",
    "Parmiters",
    "Stopsley",
    "Silverstone UTC",
    "Roundwood",
    "Watford Boys",
    "Watford Girls",
    "Chalk Hills",
    "St Clement Danes",
    "Lealands",
    "Chiltern Academy",
    "Shenley Brook End"
  ];

  const passwords = [
    "lu13pg",
    "cottesloe37355",
    "queensbury67890",
    "aylesburyhigh54321",
    "parmiters98765",
    "stopsley11223",
    "silverstoneutc44556",
    "roundwood77889",
    "watfordboys99001",
    "watfordgirls22334",
    "chalkhills55667",
    "stclementdanes88990",
    "lealands33445",
    "chilternacademy66778",
    "shenleybrookend91402"
  ];

  for (let i = 0; i < schools.length; i++) {
    await prisma.schoolProgress.create({
      data: {
        school: schools[i],
        password: passwords[i], // Use the corresponding password
        progress: [],
        comments: [],
      },
    });
  }

  console.log("Schools added successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });