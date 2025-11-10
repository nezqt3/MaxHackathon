import { useState } from "react";
import StartScreen from "./components/StartScreen";
import MenuBar, { MENU_ITEMS } from "./components/MenuBar";
import ScheduleScreen from "./components/screens/ScheduleScreen";
import ServicesScreen from "./components/screens/ServicesScreen";
import NewsScreen from "./components/screens/NewsScreen";
import ProjectsScreen from "./components/screens/ProjectsScreen";
import AccountScreen from "./components/screens/AccountScreen";
import "./styles/main.scss";

const SCREEN_COMPONENTS = {
  schedule: ScheduleScreen,
  services: ServicesScreen,
  news: NewsScreen,
  projects: ProjectsScreen,
  account: AccountScreen,
};

const App = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [activeScreen, setActiveScreen] = useState(MENU_ITEMS[0].key);

  if (!isStarted) {
    return <StartScreen onContinue={() => setIsStarted(true)} />;
  }

  const ActiveScreen = SCREEN_COMPONENTS[activeScreen] ?? ScheduleScreen;

  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <ActiveScreen />
      </main>
      <MenuBar activeItem={activeScreen} onChange={setActiveScreen} />
    </div>
  );
};

export default App;
