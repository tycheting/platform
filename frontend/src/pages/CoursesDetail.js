import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Spinner, Button, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CoursesDetail.css";

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bottomTab, setBottomTab] = useState("discussion");

  // 量左側影片高度，讓右側章節等高（不含上方標題）
  const videoBoxRef = useRef(null);
  const [videoBoxH, setVideoBoxH] = useState(0);
  const syncHeights = () => {
    if (videoBoxRef.current) setVideoBoxH(videoBoxRef.current.offsetHeight || 0);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg("");
      await Promise.all([getCourseDetail(id), checkIfEnrolled(id)]);
      setLoading(false);
      setTimeout(syncHeights, 0);
    })();
  }, [id]);

  useEffect(() => {
    syncHeights();
    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedChapter, course]);

  const getCourseDetail = async (courseId) => {
    try {
      const res = await axios.get(`http://localhost:5000/courses/${courseId}`);
      setCourse(res.data);
    } catch (error) {
      console.error("取得課程詳情失敗: ", error);
      setErrorMsg("找不到此課程或伺服器暫時無法提供服務。");
    }
  };

  const checkIfEnrolled = async (courseId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/user/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enrolledCourseIds = res.data.map((item) => item.course_id);
      setIsEnrolled(enrolledCourseIds.includes(parseInt(courseId)));
    } catch (err) {
      console.error("檢查選課狀態失敗", err);
    }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("請先登入");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5000/enroll",
        { courseId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.post(
        "http://localhost:5000/track",
        { courseId: id, actionType: "action_enroll_course" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEnrolled(true);
      alert("已成功選課！");
    } catch (error) {
      console.error("選課失敗", error);
      alert("選課失敗，請稍後再試");
    }
  };

  const handleTrack = (type) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.post(
      "http://localhost:5000/track",
      { courseId: id, actionType: type },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const introVideoUrl = useMemo(() => {
    if (!course) return "";
    return course.intro_video_path || course.video_path || "";
  }, [course]);

  // 章節：若後端有提供就補齊欄位；否則用預設 10 章
  const chapters = useMemo(() => {
    if (!course) return [];
    if (Array.isArray(course.chapters) && course.chapters.length > 0) {
      return course.chapters.map((ch, i) => ({
        ...ch,
        title: ch.title || `第 ${i + 1} 章`,
        content: ch.content || ch.description || `此處為【第 ${i + 1} 章】的簡介，將顯示關於此章節的相關介紹。`,
        video_url: ch.video_url || course.video_path || "",
      }));
    }
    return Array.from({ length: 10 }, (_, i) => ({
      title: `第 ${i + 1} 章`,
      content: `此處為【第 ${i + 1} 章】的簡介，將顯示關於此章節的相關介紹。`,
      video_url: course.video_path || "",
    }));
  }, [course]);

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

  // ========= 未選課 =========
  if (!isEnrolled) {
    return (
      <Container className="course-detail-container">
        <div className="hero-unenrolled">
          <div className="hero-unenrolled__video">
            {introVideoUrl ? (
              <video
                className="course-video"
                controls
                poster={course.image_path || ""}
                onPlay={() => handleTrack("action_play_intro")}
                onPause={() => handleTrack("action_pause_intro")}
                onEnded={() => handleTrack("action_end_intro")}
                onSeeked={() => handleTrack("action_seek_intro")}
              >
                <source src={introVideoUrl} type="video/mp4" />
                您的瀏覽器不支援 HTML5 影片標籤。
              </video>
            ) : (
              <div className="cover-fallback">無介紹影片（請上傳 intro_video_path 或 video_path）</div>
            )}
          </div>

          <div className="hero-unenrolled__meta">
            <h1 className="cd-title cd-bigger">{course.title}</h1>

            {/* 簡介：quotes.png 在左、close.png 直接放在段落最後 */}
            <div className="desc-with-icons">
              <img src="/quotes.png" alt="quotes" className="desc-icon left" />
              <p className="course-description with-tail">
                {course.description}
                <img src="/close.png" alt="close" className="inline-tail" />
              </p>
            </div>

            <div className="enroll-block">
              <div className="notice-note square">
                <img src="/idea.png" alt="idea" className="note-image" />
                <span>
                  選課後將解鎖 <b>【完整章節】</b>、<b>【討論區】</b>與<b>【教材】</b>下載區。
                </span>
              </div>
              <Button className="enroll-button full" onClick={handleEnroll}>選課</Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // ========= 已選課 =========
  return (
    <Container className="course-detail-container">
      <h1 className="cd-title cd-top">{course.title}</h1>

      {/* 影片（左） + 章節（右）等高 */}
      <div className="player-grid">
        <div className="video-wrapper" ref={videoBoxRef}>
          <video
            className="course-video"
            controls
            poster={course.image_path || ""}
            onPlay={() => handleTrack("action_play_video")}
            onPause={() => handleTrack("action_pause_video")}
            onEnded={() => handleTrack("action_stop_video")}
            onSeeked={() => handleTrack("action_seek_video")}
            onLoadedMetadata={syncHeights}
          >
            <source src={chapters[selectedChapter]?.video_url || ""} type="video/mp4" />
            您的瀏覽器不支援 HTML5 影片標籤。
          </video>
        </div>

        {/* 章節清單固定為左側影片高度，可捲動；選中的章節顯示其簡介 */}
        <aside className="sidebar-playlist no-frame fixed">
          <div
            className="chapter-list no-frame fill"
            style={{ maxHeight: videoBoxH ? `${videoBoxH}px` : undefined }}
          >
            {chapters.map((ch, idx) => (
              <div key={idx} className="chapter-block">
                <button
                  className={`chapter-item ${selectedChapter === idx ? "active" : ""}`}
                  onClick={() => setSelectedChapter(idx)}
                >
                  {ch.title}
                </button>

                {selectedChapter === idx && (
                  <div className="chapter-extra">
                    {ch.content || `這是第 ${idx + 1} 章的簡介`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 下方兩個分頁用相同色塊 */}
      <div className="white-box">
        <div className="category-bar" style={{ animation: "fadeSlideDown .25s ease both" }}>
          <div
            className={`category-item ${bottomTab === "discussion" ? "active" : ""}`}
            onClick={() => setBottomTab("discussion")}
          >
            討論區
          </div>
          <div
            className={`category-item ${bottomTab === "materials" ? "active" : ""}`}
            onClick={() => setBottomTab("materials")}
          >
            教材區
          </div>
        </div>

        {bottomTab === "discussion" ? (
          <div className="tab-body tint-pane"><p>這裡可接【討論】API；目前為靜態區塊。</p></div>
        ) : (
          <div className="tab-body tint-pane"><p>這裡可接【教材】API；目前為靜態區塊。</p></div>
        )}
      </div>
    </Container>
  );
}

export default CourseDetail;
