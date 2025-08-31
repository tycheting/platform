import React, { useEffect, useMemo, useState } from "react";
import { Container, Spinner, Button, Alert, Form } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CourseMaterials() {
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
  const [materials, setMaterials] = useState([]);
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

  const fetchMaterials = async (cid) => {
    if (!cid) { setMaterials([]); return; }
    try {
      const res = await API.get(`/course/material/chapters/${cid}`);
      setMaterials(pickArray(res.data, ["materials", "items"]));
    } catch {
      setMaterials([]);
    }
  };

  useEffect(() => { if (chapterId) fetchMaterials(chapterId); }, [chapterId]); // eslint-disable-line

  const downloadMaterial = (mid) => {
    if (!mid) return;
    window.open(`${API.defaults.baseURL}/course/material/${mid}/download`, "_blank");
  };

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

          {materials.length ? (
            <ul className="list-unstyled">
              {materials.map((m) => (
                <li key={m.id || m.url} className="mb-2">
                  <Button
                    variant="outline-primary"
                    onClick={() => (m.url ? window.open(m.url, "_blank") : downloadMaterial(m.id))}
                  >
                    {m.title || m.name || m.label || "未命名教材"}
                  </Button>
                  {m.type && <span className="ms-2 text-muted">({m.type})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">此章節無教材。</p>
          )}
        </div>
      )}
    </Container>
  );
}
