import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import DetailView from "../views/DetailView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/cafe/:id",
      name: "detail",
      component: DetailView,
    },
  ],
  // ✨ TAMBAHKAN FUNGSI INI ✨
  scrollBehavior(to, from, savedPosition) {
    // Jika ada posisi yang tersimpan (saat user klik tombol 'Back' di browser/HP)
    if (savedPosition) {
      return savedPosition;
    }
    // Jika tidak ada (user klik link baru), mulai dari paling atas
    else {
      return { top: 0 };
    }
  },
});

export default router;
