import { useEffect, useState } from "react";
import "./News.css";

function News() {
  const [news, setNews] = useState([]);

  const fetchNews = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/news");
      const data = await res.json();

      setNews(data.news || []);
    } catch (err) {
      console.error("News error:", err);
      setNews([]);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="news-container">

      {/* 🔴 BREAKING TICKER */}
      <div className="ticker">
        <div className="ticker-text">
          {news.length > 0
            ? news.map(n => `📰 ${n.title}`).join("   🔥   ")
            : "Loading crypto news..."}
        </div>
      </div>

      {/* 🧠 NEWS PANEL */}
      <div className="news-box">
        <h3>📰 LIVE CRYPTO NEWS</h3>

        {news.length === 0 ? (
          <p>Loading...</p>
        ) : (
          <div className="news-list">
            {news.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className="news-card"
                onClick={() => window.open(item.link, "_blank")}
              >
                <span className="news-dot"></span>
                <p>{item.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default News;