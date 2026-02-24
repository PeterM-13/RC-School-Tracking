// ========================================
// Server Configuration & Middleware Setup
// ========================================
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const ALLOWED_ORIGINS = [
  'https://peter-metcalfe.co.uk',
  'https://leonardo-rc.com',
  'https://www.leonardo-rc.com',
  'http://127.0.0.1:5500'
];

// Middleware: CORS
app.use(cors({ origin: ALLOWED_ORIGINS }));

// Middleware: JSON parsing
app.use(express.json());

// Middleware: Error handling
app.use((err, req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://leonardo-rc.com');
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// ========================================
// Utility Functions
// ========================================

/*
 * Find a school by name and password
 * @param {string} schoolName - The school name to find
 * @param {string} password - The school password
 * @returns {Promise<Object|null>} - The school object or null
 */
async function findSchoolByNameAndPassword(schoolName, password) {
  return prisma.schoolProgress.findFirst({
    where: {
      school: {
        equals: schoolName,
        mode: 'insensitive'
      },
      password
    }
  });
}

/*
 * Find a school by name and password, select specific fields
 * @param {string} schoolName - The school name
 * @param {string} password - The school password
 * @param {Object} selectFields - Fields to select
 * @returns {Promise<Object|null>} - School object with selected fields
 */
async function findSchoolByNameAndPasswordSelect(schoolName, password, selectFields) {
  return prisma.schoolProgress.findFirst({
    where: {
      school: {
        equals: schoolName,
        mode: 'insensitive'
      },
      password
    },
    select: selectFields
  });
}

/*
 * Find a school by name (case-insensitive)
 * @param {string} schoolName - The school name
 * @returns {Promise<Object|null>} - School object or null
 */
async function findSchoolByName(schoolName) {
  return prisma.schoolProgress.findFirst({
    where: {
      school: {
        equals: schoolName,
        mode: 'insensitive'
      }
    }
  });
}

/*
 * Verify credentials and return school data
 * @param {string} schoolName - The school name
 * @param {string} password - The school password
 * @param {Object} selectFields - Fields to select
 * @returns {Promise<Object|null>} - School data or null if credentials invalid
 */
async function verifyAndGetSchool(schoolName, password, selectFields = { school: true }) {
  return findSchoolByNameAndPasswordSelect(schoolName, password, selectFields);
}

// ========================================
// School Progress Endpoints
// ========================================

// Health check endpoint
app.get('/test', async (req, res) => {
  try {
    res.status(200).json({ success: 'API Awake!' });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// GET all school progress (admin view)
app.get('/school-progress-all', async (req, res) => {
  try {
    const schoolProgress = await prisma.schoolProgress.findMany({
      select: {
        school: true,
        progress: true
      }
    });
    res.json(schoolProgress);
  } catch (error) {
    console.error('Error fetching all school progress:', error);
    res.status(500).json({ error: 'Failed to fetch school progress' });
  }
});

// GET all school names
app.get('/school-names', async (req, res) => {
  try {
    const schools = await prisma.schoolProgress.findMany({
      select: { school: true }
    });
    res.json(schools.map((s) => s.school));
  } catch (error) {
    console.error('Error fetching school names:', error);
    res.status(500).json({ error: 'Failed to fetch school names' });
  }
});

// POST verify school password
app.post('/school-password', async (req, res) => {
  const { name, password } = req.body;
  try {
    const school = await findSchoolByNameAndPassword(name, password);
    res.json({ success: !!school });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// GET a school's progress
app.get('/school-progress/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const schoolProgress = await findSchoolByName(name);
    if (schoolProgress) {
      res.json({
        school: schoolProgress.school,
        progress: schoolProgress.progress
      });
    } else {
      res.status(404).json({ error: 'School not found' });
    }
  } catch (error) {
    console.error('Error fetching school progress:', error);
    res.status(500).json({ error: 'Failed to fetch school progress' });
  }
});

// ========================================
// School Management Endpoints
// ========================================

// POST create new school
app.post('/school', async (req, res) => {
  const { name, password } = req.body;
  try {
    if (!name || !password) {
      return res.status(400).json({ error: 'School name and password are required' });
    }

    const existingSchool = await findSchoolByName(name);
    if (existingSchool) {
      return res.status(409).json({ error: 'School already exists' });
    }

    const newSchool = await prisma.schoolProgress.create({
      data: {
        school: name,
        password,
        progress: [],
        comments: []
      },
      select: {
        school: true,
        progress: true,
        comments: true
      }
    });

    res.status(201).json(newSchool);
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// DELETE school
app.delete('/school', async (req, res) => {
  const { name, password } = req.body;
  try {
    if (!name || !password) {
      return res.status(400).json({ error: 'School name and password are required' });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      name,
      password,
      { id: true, school: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    await prisma.schoolProgress.delete({
      where: { id: school.id }
    });

    res.json({ 
      success: true, 
      message: `School "${school.school}" deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// PATCH school password
app.patch('/school-password', async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  try {
    if (!name || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'School name, current password, and new password are required' 
      });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      name,
      currentPassword,
      { id: true }
    );

    if (!school) {
      return res.status(404).json({ 
        error: 'School not found or incorrect current password' 
      });
    }

    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { password: newPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// PATCH school progress
app.patch('/school-progress', async (req, res) => {
  const { name, progress, password } = req.body;
  try {
    if (!Array.isArray(progress)) {
      return res.status(400).json({ error: 'Progress must be an array' });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      name,
      password,
      { id: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { progress }
    });

    const updatedSchool = await prisma.schoolProgress.findUnique({
      where: { id: school.id },
      select: {
        school: true,
        progress: true
      }
    });

    res.json(updatedSchool);
  } catch (error) {
    console.error('Error updating school progress:', error);
    res.status(500).json({ error: 'Failed to update school progress' });
  }
});

// ========================================
// Admin Endpoints
// ========================================

// PATCH reset all school progress
app.patch('/reset-all-progress', async (req, res) => {
  const { password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'Admin password is required' });
    }

    const admin = await findSchoolByNameAndPassword('Admin', password);

    if (!admin) {
      return res.status(403).json({ error: 'Incorrect admin password' });
    }

    await prisma.schoolProgress.updateMany({
      data: { progress: [] }
    });

    res.json({ success: true, message: 'All school progress has been reset' });
  } catch (error) {
    console.error('Error resetting all progress:', error);
    res.status(500).json({ error: 'Failed to reset all progress' });
  }
});

// ========================================
// Comment Endpoints
// ========================================

// GET comments for a school
app.get('/comments', async (req, res) => {
  const { 'school-name': schoolName, key: password } = req.query;
  try {
    if (!schoolName || !password) {
      return res.status(400).json({ error: 'School name and password are required' });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      schoolName,
      password,
      { comments: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    res.json({ comments: school.comments || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST a new comment
app.post('/comment', async (req, res) => {
  const { 'school-name': schoolName, 'school-key': password, text, 'admin-key': adminKey } = req.body;
  try {
    if (!schoolName || !password || !text) {
      return res.status(400).json({ 
        error: 'School name, password, and comment text are required' 
      });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      schoolName,
      password,
      { id: true, comments: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    const sender = adminKey ? 'leonardo' : 'school';
    const comments = Array.isArray(school.comments) ? school.comments : [];
    const newIndex = comments.length;
    const newComment = { index: newIndex, sender, text, viewed: false };
    const updatedComments = [...comments, newComment];

    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments: updatedComments }
    });

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// DELETE a comment by index
app.delete('/comment', async (req, res) => {
  const { 'school-name': schoolName, 'school-key': password, 'comment-index': commentIndex } = req.body;
  try {
    if (!schoolName || !password || commentIndex === undefined) {
      return res.status(400).json({ 
        error: 'School name, password, and comment index are required' 
      });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      schoolName,
      password,
      { id: true, comments: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    let comments = Array.isArray(school.comments) ? school.comments : [];
    const commentIdx = parseInt(commentIndex, 10);

    if (isNaN(commentIdx) || commentIdx < 0 || commentIdx >= comments.length) {
      return res.status(400).json({ error: 'Invalid comment index' });
    }

    // Remove comment and re-index
    comments = comments.filter((c) => c.index !== commentIdx);
    comments = comments.map((c, i) => ({ ...c, index: i }));

    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments }
    });

    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// PATCH mark comment as viewed
app.patch('/comment-viewed', async (req, res) => {
  const { 'school-name': schoolName, key: password, 'msg-index': msgIndex } = req.body;
  try {
    if (!schoolName || !password || msgIndex === undefined) {
      return res.status(400).json({ 
        error: 'School name, password, and message index are required' 
      });
    }

    const school = await findSchoolByNameAndPasswordSelect(
      schoolName,
      password,
      { id: true, comments: true }
    );

    if (!school) {
      return res.status(404).json({ error: 'School not found or incorrect password' });
    }

    let comments = Array.isArray(school.comments) ? school.comments : [];
    const msgIdx = parseInt(msgIndex, 10);

    if (isNaN(msgIdx) || msgIdx < 0 || msgIdx >= comments.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    comments[msgIdx].viewed = true;

    await prisma.schoolProgress.update({
      where: { id: school.id },
      data: { comments }
    });

    res.json({ success: true, comment: comments[msgIdx] });
  } catch (error) {
    console.error('Error marking comment as viewed:', error);
    res.status(500).json({ error: 'Failed to mark comment as viewed' });
  }
});

// GET all schools with unviewed comments (admin only)
app.get('/unviewed-comments', async (req, res) => {
  const { adminKey, 'sent-by': sentBy } = req.query;
  try {
    if (!adminKey) {
      return res.status(400).json({ error: 'Admin key is required' });
    }

    const admin = await findSchoolByNameAndPassword('Admin', adminKey);

    if (!admin) {
      return res.status(403).json({ error: 'Incorrect admin key' });
    }

    const schools = await prisma.schoolProgress.findMany({
      where: {
        school: { not: 'Admin' }
      },
      select: {
        school: true,
        comments: true
      }
    });

    const unviewedBySchool = {};

    schools.forEach(({ school, comments }) => {
      const commentArray = Array.isArray(comments) ? comments : [];
      let filteredComments = commentArray.filter(c => c.viewed === false);

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

// ========================================
// Server Startup
// ========================================

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});