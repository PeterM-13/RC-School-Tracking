const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const cors = require('cors');
const prisma = new PrismaClient();

app.use(cors({origin: 'https://peter-metcalfe.co.uk'}));

app.use(express.json());
app.use((err, req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://peter-metcalfe.co.uk');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

// GET all school progress
// Example URL: GET http://localhost:3000/school-progress-all
app.get('/school-progress-all', async (req, res) => {
  try {
    const schoolProgress = await prisma.schoolProgress.findMany({
      select: {
        school: true,
        progress: true,
      },
    });
    res.json(schoolProgress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school progress' });
  }
});

// GET all school names
// Example URL: GET http://localhost:3000/school-names
app.get('/school-names', async (req, res) => {
    try {
      const schools = await prisma.schoolProgress.findMany({
        select: { school: true },
      });
      res.json(schools.map((s) => s.school));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch school names' });
    }
  });

// POST school password
// Example URL: POST http://localhost:3000/school-password
// Example Body: { "name": "exampleSchoolName", "password": "examplePassword" }
app.post('/school-password', async (req, res) => {
  const { name, password } = req.body;
  try {
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive',
        },
        password,
      },
    });
    res.json({ success: !!school });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// GET a school's progress
// Example URL: GET http://localhost:3000/school-progress/exampleSchoolName
app.get('/school-progress/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const schoolProgress = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive', // Case-insensitive match
        },
      },
      select: { school: true, progress: true },
    });
    if (schoolProgress) {
      res.json(schoolProgress);
    } else {
      res.status(404).json({ error: 'School not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school progress' });
  }
});

// PATCH school progress
// Example URL: PATCH http://localhost:3000/school-progress
// Example Body: { "name": "exampleSchoolName", "progress": [75, 80, 90], "password":"1234" }
app.patch('/school-progress', async (req, res) => {
  const { name, progress, password } = req.body;
  try {
    if (!Array.isArray(progress)) {
      return res.status(400).json({ error: 'Progress must be an array' });
    }

    // Fetch the school by name and password to confirm credentials
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive',
        },
        password, // Match the password
      },
      select: {
        id: true, // Only select the ID to avoid returning the password
      },
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    // Update the progress using the unique ID
    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { progress },
    });

    // Fetch the updated school without the password
    const updatedSchool = await prisma.schoolProgress.findUnique({
      where: { id: school.id },
      select: {
        school: true,
        progress: true,
      },
    });

    res.json(updatedSchool);
  } catch (error) {
    console.error('Error updating school progress:', error);
    res.status(500).json({ error: 'Failed to update school progress' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});