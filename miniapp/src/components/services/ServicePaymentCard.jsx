import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

const ServicePaymentCard = ({
  title,
  description,
  options = [],
  eyebrow = "Встроенная оплата",
}) => {
  const availableOptions = useMemo(
    () => options.filter(({ url }) => Boolean(url)),
    [options],
  );

  const [activeOptionId, setActiveOptionId] = useState(null);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalContainer(document.body);
    }
  }, []);

  useEffect(() => {
    if (!availableOptions.some(({ id }) => id === activeOptionId)) {
      setActiveOptionId(null);
      setIsFrameLoading(false);
      setIsOverlayOpen(false);
    }
  }, [availableOptions, activeOptionId]);

  useEffect(() => {
    if (typeof document === "undefined" || !isOverlayOpen) {
      return undefined;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !isOverlayOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOverlayOpen(false);
        setIsFrameLoading(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayOpen]);

  const activeOption = useMemo(
    () => availableOptions.find(({ id }) => id === activeOptionId) ?? null,
    [availableOptions, activeOptionId],
  );

  const handleOpenOption = (optionId) => {
    setActiveOptionId(optionId);
    setIsOverlayOpen(true);
    setIsFrameLoading(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setIsFrameLoading(false);
  };

  const overlay =
    portalContainer && isOverlayOpen && activeOption
      ? createPortal(
          <div
            className="service-payment-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Оплата: ${activeOption.title}`}
          >
            <header className="service-payment-overlay__header">
              <button
                type="button"
                className="service-payment-overlay__back"
                onClick={handleCloseOverlay}
              >
                <span aria-hidden="true">←</span>
                Назад
              </button>

              <div className="service-payment-overlay__titles">
                {eyebrow && (
                  <p className="service-payment-overlay__eyebrow">{eyebrow}</p>
                )}
                <h3 className="service-payment-overlay__title">
                  {activeOption.title}
                </h3>
                {activeOption.caption && (
                  <p className="service-payment-overlay__caption">
                    {activeOption.caption}
                  </p>
                )}
              </div>

              <a
                className="service-payment-overlay__external"
                href={activeOption.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                В браузере
                <span aria-hidden="true">↗</span>
              </a>
            </header>

            <div className="service-payment-overlay__frame" aria-live="polite">
              {isFrameLoading && (
                <div className="service-payment-overlay__loading">
                  Загружаем форму оплаты…
                </div>
              )}
              <iframe
                key={activeOption.id}
                src={activeOption.url}
                title={activeOption.title}
                className="service-payment-overlay__iframe"
                onLoad={() => setIsFrameLoading(false)}
                allow="payment *; clipboard-write *"
              />
            </div>
          </div>,
          portalContainer,
        )
      : null;

  return (
    <>
      <section className="service-detail-card service-payment-card">
        <div className="service-payment-card__header">
          <div>
            {eyebrow && (
              <p className="service-payment-card__eyebrow">{eyebrow}</p>
            )}
            <h3 className="service-detail-card__title">{title}</h3>
          </div>
        </div>

        {description && (
          <p className="service-detail-card__text">{description}</p>
        )}

        {availableOptions.length > 0 && (
          <div className="service-payment-card__options">
            {availableOptions.map((option) => {
              const isActive = isOverlayOpen && option.id === activeOptionId;
              return (
                <button
                  type="button"
                  key={option.id}
                  className={`service-payment-card__option${
                    isActive ? " service-payment-card__option--active" : ""
                  }`}
                  aria-pressed={isActive}
                  onClick={() => handleOpenOption(option.id)}
                >
                  <span className="service-payment-card__option-title">
                    {option.title}
                  </span>
                  {option.caption && (
                    <span className="service-payment-card__option-caption">
                      {option.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {availableOptions.length === 0 && (
          <p className="service-payment-card__placeholder">
            Платежные сценарии появятся здесь позже.
          </p>
        )}
      </section>
      {overlay}
    </>
  );
};

export default ServicePaymentCard;
