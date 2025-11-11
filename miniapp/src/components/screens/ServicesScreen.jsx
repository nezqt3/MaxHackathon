import { useState } from "react";
import ActivitiesService from "../services/ActivitiesService";
import CareerService from "../services/CareerService";
import DeanOfficeService from "../services/DeanOfficeService";
import DormService from "../services/DormService";
import LibraryService from "../services/LibraryService";


const SERVICE_COMPONENTS = {
  "dean-office": DeanOfficeService,
  dorm: DormService,
  activities: ActivitiesService,
  library: LibraryService,
  career: CareerService,
};

const SERVICES = [
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
    disabled: true,
    accent: "#f97316",
    accentBg: "rgba(249, 115, 22, 0.12)",
    accentBorder: "rgba(249, 115, 22, 0.3)",
    features: ["Заказывать книги", "Получать доступ к электронной библиотеке"],
  },
  {
    id: "career",
    title: "Карьера",
    status: "planned",
    disabled: true,
    accent: "#ec4899",
    accentBg: "rgba(236, 72, 153, 0.12)",
    accentBorder: "rgba(236, 72, 153, 0.3)",
    features: [
      "Получать консультации от центра карьеры",
      "Просматривать и откликаться на вакансии",
    ],
  },
];

const ServicesScreen = () => {
  const [activeServiceId, setActiveServiceId] = useState(null);

  const activeService = SERVICES.find(({ id }) => id === activeServiceId) ?? null;
  const ActiveServiceComponent = activeService ? SERVICE_COMPONENTS[activeService.id] : null;

  const handleOpenService = (serviceId) => setActiveServiceId(serviceId);
  const handleCardKeyDown = (event, serviceId, isDisabled) => {
    if (isDisabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenService(serviceId);
    }
  };

  return (
    <section className={`screen services-screen${activeService ? " services-screen--detail" : ""}`}>
      {activeService ? (
        <div className="services-detail">
          <button
            type="button"
            className="services-detail__back"
            onClick={() => setActiveServiceId(null)}
          >
            <span aria-hidden="true">←</span>
            Назад к сервисам
          </button>

          <div className="services-detail__header">
            <p className="services-screen__eyebrow">Сервис</p>
            <h2 className="screen__title">{activeService.title}</h2>
            {activeService.description && (
              <p className="screen__subtitle">{activeService.description}</p>
            )}
          </div>

          {activeService.features?.length > 0 && (
            <ul className="services-detail__feature-list">
              {activeService.features.map((feature, index) => (
                <li key={`${activeService.id}-detail-${index}`}>{feature}</li>
              ))}
            </ul>
          )}

          <div className="services-detail__content">
            {ActiveServiceComponent ? (
              <ActiveServiceComponent />
            ) : (
              <p className="service-detail-card__placeholder">Раздел в разработке.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="services-screen__header">
            <h2 className="screen__title">Сервисы кампуса</h2>
            <p className="screen__subtitle">Различные решения для вашего удобства</p>
          </div>

          <div className="services-grid">
            {SERVICES.map((service) => {
              const initial = service.title?.[0]?.toUpperCase() ?? "";
              const isDisabled = Boolean(service.disabled);

              return (
                <article
                  key={service.id}
                  className={`services-card${isDisabled ? " services-card--disabled" : ""}`}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  aria-label={`Открыть сервис ${service.title}`}
                  aria-disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) {
                      return;
                    }
                    handleOpenService(service.id);
                  }}
                  onKeyDown={(event) => handleCardKeyDown(event, service.id, isDisabled)}
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

                    <button
                      type="button"
                      className="services-card__cta"
                      disabled={isDisabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (isDisabled) {
                          return;
                        }
                        handleOpenService(service.id);
                      }}
                    >
                      {isDisabled ? "Скоро" : "Открыть"}
                      <span aria-hidden="true" className="services-card__cta-icon">
                        →
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

export default ServicesScreen;
