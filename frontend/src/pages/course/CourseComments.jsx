import React, { useEffect, useMemo, useState } from "react";
import { Container, Spinner, Alert, Form } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CourseComments() {
  const { id } = useParams();
  const API = useMemo(() => {
    const a = axios.create({ baseURL: "http://localhost:5000" });
    a.interceptors.request.use((c) => {
      const t = localStorage.getItem("token"); if (t) c.headers.Authorization = `Bearer ${t}`; return c;
    });
    return a;
  }, []);

  const [course, setCourse] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [comments, setComments] = useState([]);
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

  const fetchComments = async (cid) => {
    if (!cid) { setComments([]); return; }
    try {
      const res = await API.get(`/course/comment/chapters/${cid}`, { params: { page: 1, size: 20 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setComments(list);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => { if (chapterId) fetchComments(chapterId); }, [chapterId]); // eslint-disable-line

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

          {comments.length ? (
            <ul className="list-unstyled">
              {comments.map((c) => (
                <li key={c.id} className="mb-2">
                  {c.body || c.content || "[空白留言]"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">此章節暫無留言。</p>
          )}
        </div>
      )}
    </Container>
  );
}
