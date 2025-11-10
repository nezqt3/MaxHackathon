// src/animations/StartScreenAnim.js
export const screenFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay: 1 },
};

export const logoRotation = {
  initial: { rotate: -50 },
  animate: { rotate: 0 },
  transition: { duration: 0.6, delay: 1.1, ease: [0, 0.3, 0.2, 1.01] },
};

export const buttonAnim = {
  initial: { scale: 0 },
  animate: { scale: 1 },
};
