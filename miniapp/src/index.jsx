import { createRoot } from "react-dom/client";
// import { MaxUI } from "@maxhub/max-ui";
import "@maxhub/max-ui/dist/styles.css";
import App from "./App.jsx";
import { UniversityProvider } from "./context/UniversityContext.jsx";

const Root = () => (
  // <MaxUI>
  <UniversityProvider>
    <App />
  </UniversityProvider>
  /* </MaxUI> */
);

createRoot(document.getElementById("root")).render(<Root />);
