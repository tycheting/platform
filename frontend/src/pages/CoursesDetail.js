import React, { useEffect, useState } from 'react';
import { Container, Spinner, Button, Tabs, Tab } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CoursesDetail.css';

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    getCourseDetail(id);
    checkIfEnrolled(id);
  }, [id]);

  const getCourseDetail = async (courseId) => {
    try {
      const res = await axios.get(`http://localhost:5000/courses/${courseId}`);
      setCourse(res.data);
      setLoading(false);
    } catch (error) {
      console.error('取得課程詳情失敗: ', error);
      setLoading(false);
    }
  };

  const checkIfEnrolled = async (courseId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/user/my-courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enrolledCourseIds = res.data.map(item => item.course_id);
      if (enrolledCourseIds.includes(parseInt(courseId))) {
        setIsEnrolled(true);
      }
    } catch (err) {
      console.error("檢查選課狀態失敗", err);
    }
  };

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("請先登入");

    try {
      await axios.post("http://localhost:5000/enroll", { courseId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 記錄選課行為
      await axios.post("http://localhost:5000/track", {
        courseId: id,
        actionType: "action_enroll_course"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsEnrolled(true);
      alert("已成功選課！");
    } catch (error) {
      console.error("選課失敗", error);
      alert("選課失敗，請稍後再試");
    }
  };

  const handleTrackAction = (type) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.post("http://localhost:5000/track", {
      courseId: id,
      actionType: type
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
        <h3>找不到此課程</h3>
      </Container>
    );
  }

  const chapters = Array.from({ length: 10 }, (_, i) => ({
    title: `第${i + 1}章`,
    content: `這是第${i + 1}章的內容說明。`,
    video_url: course.video_path,
  }));

  return (
    <Container className="course-detail-container">
      <div className="course-hero-layout">
        <div className="video-container">
          <video
            className="course-video"
            controls
            poster={course.image_path || ""}
            onPlay={() => handleTrackAction("action_play_video")}
            onPause={() => handleTrackAction("action_pause_video")}
            onEnded={() => handleTrackAction("action_stop_video")}
            onSeeked={() => handleTrackAction("action_seek_video")}
          >
            <source src={chapters[selectedChapter].video_url} type="video/mp4" />
            您的瀏覽器不支援 HTML5 影片標籤。
          </video>
        </div>

        <div className="course-info-panel">
          <h1 className="course-title">{course.title}</h1>
          <p className="course-description">{course.description}</p>
          {!isEnrolled ? (
            <Button className="enroll-button mt-2" onClick={handleEnroll}>選課</Button>
          ) : (
            <span className="text-success fw-bold">已選課</span>
          )}
        </div>
      </div>

      <Tabs defaultActiveKey="chapters" className="course-tabs mt-5" justify>
        <Tab eventKey="chapters" title="課程章節">
          <div className="chapter-tab-content mt-4 d-flex flex-column flex-lg-row gap-4">
            <div className="left-panel flex-grow-1">
              <div className="video-container">
                <video
                  className="course-video"
                  controls
                  poster={course.image_path || ""}
                  onPlay={() => handleTrackAction("action_play_video")}
                >
                  <source src={chapters[selectedChapter].video_url} type="video/mp4" />
                  您的瀏覽器不支援 HTML5 影片標籤。
                </video>
              </div>
            </div>
            <div className="right-panel">
              <div className="chapter-playlist">
                {chapters.map((ch, idx) => {
                  const isLocked = !isEnrolled && idx !== 0;
                  return (
                    <div
                      key={idx}
                      className={`playlist-item ${selectedChapter === idx ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => {
                        if (!isLocked) setSelectedChapter(idx);
                      }}
                    >
                      {ch.title} {isLocked && '🔒'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="player-area mt-4">
            <h2 className="chapter-title">{chapters[selectedChapter].title}</h2>
            <p className="chapter-content">{chapters[selectedChapter].content}</p>
          </div>
        </Tab>

        <Tab eventKey="intro" title="詳細介紹">
          <div className="mt-4">
            <p>這裡是更完整的課程說明、適合對象、學習目標等等。</p>
          </div>
        </Tab>

        <Tab eventKey="discussion" title="討論區">
          <div className="mt-4">
            <p>這裡可以放留言區（可先放靜態文字）</p>
          </div>
        </Tab>

        <Tab eventKey="materials" title="教材區">
          <div className="mt-4">
            <ul className="material-list">
              <li>
                <button
                  className="material-link"
                  onClick={() => handleTrackAction("action_click_courseware")}
                >
                  講義.pdf
                </button>
              </li>
              <li>
                <button
                  className="material-link"
                  onClick={() => handleTrackAction("action_click_courseware")}
                >
                  範例程式碼.zip
                </button>
              </li>
            </ul>
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default CourseDetail;
