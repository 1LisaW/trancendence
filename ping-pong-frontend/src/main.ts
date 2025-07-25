import { getTheme } from "./utils/tools";
import { dictionary, DictionaryType } from "./lang/dictionary";
// import earcut from "earcut";
// import * as earcut from "earcut";
// (window as any).earcut = earcut;
// import "./router/router";

import './style.css';
import { SPA } from "./pages/SPA/SPA";

const initSPA = (parent: HTMLElement | null, dictionary: DictionaryType) => {
  if (!parent) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = getTheme() || 'light';
  wrapper.id = 'app';
  wrapper.classList.add("h-[100%]");
  parent.appendChild(wrapper);
  const SPAI = new SPA(wrapper, dictionary);
  window.addEventListener('popstate', function(event) {
    SPAI.update();
    console.log('History state change:', event.state);
  });
  // window.addEventListener('beforeunload', function (event) {
  //   const message = 'Are you sure you want to leave? Your changes may not be saved.';
  //   event.returnValue = message; // For most browsers
  //   return message; // For some older browsers
  // });
}

const bodyElement: HTMLElement | null = document.querySelector('body');
initSPA(bodyElement, dictionary);


