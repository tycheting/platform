// routes/video.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // 路徑依你的專案調整

module.exports = (orm) => {
  const sequelize =
    orm?.sequelize || (orm?.define ? orm : null);
  const models =
    orm?.models || sequelize?.models || null;

  if (!models) {
    console.error('[video routes] 找不到 models。收到的 orm keys =', Object.keys(orm || {}));
    throw new Error('video routes 初始化失敗：找不到 models。');
  }

  // 取得需要的兩個 model（名稱以你的 define 為準）
  const CourseChapters = models.course_chapters || models.CourseChapters;
  const LessonProgress = models.lesson_progress || models.LessonProgress;

  if (!CourseChapters || !LessonProgress) {
    console.error('[video routes] 可用 models：', Object.keys(models));
    throw new Error('缺少必要的 model：請確認有定義 course_chapters 與 lesson_progress。');
  }

  /**
   * PUT /chapters/:chapterId/watchtime
   * body: { watchedSec: number }
   * 以「最大值」更新 watched_sec；看滿 90% 判定為完成
   */
  router.put('/chapters/:chapterId/watchtime', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const chapterId = Number(req.params.chapterId);
      const watchedSecIncoming = Math.max(0, Number(req.body.watchedSec));

      if (!Number.isInteger(chapterId) || Number.isNaN(watchedSecIncoming)) {
        return res.status(400).json({ error: 'chapterId / watchedSec 無效' });
      }

      const chapter = await CourseChapters.findByPk(chapterId, {
        attributes: ['id', 'duration_sec']
      });
      if (!chapter) return res.status(404).json({ error: '章節不存在' });

      const duration = chapter.duration_sec || 0;
      const existing = await LessonProgress.findOne({ where: { user_id: userId, chapter_id: chapterId } });

      const newWatched = Math.max(existing?.watched_sec || 0, watchedSecIncoming);
      const completeThreshold = Math.floor(duration * 0.9);
      const isCompleted = duration > 0 ? (newWatched >= completeThreshold) : false;

      if (existing) {
        existing.watched_sec = newWatched;
        existing.is_completed = isCompleted;
        await existing.save();
      } else {
        await LessonProgress.create({
          user_id: userId,
          chapter_id: chapterId,
          watched_sec: newWatched,
          is_completed: isCompleted
        });
      }

      return res.json({
        chapterId,
        userId,
        watchedSec: newWatched,
        durationSec: duration,
        isCompleted
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * GET /courses/:courseId/duration
   * 回傳課程所有章節的影片總時數（秒）
   */
  router.get('/courses/:courseId/duration', authenticateToken, async (req, res) => {
    try {
      const courseId = Number(req.params.courseId);
      if (!Number.isInteger(courseId)) return res.status(400).json({ error: 'courseId 無效' });

      const total = await CourseChapters.sum('duration_sec', { where: { course_id: courseId } });
      return res.json({ courseId, totalDurationSec: total || 0 });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * GET /courses/:courseId/progress
   * 回傳當前登入用戶在此課程的總觀看秒數、總時數、完成率(%)
   */
  router.get('/courses/:courseId/progress', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const courseId = Number(req.params.courseId);
      if (!Number.isInteger(courseId)) return res.status(400).json({ error: 'courseId 無效' });

      const chapters = await CourseChapters.findAll({
        where: { course_id: courseId },
        attributes: ['id', 'duration_sec']
      });

      const totalDuration = chapters.reduce((acc, c) => acc + (c.duration_sec || 0), 0);
      const chapterIds = chapters.map(c => c.id);

      let watchedTotal = 0;
      if (chapterIds.length > 0) {
        const progresses = await LessonProgress.findAll({
          where: { user_id: userId, chapter_id: chapterIds },
          attributes: ['chapter_id', 'watched_sec']
        });
        const durMap = new Map(chapters.map(c => [c.id, c.duration_sec || 0]));
        for (const p of progresses) {
          watchedTotal += Math.min(p.watched_sec, durMap.get(p.chapter_id) ?? 0);
        }
      }

      const progressPercent = totalDuration > 0
        ? Math.min(100, Math.round((watchedTotal * 100) / totalDuration))
        : 0;

      return res.json({
        userId,
        courseId,
        watchedTotalSec: watchedTotal,
        totalDurationSec: totalDuration,
        progressPercent
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
};
