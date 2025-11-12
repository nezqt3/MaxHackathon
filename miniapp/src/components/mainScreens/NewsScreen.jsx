import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getNews, getNewsContent } from "../../methods/parse/parseNews";
import {
  getNewsCardMotion,
  newsDetailContentMotion,
  newsDetailMotion,
  newsHeroMotion,
  newsMetaMotion,
  newsOverviewMotion,
  newsTapFeedback,
} from "../../animations/NewsAnim";
import { useUniversity } from "../../context/UniversityContext.jsx";

const CACHE_LIFETIME = 1000 * 60 * 60; // 1 час
const SKELETON_ITEMS = Array.from({ length: 4 }, (_, index) => index);

const getBadgeLabel = (index) => {
  if (index === 0) return "Свежий выпуск";
  if (index <= 2) return "Важно";
  if (index <= 5) return "Полезно";
  return "Кампус";
};

const splitIntoParagraphs = (text) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const getImageLayoutId = (url) => `news-image-${encodeURIComponent(url)}`;

const handleCardKeyDown = (event, callback) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    callback();
  }
};

export default function NewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNews, setActiveNews] = useState(null);
  const [newsContent, setNewsContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");
  const { university } = useUniversity();
  const universityId = university?.apiId || university?.id || null;
  const domainLabel = university?.domain || "campus";
  const cachePrefix = useMemo(
    () => (universityId ? `news-${universityId}` : null),
    [universityId]
  );

  const featuredNews = news[0] ?? null;
  const otherNews = featuredNews ? news.slice(1) : news;

  const loadNews = useCallback(
    async (forceRefresh = false) => {
      if (!universityId) {
        setLoading(false);
        setNews([]);
        setError("Выберите вуз, чтобы увидеть новости кампуса.");
        return;
      }

      setError("");

      const cacheKey = cachePrefix ?? "newsData";
      const cacheTimeKey = `${cacheKey}Time`;

      const cached = forceRefresh ? null : localStorage.getItem(cacheKey);
      const cachedTimeRaw = forceRefresh ? null : localStorage.getItem(cacheTimeKey);
      const cachedTime = cachedTimeRaw ? Number(cachedTimeRaw) : null;

      if (
        !forceRefresh &&
        cached &&
        cachedTime &&
        Date.now() - cachedTime < CACHE_LIFETIME
      ) {
        try {
          const parsedNews = JSON.parse(cached);
          setNews(parsedNews);
          setLoading(false);
          return;
        } catch (cacheError) {
          console.warn("Не удалось прочитать кэш новостей:", cacheError);
        }
      }

      setLoading(true);

      try {
        const freshNews = await getNews(universityId);
        const normalizedNews = Array.isArray(freshNews) ? freshNews : [];

        setNews(normalizedNews);

        localStorage.setItem(cacheKey, JSON.stringify(normalizedNews));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch (fetchError) {
        console.error("Ошибка при загрузке новостей:", fetchError);
        setNews([]);
        setError("Не получилось загрузить новости. Попробуйте чуть позже.");
      } finally {
        setLoading(false);
      }
    },
    [cachePrefix, universityId]
  );

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    setActiveNews(null);
    setNewsContent("");
    setContentLoading(false);
  }, [universityId]);

  const openNews = async (item) => {
    if (!item || !universityId) {
      setError("Выберите вуз, чтобы прочитать новость.");
      return;
    }

    setActiveNews(item);
    setContentLoading(true);
    setNewsContent("");

    try {
      const cacheKey = `${cachePrefix || "newsContent"}_${item.url}`;
      const cachedContent = localStorage.getItem(cacheKey);

      if (cachedContent) {
        setNewsContent(cachedContent);
        return;
      }

      const content = await getNewsContent(universityId, item.url);
      const finalText = content || "Не удалось загрузить содержимое новости 😢";

      setNewsContent(finalText);
      localStorage.setItem(cacheKey, finalText);
    } catch (contentError) {
      console.error("Ошибка при загрузке содержимого новости:", contentError);
      setNewsContent("Не удалось загрузить содержимое новости 😢");
    } finally {
      setContentLoading(false);
    }
  };

  const backToList = () => {
    setActiveNews(null);
    setNewsContent("");
    setContentLoading(false);
  };

  const detailContentClassName = `news-detail__content${
    contentLoading ? " news-detail__content--loading" : ""
  }`;

  const renderEmptyState = (message) => (
    <div className="news-empty">
      <p>{message}</p>
      <motion.button
        type="button"
        className="news-empty__cta"
        onClick={() => loadNews(true)}
        whileTap={newsTapFeedback}
      >
        Обновить
      </motion.button>
    </div>
  );

  return (
    <section
      className={`screen news-screen${activeNews ? " news-screen--detail" : ""}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {activeNews ? (
          <motion.div
            key="news-detail"
            className="news-detail"
            initial={newsDetailMotion.initial}
            animate={newsDetailMotion.animate}
            exit={newsDetailMotion.exit}
            transition={newsDetailMotion.transition}
          >
            <motion.button
              type="button"
              className="news-detail__back"
              onClick={backToList}
              whileTap={newsTapFeedback}
            >
              <span aria-hidden="true">←</span>
              Назад к новостям
            </motion.button>

            <motion.div className="news-detail__hero" layout>
              <motion.div
                className="news-detail__media"
                layoutId={
                  activeNews?.url ? getImageLayoutId(activeNews.url) : undefined
                }
              >
                <img
                  src={activeNews?.img}
                  alt=""
                  loading="lazy"
                  className="news-detail__image"
                />
              </motion.div>

              <div className="news-detail__info">
                <p className="news-detail__eyebrow">Новость кампуса</p>
                <h2 className="screen__title">{activeNews?.title}</h2>

                <div className="news-detail__meta">
                  <span className="news-detail__chip">{getBadgeLabel(0)}</span>
                  <span className="news-detail__chip news-detail__chip--muted">
                    {domainLabel}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.section
              className={detailContentClassName}
              layout
              initial={newsDetailContentMotion.initial}
              animate={newsDetailContentMotion.animate}
              exit={newsDetailContentMotion.exit}
              transition={newsDetailContentMotion.transition}
            >
              {contentLoading ? (
                <div className="news-detail__loader" aria-live="polite">
                  <span />
                  <span />
                  <span />
                </div>
              ) : newsContent ? (
                splitIntoParagraphs(newsContent).map((paragraph, index) => (
                  <p key={`paragraph-${index}`} className="news-detail__paragraph">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="news-detail__placeholder">
                  Контент появится сразу после загрузки.
                </p>
              )}
            </motion.section>

            {activeNews?.url && (
              <div className="news-detail__actions">
                <motion.a
                  href={activeNews.url}
                  target="_blank"
                  rel="noreferrer"
                  className="news-detail__cta"
                  whileTap={newsTapFeedback}
                >
                  Читать на сайте
                  <span aria-hidden="true">↗</span>
                </motion.a>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="news-overview"
            className="news-overview"
            initial={newsOverviewMotion.initial}
            animate={newsOverviewMotion.animate}
            exit={newsOverviewMotion.exit}
            transition={newsOverviewMotion.transition}
          >
            <div className="news-overview__header">
              <div>
                <p className="news-overview__eyebrow">Кампус онлайн</p>
                <h2 className="screen__title">Новости</h2>
                <p className="screen__subtitle">
                  Собрали фокус на ключевых событиях университета
                </p>
              </div>

              <motion.div
                className="news-overview__stats"
                initial={newsMetaMotion.initial}
                animate={newsMetaMotion.animate}
                transition={newsMetaMotion.transition}
              >
                <span className="news-overview__count">
                  {news.length || "—"} материалов
                </span>
                <span className="news-overview__updated">
                  Источник: {domainLabel}
                </span>
              </motion.div>
            </div>

            <div className="news-overview__hero">
              {loading && !featuredNews ? (
                <div className="news-hero-card news-hero-card--skeleton" aria-hidden="true">
                  <div className="news-hero-card__skeleton-line" />
                  <div className="news-hero-card__skeleton-line news-hero-card__skeleton-line--short" />
                  <div className="news-hero-card__skeleton-line news-hero-card__skeleton-line--cta" />
                </div>
              ) : (
                featuredNews && (
                  <motion.article
                    className="news-hero-card"
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть новость ${featuredNews.title}`}
                    onClick={() => openNews(featuredNews)}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, () => openNews(featuredNews))
                    }
                    initial={newsHeroMotion.initial}
                    animate={newsHeroMotion.animate}
                    exit={newsHeroMotion.exit}
                    transition={newsHeroMotion.transition}
                    layoutId={`news-card-${encodeURIComponent(featuredNews.url)}`}
                    whileTap={newsTapFeedback}
                  >
                    <motion.div
                      className="news-hero-card__image"
                      layoutId={getImageLayoutId(featuredNews.url)}
                    >
                      <img
                        src={featuredNews.img}
                        alt=""
                        loading="lazy"
                        className="news-hero-card__img"
                      />
                    </motion.div>
                    <div className="news-hero-card__overlay" />
                    <div className="news-hero-card__content">
                      <div className="news-hero-card__meta">
                        <span className="news-hero-card__badge">
                          {getBadgeLabel(0)}
                        </span>
                        <span className="news-hero-card__updated">
                          Новости {domainLabel}
                        </span>
                      </div>
                      <h3 className="news-hero-card__title">
                        {featuredNews.title}
                      </h3>
                      <motion.button
                        type="button"
                        className="news-hero-card__cta"
                        onClick={(event) => {
                          event.stopPropagation();
                          openNews(featuredNews);
                        }}
                        whileTap={newsTapFeedback}
                      >
                        Читать подробнее
                        <span aria-hidden="true">→</span>
                      </motion.button>
                    </div>
                  </motion.article>
                )
              )}
            </div>

            {error && renderEmptyState(error)}

            {!loading && !error && news.length === 0 && (
              renderEmptyState("Нет новостей — но мы уже работаем над этим!")
            )}

            {!loading && !error && news.length === 1 && (
              <p className="news-empty news-empty--inline">
                Как только появятся новые материалы, они появятся здесь.
              </p>
            )}

            {loading ? (
              <div className="news-grid" aria-live="polite">
                {SKELETON_ITEMS.map((index) => (
                  <div key={`skeleton-${index}`} className="news-card news-card--skeleton">
                    <div className="news-card__skeleton-image" />
                    <div className="news-card__skeleton-line" />
                    <div className="news-card__skeleton-line news-card__skeleton-line--short" />
                  </div>
                ))}
              </div>
            ) : (
              otherNews.length > 0 && (
                <div className="news-grid" aria-live="polite">
                  <AnimatePresence>
                    {otherNews.map((item, index) => {
                      const cardMotion = getNewsCardMotion(index);
                      const layoutId = getImageLayoutId(item.url);
                      const badge = getBadgeLabel(index + 1);

                      return (
                        <motion.article
                          key={item.url}
                          className="news-card"
                          role="button"
                          tabIndex={0}
                          aria-label={`Открыть новость ${item.title}`}
                          onClick={() => openNews(item)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () => openNews(item))
                          }
                          initial={cardMotion.initial}
                          animate={cardMotion.animate}
                          exit={cardMotion.exit}
                          transition={cardMotion.transition}
                          layout
                          whileTap={newsTapFeedback}
                        >
                          <motion.div
                            className="news-card__image"
                            layoutId={layoutId}
                          >
                            <img
                              src={item.img}
                              alt=""
                              loading="lazy"
                              className="news-card__img"
                            />
                          </motion.div>

                          <div className="news-card__content">
                            <div className="news-card__badge">{badge}</div>
                            <h3 className="news-card__title">{item.title}</h3>
                            <div className="news-card__footer">
                          <span className="news-card__meta">{domainLabel}</span>
                              <motion.button
                                type="button"
                                className="news-card__cta"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openNews(item);
                                }}
                                whileTap={newsTapFeedback}
                              >
                                Читать
                                <span aria-hidden="true">→</span>
                              </motion.button>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
