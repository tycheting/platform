// src/pages/CoursesDetail.js
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

  const handleEnroll = () => {
    setIsEnrolled(true);
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
      {/* 上方：影片與資訊左右排列 */}
      <div className="course-hero-layout">
        <div className="video-container">
          <video className="course-video" controls poster={course.image_path || ""}>
            <source src={chapters[selectedChapter].video_url} type="video/mp4" />
            您的瀏覽器不支援 HTML5 影片標籤。
          </video>
        </div>

        <div className="course-info-panel">
          <h1 className="course-title">{course.title}</h1>
          <p className="course-description">{course.description}</p>
          {!isEnrolled && (
            <Button className="enroll-button mt-2" onClick={handleEnroll}>選課</Button>
          )}
        </div>
      </div>

      {/* 下方 Tabs */}
      <Tabs defaultActiveKey="chapters" className="course-tabs mt-5" justify>
        <Tab eventKey="chapters" title="課程章節">
          <div className="chapter-tab-content mt-4 d-flex flex-column flex-lg-row gap-4">
            <div className="left-panel flex-grow-1">
              <div className="video-container">
                <video className="course-video" controls poster={course.image_path || ""}>
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
                  onClick={() => alert('🔽 模擬下載：講義.pdf')}
                >
                  講義.pdf
                </button>
              </li>
              <li>
                <button
                  className="material-link"
                  onClick={() => alert('🔽 模擬下載：範例程式碼.zip')}
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
