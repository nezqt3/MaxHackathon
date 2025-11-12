const defaultEase = [0.16, 1, 0.3, 1];

export const servicesOverviewMotion = {
  initial: { opacity: 0, x: -28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 },
  transition: { duration: 0.35, ease: defaultEase },
};

export const servicesDetailMotion = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.35, ease: defaultEase },
};

export const servicesDetailContentMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: defaultEase },
};

export const getServiceCardMotion = (index = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.35,
    delay: index * 0.05,
    ease: defaultEase,
  },
});

export const servicesTapFeedback = { scale: 0.97 };
