import { getTheme } from "./utils/tools";
import { dictionary, DictionaryType } from "./lang/dictionary";
import './style.css';
import { SPA } from "./pages/SPA/SPA";

const initSPA = (parent: HTMLElement | null, dictionary: DictionaryType) => {
  if (!parent) return;

  const wrapper = document.createElement("div");
  wrapper.id = "app";

  wrapper.className = `
    ${getTheme() || "light"}
    min-h-screen
    w-full
    flex
    flex-col
    justify-between
    bg-[var(--color-fill)]
    text-[var(--color-text-base)]
  `;

  parent.appendChild(wrapper);

  const SPAI = new SPA(wrapper, dictionary);

  window.addEventListener("popstate", function (event) {
    SPAI.update();
    console.log("History state change:", event.state);
  });

  window.addEventListener("beforeunload", function (event) {
    const message =
      "Are you sure you want to leave? Your changes may not be saved.";
    event.returnValue = message;
    return message;
  });
};

const bodyElement: HTMLElement | null = document.querySelector("body");
initSPA(bodyElement, dictionary);
