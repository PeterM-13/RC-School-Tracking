const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const cors = require('cors');
const prisma = new PrismaClient();

app.use(cors({ origin: ['https://peter-metcalfe.co.uk', 'https://leonardo-rc.com'] }));

app.use(express.json());
app.use((err, req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://leonardo-rc.com');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

app.get('/test', async (req, res) => {
  console.log('Endpoint hit: GET /test');
  try {
    res.status(200).json({ success: 'API Awake!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school progress' });
  }
});

// GET all school progress
// Example URL: GET http://localhost:3000/school-progress-all
app.get('/school-progress-all', async (req, res) => {
  console.log('Endpoint hit: GET /school-progress-all');
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
  console.log('Endpoint hit: GET /school-names');
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
  console.log('Endpoint hit: POST /school-password');
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
  console.log(`Endpoint hit: GET /school-progress/${req.params.name}`);
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

// POST create new school
// Example URL: POST http://localhost:3000/school
// Example Body: { "name": "exampleSchoolName", "password": "1234" }
app.post('/school', async (req, res) => {
  console.log('Endpoint hit: POST /school');
  const { name, password } = req.body;
  try {
    if (!name || !password) {
      return res.status(400).json({ error: 'School name and password are required' });
    }

    // Check if school already exists
    const existingSchool = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingSchool) {
      return res.status(409).json({ error: 'School already exists' });
    }

    // Create the new school
    const newSchool = await prisma.schoolProgress.create({
      data: {
        school: name,
        password,
        progress: [],
        comments: [],
      },
      select: {
        school: true,
        progress: true,
        comments: true,
      },
    });

    res.status(201).json(newSchool);
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// DELETE school
// Example URL: DELETE http://localhost:3000/school
// Example Body: { "name": "exampleSchoolName", "password": "1234" }
app.delete('/school', async (req, res) => {
  console.log('Endpoint hit: DELETE /school');
  const { name, password } = req.body;
  try {
    if (!name || !password) {
      return res.status(400).json({ error: 'School name and password are required' });
    }

    // Find the school and verify password
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive',
        },
        password,
      },
      select: {
        id: true,
        school: true,
      },
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    // Delete the school
    await prisma.schoolProgress.delete({
      where: { id: school.id },
    });

    res.json({ success: true, message: `School "${school.school}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// PATCH school password
// Example URL: PATCH http://localhost:3000/school-password
// Example Body: { "name": "exampleSchoolName", "currentPassword": "1234", "newPassword": "5678" }
app.patch('/school-password', async (req, res) => {
  console.log('Endpoint hit: PATCH /school-password');
  const { name, currentPassword, newPassword } = req.body;
  try {
    if (!name || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'School name, current password, and new password are required' });
    }

    // Find the school and verify current password
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: name,
          mode: 'insensitive',
        },
        password: currentPassword,
      },
      select: {
        id: true,
      },
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect current password' });
    }

    // Update the password
    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { password: newPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// PATCH school progress
// Example URL: PATCH http://localhost:3000/school-progress
// Example Body: { "name": "exampleSchoolName", "progress": [75, 80, 90], "password":"1234" }
app.patch('/school-progress', async (req, res) => {
  console.log('Endpoint hit: PATCH /school-progress');
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

// PATCH reset all school progress
// Example URL: PATCH http://localhost:3000/reset-all-progress
// Example Body: { "password": "adminPassword" }
app.patch('/reset-all-progress', async (req, res) => {
  console.log('Endpoint hit: PATCH /reset-all-progress');
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'Admin password is required' });
    }

    // Verify admin password
    const admin = await prisma.schoolProgress.findFirst({
      where: {
        school: {
          equals: 'Admin',
          mode: 'insensitive',
        },
        password,
      },
    });

    if (!admin) {
      return res.status(403).json({ error: 'Incorrect admin password' });
    }

    // Update all schools' progress to empty array
    await prisma.schoolProgress.updateMany({
      data: { progress: [] },
    });

    res.json({ success: true, message: 'All school progress has been reset' });
  } catch (error) {
    console.error('Error resetting all progress:', error);
    res.status(500).json({ error: 'Failed to reset all progress' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// GET comments for a school
// Example: GET /comments?school-name=exampleSchoolName&key=1234
app.get('/comments', async (req, res) => {
  console.log('Endpoint hit: GET /comments');
  const { 'school-name': name, key } = req.query;
  try {
    if (!name || !key) {
      return res.status(400).json({ error: 'School name and key are required' });
    }
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: { equals: name, mode: 'insensitive' },
        password: key,
      },
      select: { comments: true },
    });
    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect key' });
    }
    res.json({ comments: school.comments || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST a new comment
// Example: POST /comment { school-name, school-key, text, admin-key (optional) }
app.post('/comment', async (req, res) => {
  console.log('Endpoint hit: POST /comment');
  const { 'school-name': name, 'school-key': key, text, 'admin-key': adminKey } = req.body;
  try {
    if (!name || !key || !text) {
      return res.status(400).json({ error: 'School name, key, and text are required' });
    }
    // Find the school
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: { equals: name, mode: 'insensitive' },
        password: key,
      },
      select: { id: true, comments: true },
    });
    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect key' });
    }
    const sender = adminKey ? 'leonardo' : 'school';
    const comments = Array.isArray(school.comments) ? school.comments : [];
    const newIndex = comments.length > 0 ? comments.length : 0;
    const newComment = { index: newIndex, sender, text, viewed: false };
    const updatedComments = [...comments, newComment];
    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments: updatedComments },
    });
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// DELETE a comment by index
// Example: DELETE /comment { school-name, school-key, comment-index }
app.delete('/comment', async (req, res) => {
  console.log('Endpoint hit: DELETE /comment');
  const { 'school-name': name, 'school-key': key, 'comment-index': commentIndex } = req.body;
  try {
    if (!name || !key || commentIndex === undefined) {
      return res.status(400).json({ error: 'School name, key, and comment index are required' });
    }
    // Find the school
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: { equals: name, mode: 'insensitive' },
        password: key,
      },
      select: { id: true, comments: true },
    });
    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect key' });
    }
    let comments = Array.isArray(school.comments) ? school.comments : [];
    const idx = parseInt(commentIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= comments.length) {
      return res.status(400).json({ error: 'Invalid comment index' });
    }
    comments = comments.filter((c) => c.index !== idx);
    // Re-index comments
    comments = comments.map((c, i) => ({ ...c, index: i }));
    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments },
    });
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// PATCH mark comment as viewed
// Example: PATCH /comment-viewed { school-name, key, msg-index }
app.patch('/comment-viewed', async (req, res) => {
  console.log('Endpoint hit: PATCH /comment-viewed');
  const { 'school-name': name, key, 'msg-index': msgIndex } = req.body;
  try {
    if (!name || !key || msgIndex === undefined) {
      return res.status(400).json({ error: 'School name, key, and message index are required' });
    }
    // Find the school
    const school = await prisma.schoolProgress.findFirst({
      where: {
        school: { equals: name, mode: 'insensitive' },
        password: key,
      },
      select: { id: true, comments: true },
    });
    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect key' });
    }
    let comments = Array.isArray(school.comments) ? school.comments : [];
    const idx = parseInt(msgIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= comments.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }
    // Mark the comment as viewed
    comments[idx].viewed = true;
    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments },
    });
    res.json({ success: true, comment: comments[idx] });
  } catch (error) {
    console.error('Error marking comment as viewed:', error);
    res.status(500).json({ error: 'Failed to mark comment as viewed' });
  }
});

// GET all schools with unviewed comments (admin only)
// Example: GET /unviewed-comments?adminKey=adminPassword
// Optional: ?sent-by=leonardo or ?sent-by=school
app.get('/unviewed-comments', async (req, res) => {
  console.log('Endpoint hit: GET /unviewed-comments');
  const { 'adminKey': adminKey, 'sent-by': sentBy } = req.query;
  try {
    if (!adminKey) {
      return res.status(400).json({ error: 'Admin key is required' });
    }
    // Verify admin key
    const admin = await prisma.schoolProgress.findFirst({
      where: {
        school: { equals: 'Admin', mode: 'insensitive' },
        password: adminKey,
      },
    });
    if (!admin) {
      return res.status(403).json({ error: 'Incorrect admin key' });
    }
    // Get all schools with their unviewed comment count
    const schools = await prisma.schoolProgress.findMany({
      where: {
        school: { not: 'Admin' },
      },
      select: {
        school: true,
        comments: true,
      },
    });
    const unviewedBySchool = {};
    schools.forEach(({ school, comments }) => {
      const commentArray = Array.isArray(comments) ? comments : [];
      let filteredComments = commentArray.filter(c => c.viewed === false);
      
      // Filter by sender if sent-by parameter is provided
      if (sentBy === 'leonardo' || sentBy === 'school') {
        filteredComments = filteredComments.filter(c => c.sender === sentBy);
      }
      
      const unviewedCount = filteredComments.length;
      if (unviewedCount > 0) {
        unviewedBySchool[school] = unviewedCount;
      }
    });
    res.json(unviewedBySchool);
  } catch (error) {
    console.error('Error fetching unviewed comments:', error);
    res.status(500).json({ error: 'Failed to fetch unviewed comments' });
  }
});