// src/pages/MyCourses.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [comments, setComments] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("http://localhost:5000/user/my-courses", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setCourses(res.data);
    });
  }, []);

  const recordAction = (courseId, actionType) => {
    const token = localStorage.getItem("token");
    axios.post("http://localhost:5000/track", {
      courseId, actionType
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleCommentChange = (courseId, value) => {
    setComments(prev => ({ ...prev, [courseId]: value }));
  };

  const handleCommentSubmit = (courseId) => {
    recordAction(courseId, "action_create_comment");
    alert("已送出留言：" + comments[courseId]);
    setComments(prev => ({ ...prev, [courseId]: "" }));
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">我的課程</h2>
      {courses.length === 0 ? (
        <p>尚未有任何課程。</p>
      ) : (
        courses.map(course => (
          <div key={course.course_id} className="mb-5 p-4 border rounded">
            <h4>{course.title}</h4>
            <img
              src={`http://localhost:5000${course.image_path}`}
              alt={course.title}
              style={{ width: '300px', borderRadius: '8px', marginBottom: '16px' }}
            />
            <video
              width="600"
              controls
              onCanPlay={() => recordAction(course.course_id, "action_load_video")}
              onPlay={() => recordAction(course.course_id, "action_play_video")}
              onPause={() => recordAction(course.course_id, "action_pause_video")}
              onSeeked={() => recordAction(course.course_id, "action_seek_video")}
              onEnded={() => recordAction(course.course_id, "action_stop_video")}
            >
              <source src={`http://localhost:5000${course.video_path}`} type="video/mp4" />
              您的瀏覽器不支援影片播放。
            </video>

            {/* 課程教材區塊 */}
            <div className="mt-3">
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  recordAction(course.course_id, "action_click_courseware");
                  alert("教材下載中...");
                }}
              >
                📘 查看教材
              </button>
            </div>

            {/* 留言區塊 */}
            <div className="mt-3">
              <textarea
                className="form-control"
                rows="2"
                placeholder="留言..."
                value={comments[course.course_id] || ""}
                onChange={(e) => handleCommentChange(course.course_id, e.target.value)}
              />
              <button
                className="btn btn-success mt-2"
                onClick={() => handleCommentSubmit(course.course_id)}
              >
                送出留言
              </button>
            </div>

            {/* 假設正確作答按鈕（示意用） */}
            <div className="mt-3">
              <button
                className="btn btn-warning"
                onClick={() => recordAction(course.course_id, "action_problem_check_correct")}
              >
                我答對一題！
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyCourses;
