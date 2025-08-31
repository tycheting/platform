import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Spinner, Button, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CoursesDetail.css";

function CourseDetail() {
  const { id } = useParams(); // 注意：route param 字串
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // 分頁鍵：discussion | materials | progress | problems | comments | about | info
  const [bottomTab, setBottomTab] = useState("discussion");

  // 課程總時長 / 用戶總進度（秒＆完成率）
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [progressSec, setProgressSec] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // 量左側影片高度，讓右側章節等高（不含上方標題）
  const videoBoxRef = useRef(null);
  const [videoBoxH, setVideoBoxH] = useState(0);
  const syncHeights = () => {
    if (videoBoxRef.current) setVideoBoxH(videoBoxRef.current.offsetHeight || 0);
  };

  // ====== axios 實例：自動帶 JWT、統一 baseURL ======
  const API = useMemo(() => {
    const instance = axios.create({ baseURL: "http://localhost:5000" });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, []);

  // ====== 影片 ref 與事件回報工具（含時間） ======
  const videoRef = useRef(null);

  // 節流：timeupdate 每 N 秒回報 1 次 watchtime
  const lastReportRef = useRef({ ts: 0, sentSec: 0 });
  const REPORT_EVERY_MS = 10000; // 每 10 秒回報一次

  const getOrInitSessionId = () => {
    const KEY = "session_id";
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      try {
        sid = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      } catch {
        sid = Math.random().toString(36).slice(2);
      }
      localStorage.setItem(KEY, sid);
    }
    return sid;
  };

  const handleTrack = (type, extra = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const session_id = getOrInitSessionId();
    API.post("/track", { courseId: id, actionType: type, session_id, ...extra }).catch(() => {});
  };

  // 先算出 intro 影片網址（未選課頁用）
  const introVideoUrl = useMemo(() => {
    if (!course) return "";
    return course.intro_video_path || course.video_path || "";
  }, [course]);

  // ====== 僅使用「後端章節」，抓不到就空陣列 ======
  const chapters = useMemo(() => {
    if (!course) return [];
    if (Array.isArray(course.chapters) && course.chapters.length > 0) {
      // 必須有 id 才保留
      return course.chapters
        .filter((ch) => ch && ch.id)
        .map((ch) => ({
          id: ch.id,
          title: ch.title || "未命名章節",
          content: ch.description || ch.content || "",
          video_url: ch.video_url || "",
          duration_sec: Number(ch.duration_sec || 0),
        }));
    }
    return [];
  }, [course]);

  // 從章節物件取主鍵 id
  const getChapterId = (ch) => ch?.id ?? null;

  // ====== 後端 API 串接：watchtime / duration / progress ======

  // PUT /video/chapters/:chapterId/watchtime  回報單章節觀看進度（body: { watchedSec }）
  const putWatchtime = async (chapterId, watchedSec) => {
    if (chapterId === null || chapterId === undefined) return;
    try {
      await API.put(`/video/chapters/${chapterId}/watchtime`, {
        watchedSec: Math.max(0, Math.floor(watchedSec || 0)),
      });
    } catch {
      /* 靜默，避免干擾 UX */
    }
  };

  // GET /video/courses/:courseId/duration  讀取課程總時長
  const fetchCourseDuration = async () => {
    try {
      const res = await API.get(`/video/courses/${id}/duration`);
      const sec = Number(res.data?.totalDurationSec ?? 0);
      setTotalDurationSec(Number.isFinite(sec) ? sec : 0);
    } catch (e) {
      console.error("duration API error:", e?.response?.data || e?.message);
      setTotalDurationSec(0);
    }
  };

  // GET /video/courses/:courseId/progress  讀取用戶整體進度（秒 & %）
  const fetchCourseProgress = async () => {
    try {
      const res = await API.get(`/video/courses/${id}/progress`);
      const watched = Number(res.data?.watchedTotalSec ?? 0);
      const pct = Number(res.data?.progressPercent ?? 0);
      setProgressSec(Number.isFinite(watched) ? watched : 0);
      setProgressPercent(Number.isFinite(pct) ? Math.max(0, Math.min(100, Math.round(pct))) : 0);
    } catch (e) {
      console.error("progress API error:", e?.response?.data || e?.message);
      setProgressSec(0);
      setProgressPercent(0);
    }
  };

  // ====== 影片事件封裝 ======
  const sendVideoEvent = (action) => {
    const v = videoRef.current;
    const cur = v ? Math.floor(v.currentTime || 0) : 0;
    const dur = v ? Math.floor(v.duration || 0) : 0;
    const percent = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
    handleTrack(action, { currentTime: cur, duration: dur, percent });
  };

  // metadata 載入時：補送 0 秒（建檔用），再抓總時長/進度
  const onLoadedMeta = async () => {
    const ch = chapters[selectedChapter];
    if (!ch) return;
    const chapterId = getChapterId(ch);
    if (chapterId) await putWatchtime(chapterId, 0);
    syncHeights();
    await Promise.all([fetchCourseDuration(), fetchCourseProgress()]);
  };

  // 每 10 秒回報一次 watchtime
  const onTimeUpdate = async () => {
    const now = Date.now();
    const v = videoRef.current;
    if (!v) return;
    const cur = Math.floor(v.currentTime || 0);

    if (now - lastReportRef.current.ts >= REPORT_EVERY_MS && cur !== lastReportRef.current.sentSec) {
      const ch = chapters[selectedChapter];
      const chapterId = getChapterId(ch);
      if (chapterId) {
        lastReportRef.current = { ts: now, sentSec: cur };
        await putWatchtime(chapterId, cur);
      }
    }
  };

  // 切頁/關閉前補送一次 stop & watchtime
  useEffect(() => {
    const onBeforeUnload = async () => {
      const v = videoRef.current;
      const ch = chapters[selectedChapter];
      if (!v || !ch) return;
      const chapterId = getChapterId(ch);
      if (chapterId) await putWatchtime(chapterId, v.currentTime);
      sendVideoEvent("action_stop_video");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      onBeforeUnload();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, chapters]);

  // 初始載入：只抓課程資料與是否已選（duration/progress 等到影片 metadata 再抓）
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg("");
      await Promise.all([getCourseDetail(id), checkIfEnrolled(id)]);
      setLoading(false);
      setTimeout(syncHeights, 0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 視窗尺寸變更，調整右側高度
  useEffect(() => {
    syncHeights();
    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedChapter, course]);

  const getCourseDetail = async (courseId) => {
    try {
      const res = await API.get(`/courses/${courseId}`);
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
      const res = await API.get("/user/my-courses");
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
      await API.post("/enroll", { courseId: id });
      setIsEnrolled(true);
      alert("已成功選課！");
      await Promise.all([fetchCourseDuration(), fetchCourseProgress()]);
    } catch (error) {
      console.error("選課失敗", error);
      alert("選課失敗，請稍後再試");
    }
  };

  // 分頁切換：回報點擊與離開
  const switchTab = (nextTab) => {
    if (bottomTab === nextTab) return;

    // 先送「離開」事件（僅討論區/教材區有 close）
    if (bottomTab === "discussion") handleTrack("action_close_forum");
    if (bottomTab === "materials") handleTrack("action_close_courseware");

    // 送「進入」事件
    if (nextTab === "discussion") handleTrack("action_click_forum");
    if (nextTab === "materials") handleTrack("action_click_courseware");
    if (nextTab === "progress") handleTrack("action_click_progress");
    if (nextTab === "problems") handleTrack("action_problem_get"); // 進入題目區=載入題目
    if (nextTab === "comments") {
      // 進留言區先不送 create，等使用者真的提交再送 action_create_comment
    }
    if (nextTab === "about") handleTrack("action_click_about");
    if (nextTab === "info") handleTrack("action_click_info");

    setBottomTab(nextTab);
  };

  // 點章節：切換前補送一次 stop & watchtime，切換後刷新整體進度
  const onSelectChapter = async (idx) => {
    if (!chapters[selectedChapter]) return;
    const v = videoRef.current;
    if (v) {
      const prevId = getChapterId(chapters[selectedChapter]);
      if (prevId) await putWatchtime(prevId, v.currentTime);
      sendVideoEvent("action_stop_video");
    }
    setSelectedChapter(idx);
    handleTrack("action_click_courseware", { chapterIndex: idx });
    fetchCourseProgress();
  };

  // ========= Loading / Error =========
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
                ref={videoRef}
                className="course-video"
                controls
                poster={course.image_path || ""}
                onLoadedMetadata={onLoadedMeta}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => sendVideoEvent("action_play_video")}
                onPause={() => sendVideoEvent("action_pause_video")}
                onEnded={async () => {
                  const v = videoRef.current;
                  const ch = chapters[selectedChapter];
                  const chapterId = getChapterId(ch);
                  if (chapterId) await putWatchtime(chapterId, v?.duration ?? 0);
                  sendVideoEvent("action_stop_video");
                  fetchCourseProgress();
                }}
                onSeeked={() => sendVideoEvent("action_seek_video")}
              >
                <source src={introVideoUrl} type="video/mp4" />
                您的瀏覽器不支援 HTML5 影片標籤。
              </video>
            ) : (
              <div className="cover-fallback">找不到介紹影片（請確認後端欄位 intro_video_path 或 video_path）</div>
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
              <Button className="enroll-button full" onClick={handleEnroll}>
                選課
              </Button>
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
          {chapters.length === 0 ? (
            <div className="cover-fallback">
              找不到章節（請確認後端 /courses/:id 是否回傳 chapters 且每筆都有 id / video_url）
            </div>
          ) : (
            <video
              ref={videoRef}
              className="course-video"
              controls
              poster={course.image_path || ""}
              onLoadedMetadata={onLoadedMeta}
              onTimeUpdate={onTimeUpdate}
              onPlay={() => sendVideoEvent("action_play_video")}
              onPause={() => sendVideoEvent("action_pause_video")}
              onEnded={async () => {
                const v = videoRef.current;
                const ch = chapters[selectedChapter];
                const chapterId = getChapterId(ch);
                if (chapterId) await putWatchtime(chapterId, v?.duration ?? 0);
                sendVideoEvent("action_stop_video");
                fetchCourseProgress();
              }}
              onSeeked={() => sendVideoEvent("action_seek_video")}
            >
              <source src={chapters[selectedChapter]?.video_url || ""} type="video/mp4" />
              您的瀏覽器不支援 HTML5 影片標籤。
            </video>
          )}
        </div>

        {/* 章節清單固定為左側影片高度，可捲動；選中的章節顯示其簡介 */}
        <aside className="sidebar-playlist no-frame fixed">
          <div
            className="chapter-list no-frame fill"
            style={{ maxHeight: videoBoxH ? `${videoBoxH}px` : undefined }}
          >
            {chapters.length === 0 ? (
              <div className="text-muted p-3">尚無章節</div>
            ) : (
              chapters.map((ch, idx) => (
                <div key={ch.id} className="chapter-block">
                  <button
                    className={`chapter-item ${selectedChapter === idx ? "active" : ""}`}
                    onClick={() => onSelectChapter(idx)}
                  >
                    {ch.title}
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

      {/* 下方分頁 */}
      <div className="white-box">
        <div className="category-bar" style={{ animation: "fadeSlideDown .25s ease both" }}>
          <div
            className={`category-item ${bottomTab === "discussion" ? "active" : ""}`}
            onClick={() => switchTab("discussion")}
          >
            討論區
          </div>
          <div
            className={`category-item ${bottomTab === "materials" ? "active" : ""}`}
            onClick={() => switchTab("materials")}
          >
            教材區
          </div>
          <div
            className={`category-item ${bottomTab === "progress" ? "active" : ""}`}
            onClick={() => switchTab("progress")}
          >
            課程進度
          </div>
          <div
            className={`category-item ${bottomTab === "problems" ? "active" : ""}`}
            onClick={() => switchTab("problems")}
          >
            題目區
          </div>
          <div
            className={`category-item ${bottomTab === "comments" ? "active" : ""}`}
            onClick={() => switchTab("comments")}
          >
            留言區
          </div>
          <div
            className={`category-item ${bottomTab === "about" ? "active" : ""}`}
            onClick={() => switchTab("about")}
          >
            關於課程
          </div>
          <div
            className={`category-item ${bottomTab === "info" ? "active" : ""}`}
            onClick={() => switchTab("info")}
          >
            課程資訊
          </div>
        </div>

        {/* 各分頁內容（只吃後端，抓不到就顯示沒有資料） */}
        {bottomTab === "discussion" && (
          <div className="tab-body tint-pane">
            {Array.isArray(course.discussions) && course.discussions.length > 0 ? (
              <ul className="list-unstyled">
                {course.discussions.map((d) => (
                  <li key={d.id} className="mb-2">{d.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">找不到討論資料（尚未串接或後端無資料）。</p>
            )}
          </div>
        )}

        {bottomTab === "materials" && (
          <div className="tab-body tint-pane">
            {Array.isArray(course.materials) && course.materials.length > 0 ? (
              <ul className="list-unstyled">
                {course.materials.map((m) => (
                  <li key={m.id || m.href} className="mb-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        handleTrack("action_click_courseware", { material: m.label || m.name });
                        if (m.href) window.open(m.href, "_blank");
                      }}
                    >
                      {m.label || m.name}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">找不到教材（尚未串接或後端無資料）。</p>
            )}
          </div>
        )}

        {bottomTab === "progress" && (
          <div className="tab-body tint-pane">
            <p>這裡顯示個人學習進度（已串後端）。切換到本分頁時已送 action_click_progress。</p>
            <ul>
              <li>
                觀看時間：{Math.floor(progressSec / 60)} 分 {progressSec % 60} 秒
                {" / "}
                {Math.floor(totalDurationSec / 60)} 分 {totalDurationSec % 60} 秒
              </li>
              <li>完成率：{progressPercent}%</li>
              <li>目前章節：{chapters.length > 0 ? `第 ${selectedChapter + 1} / ${chapters.length}` : "無章節"}</li>
            </ul>
            <Button
              variant="outline-secondary"
              onClick={() => Promise.all([fetchCourseDuration(), fetchCourseProgress()])}
            >
              重新整理進度
            </Button>
          </div>
        )}

        {bottomTab === "problems" && (
          <div className="tab-body tint-pane">
            {Array.isArray(course.problems) && course.problems.length > 0 ? (
              <ul className="list-unstyled">
                {course.problems.map((p) => (
                  <li key={p.id} className="mb-2">{p.title || `題目 #${p.id}`}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">找不到題目資料（尚未串接或後端無資料）。</p>
            )}
          </div>
        )}

        {bottomTab === "comments" && (
          <div className="tab-body tint-pane">
            {Array.isArray(course.comments) && course.comments.length > 0 ? (
              <ul className="list-unstyled">
                {course.comments.map((c) => (
                  <li key={c.id} className="mb-2">{c.content}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">找不到留言資料（尚未串接或後端無資料）。</p>
            )}
          </div>
        )}

        {bottomTab === "about" && (
          <div className="tab-body tint-pane">
            <p>{course.about || "找不到課程介紹（尚未串接或後端無資料）。"}</p>
          </div>
        )}

        {bottomTab === "info" && (
          <div className="tab-body tint-pane">
            <ul>
              <li>老師：{course.instructor || "未提供"}</li>
              <li>課程別：{course.category || "未提供"}</li>
              <li>開課單位：{course.school || "未提供"}</li>
            </ul>
          </div>
        )}
      </div>
    </Container>
  );
}

export default CourseDetail;
