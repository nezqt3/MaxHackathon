import QuestionMark from "../static/question-mark.svg";
import Settings from "../static/settings.svg";

import LogoFin from "../static/logoFin.svg";

export default function ChooseUniversity() {
  const universities = [
    {
      logo: LogoFin,
      title: "Финансовый университет при правительстве РФ",
      id: "financial-university",
    },
  ];

  return (
    <div className="choose-university">
      <div className="choose-university__header">
        <div className="choose-university__header-left">
          <div className="choose-university__header-left-question-div">
            <img
              className="choose-university__header-left-question"
              alt="question-mark"
              src={QuestionMark}
            />
          </div>
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
          return (
            <div className="choose-university__universities-university">
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
              <button className="choose-university__universities-university-choose">
                Выбрать
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
