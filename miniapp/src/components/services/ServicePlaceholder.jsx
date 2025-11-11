const ServicePlaceholder = ({
  title,
  description = "Сервис скоро будет доступен в NoMissed.",
  children,
}) => (
  <div className="service-detail-card">
    <h3 className="service-detail-card__title">{title}</h3>
    <p className="service-detail-card__text">{description}</p>
    <div className="service-detail-card__body">
      {children ?? (
        <p className="service-detail-card__placeholder">
          Мы уже проектируем пользовательские сценарии. Следите за обновлениями.
        </p>
      )}
    </div>
  </div>
);

export default ServicePlaceholder;
