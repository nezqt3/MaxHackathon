import { motion } from "motion/react";

const getInitials = (fullName) => {
  if (!fullName) {
    return "??";
  }
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const AccountProfileCard = ({ account, onEdit }) => {
  if (!account) {
    return null;
  }

  return (
    <motion.div
      className="account-card account-card--profile"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="account-card__avatar account-card__avatar--initials">
        {getInitials(account.fullName)}
      </div>

      <div className="account-card__body">
        <div className="account-card__info">
          <span className="account-card__info-eyebrow">Профиль MAX</span>
          <span className="account-card__info-name">
            {account.fullName || "Имя не указано"}
          </span>
          <p className="account-card__info-description">
            Здесь отображаются данные, которые вы синхронизировали с сервисами
            MAX.
          </p>
        </div>

        <div className="account-card__meta">
          <div>
            <span>Вуз</span>
            <strong>{account.universityTitle || "Не выбран"}</strong>
          </div>
          <div>
            <span>Курс</span>
            <strong>{account.course || "—"}</strong>
          </div>
          <div>
            <span>Группа</span>
            <strong>{account.groupLabel || "—"}</strong>
          </div>
        </div>

        {account.scheduleProfile && (
          <span className="account-card__badge">
            Синхронизировано с расписанием
          </span>
        )}
      </div>

      <div className="account-card__actions">
        <button
          type="button"
          className="account-card__action"
          onClick={onEdit}
        >
          Изменить данные
        </button>
      </div>
    </motion.div>
  );
};

export default AccountProfileCard;
