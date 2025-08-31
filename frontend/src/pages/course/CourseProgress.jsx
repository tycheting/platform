import React, { useEffect, useMemo, useState } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CourseProgress() {
  const { id } = useParams();
  const API = useMemo(() => {
    const a = axios.create({ baseURL: "http://localhost:5000" });
    a.interceptors.request.use((c) => {
      const t = localStorage.getItem("token"); if (t) c.headers.Authorization = `Bearer ${t}`; return c;
    });
    return a;
  }, []);

  const [loading, setLoading] = useState(true);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [progressSec, setProgressSec] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        API.get(`/course/video/courses/${id}/duration`),
        API.get(`/course/video/courses/${id}/progress`)
      ]);
      setTotalDurationSec(Number(d.data?.totalDurationSec || 0));
      setProgressSec(Number(p.data?.watchedTotalSec || 0));
      setProgressPercent(Math.max(0, Math.min(100, Math.round(Number(p.data?.progressPercent || 0)))));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]); // eslint-disable-line

  return (
    <Container className="mt-4">
      <div className="mb-3"><Link to={`/courses/${id}`}>&larr; 回課程</Link></div>
      {loading ? <Spinner animation="border" /> : (
        <div className="tint-pane p-3">
          <h4>課程進度</h4>
          <ul>
            <li>
              觀看時間：{Math.floor(progressSec / 60)} 分 {progressSec % 60} 秒
              {" / "}
              {Math.floor(totalDurationSec / 60)} 分 {totalDurationSec % 60} 秒
            </li>
            <li>完成率：{progressPercent}%</li>
          </ul>
          <Button variant="outline-secondary" onClick={fetchAll}>重新整理</Button>
        </div>
      )}
    </Container>
  );
}
