import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUniversity } from "../../context/UniversityContext.jsx";

const SKELETON_ITEMS = Array.from({ length: 1 }, (_, i) => i);

const AccountScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const { university } = useUniversity();

  /* Будем парсить из max */

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProfileData({
        name: "Иван Иванов",
        email: "ivan@example.com",
        avatar: "https://i.pravatar.cc/150?img=12",
        university: university?.title ?? "Вуз не выбран",
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [university]);

  return (
    <section className="screen account-screen">
      <div className="account-screen__header">
        <h2 className="screen__title">Профиль</h2>
        <p className="screen__subtitle">
          Настройки и информация о вашем аккаунте
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <div className="account-skeleton">
            {SKELETON_ITEMS.map((_, index) => (
              <motion.div
                key={index}
                className="account-skeleton__item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="account-skeleton__avatar" />
                <div className="account-skeleton__line" />
              </motion.div>
            ))}
          </div>
        ) : profileData ? (
          <motion.div
            className="account-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="account-card__avatar">
              <img
                src={profileData.avatar}
                alt={`${profileData.name} avatar`}
              />
            </div>

            <div className="account-card__info">
              <span className="account-card__info-name">
                {profileData.name}
              </span>
              <span className="account-card__info-email">
                {profileData.email}
              </span>
              <span>{profileData.university}</span>
            </div>
          </motion.div>
        ) : (
          <div className="news-empty">
            <p>Данные профиля недоступны.</p>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AccountScreen;
