import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "assets/style.css";
import "assets/index.scss";

const pinia = createPinia();

createApp(App).use(pinia).mount("#app");
