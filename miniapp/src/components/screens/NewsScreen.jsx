import { useEffect, useState } from "react";
import { getNews } from "../../methods/parse/parseNews";

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newNews = await getNews();
        setNews(newNews || []);
      } catch (error) {
        console.error("Ошибка при загрузке новостей:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="screen">
      <h2 className="screen__title">News</h2>

      {loading && <p>Загрузка...</p>}

      {!loading && news.length === 0 && (
        <p className="screen__subtitle">Нет новостей 😢</p>
      )}

      {!loading &&
        news.map((elem, index) => (
          <div key={index} className="news-card">
            <a
              target="_blank"
              rel="noopener noreferrer"
              id={elem.url}
              className="news-card__title"
            >
              {elem.title}
            </a>
          </div>
        ))}
    </section>
  );
}
