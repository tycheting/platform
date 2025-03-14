// src/pages/CourseDetail.js
import React, { useEffect, useState } from 'react';
import { Container, Spinner, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CoursesDetail.css'; // 新增(或更新) CSS

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Container className="course-detail-container">
      {/* 影片容器 */}
      <div className="video-container">
        {course.video_path ? (
          <video 
            className="course-video" 
            controls 
            poster={course.image_path || ""}  // 如果有預覽圖，就加上 poster
          >
            <source src={course.video_path} type="video/mp4" />
            您的瀏覽器不支援 HTML5 影片標籤。
          </video>
        ) : (
          <div className="video-placeholder">暫無影片</div>
        )}
      </div>

      {/* 課程標題 */}
      <h1 className="course-title">{course.title}</h1>

      {/* 課程描述 */}
      <p className="course-description">{course.description}</p>

      {/* 選課按鈕 */}
      <Button variant="success">選課</Button>
    </Container>
  );
}

export default CourseDetail;
