import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // Tambahkan ini
import "./index.css";

const app = createApp(App);
app.use(router); // Tambahkan ini
app.mount("#app");
