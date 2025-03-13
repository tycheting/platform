// src/pages/CourseDetail.js
import React, { useEffect, useState } from 'react';
import { Container, Spinner, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function CourseDetail() {
  const { id } = useParams(); // 取得網址上的課程ID
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourseDetail(id);
  }, [id]);

  const getCourseDetail = async (courseId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
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
    <Container className="mt-4">
      <div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <p>{course.category}</p>

          {/* 顯示影片 */}
          {course.video_path && (
                <video width="640" height="360" controls>
                    <source src={course.video_path} type="video/mp4" />
                    您的瀏覽器不支援 HTML5 影片標籤。
                </video>
            )}
        </div>
      <Button variant="success">選課</Button>
    </Container>
  );
}

export default CourseDetail;
