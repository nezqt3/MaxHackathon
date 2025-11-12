const ServiceFeatureStub = ({
  title,
  description,
  statusLabel = "Скоро",
  iconLabel = "",
}) => (
  <article className="service-feature-stub">
    {iconLabel && (
      <div className="service-feature-stub__icon" aria-hidden="true">
        {iconLabel}
      </div>
    )}
    <div className="service-feature-stub__body">
      <div className="service-feature-stub__status">
        <span className="services-status services-status--pending">
          <span className="services-status__icon" aria-hidden="true">
            •
          </span>
          {statusLabel}
        </span>
      </div>
      <h4 className="service-feature-stub__title">{title}</h4>
      <p className="service-feature-stub__description">{description}</p>
    </div>
  </article>
);

export default ServiceFeatureStub;
