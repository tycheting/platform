import React, { useEffect, useState } from 'react';
import { Container, Spinner, Button } from 'react-bootstrap';
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

  const chapters = [
    {
      title: '第一章',
      content: '這是第一章的介紹內容。',
      video_url: course.video_path,
    },
    {
      title: '第二章',
      content: '這是第二章的重點內容。',
      video_url: course.video_path,
    },
    {
      title: '第三章',
      content: '這是第三章的實作影片說明。',
      video_url: course.video_path,
    }
  ];

  return (
    <Container className="course-detail-container">
      {!isEnrolled ? (
        <>
          <div className="intro-layout">
            <div className="video-container flex-shrink-0">
              <video className="course-video" controls poster={course.image_path || ""}>
                <source src={course.video_path} type="video/mp4" />
                您的瀏覽器不支援 HTML5 影片標籤。
              </video>
            </div>

            <div className="course-intro">
              <h1 className="course-title">{course.title}</h1>
              <p className="course-description">{course.description}</p>
              <Button className="enroll-button" onClick={handleEnroll}>選課</Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="playlist-layout d-flex flex-column flex-lg-row gap-4">
            <div className="chapter-playlist">
              {chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className={`playlist-item ${selectedChapter === idx ? 'active' : ''}`}
                  onClick={() => setSelectedChapter(idx)}
                >
                  {ch.title}
                </div>
              ))}
            </div>

            <div className="player-area">
              <div className="video-container">
                <video className="course-video" controls poster={course.image_path || ""}>
                  <source src={chapters[selectedChapter].video_url} type="video/mp4" />
                  您的瀏覽器不支援 HTML5 影片標籤。
                </video>
              </div>
              <h2 className="chapter-title">{chapters[selectedChapter].title}</h2>
              <p className="chapter-content">{chapters[selectedChapter].content}</p>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}

export default CourseDetail;