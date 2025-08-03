const express = require('express');
const router = express.Router();
const { Course } = require('../models');

// GET /courses?category=語言
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;

    const whereClause = category ? { category } : {};

    const courses = await Course.findAll({ where: whereClause });

    res.json(courses);
  } catch (err) {
    console.error('無法取得課程', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
