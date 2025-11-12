export const newsOverviewMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35 },
};

export const newsDetailMotion = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.35 },
};

export const newsHeroMotion = {
  initial: { opacity: 0, y: 25, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.96 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
};

export const getNewsCardMotion = (index = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.97 },
  transition: {
    duration: 0.35,
    delay: index * 0.04,
    ease: [0.16, 1, 0.3, 1],
  },
});

export const newsDetailContentMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3 },
};

export const newsMetaMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.35, delay: 0.15 },
};

export const newsTapFeedback = { scale: 0.97 };
