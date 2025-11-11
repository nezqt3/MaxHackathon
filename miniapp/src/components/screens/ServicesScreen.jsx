const SERVICE_STATUS_META = {
  planned: { label: "Скоро", tone: "pending", icon: "?" },
};

const SERVICES = [
  {
    id: "career",
    title: "Карьера",
    status: "planned",
    accent: "#ec4899",
    accentBg: "rgba(236, 72, 153, 0.12)",
    accentBorder: "rgba(236, 72, 153, 0.3)",
    description: "Совместно с центром развития собираем карьерный трек.",
    features: [
      "Получать консультации от центра карьеры",
      "Просматривать и откликаться на вакансии",
    ],
  },
  {
    id: "dean-office",
    title: "Деканат",
    status: "ready",
    accent: "#6366f1",
    accentBg: "rgba(99, 102, 241, 0.12)",
    accentBorder: "rgba(99, 102, 241, 0.25)",
    description: "Все важные заявления и платежи собраны в одном месте.",
    features: [
      "Получать справки",
      "Оплачивать обучение",
      "Оформлять компенсации",
      "Подавать заявление на перевод или академический отпуск",
    ],
  },
  {
    id: "dorm",
    title: "Общежитие",
    status: "ready",
    accent: "#0ea5e9",
    accentBg: "rgba(14, 165, 233, 0.12)",
    accentBorder: "rgba(14, 165, 233, 0.25)",
    description: "Контроль проживания и сервисов без очередей.",
    features: [
      "Оплачивать проживание",
      "Заказывать дополнительные услуги",
      "Оформлять пропуск для гостя",
      "Подача заявок в техподдержку",
    ],
  },
  {
    id: "activities",
    title: "Внеучебная деятельность",
    status: "ready",
    accent: "#22c55e",
    accentBg: "rgba(34, 197, 94, 0.12)",
    accentBorder: "rgba(34, 197, 94, 0.25)",
    description: "Гибкий календарь для активной жизни кампуса.",
    features: [
      "Просматривать календарь событий",
      "Регистрироваться на мероприятия как зритель или участник",
    ],
  },
  {
    id: "library",
    title: "Библиотека",
    status: "planned",
    accent: "#f97316",
    accentBg: "rgba(249, 115, 22, 0.12)",
    accentBorder: "rgba(249, 115, 22, 0.3)",
    description: "Подключаем печатные и цифровые фонды.",
    features: ["Заказывать книги", "Получать доступ к электронной библиотеке"],
  },
];

const ServicesScreen = () => (
  <section className="screen services-screen">
    <div className="services-screen__header">
      <h2 className="screen__title">Сервисы кампуса</h2>
    </div>

    <div className="services-grid">
      {SERVICES.map((service) => {
        const statusMeta = SERVICE_STATUS_META[service.status];
        const initial = service.title?.[0]?.toUpperCase() ?? "";

        return (
          <article
            key={service.id}
            className="services-card"
            style={{
              "--services-accent": service.accent,
              "--services-accent-bg": service.accentBg,
              "--services-accent-border": service.accentBorder,
            }}
          >
            <div className="services-card__icon" aria-hidden="true">
              {initial}
            </div>

            <div className="services-card__content">
              <div className="services-card__header">
                <h3 className="services-card__title">{service.title}</h3>
                {statusMeta && (
                  <span className={`services-status services-status--${statusMeta.tone}`}>
                    <span className="services-status__icon" aria-hidden="true">
                      {statusMeta.icon}
                    </span>
                    {statusMeta.label}
                  </span>
                )}
              </div>

              {service.description && (
                <p className="services-card__description">{service.description}</p>
              )}

              <ul className="services-card__features">
                {service.features.map((feature, index) => (
                  <li key={`${service.id}-${index}`} className="services-card__feature">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

export default ServicesScreen;
