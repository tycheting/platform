import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Spinner, Button, Alert } from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CoursesDetail.css";

// NEW: 增加一個簡單的 Icon 元件來根據教材類型顯示圖示
const MaterialIcon = ({ type }) => {
  const iconMap = {
    pdf: "📄",
    slides: "投影", // 為了簡潔，可以使用 Emoji 或對應的 icon class
    link: "🔗",
    code: "💻",
    image: "🖼️",
    file: "📁",
  };
  return <span style={{ marginRight: '8px', fontSize: '1.2em' }}>{iconMap[type] || '📎'}</span>;
};

function CourseDetail() {
  const { id } = useParams(); // route param 字串
  const courseIdStr = String(id);

  // ====== 基本狀態 ======
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs
  const [bottomTab, setBottomTab] = useState("about");

  // 整體進度
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [progressSec, setProgressSec] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // 影片區高度同步
  const videoBoxRef = useRef(null);
  const [videoBoxH, setVideoBoxH] = useState(0);
  const syncHeights = () => {
    if (videoBoxRef.current) setVideoBoxH(videoBoxRef.current.offsetHeight || 0);
  };

  // ====== axios ======
  const API = useMemo(() => {
    const instance = axios.create({ baseURL: "http://localhost:5000" });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, []);

  // ====== 工具 ======
  const pickArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    for (const k of keys) {
      const v = data?.[k];
      if (Array.isArray(v)) return v;
    }
    return [];
  };

  const fixVideoUrl = (u) => {
    if (!u) return "";
    try {
      const isAbsolute = /^https?:\/\//i.test(u);
      let urlStr = isAbsolute ? u : `${API.defaults.baseURL}${u.startsWith("/") ? "" : "/"}${u}`;
      urlStr = urlStr.replace(/\/video(\/|$)/, "/course/video$1");
      return urlStr;
    } catch {
      if (u.startsWith("/video")) return u.replace(/^\/video/, "/course/video");
      return u;
    }
  };

  // ====== 常數 ======
  const CH_DONE_THRESHOLD = 0.97; // 97% 視為完成
  const REPORT_EVERY_MS = 10000;

  // ====== 視訊 ref / 事件 ======
  const videoRef = useRef(null);
  const [videoKey, setVideoKey] = useState(0);
  const lastReportRef = useRef({ ts: 0, sentSec: 0 });

  // ====== 章節完成狀態 ======
  const [chapterWatch, setChapterWatch] = useState({}); // { [chapterId]: watchedSec }
  const [chapterDone, setChapterDone] = useState({});   // { [chapterId]: true/false }

  // duration 快取
  const DUR_KEY = "chapter_durations_v1";
  const readDurationStore = () => {
    try { return JSON.parse(localStorage.getItem(DUR_KEY) || "{}"); } catch { return {}; }
  };
  const writeDurationStore = (obj) => {
    try { localStorage.setItem(DUR_KEY, JSON.stringify(obj)); } catch {}
  };
  const [durationStore, setDurationStore] = useState(readDurationStore);
  const durKey = (chapterId) => `${courseIdStr}:${String(chapterId)}`;

  const recomputeChapterDone = (chaptersList, watchMap, store = durationStore) => {
    const next = {};
    chaptersList.forEach((ch) => {
      const key = durKey(ch.id);
      const cachedDur = Number(store?.[key] || 0);
      const backendDur = Number(ch.duration_sec || 0);
      const dur = Math.max(0, backendDur > 0 ? backendDur : cachedDur);
      const w = Math.max(0, Number(watchMap[String(ch.id)] ?? 0));
      next[ch.id] = dur > 0 ? w >= Math.floor(dur * CH_DONE_THRESHOLD) : false;
    });
    setChapterDone(next);
  };

  // ====== 章節 / 課程 ======
  const introVideoUrl = useMemo(() => {
    if (!course) return "";
    return course.intro_video_path || course.video_path || "";
  }, [course]);

  const chapters = useMemo(() => {
    if (!course) return [];
    if (Array.isArray(course.chapters) && course.chapters.length > 0) {
      return course.chapters
        .filter((ch) => ch && ch.id != null)
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

  const getChapterId = (ch) => (ch?.id != null ? ch.id : null);
  const currentChapter = chapters[selectedChapter];
  const currentChapterId = currentChapter?.id ?? null;

  // ====== 後端 API：課程/選課/進度 ======
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

  const putWatchtime = async (chapterId, watchedSec) => {
    if (chapterId == null) return;
    try {
      await API.put(`/course/video/chapters/${chapterId}/watchtime`, {
        watchedSec: Math.max(0, Math.floor(watchedSec || 0)),
      });
      setChapterWatch((prev) => {
        const cidStr = String(chapterId);
        const nextWatch = { ...prev, [cidStr]: Math.max(Math.floor(watchedSec || 0), Number(prev[cidStr] || 0)) };
        recomputeChapterDone(chapters, nextWatch);
        return nextWatch;
      });
    } catch {}
  };

  const fetchCourseDuration = async () => {
    try {
      const res = await API.get(`/course/video/courses/${id}/duration`);
      const sec = Number(res.data?.totalDurationSec ?? 0);
      setTotalDurationSec(Number.isFinite(sec) ? sec : 0);
    } catch (e) {
      console.error("duration API error:", e?.response?.data || e?.message);
      setTotalDurationSec(0);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const res = await API.get(`/course/video/courses/${id}/progress`);
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

  const fetchChaptersWatchtime = async (chaptersList) => {
    if (!Array.isArray(chaptersList) || chaptersList.length === 0) {
      setChapterWatch({});
      setChapterDone({});
      return;
    }
    try {
      const results = await Promise.allSettled(
        chaptersList.map((ch) =>
          API.get(`/course/video/chapters/${ch.id}/watchtime`).then((r) => ({
            id: ch.id,
            watchedSec: Number(r.data?.watchedSec ?? r.data?.watchtime ?? 0),
          }))
        )
      );
      const watchMap = {};
      results.forEach((res) => {
        if (res.status === "fulfilled") {
          const { id: chapterId, watchedSec } = res.value;
          watchMap[String(chapterId)] = Math.max(0, Number.isFinite(watchedSec) ? watchedSec : 0);
        }
      });
      setChapterWatch(watchMap);
      recomputeChapterDone(chaptersList, watchMap);
    } catch (e) {
      console.error("chapters watchtime error:", e?.response?.data || e?.message);
      setChapterWatch({});
      recomputeChapterDone(chaptersList, {});
    }
  };

  // ====== 分頁資料（章節級）======
  // MODIFIED: 教材區，加入獨立 loading 狀態
  const [materials, setMaterials] = useState([]);
  const [materialsError, setMaterialsError] = useState("");
  const [materialsLoading, setMaterialsLoading] = useState(false); // NEW: 教材區專用 loading state

  const listChapterMaterials = async (chapterId) => {
    setMaterialsError("");
    if (chapterId == null) {
      setMaterials([]);
      return;
    }
    setMaterialsLoading(true); // NEW: 開始讀取
    try {
      const res = await API.get(`/course/material/chapters/${chapterId}`);
      // MODIFIED: 從 `pickArray` 改為更直接的取值，並加上 position 排序
      const rawMaterials = Array.isArray(res.data) ? res.data : (res.data?.materials || []);
      const sortedMaterials = rawMaterials.sort((a, b) => (a.position || 0) - (b.position || 0));
      setMaterials(sortedMaterials);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) setMaterialsError("您需要選課才能查看此章節的教材。");
      else if (status === 404) setMaterialsError("找不到此章節或教材資源。");
      else setMaterialsError("讀取教材失敗，請稍後再試。");
      setMaterials([]);
    } finally {
      setMaterialsLoading(false); // NEW: 結束讀取
    }
  };

  /** 受保護下載（含預覽），這部分邏輯已很完整，無需修改 */
  const fetchAndOpenMaterial = async (material) => {
    if (!material?.id) return;
    try {
      const resp = await API.get(`/course/material/${material.id}/download`, {
        responseType: "blob",
        validateStatus: (s) => s >= 200 && s < 400,
      });

      const blob = resp.data;
      const url = window.URL.createObjectURL(blob);
      const ct = resp.headers["content-type"] || "";
      const inline = /pdf|image\//i.test(ct); // 簡化判斷，PDF和圖片直接在新分頁開啟

      if (inline && material.type !== 'file') { // 確保 `type: 'file'` 的檔案總是會下載
        window.open(url, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = url;
        const filename =
          resp.headers["x-filename"] ||
          material.title ||
          `material-${material.id}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) alert("需要已選課才能下載此教材（403）。");
      else if (status === 404) alert("找不到此教材（404）。");
      else alert("下載失敗，請稍後再試。");
    }
  };

  // 題目（使用者：僅作答檢查）
  const [questions, setQuestions] = useState([]);
  const [questionsError, setQuestionsError] = useState("");

  const listChapterQuestions = async (chapterId) => {
    setQuestionsError("");
    if (chapterId == null) { setQuestions([]); return; }
    try {
      const res = await API.get(`/course/question/chapters/${chapterId}`);
      setQuestions(pickArray(res.data, ["questions", "items"]));
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) setQuestionsError("需要已選課才能查看此章節題目（403）。");
      else if (status === 404) setQuestionsError("找不到此章節或題目（404）。");
      else setQuestionsError("讀取題目失敗，請稍後再試。");
      setQuestions([]);
    }
  };

  const checkAnswer = async (questionId, userAnswer) => {
    if (!questionId) return;
    try {
      const res = await API.post(`/course/question/${questionId}/check`, { userAnswer });
      const { correct, explanation } = res.data || {};
      alert(`${correct ? "✅ 答對了！" : "❌ 答錯了～"}${explanation ? `\n解析：${explanation}` : ""}`);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) alert("需要已選課才能作答（403）。");
      else alert("作答檢查失敗，請稍後再試。");
    }
  };

  // 討論/留言（簡版只讀）
  const [discussions, setDiscussions] = useState([]);
  const [discPage, setDiscPage] = useState(1);
  const [discSize, setDiscSize] = useState(20);
  const [discQ, setDiscQ] = useState("");

  const listChapterDiscussions = async (chapterId, page = discPage, size = discSize, q = discQ) => {
    if (chapterId == null) { setDiscussions([]); return; }
    try {
      const res = await API.get(`/course/discussion/chapters/${chapterId}`, { params: { page, size, q } });
      setDiscussions(Array.isArray(res.data?.threads) ? res.data.threads
        : Array.isArray(res.data) ? res.data
        : (res.data?.items || []));
    } catch {
      setDiscussions([]);
    }
  };

  const [comments, setComments] = useState([]);
  const [cPage, setCPage] = useState(1);
  const [cSize, setCSize] = useState(20);

  const listChapterComments = async (chapterId, page = cPage, size = cSize) => {
    if (chapterId == null) { setComments([]); return; }
    try {
      const res = await API.get(`/course/comment/chapters/${chapterId}`, { params: { page, size } });
      setComments(Array.isArray(res.data) ? res.data : (res.data?.items || []));
    } catch {
      setComments([]);
    }
  };

  // ====== 行為事件 ======
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

  const sendVideoEvent = (action) => {
    const v = videoRef.current;
    const cur = v ? Math.floor(v.currentTime || 0) : 0;
    const dur = v ? Math.floor(v.duration || 0) : 0;
    const percent = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
    handleTrack(action, { currentTime: cur, duration: dur, percent });
  };

  const onLoadedMeta = async () => {
    const ch = currentChapter;
    if (ch) {
      const v = videoRef.current;
      const d = v ? Math.floor(Number(v.duration || 0)) : 0;
      if (ch.id != null && d > 0) {
        setDurationStore((prev) => {
          const key = durKey(ch.id);
          if (Number(prev[key] || 0) === d) return prev;
          const next = { ...prev, [key]: d };
          writeDurationStore(next);
          recomputeChapterDone(chapters, chapterWatch, next);
          return next;
        });
      }
      const chapterId = getChapterId(ch);
      if (chapterId != null) await putWatchtime(chapterId, 0);
    }
    syncHeights();
    await Promise.all([fetchCourseDuration(), fetchCourseProgress()]);
  };

  const onTimeUpdate = async () => {
    const now = Date.now();
    const v = videoRef.current;
    if (!v) return;
    const cur = Math.floor(v.currentTime || 0);

    if (now - lastReportRef.current.ts >= REPORT_EVERY_MS && cur !== lastReportRef.current.sentSec) {
      const ch = currentChapter;
      const chapterId = getChapterId(ch);
      if (chapterId != null) {
        lastReportRef.current = { ts: now, sentSec: cur };
        await putWatchtime(chapterId, cur);
      }
    }
  };

  const onSelectChapter = async (idx) => {
    if (!chapters[selectedChapter]) return;
    const v = videoRef.current;
    if (v) {
      const prevId = getChapterId(chapters[selectedChapter]);
      if (prevId != null) await putWatchtime(prevId, v.currentTime);
      sendVideoEvent("action_stop_video");
    }
    setSelectedChapter(idx);
    handleTrack("action_click_courseware", { chapterIndex: idx });
    setVideoKey((k) => k + 1); // 重建 <video>
    fetchCourseProgress();
  };

  // ====== beforeunload ======
  useEffect(() => {
    const onBeforeUnload = async () => {
      const v = videoRef.current;
      const ch = currentChapter;
      if (!v || !ch) return;
      const chapterId = getChapterId(ch);
      if (chapterId != null) await putWatchtime(chapterId, v.currentTime);
      sendVideoEvent("action_stop_video");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      onBeforeUnload();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, chapters]);

  // ====== 初始化 ======
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

  // 課程或章節列表更新 → 拉單章 watchtime
  useEffect(() => {
    if (chapters.length > 0) {
      fetchChaptersWatchtime(chapters);
    } else {
      setChapterWatch({});
      setChapterDone({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chapters.map((c) => c.id).join(","),
    chapters.map((c) => c.duration_sec).join(","),
    JSON.stringify(
      Object.fromEntries(Object.entries(durationStore).filter(([key]) => key.startsWith(`${courseIdStr}:`)))
    ),
  ]);

  // 高度同步
  useEffect(() => {
    syncHeights();
    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedChapter, course]);

  // 分頁切換 + 懶載入
  const switchTab = (nextTab) => {
    if (bottomTab === nextTab) return;

    if (bottomTab === "discussion") handleTrack("action_close_forum");
    if (bottomTab === "materials") handleTrack("action_close_courseware");

    if (nextTab === "discussion") {
      handleTrack("action_click_forum");
      listChapterDiscussions(currentChapterId, 1, discSize, discQ);
      setDiscPage(1);
    }
    if (nextTab === "materials") {
      handleTrack("action_click_courseware");
      listChapterMaterials(currentChapterId);
    }
    if (nextTab === "progress") {
      handleTrack("action_click_progress");
      Promise.all([fetchCourseDuration(), fetchCourseProgress(), fetchChaptersWatchtime(chapters)]);
    }
    if (nextTab === "problems") {
      handleTrack("action_problem_get");
      listChapterQuestions(currentChapterId);
    }
    if (nextTab === "comments") {
      listChapterComments(currentChapterId, 1, cSize);
      setCPage(1);
    }
    if (nextTab === "about") handleTrack("action_click_about");
    if (nextTab === "info") handleTrack("action_click_info");

    setBottomTab(nextTab);
  };

  // 章節切換後，如果當下分頁需要章節資料 → 立即取資料
  useEffect(() => {
    if (!currentChapterId) return;
    if (bottomTab === "materials") listChapterMaterials(currentChapterId);
    if (bottomTab === "problems") listChapterQuestions(currentChapterId);
    if (bottomTab === "discussion") listChapterDiscussions(currentChapterId, 1, discSize, discQ);
    if (bottomTab === "comments") listChapterComments(currentChapterId, 1, cSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterId]);

  // ====== Render ======
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
    const intro = introVideoUrl;
    return (
      <Container className="course-detail-container">
        <div className="hero-unenrolled">
          <div className="hero-unenrolled__video">
            {intro ? (
              <video
                key={videoKey}
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
                  const ch = currentChapter;
                  const chapterId = getChapterId(ch);
                  if (chapterId != null) await putWatchtime(chapterId, v?.duration ?? 0);
                  sendVideoEvent("action_stop_video");
                  fetchCourseProgress();
                }}
                onSeeked={() => sendVideoEvent("action_seek_video")}
              >
                <source src={fixVideoUrl(intro)} type="video/mp4" />
                您的瀏覽器不支援 HTML5 影片標籤。
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

      <div className="player-grid">
        <div className="video-wrapper" ref={videoBoxRef}>
          {chapters.length === 0 ? (
            <div className="cover-fallback">
              找不到章節（請確認後端 /courses/:id 是否回傳 chapters 且每筆都有 id / video_url）
            </div>
          ) : (
            <video
              key={videoKey}
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
                const ch = currentChapter;
                const chapterId = getChapterId(ch);
                if (chapterId != null) await putWatchtime(chapterId, v?.duration ?? 0);
                sendVideoEvent("action_stop_video");
                fetchCourseProgress();
              }}
              onSeeked={() => sendVideoEvent("action_seek_video")}
            >
              <source src={fixVideoUrl(currentChapter?.video_url || "")} type="video/mp4" />
              您的瀏覽器不支援 HTML5 影片標籤。
            </video>
          )}
        </div>

        <aside className="sidebar-playlist no-frame fixed">
          <div
            className="chapter-list no-frame fill"
            style={{ maxHeight: videoBoxH ? `${videoBoxH}px` : undefined }}
          >
            {chapters.length === 0 ? (
              <div className="text-muted p-3">尚無章節</div>
            ) : (
              chapters.map((ch, idx) => {
                const done = !!chapterDone[ch.id];
                return (
                  <div key={ch.id} className="chapter-block">
                    <button
                      className={`chapter-item ${selectedChapter === idx ? "active" : ""} ${done ? "done" : ""}`}
                      onClick={() => onSelectChapter(idx)}
                    >
                      <span className="ch-title">{ch.title}</span>
                      {done && <span className="ch-badge">✓ 完成</span>}
                    </button>

                    {selectedChapter === idx && (
                      <div className="chapter-extra">{ch.content || `第 ${idx + 1} 章`}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <div className="white-box">
        <div className="category-bar" style={{ animation: "fadeSlideDown .25s ease both" }}>
          <div className={`category-item ${bottomTab === "about" ? "active" : ""}`} onClick={() => switchTab("about")}>
            關於課程
          </div>
          <div className={`category-item ${bottomTab === "info" ? "active" : ""}`} onClick={() => switchTab("info")}>
            課程資訊
          </div>
          <div className={`category-item ${bottomTab === "progress" ? "active" : ""}`} onClick={() => switchTab("progress")}>
            課程進度
          </div>
          <div className={`category-item ${bottomTab === "materials" ? "active" : ""}`} onClick={() => switchTab("materials")}>
            教材區
          </div>
          <div className={`category-item ${bottomTab === "problems" ? "active" : ""}`} onClick={() => switchTab("problems")}>
            題目區
          </div>
          <div className={`category-item ${bottomTab === "discussion" ? "active" : ""}`} onClick={() => switchTab("discussion")}>
            討論區
          </div>
          <div className={`category-item ${bottomTab === "comments" ? "active" : ""}`} onClick={() => switchTab("comments")}>
            留言區
          </div>
        </div>

        {/* 關於課程 */}
        {bottomTab === "about" && (
          <div className="tab-body tint-pane">
            <div className="desc-with-icons">
              <img src="/quotes.png" alt="quotes" className="desc-icon left" />
              <p className="course-description with-tail">
                {course.description || "找不到課程簡介"}
                <img src="/close.png" alt="close" className="inline-tail" />
              </p>
            </div>
          </div>
        )}

        {/* 課程資訊 */}
        {bottomTab === "info" && (
          <div className="tab-body tint-pane">
            <ul>
              <li>老師 | {course.instructor || "未提供"}</li>
              <li>課程別 | {course.category || "未提供"}</li>
              <li>開課單位 | {course.school || "未提供"}</li>
            </ul>
          </div>
        )}

        {/* 進度 */}
        {bottomTab === "progress" && (
          <div className="tab-body tint-pane">
            <p>這裡顯示個人學習進度（已串後端）。</p>
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
              onClick={() => Promise.all([fetchCourseDuration(), fetchCourseProgress(), fetchChaptersWatchtime(chapters)])}
            >
              重新整理進度
            </Button>
          </div>
        )}

        {/* MODIFIED: 教材區，加入 loading spinner 和優化後的列表顯示 */}
        {bottomTab === "materials" && (
          <div className="tab-body tint-pane">
            {materialsLoading ? (
              <div className="text-center p-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">讀取教材中...</span>
              </div>
            ) : materialsError ? (
              <Alert variant="warning">{materialsError}</Alert>
            ) : materials.length > 0 ? (
              <ul className="list-unstyled">
                {materials.map((m) => (
                  <li key={m.id} className="mb-2">
                    <Button
                      variant="light"
                      className="d-flex align-items-center text-start w-100"
                      onClick={() => fetchAndOpenMaterial(m)}
                    >
                      <MaterialIcon type={m.type} />
                      <span className="flex-grow-1">{m.title || "未命名教材"}</span>
                      <span className="badge bg-secondary ms-2">{m.type}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">此章節尚無教材。</p>
            )}
          </div>
        )}

        {/* 題目區 */}
        {bottomTab === "problems" && (
          <div className="tab-body tint-pane">
            {questionsError && <p className="text-danger mb-2">{questionsError}</p>}
            {Array.isArray(questions) && questions.length > 0 ? (
              <ul className="list-unstyled">
                {questions.map((q) => (
                  <li key={q.id} className="mb-3">
                    <div className="fw-bold">[{q.type}] {q.question || `題目 #${q.id}`}</div>
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <ol type="A" className="mb-1">
                        {q.options.map((op, i) => <li key={i}>{String(op)}</li>)}
                      </ol>
                    )}
                    <div className="d-flex gap-2 mt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const tip =
                            "輸入你的答案：\n" +
                            "single: 直接輸入字串（例：A）\n" +
                            "multiple: 請輸入 JSON 陣列（例：[\"A\",\"C\"]）\n" +
                            "true_false: true 或 false\n" +
                            "short_answer: 文字";
                          const ua = window.prompt(tip);
                          if (ua == null) return;
                          let parsed = ua;
                          try { parsed = JSON.parse(ua); } catch {}
                          checkAnswer(q.id, parsed);
                        }}
                      >
                        作答檢查
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !questionsError && <p className="text-muted">此章節無題目。</p>
            )}
          </div>
        )}

        {/* 討論區 */}
        {bottomTab === "discussion" && (
          <div className="tab-body tint-pane">
            {Array.isArray(discussions) && discussions.length > 0 ? (
              <ul className="list-unstyled">
                {discussions.map((d) => (
                  <li key={d.id} className="mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">{d.title}</span>
                      {d.pinned && <span className="badge bg-warning text-dark">置頂</span>}
                    </div>
                    {d.body && <div className="text-muted small">{d.body}</div>}
                    <div className="small text-secondary">
                      回覆：{d.posts_count ?? d.postsCount ?? 0} ｜ 最近回覆：{d.last_reply_at ?? "-"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">此章節暫無討論串。</p>
            )}
          </div>
        )}

        {/* 留言區 */}
        {bottomTab === "comments" && (
          <div className="tab-body tint-pane">
            {Array.isArray(comments) && comments.length > 0 ? (
              <ul className="list-unstyled">
                {comments.map((c) => (
                  <li key={c.id} className="mb-2 d-flex align-items-center gap-2">
                    <span>{c.body || c.content || "[空白留言]"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">此章節暫無留言。</p>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

export default CourseDetail;