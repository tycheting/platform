import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import WhiteBox from "../components/WhiteBox";
import "./MyCourses.css";

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const DONE_THRESHOLD = 97;

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizePercent = (val) => {
    if (val === null || val === undefined) return 0;

    if (typeof val === "string") {
      const t = val.trim();
      if (t.endsWith("%")) {
        const n = Number(t.slice(0, -1));
        return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
      }
      const n = Number(t);
      if (!Number.isFinite(n)) return 0;
      if (n > 0 && n <= 1) return Math.round(n * 100);
      return Math.max(0, Math.min(100, Math.round(n)));
    }

    if (typeof val === "number") {
      if (val > 0 && val <= 1) return Math.round(val * 100);
      return Math.max(0, Math.min(100, Math.round(val)));
    }
    return 0;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/images")) return `http://localhost:5000${imagePath}`;
    return `http://localhost:5000/images/${imagePath}`;
  };

  const getProgress = (c) => normalizePercent(c._progress_percent);

  const fetchOneProgress = async (courseId) => {
    try {
      const pr = await axios.get(
        `http://localhost:5000/video/courses/${courseId}/progress`,
        { headers: authHeaders() }
      );
      const raw =
        pr.data?.progressPercent ??
        pr.data?.percent ??
        pr.data?.progress_percent ??
        pr.data?.progress ??
        pr.data?.completion ??
        pr.data?.completion_rate ??
        0;
      return normalizePercent(raw);
    } catch (e) {
      console.error("progress API error", courseId, e?.response?.data || e?.message);
      return 0;
    }
  };

  const fetchOneStats = async (courseId) => {
    try {
      const st = await axios.get(
        `http://localhost:5000/courses/${courseId}/stats`,
        { headers: authHeaders() }
      );
      const d = st.data || {};

      const num = (x, def = 0) => (Number.isFinite(Number(x)) ? Number(x) : def);

      const comments =
        num(d.commentsCount) ??
        num(d.comment_count) ??
        num(d.discussionCount) ??
        0;

      let quizRate =
        d.quizAnswerRate ??
        d.quiz_rate ??
        d.answerRate ??
        d.answer_rate ??
        null;

      if (quizRate == null) {
        const done =
          num(d.quizzesDone, NaN) ??
          num(d.quiz_done, NaN) ??
          num(d.answered, NaN);
        const total =
          num(d.totalQuizzes, NaN) ??
          num(d.quiz_total, NaN) ??
          num(d.total, NaN);
        if (Number.isFinite(done) && Number.isFinite(total) && total > 0) {
          quizRate = Math.round((done / total) * 100);
        }
      }
      quizRate = normalizePercent(quizRate ?? 0);

      const downloads = num(d.downloads, null) ?? num(d.materialDownloads, null) ?? null;
      const assignments = num(d.assignments, null) ?? num(d.hwSubmitted, null) ?? null;
      const watchMin =
        num(d.watchMinutes, null) ??
        num(d.watch_min, null) ??
        num(d.learn_minutes, null) ??
        null;

      const lastActiveAt = d.lastActiveAt ?? d.last_active_at ?? null;

      return {
        commentsCount: comments,
        quizRate,
        downloads,
        assignments,
        watchMinutes: watchMin,
        lastActiveAt,
      };
    } catch {
      return {
        commentsCount: 0,
        quizRate: 0,
        downloads: null,
        assignments: null,
        watchMinutes: null,
        lastActiveAt: null,
      };
    }
  };

  const fetchMyCoursesWithProgress = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCourses([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/user/my-courses", {
        headers: authHeaders(),
      });

      const baseCourses = Array.from(
        new Map(
          (res.data || []).map((c) => {
            const cid = c.course_id ?? c.id;
            return [cid, { ...c, course_id: cid }];
          })
        ).values()
      );

      const withData = await Promise.all(
        baseCourses.map(async (c) => {
          const [percent, stats] = await Promise.all([
            fetchOneProgress(c.course_id).catch(() => 0),
            fetchOneStats(c.course_id).catch(() => ({ commentsCount: 0, quizRate: 0 })),
          ]);

          const fallback =
            c.progress_percent ??
            c.progressRate ??
            c.progress ??
            c.learn_percent ??
            0;

          return {
            ...c,
            _progress_percent: percent > 0 ? percent : normalizePercent(fallback),
            _stats: stats,
          };
        })
      );

      setCourses(withData);
    } catch (e) {
      console.error("my-courses API error:", e?.response?.data || e?.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCoursesWithProgress();
  }, [fetchMyCoursesWithProgress]);

  useEffect(() => {
    const onFocus = () => fetchMyCoursesWithProgress();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchMyCoursesWithProgress();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchMyCoursesWithProgress]);

  // 排序：未完成優先 → 最近活動時間新→ 完成度高 → 標題
  const sortedCourses = [...courses].sort((a, b) => {
    const progA = getProgress(a);
    const progB = getProgress(b);
    const doneA = progA >= DONE_THRESHOLD;
    const doneB = progB >= DONE_THRESHOLD;

    if (doneA !== doneB) {
      // 未完成排前面
      return doneA ? 1 : -1;
    }

    // 都未完成 or 都已完成 → 比 lastActiveAt（新到舊）
    const laA = a._stats?.lastActiveAt ? Date.parse(a._stats.lastActiveAt) : 0;
    const laB = b._stats?.lastActiveAt ? Date.parse(b._stats.lastActiveAt) : 0;
    if (laA !== laB) return laB - laA;

    // 再比完成度（高到低）
    if (progA !== progB) return progB - progA;

    // 再比標題（避免同分亂跳）
    const tA = (a.title || "").toString().toLowerCase();
    const tB = (b.title || "").toString().toLowerCase();
    return tA.localeCompare(tB, "zh-Hant");
  });

  return (
    <Container className="mt-4 mycourses-page">
      <WhiteBox className="white-box">
        <div
          className="title-with-lines"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <img src="/已選課程.png" alt="我的課程" className="title-image" />
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div className="course-card-grid">
            {sortedCourses.map((course) => {
              const progress = getProgress(course);
              const s = course._stats || {};
              const title = course.title || "未命名課程";
              const isDone = progress >= DONE_THRESHOLD;

              return (
                <Link
                  to={`/courses/${course.course_id}`}
                  className={`course-card${isDone ? " is-done" : ""}`}
                  key={course.course_id}
                >
                  <div className="cover">
                    <img
                      src={getImageUrl(course.image_path)}
                      alt={title}
                      loading="lazy"
                    />
                    {!isDone && progress > 0 && (
                      <div className="ribbon">上課中</div>
                    )}
                    {isDone && <div className="ribbon done">已完成</div>}
                  </div>

                  <div className="meta">
                    <h3 className="title" title={title}>
                      {title}
                    </h3>

                    <div
                      className="progress-wrap"
                      aria-label={`完成度 ${isDone ? 100 : progress}%`}
                    >
                      <div className="bar" style={{ "--p": `${isDone ? 100 : progress}%` }}>
                        <div className="fill" style={{ width: `${isDone ? 100 : progress}%` }} />
                      </div>
                      <div className={isDone ? "percent-text done" : "percent-text"}>
                        {isDone ? "完成" : `${progress}%`}
                      </div>
                    </div>

                    <div className="stats-pair" aria-label="課程統計">
                      <div className="stat-item">
                        <span className="label">留言</span>
                        <span className="value">
                          {Number.isFinite(Number(s.commentsCount))
                            ? Number(s.commentsCount)
                            : "—"}
                        </span>
                        <span className="label">則</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">作答</span>
                        <span className="value">
                          {Number.isFinite(Number(s.quizRate))
                            ? Number(s.quizRate)
                            : "—"}
                        </span>
                        <span className="label">%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </WhiteBox>
    </Container>
  );
}

export default MyCourses;
