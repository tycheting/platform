// src/pages/Featured.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WhiteBox from "../components/WhiteBox";
import "./Featured.css";

const BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function Featured() {
  const [username, setUsername] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const auth = useMemo(() => {
    const token = localStorage.getItem("token") || "";
    const userName = localStorage.getItem("userName") || "";
    return { token, userName };
  }, []);

  const clip = (text, n = 90) => {
    if (!text) return "";
    const s = String(text).replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  };

  const pickCourseFields = (c) => {
    const id = c?.id ?? c?.course_id ?? c?.courseId ?? null;
    const title = c?.title ?? c?.course_name ?? c?.name ?? "（無標題）";
    const cover =
      c?.image_path ??
      c?.cover_url ??
      c?.image_url ??
      c?.cover ??
      c?.thumbnail ??
      c?.course_image ??
      c?.image ??
      c?.pic_url ??
      "";

    let chapterSnippet = "";
    if (!c?.description && Array.isArray(c?.chapters) && c.chapters.length > 0) {
      const ch0 = c.chapters[0];
      chapterSnippet = clip(ch0?.description || "", 90);
    }

    const descRaw =
      c?.description ??
      c?.course_syllabus ??
      c?.intro ??
      c?.summary ??
      c?.short_description ??
      c?.syllabus ??
      c?.abstract ??
      c?.subtitle ??
      chapterSnippet ??
      "";

    const desc = clip(descRaw, 120);
    return { id, title, cover, desc };
  };

  const hydrateCourses = async (recData) => {
    let ids = [];

    if (Array.isArray(recData)) {
      ids = recData.map((x) =>
        typeof x === "object" ? x?.id ?? x?.course_id ?? x?.courseId ?? null : x
      );
    } else if (recData && typeof recData === "object") {
      const arr =
        recData.recommendations ??
        recData.results ??
        recData.data ??
        recData.courses ??
        [];
      if (Array.isArray(arr)) {
        ids = arr.map((x) =>
          typeof x === "object" ? x?.id ?? x?.course_id ?? x?.courseId ?? null : x
        );
      }
    }

    ids = ids.filter((x) => x !== null && x !== undefined);

    if (ids.length === 0 && Array.isArray(recData)) {
      const maybeCourses = recData.map(pickCourseFields).filter((c) => c.id !== null);
      if (maybeCourses.length > 0) return maybeCourses;
    }

    const details = await Promise.all(
      ids.map(async (cid) => {
        try {
          const res = await fetch(`${BASE_URL}/courses/${encodeURIComponent(cid)}`, {
            headers: {
              "Content-Type": "application/json;charset=utf-8",
              ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
            },
          });
          if (!res.ok) throw new Error("課程詳情請求失敗");
          const data = await res.json();
          const courseObj = data?.course ?? data?.data ?? data ?? { id: cid, title: "抓不到" };
          return pickCourseFields(courseObj);
        } catch {
          return { id: cid, title: "抓不到", cover: "", desc: "" };
        }
      })
    );

    return details;
  };

  const fetchRecommendations = async (user) => {
    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const res = await fetch(`${BASE_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ username: user }),
      });

      if (!res.ok) throw new Error("推薦請求失敗");
      const data = await res.json();

      const courses = await hydrateCourses(data);
      setRecommendations(courses);
    } catch (e) {
      setError("取得推薦課程時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userName) setUsername(auth.userName);
  }, [auth.userName]);

  useEffect(() => {
    if (auth.userName) fetchRecommendations(auth.userName);
  }, [auth.userName]); // eslint-disable-line

  // 分區：前三名、4–11 名、12–20 名
  const top3 = recommendations.slice(0, 3);
  const mid = recommendations.slice(3, 11);
  const tailRows = recommendations.slice(11, 20);

  return (
    <div className="featured-page">
      <WhiteBox className="ftr-whitebox">

        {!username && <div className="ftr-alert">尚未偵測到登入使用者，請先登入。</div>}
        {loading && <div className="ftr-loading">載入中...</div>}
        {error && <div className="ftr-error">{error}</div>}

        {!loading && username && recommendations.length === 0 && !error && (
          <div className="ftr-empty">目前沒有推薦結果。</div>
        )}

        {!loading && recommendations.length > 0 && (
          <>
            {/* 前三名：背景徽章（/1.png /2.png /3.png） */}
            {top3.length > 0 && (
              <div className="ftr-top3" role="list">
                {top3.map((c, i) => (
                  <Link
                    to={`/courses/${encodeURIComponent(c.id ?? "")}`}
                    className={`ftr-topcard ftr-topcard--${i + 1}`}
                    key={`top-${c.id}-${c.title}`}
                    role="listitem"
                  >
                    <div className="ftr-topcard__thumb">
                      {c.cover ? (
                        <img
                          src={c.cover}
                          alt={c.title || "課程封面"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const altBox = e.currentTarget.nextSibling;
                            if (altBox) altBox.style.display = "grid";
                          }}
                        />
                      ) : null}
                      <div className="ftr-thumb-fallback">無封面</div>

                      {/* 背景徽章 + contain 縮圖 */}
                      <div
                        className="ftr-rank-badge"
                        role="img"
                        aria-label={`第${i + 1}名`}
                        style={{ backgroundImage: `url(/${i + 1}.png)` }}
                      />
                    </div>

                    <div className="ftr-topcard__body">
                      <h3 className="ftr-topcard__title" title={c.title}>
                        {c.title || "（無標題）"}
                      </h3>
                      {c.desc ? (
                        <p className="ftr-topcard__desc">{c.desc}</p>
                      ) : (
                        <p className="ftr-topcard__desc ftr-topcard__desc--muted">（無課程簡介）</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 4–11 名：背景徽章（/4.png … /11.png） */}
            {mid.length > 0 && (
              <div className="ftr-midgrid" role="list">
                {mid.map((c, idx) => (
                  <Link
                    to={`/courses/${encodeURIComponent(c.id ?? "")}`}
                    className="ftr-midcard"
                    key={`mid-${c.id}-${c.title}`}
                    role="listitem"
                  >
                    <div className="ftr-midcard__thumb">
                      {c.cover ? (
                        <img
                          src={c.cover}
                          alt={c.title || "課程封面"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const altBox = e.currentTarget.nextSibling;
                            if (altBox) altBox.style.display = "grid";
                          }}
                        />
                      ) : null}
                      <div className="ftr-thumb-fallback">無封面</div>

                      <div
                        className="ftr-rank-badge"
                        role="img"
                        aria-label={`第${idx + 4}名`}
                        style={{ backgroundImage: `url(/${idx + 4}.png)` }}
                      />
                    </div>

                    <div className="ftr-midcard__body">
                      <h4 className="ftr-midcard__title" title={c.title}>
                        {c.title || "（無標題）"}
                      </h4>
                      {c.desc ? (
                        <p className="ftr-midcard__desc">{c.desc}</p>
                      ) : (
                        <p className="ftr-midcard__desc ftr-midcard__desc--muted">（無課程簡介）</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 12–20 名（橫向小卡片） */}
            {tailRows.length > 0 && (
              <div className="ftr-tail" role="list">
                {tailRows.map((c, idx) => (
                  <Link
                    to={`/courses/${encodeURIComponent(c.id ?? "")}`}
                    className="ftr-tailrow"
                    key={`tail-${c.id}-${c.title}`}
                    role="listitem"
                  >
                    <div className="ftr-tailrow__thumb">
                      {c.cover ? (
                        <img
                          src={c.cover}
                          alt={c.title || "課程封面"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const altBox = e.currentTarget.nextSibling;
                            if (altBox) altBox.style.display = "grid";
                          }}
                        />
                      ) : null}
                      <div className="ftr-thumb-fallback">無封面</div>
                    </div>
                    <div className="ftr-tailrow__body">
                      <h5 className="ftr-tailrow__title" title={c.title}>
                        <span className="ftr-tailrow__rank">{idx + 12}</span>{" "}
                        {c.title || "（無標題）"}
                      </h5>
                      {c.desc ? (
                        <p className="ftr-tailrow__desc">{c.desc}</p>
                      ) : (
                        <p className="ftr-tailrow__desc ftr-tailrow__desc--muted">（無課程簡介）</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </WhiteBox>
    </div>
  );
}

export default Featured;
