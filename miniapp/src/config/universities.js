import LogoFin from "../static/logoFin.svg";

export const UNIVERSITIES = [
  {
    id: "financial-university",
    apiId: "financial-university",
    title: "Финансовый университет при Правительстве РФ",
    shortTitle: "Финуниверситет",
    domain: "fa.ru",
    brandColor: "#6366f1",
    logo: LogoFin,
    services: {
      deanOffice: {
        paymentOptions: [
          {
            id: "edu",
            title: "Оплата обучения",
            caption: "Контрактное обучение, пересдачи, доп. услуги",
            url: "https://pay.fa.ru/moscow/edu/",
          },
        ],
      },
    },
  },
];

export const UNIVERSITY_MAP = UNIVERSITIES.reduce((acc, university) => {
  acc[university.id] = university;
  return acc;
}, {});

export const DEFAULT_UNIVERSITY_ID = UNIVERSITIES[0]?.id ?? null;
