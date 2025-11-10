import Logo from "../static/nomissedaim.svg";
import { motion } from "motion/react";
import { screenFade, logoRotation, buttonAnim } from "../../src/animations/StartScreenAnim.jsx";

export default function StartScreen() {
  return (
    <motion.div {...screenFade} className="start-screen">
      <div className="start-screen__logo-div">
        <motion.img
          {...logoRotation}
          className="start-screen__logo"
          src={Logo}
          alt="logo"
        />
      </div>

      <h1 className="start-screen__title">NoMissed</h1>
      <p className="start-screen__text">Сервисы для вашего вуза</p>

      <motion.button
        {...buttonAnim}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="start-screen__button"
      >
        Продолжить
      </motion.button>
    </motion.div>
  );
}
