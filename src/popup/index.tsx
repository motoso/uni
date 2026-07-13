import * as React from "preact/compat";
import { createRoot } from "preact/compat/client";
import Popup from "./Popup";

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(<Popup />);
});
