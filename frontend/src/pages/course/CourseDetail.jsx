import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Spinner, Button, Alert } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./CoursesDetail.css";

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // axios 實例（帶 JWT）
  const API = useMemo(() => {
    const instance = axios.create({ baseURL: "http://localhost:5000" });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, []);

  // 舊 /video/* -> /course/video/* + 補完整 URL
  const fixVideoUrl = (u) => {
    if (!u) return "";
    try {
      const isAbs = /^https?:\/\//i.test(u);
      let urlStr = isAbs ? u : `${API.defaults.baseURL}${u.startsWith("/") ? "" : "/"}${u}`;
      urlStr = urlStr.replace(/\/video(\/|$)/, "/course/video$1");
      return urlStr;
    } catch {
      return u.startsWith("/video") ? u.replace(/^\/video/, "/course/video") : u;
    }
  };

  // 視訊/尺寸
  const videoRef = useRef(null);
  const [videoKey, setVideoKey] = useState(0);
  const videoBoxRef = useRef(null);
  const [videoBoxH, setVideoBoxH] = useState(0);
  const syncHeights = () => {
    if (videoBoxRef.current) setVideoBoxH(videoBoxRef.current.offsetHeight || 0);
  };

  const getCourseDetail = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setCourse(res.data);
    } catch (e) {
      setErrorMsg("找不到此課程或伺服器暫時無法提供服務。");
    }
  };
  const checkIfEnrolled = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await API.get("/user/my-courses");
      const ids = res.data.map((c) => c.course_id);
      setIsEnrolled(ids.includes(parseInt(id)));
    } catch {}
  };
  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("請先登入");
    try {
      await API.post("/enroll", { courseId: id });
      setIsEnrolled(true);
      alert("已成功選課！");
    } catch {
      alert("選課失敗，請稍後再試");
    }
  };

  const chapters = useMemo(() => {
    if (!course) return [];
    const arr = Array.isArray(course.chapters) ? course.chapters : [];
    return arr
      .filter((ch) => ch && ch.id != null)
      .map((ch) => ({
        id: ch.id,
        title: ch.title || "未命名章節",
        content: ch.description || ch.content || "",
        video_url: ch.video_url || "",
        duration_sec: Number(ch.duration_sec || 0),
      }));
  }, [course]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([getCourseDetail(), checkIfEnrolled()]);
      setLoading(false);
      setTimeout(syncHeights, 0);
    })();
  }, [id]); // eslint-disable-line

  useEffect(() => {
    syncHeights();
    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedChapter, course]);

  const introVideoUrl = useMemo(() => {
    if (!course) return "";
    return course.intro_video_path || course.video_path || "";
  }, [course]);

  const onSelectChapter = (idx) => {
    setSelectedChapter(idx);
    setVideoKey((k) => k + 1);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  if (!course) {
    return (
      <Container className="mt-4">
        {errorMsg ? <Alert variant="danger">{errorMsg}</Alert> : <h3>找不到此課程</h3>}
      </Container>
    );
  }

  // 未選課：只看介紹 + 按鈕
  if (!isEnrolled) {
    return (
      <Container className="course-detail-container">
        <div className="hero-unenrolled">
          <div className="hero-unenrolled__video">
            {introVideoUrl ? (
              <video key={videoKey} ref={videoRef} className="course-video" controls poster={course.image_path || ""}>
                <source src={fixVideoUrl(introVideoUrl)} type="video/mp4" />
              </video>
            ) : (
              <div className="cover-fallback">找不到介紹影片</div>
            )}
          </div>

          <div className="hero-unenrolled__meta">
            <h1 className="cd-title cd-bigger">{course.title}</h1>
            <div className="desc-with-icons">
              <img src="/quotes.png" alt="quotes" className="desc-icon left" />
              <p className="course-description with-tail">
                {course.description || "找不到課程簡介"}
                <img src="/close.png" alt="close" className="inline-tail" />
              </p>
            </div>

            <div className="enroll-block">
              <div className="notice-note square">
                <img src="/idea.png" alt="idea" className="note-image" />
                <span>選課後可觀看章節、討論、教材等內容。</span>
              </div>
              <Button className="enroll-button full" onClick={handleEnroll}>選課</Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // 已選課：播放器 + 章節清單 + 子導覽
  return (
    <Container className="course-detail-container">
      <h1 className="cd-title cd-top">{course.title}</h1>

      {/* 子導覽列：改用 Link 到各子頁 */}
      <div className="subnav mb-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/info`}>課程資訊</Link>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/progress`}>課程進度</Link>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/materials`}>教材區</Link>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/problems`}>題目區</Link>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/discussion`}>討論區</Link>
        <Link className="btn btn-outline-secondary btn-sm" to={`/courses/${id}/comments`}>留言區</Link>
      </div>

      <div className="player-grid">
        <div className="video-wrapper" ref={videoBoxRef}>
          {chapters.length === 0 ? (
            <div className="cover-fallback">找不到章節（請確認後端 /courses/:id 是否回傳 chapters）</div>
          ) : (
            <video key={videoKey} ref={videoRef} className="course-video" controls poster={course.image_path || ""}>
              <source src={fixVideoUrl(chapters[selectedChapter]?.video_url || "")} type="video/mp4" />
              您的瀏覽器不支援 HTML5 影片標籤。
            </video>
          )}
        </div>

        <aside className="sidebar-playlist no-frame fixed">
          <div className="chapter-list no-frame fill" style={{ maxHeight: videoBoxH ? `${videoBoxH}px` : undefined }}>
            {chapters.length === 0 ? (
              <div className="text-muted p-3">尚無章節</div>
            ) : (
              chapters.map((ch, idx) => (
                <div key={ch.id} className="chapter-block">
                  <button
                    className={`chapter-item ${selectedChapter === idx ? "active" : ""}`}
                    onClick={() => onSelectChapter(idx)}
                  >
                    <span className="ch-title">{ch.title}</span>
                  </button>
                  {selectedChapter === idx && (
                    <div className="chapter-extra">{ch.content || `第 ${idx + 1} 章`}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* 簡短關於課程 */}
      <div className="white-box mt-3">
        <div className="tab-body tint-pane">
          <div className="desc-with-icons">
            <img src="/quotes.png" alt="quotes" className="desc-icon left" />
            <p className="course-description with-tail">
              {course.description || "找不到課程簡介"}
              <img src="/close.png" alt="close" className="inline-tail" />
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default CourseDetail;
