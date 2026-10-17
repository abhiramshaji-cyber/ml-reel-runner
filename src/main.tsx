import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReelRunner from "./demo/ReelRunner";
import "./theme.css";
import "./styles.css";

const NOTES_URL =
  "https://github.com/abhiramshaji-cyber/ml-reel-runner#how-it-works";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="page">
      <header className="masthead">
        <h1>
          <span className="title">Reel runner</span>
          <span className="tagline">
            a Q-learning agent learns to catch the reel, live
          </span>
        </h1>
        <a className="notes-link" href={NOTES_URL}>
          How it works <span aria-hidden="true">→</span>
        </a>
      </header>
      <ReelRunner />
    </main>
  </StrictMode>,
);
