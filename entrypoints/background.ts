import { registerBackgroundListeners } from "../src/eventPage";

export default defineBackground(() => {
  registerBackgroundListeners();
});
