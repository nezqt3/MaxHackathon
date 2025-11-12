import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBids } from "../../methods/parse/links";
import ServiceFeatureStub from "./ServiceFeatureStub";
import ServicePaymentCard from "./ServicePaymentCard";
import { useUniversity } from "../../context/UniversityContext.jsx";

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
    id: "requests",
    title: "Заявления на перевод и академический отпуск",
    description:
      "Готовим единые формы с отслеживанием статусов и комментариями.",
    statusLabel: "В разработке",
    iconLabel: "REQ",
  }
];

const DeanOfficeService = () => {
  const [bids, setBids] = useState([]);
  const [hasLoadedBids, setHasLoadedBids] = useState(false);
  const [isBidListVisible, setIsBidListVisible] = useState(false);
  const [isBidsLoading, setIsBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);
  const { university } = useUniversity();
  const universityId = university?.apiId || university?.id || null;

  const paymentOptions = useMemo(() => {
    const configuredOptions =
      university?.services?.deanOffice?.paymentOptions ?? [];
    return configuredOptions.length > 0 ? configuredOptions : PAYMENT_OPTIONS;
  }, [university]);

  const handleCloseOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setIsFrameLoading(false);
    setSelectedBid(null);
  }, []);

  const loadBids = useCallback(async () => {
    if (!universityId) {
      setBids([]);
      setHasLoadedBids(false);
      return;
    }
    setIsBidsLoading(true);
    setBidsError(null);
    try {
      const result = await getBids(universityId);
      setBids(Array.isArray(result) ? result : []);
      setHasLoadedBids(true);
    } catch (error) {
      setBidsError("Не удалось загрузить заявки. Попробуйте ещё раз.");
    } finally {
      setIsBidsLoading(false);
    }
  }, [universityId]);

  const handleTriggerClick = async () => {
    if (!universityId) {
      setBidsError("Выберите вуз, чтобы получить список заявлений.");
      return;
    }
    if (!isBidListVisible) {
      setIsBidListVisible(true);
      if (!hasLoadedBids && !isBidsLoading) {
        await loadBids();
      }
      return;
    }
    if (!isBidsLoading) {
      await loadBids();
    }
  };

  const handleOpenBid = (bid) => {
    if (!bid?.url) {
      return;
    }
    setSelectedBid(bid);
    setIsOverlayOpen(true);
    setIsFrameLoading(true);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalContainer(document.body);
    }
  }, []);

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
        handleCloseOverlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayOpen, handleCloseOverlay]);

  useEffect(() => {
    setBids([]);
    setIsBidListVisible(false);
    setHasLoadedBids(false);
    setBidsError(null);
  }, [universityId]);

  const overlay =
    portalContainer && isOverlayOpen && selectedBid
      ? createPortal(
          <div
            className="service-payment-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Заявка: ${selectedBid.title}`}
          >
            <header className="service-payment-overlay__header">
              <div className="service-payment-overlay__actions">
                <button
                  type="button"
                  className="service-payment-overlay__back"
                  onClick={handleCloseOverlay}
                >
                  <span aria-hidden="true">←</span>
                  Назад
                </button>

                <a
                  className="service-payment-overlay__external"
                  href={selectedBid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  В браузере
                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="service-payment-overlay__titles">
                <p className="service-payment-overlay__eyebrow">Заявки</p>
                <h3 className="service-payment-overlay__title">
                  {selectedBid.title}
                </h3>
                <p className="service-payment-overlay__caption">
                  Форма откроется прямо внутри мини-приложения.
                </p>
              </div>

            </header>

            <div className="service-payment-overlay__frame" aria-live="polite">
              {isFrameLoading && (
                <div className="service-payment-overlay__loading">
                  Загружаем форму…
                </div>
              )}
              <iframe
                key={selectedBid.url}
                src={selectedBid.url}
                title={selectedBid.title}
                className="service-payment-overlay__iframe"
                onLoad={() => setIsFrameLoading(false)}
              />
            </div>
          </div>,
          portalContainer,
        )
      : null;

  return (
    <>
      <div className="service-detail-grid">
        <div className="service-detail-grid__column service-detail-grid__column--primary">
          <ServicePaymentCard
            title="Оплата образовательных услуг"
            description={
              university
                ? `Форма из официального сервиса ${university.shortTitle || university.title} открывается прямо внутри мини-приложения.`
                : "Форма из официального сервиса университета откроется внутри мини-приложения."
            }
            options={paymentOptions}
          />

          <section className="service-detail-card service-bids-card">
            <h3 className="service-detail-card__title">Заявления деканата</h3>
            <p className="service-detail-card__text">
              Найдите нужную заявку и заполните её без переходов в браузер.
              Список подтягивается из официального сайта.
            </p>

            <button
              type="button"
              className="service-bids-card__trigger"
              onClick={handleTriggerClick}
              disabled={isBidsLoading || !universityId}
            >
              {isBidsLoading
                ? "Загружаем заявки…"
                : isBidListVisible
                  ? "Обновить список"
                  : "Выбрать заявку"}
            </button>

            {!universityId && (
              <p className="service-detail-card__placeholder">
                Выберите вуз на стартовом экране, чтобы увидеть список заявлений.
              </p>
            )}

            {isBidListVisible && (
              <div
                className="service-bids-card__list"
                role="region"
                aria-live="polite"
                aria-label="Список заявок"
              >
                {bidsError && (
                  <p className="service-detail-card__placeholder service-bids-card__error">
                    {bidsError}
                  </p>
                )}

                {!bidsError && bids.length === 0 && !isBidsLoading && (
                  <p className="service-detail-card__placeholder">
                    Пока нет готовых заявлений. Попробуйте обновить список позже.
                  </p>
                )}

                {!bidsError && bids.length > 0 && (
                  <ul className="service-bid-list">
                    {bids.map((bid) => (
                      <li key={bid.url}>
                        <button
                          type="button"
                          className="service-bid-list__item"
                          onClick={() => handleOpenBid(bid)}
                        >
                          <span className="service-bid-list__title">
                            {bid.title}
                          </span>
                          <span
                            className="service-bid-list__action"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="service-detail-grid__column service-detail-grid__column--secondary">
          <section className="service-detail-card service-feature-section">
            <div className="service-feature-section__header">
              <h3 className="service-feature-section__title">
                Что появится дальше
              </h3>
              <p className="service-feature-section__description">
                Мы собираем сценарии из запросов студентов и добавляем их
                постепенно.
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
      {overlay}
    </>
  );
};

export default DeanOfficeService;
