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
