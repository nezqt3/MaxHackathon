import ServiceFeatureStub from "./ServiceFeatureStub";
import ServicePaymentCard from "./ServicePaymentCard";

const PAYMENT_OPTIONS = [
  {
    id: "edu",
    title: "Оплата обучения",
    caption: "Контрактное обучение, пересдачи, доп. услуги",
    url: "https://pay.fa.ru/moscow/edu/",
  },
];

const FEATURE_STUBS = [
  {
    id: "certificates",
    title: "Справки без похода в деканат",
    description: "Скоро появится доставка справок с QR-подписями прямо в приложение.",
    statusLabel: "Проектирование",
    iconLabel: "DOC",
  },
  {
    id: "requests",
    title: "Заявления на перевод и академический отпуск",
    description: "Готовим единые формы с отслеживанием статусов и комментариями.",
    statusLabel: "В разработке",
    iconLabel: "REQ",
  },
  {
    id: "timeline",
    title: "История обращений",
    description: "Будет видно, кто обрабатывает заявку и когда ждать ответ.",
    statusLabel: "Скоро",
    iconLabel: "LOG",
  },
];

const DeanOfficeService = () => (
  <div className="service-detail-grid">
    <div className="service-detail-grid__column service-detail-grid__column--primary">
      <ServicePaymentCard
        title="Оплата образовательных услуг"
        description="Форма из официального сервиса Финансового университета открывается прямо внутри мини-приложения."
        options={PAYMENT_OPTIONS}
      />
    </div>

    <div className="service-detail-grid__column service-detail-grid__column--secondary">
      <section className="service-detail-card service-feature-section">
        <div className="service-feature-section__header">
          <h3 className="service-feature-section__title">Что появится дальше</h3>
          <p className="service-feature-section__description">
            Мы собираем сценарии из запросов студентов и добавляем их постепенно.
          </p>
        </div>
        <div className="service-feature-stubs">
          {FEATURE_STUBS.map((feature) => (
            <ServiceFeatureStub
              key={feature.id}
              title={feature.title}
              description={feature.description}
              statusLabel={feature.statusLabel}
              iconLabel={feature.iconLabel}
            />
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default DeanOfficeService;
