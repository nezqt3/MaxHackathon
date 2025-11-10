import Logo from "../static/nomissedaim.svg";

export default function StartScreen() {
  return (
    <div className="start-screen">
      <div className="start-screen__logo-div">
        <img className="start-screen__logo" src={Logo} alt="logo" />
      </div>

      <h1 className="start-screen__title">NoMissed</h1>
      <p className="start-screen__text">Сервисы для вашего вуза</p>

      <button className="start-screen__button">Продолжить</button>
    </div>
  );
}
