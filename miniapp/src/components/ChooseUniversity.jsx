import { motion } from "motion/react";
import QuestionMark from "../static/question-mark.svg";
import Settings from "../static/settings.svg";
import { UNIVERSITIES as DEFAULT_UNIVERSITIES } from "../config/universities";

const ChooseUniversity = ({
  universities = DEFAULT_UNIVERSITIES,
  selectedId,
  onSelect = () => {},
  onBack,
}) => (
  <motion.section
    className="choose-university"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="choose-university__header">
      <div className="choose-university__header-left">
        <button
          type="button"
          className="choose-university__header-left-question-div"
          onClick={onBack}
          aria-label="Назад"
        >
          <img
            className="choose-university__header-left-question"
            alt="question-mark"
            src={QuestionMark}
          />
        </button>
        <h2 className="choose-university__header-left-title">
          Выберите ваш вуз
        </h2>
      </div>
      <div className="choose-university__header-settings-div">
        <img
          src={Settings}
          alt="settings"
          className="choose-university__header-settings"
        />
      </div>
    </div>

    <div className="choose-university__universities">
      {universities.map((university) => {
        const isSelected = selectedId === university.id;

        return (
          <div
            key={university.id}
            className="choose-university__universities-university"
          >
            <div className="choose-university__universities-university-logo__div">
              <img
                src={university.logo}
                alt={`logo-${university.id}`}
                className="choose-university__universities-university-logo"
              />
            </div>
            <div className="choose-university__universities-university-title">
              {university.title}
            </div>
            <button
              type="button"
              className="choose-university__universities-university-choose"
              disabled={isSelected}
              onClick={() => onSelect(university)}
            >
              {isSelected ? "Выбрано" : "Выбрать"}
            </button>
          </div>
        );
      })}
    </div>
  </motion.section>
);

export default ChooseUniversity;
