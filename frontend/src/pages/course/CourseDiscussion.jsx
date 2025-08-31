import React, { useEffect, useMemo, useState } from "react";
import { Container, Spinner, Alert, Form } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CourseDiscussion() {
  const { id } = useParams();
  const API = useMemo(() => {
    const a = axios.create({ baseURL: "http://localhost:5000" });
    a.interceptors.request.use((c) => {
      const t = localStorage.getItem("token"); if (t) c.headers.Authorization = `Bearer ${t}`; return c;
    });
    return a;
  }, []);
  const pickArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;
    for (const k of keys) {
      const v = data?.[k];
      if (Array.isArray(v)) return v;
    }
    return [];
  };

  const [course, setCourse] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/courses/${id}`);
        setCourse(res.data);
        const list = Array.isArray(res.data?.chapters) ? res.data.chapters : [];
        if (list.length) setChapterId(list[0].id);
      } catch {
        setErr("讀取課程章節失敗");
      } finally { setLoading(false); }
    })();
  }, [id]); // eslint-disable-line

  const chapters = useMemo(() => {
    const arr = Array.isArray(course?.chapters) ? course.chapters : [];
    return arr.filter((x) => x && x.id != null);
  }, [course]);

  const fetchThreads = async (cid) => {
    if (!cid) { setThreads([]); return; }
    try {
      const res = await API.get(`/course/discussion/chapters/${cid}`, { params: { page: 1, size: 20 } });
      const t = Array.isArray(res.data?.threads) ? res.data.threads : pickArray(res.data, ["items"]);
      setThreads(Array.isArray(t) ? t : []);
    } catch {
      setThreads([]);
    }
  };

  useEffect(() => { if (chapterId) fetchThreads(chapterId); }, [chapterId]); // eslint-disable-line

  return (
    <Container className="mt-4">
      <div className="mb-3"><Link to={`/courses/${id}`}>&larr; 回課程</Link></div>
      {loading ? <Spinner animation="border" /> : err ? <Alert variant="danger">{err}</Alert> : (
        <div className="tint-pane p-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Form.Select
              value={chapterId || ""}
              onChange={(e) => setChapterId(Number(e.target.value) || null)}
              style={{ maxWidth: 360 }}
            >
              {chapters.map((ch) => <option key={ch.id} value={ch.id}>{ch.title || `章節#${ch.id}`}</option>)}
            </Form.Select>
          </div>

          {threads.length ? (
            <ul className="list-unstyled">
              {threads.map((d) => (
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
    </Container>
  );
}
