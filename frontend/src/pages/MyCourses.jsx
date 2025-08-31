import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Container, Button, Spinner } from "react-bootstrap";
import WhiteBox from "../components/WhiteBox";
import "./MyCourses.css";

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 將各種可能欄位轉成 0~100 的整數百分比；接受 "35%"、0.35、"0.35"、35 等
  const normalizePercent = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.endsWith("%")) {
        const n = Number(trimmed.slice(0, -1));
        return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
      }
      const n = Number(trimmed);
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

  // 取得我的課程 + 逐門課查進度（只要百分比）
  const fetchMyCoursesWithProgress = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCourses([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // 先拿課程清單
      const res = await axios.get("http://localhost:5000/user/my-courses", {
        headers: authHeaders(),
      });

      // 去重，並兼容 id / course_id
      const baseCourses = Array.from(
        new Map(
          res.data.map((c) => {
            const cid = c.course_id ?? c.id;
            return [cid, { ...c, course_id: cid }];
          })
        ).values()
      );

      // 逐門課去拿 /video/courses/:courseId/progress
      const withProgress = await Promise.all(
        baseCourses.map(async (c) => {
          try {
            const pr = await axios.get(
              `http://localhost:5000/video/courses/${c.course_id}/progress`,
              { headers: authHeaders() }
            );

            // ✅ 包含 progressPercent
            const raw =
              pr.data?.progressPercent ??
              pr.data?.percent ??
              pr.data?.progress_percent ??
              pr.data?.progress ??
              pr.data?.completion ??
              pr.data?.completion_rate ??
              0;

            const percent = normalizePercent(raw);

            // 如果後端暫時還沒算，就 fallback 吃原本可能存在的欄位
            const fallback =
              c.progress_percent ?? c.progressRate ?? c.progress ?? c.learn_percent ?? 0;

            return {
              ...c,
              _progress_percent: percent > 0 ? percent : normalizePercent(fallback),
            };
          } catch (e) {
            console.error(
              "progress API error for course",
              c.course_id,
              e?.response?.data || e?.message
            );
            const fallback =
              c.progress_percent ?? c.progressRate ?? c.progress ?? c.learn_percent ?? 0;
            return { ...c, _progress_percent: normalizePercent(fallback) };
          }
        })
      );

      setCourses(withProgress);
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/images")) return `http://localhost:5000${imagePath}`;
    return `http://localhost:5000/images/${imagePath}`;
  };

  const getProgress = (c) => normalizePercent(c._progress_percent);

  const refreshProgress = async () => {
    setRefreshing(true);
    await fetchMyCoursesWithProgress();
    setRefreshing(false);
  };

  return (
    <Container className="mt-4 mycourses-page">
      <WhiteBox className="white-box">
        <div className="title-with-lines" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/已選課程.png" alt="我的課程" className="title-image" />
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={refreshProgress}
            disabled={refreshing || loading}
          >
            {refreshing ? "更新中…" : "重新整理進度"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div className="course-card-grid">
            {courses.map((course) => {
              const progress = getProgress(course);

              return (
                <Link
                  to={`/courses/${course.course_id}`}
                  className="course-card"
                  key={course.course_id}
                >
                  <div className="cover">
                    <img
                      src={getImageUrl(course.image_path)}
                      alt={course.title}
                      loading="lazy"
                    />
                    {progress > 0 && progress < 100 && (
                      <div className="ribbon">上課中</div>
                    )}
                    {progress === 100 && <div className="ribbon done">已完成</div>}
                  </div>

                  <div className="meta">
                    <h3 className="title" title={course.title}>
                      {course.title}
                    </h3>

                    <div className="progress-wrap" aria-label={`完成度 ${progress}%`}>
                      <div className="bar">
                        <div className="fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className={progress === 100 ? "percent-text done" : "percent-text"}>
                        {progress === 100 ? "完成" : `${progress}%`}
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
