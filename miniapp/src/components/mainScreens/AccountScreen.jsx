import { AnimatePresence, motion } from "motion/react";
import { useAccount } from "../../context/AccountContext.jsx";
import SettingsIcon from "../../static/settings.svg";
import RegistrationScreen from "../account/RegistrationScreen.jsx";

const SKELETON_ITEMS = Array.from({ length: 1 }, (_, i) => i);

const AccountScreen = ({ onNavigate }) => {
  const { isInitializing, userId } = useAccount();

  const handleOpenSettings = () => {
    onNavigate?.("settings");
  };

  const renderSkeleton = () => (
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
  );

  const renderMissingUser = () => (
    <div className="account-auth account-auth--info">
      <div className="account-auth__body">
        <h3>Нет подключения к MAX</h3>
        <p>
          Профиль открывается автоматически, когда вы запускаете мини-приложение
          из чат-бота MAX. Вернитесь в чат и нажмите кнопку «Открыть приложение»,
          чтобы мы смогли определить ваш ID.
        </p>
        <button
          type="button"
          className="account-form__link"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isInitializing) {
      return renderSkeleton();
    }
    if (!userId) {
      return renderMissingUser();
    }
    return <RegistrationScreen />;
  };

  const hasUserSession = Boolean(userId);
  const eyebrowText = hasUserSession ? "Данные профиля" : "Сессия недоступна";
  const titleText = hasUserSession ? "Ваши данные" : "Подключите аккаунт MAX";
  const subtitleText = hasUserSession
    ? "MAX автоматически определяет ваш ID. Проверьте свои данные, обновите ФИО и синхронизируйте вуз."
    : "Чтобы редактировать профиль, откройте мини-приложение через бота MAX. Так мы сможем связать аккаунт с вашим ID.";

  return (
    <section className="screen account-screen">
      <header className="account-screen__header">
        <div className="account-screen__header-content">
          <p className="account-screen__eyebrow">{eyebrowText}</p>
          <h2 className="account-screen__title">{titleText}</h2>
          <p className="account-screen__subtitle">{subtitleText}</p>
        </div>
        <button
          type="button"
          className="account-screen__settings-button"
          onClick={handleOpenSettings}
          aria-label="Открыть настройки"
        >
          <img src={SettingsIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hasUserSession ? "account-form" : isInitializing ? "loading" : "no-session"}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default AccountScreen;
