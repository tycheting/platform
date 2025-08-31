import React, { useEffect, useMemo, useState } from "react";
import { Container, Spinner, Alert, Button, Form } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function CourseProblems() {
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

  // 將 options 顯示成「A. xxx」格式
  const normalizeOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) {
      if (options.length > 0 && typeof options[0] === "object") {
        return options.map((op, i) => {
          const label = op.label ?? op.key ?? op.option ?? (op.value != null ? String(op.value) : String.fromCharCode(65 + i));
          const text  = op.text  ?? op.title ?? op.desc   ?? op.name ?? op.value ?? "";
          return `${label}. ${text}`;
        });
      }
      return options.map((op, i) => `${String.fromCharCode(65 + i)}. ${String(op)}`);
    }
    if (typeof options === "object") {
      const keys = Object.keys(options).sort((a,b) => a.localeCompare(b, "zh-Hant"));
      return keys.map((k) => `${k}. ${String(options[k])}`);
    }
    if (typeof options === "string") {
      const parts = options.split(/\r?\n|;|；/g).map(s => s.trim()).filter(Boolean);
      return parts.map((txt, i) => (/^[A-Z]\s*[\.\、\:]/.test(txt) ? txt : `${String.fromCharCode(65 + i)}. ${txt}`));
    }
    return [];
  };

  const [course, setCourse] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [questions, setQuestions] = useState([]);
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

  const fetchQuestions = async (cid) => {
    if (!cid) { setQuestions([]); return; }
    try {
      const res = await API.get(`/course/question/chapters/${cid}`);
      setQuestions(pickArray(res.data, ["questions", "items"]));
    } catch {
      setQuestions([]);
    }
  };

  useEffect(() => { if (chapterId) fetchQuestions(chapterId); }, [chapterId]); // eslint-disable-line

  const checkAnswer = async (qid, userAnswer) => {
    try {
      const res = await API.post(`/course/question/${qid}/check`, { userAnswer });
      const { correct, explanation } = res.data || {};
      alert(`${correct ? "✅ 答對了！" : "❌ 答錯了～"}${explanation ? `\n解析：${explanation}` : ""}`);
    } catch {
      alert("作答檢查失敗，請稍後再試。");
    }
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

          {questions.length ? (
            <ul className="list-unstyled">
              {questions.map((q) => {
                const opts = normalizeOptions(q.options);
                return (
                  <li key={q.id} className="mb-3">
                    <div className="fw-bold">[{q.type}] {q.question || `題目 #${q.id}`}</div>
                    {opts.length > 0 && (
                      <ol type="A" className="mb-1">
                        {opts.map((txt, i) => <li key={i}>{txt}</li>)}
                      </ol>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        const tip =
                          "輸入你的答案：\n" +
                          "single: 直接輸入字串（例：A）\n" +
                          'multiple: 請輸入 JSON 陣列（例：["A","C"]）\n' +
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
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted">此章節無題目。</p>
          )}
        </div>
      )}
    </Container>
  );
}
