import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { RecoilRoot } from "recoil";
import { DurationContextProvider } from "./context/DurationContext.jsx";
import { MarkContextProvider } from "./context/MarkContext.jsx";
import { ExamContextProvider } from "./context/ExamContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <RecoilRoot>
      <AuthContextProvider>
        <DurationContextProvider>
          <MarkContextProvider>
            <ExamContextProvider>
              <App />
            </ExamContextProvider>
          </MarkContextProvider>
        </DurationContextProvider>
      </AuthContextProvider>
    </RecoilRoot>
  </BrowserRouter>,
);

// PWA service worker — production only, so the dev server (npm run dev)
// never has to deal with a service worker caching its own hot-reloaded
// files. Registered after the page has loaded so it never competes with
// or delays the initial render.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
