import ServiceFeatureStub from "./ServiceFeatureStub";
import ServicePaymentCard from "./ServicePaymentCard";

const PAYMENT_OPTIONS = [
  {
    id: "residence",
    title: "Проживание и коммунальные услуги",
    caption: "Регулярные начисления, штрафы и услуги общежития",
    url: "https://pay.fa.ru/moscow/other/",
  },
];

const FEATURE_STUBS = [
  {
    id: "service-desk",
    title: "Заявки в техподдержку",
    description: "Фото неисправности, трекинг мастера и пуши об обновлениях.",
    statusLabel: "Проектирование",
    iconLabel: "FIX",
  },
  {
    id: "guest-pass",
    title: "Гостевые пропуска",
    description: "Одобрение через кураторов и автоматическая отправка на КПП.",
    statusLabel: "В разработке",
    iconLabel: "PASS",
  },
  {
    id: "extras",
    title: "Дополнительные услуги",
    description: "Прачечная, хранение вещей и другие сервисы по подписке.",
    statusLabel: "Скоро",
    iconLabel: "PLUS",
  },
];

const DormService = () => (
  <div className="service-detail-grid">
    <div className="service-detail-grid__column service-detail-grid__column--primary">
      <ServicePaymentCard
        title="Оплата проживания в общежитии"
        description="Оплата попадает в официальный сервис, но форма остается внутри мини-приложения."
        options={PAYMENT_OPTIONS}
      />
    </div>

    <div className="service-detail-grid__column service-detail-grid__column--secondary">
      <section className="service-detail-card service-feature-section">
        <div className="service-feature-section__header">
          <h3 className="service-feature-section__title">Следующие функции</h3>
          <p className="service-feature-section__description">
            Расширяем цифровые сценарии общежитий и собираем обратную связь.
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

export default DormService;
