import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Container } from "react-bootstrap";
import WhiteBox from "../components/WhiteBox";
import "./SearchResults.css";

function SearchResults() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("query");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query && query.trim() !== "") {
      axios
        .get(`http://localhost:5000/search?query=${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("搜尋失敗：", err);
          setLoading(false);
        });
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <Container className="mt-4">
      <WhiteBox>
        {loading ? (
          <p>載入中...</p>
        ) : results.length === 0 ? (
          <div className="no-results">
            <img
              src="/null.png"
              alt="找不到課程"
              className="no-results-image"
            />
          </div>
        ) : (
          <div className="search-result-list">
            {results.map((course) => (
              <Link
                to={`/courses/${course.id}`}
                className="search-result-item"
                key={course.id}
              >
                <div className="result-image-wrapper">
                  <img
                    src={course.image_path}
                    alt={course.title}
                    className="result-image"
                  />
                </div>
                <div className="result-content">
                  <h4 className="result-title">{course.title}</h4>
                  <p className="result-description">{course.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </WhiteBox>
    </Container>
  );
}

export default SearchResults;
