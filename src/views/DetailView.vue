<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ChevronLeft,
  Filter,
  MessageSquare,
  Star,
  MapPin,
} from "lucide-vue-next";

// Import Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const route = useRoute();
const router = useRouter();
const cafeId = route.params.id;

// State Data
const cafe = ref(null);
const reviews = ref([]);
const isLoading = ref(true);
const isReviewsLoading = ref(false);

// State Filter
const selectedAspect = ref("all");
const selectedSentiment = ref("all");
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// 1. Fetch Detail Kafe (Bisa menggunakan endpoint list dengan filter ID atau buat endpoint baru)
const fetchCafeDetail = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/cafes/${cafeId}`, {
      method: "GET",
      headers: {
        // 🚨 INI ADALAH KUNCI UNTUK MELEWATI LAYAR NGROK
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    cafe.value = result.data;
  } catch (error) {
    console.error("Gagal ambil detail:", error);
  }
};

// 2. Fetch Ulasan dengan Filter Pintar
const fetchReviews = async () => {
  isReviewsLoading.value = true;
  try {
    let url = `${baseUrl}/api/cafes/${cafeId}/reviews?limit=10`;

    // Tambahkan parameter jika filter aktif
    if (selectedAspect.value !== "all" && selectedSentiment.value !== "all") {
      url += `&aspect=${selectedAspect.value}&sentiment=${selectedSentiment.value}`;
    } else if (selectedSentiment.value !== "all") {
      url += `&sentiment=${selectedSentiment.value}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        // 🚨 INI ADALAH KUNCI UNTUK MELEWATI LAYAR NGROK
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    reviews.value = result.data;
  } catch (error) {
    console.error("Gagal ambil ulasan:", error);
  } finally {
    isReviewsLoading.value = false;
  }
};

// Pantau perubahan filter untuk fetch ulang ulasan secara otomatis
watch([selectedAspect, selectedSentiment], () => {
  fetchReviews();
});

const openGoogleMaps = (url) => {
  if (!url) return;

  // Pastikan URL memiliki protokol https:// agar browser tidak bingung
  const finalUrl = url.startsWith("http") ? url : `https://${url}`;

  // Buka di tab baru (_blank) dengan parameter keamanan standar
  window.open(finalUrl, "_blank", "noopener,noreferrer");
};

onMounted(async () => {
  await fetchCafeDetail();
  await fetchReviews();
  isLoading.value = false;
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-10">
    <nav
      class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4"
    >
      <div class="max-w-2xl mx-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <h1 class="font-semibold text-lg truncate" v-if="cafe">
          {{ cafe.name }}
        </h1>
      </div>
    </nav>

    <main class="max-w-2xl mx-auto p-4 space-y-6" v-if="!isLoading && cafe">
      <section
        class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-3xl font-bold text-slate-900">{{ cafe.name }}</h2>
            <div class="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                class="text-amber-600 border-amber-200 bg-amber-50"
              >
                ★ {{ cafe.rating }}
              </Badge>
              <Badge
                class="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"
              >
                {{ Math.round(cafe.sentiment_analytics * 100) }}% Positif (AI)
              </Badge>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <Button
            v-if="cafe.google_maps_url"
            @click="openGoogleMaps(cafe.google_maps_url)"
            class="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <MapPin class="h-4 w-4" />
            Buka di Google Maps
          </Button>

          <Button variant="outline" @click="shareCafe"> Bagikan </Button>
        </div>

        <div class="flex flex-wrap gap-2 mt-4">
          <Badge v-for="tag in cafe.vibe_tags" :key="tag" variant="secondary">
            {{ tag }}
          </Badge>
        </div>
      </section>

      <Separator />

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <MessageSquare class="h-5 w-5 text-slate-400" />
            Ulasan Pintar
          </h3>
          <div class="flex gap-2">
            <Select v-model="selectedAspect">
              <SelectTrigger class="w-[140px] h-8 text-xs bg-white">
                <SelectValue placeholder="Semua Aspek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aspek</SelectItem>
                <SelectItem value="fasilitas_kerja">Fasilitas Kerja</SelectItem>
                <SelectItem value="kopi_dan_makanan">Menu & Kopi</SelectItem>
                <SelectItem value="suasana">Suasana</SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="selectedSentiment">
              <SelectTrigger class="w-[120px] h-8 text-xs bg-white">
                <SelectValue placeholder="Sentimen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="positif">Positif</SelectItem>
                <SelectItem value="negatif">Negatif</SelectItem>
                <SelectItem value="netral">Netral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-if="isReviewsLoading" class="space-y-4 animate-pulse">
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 bg-slate-200 rounded-xl"
          ></div>
        </div>

        <div v-else-if="reviews.length > 0" class="space-y-3">
          <Card
            v-for="rev in reviews"
            :key="rev.review_id"
            class="border-slate-200 shadow-none"
          >
            <CardContent class="p-4">
              <div class="flex justify-between items-start mb-2">
                <Badge
                  :class="
                    rev.ai_sentiment_score >= 0.7
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  "
                  class="text-[10px] uppercase border-none"
                >
                  {{
                    rev.ai_sentiment_score >= 0.7
                      ? "Direkomendasikan"
                      : "Kritik"
                  }}
                </Badge>
                <span class="text-[10px] text-slate-400 font-mono">{{
                  rev.review_id.substring(0, 8)
                }}</span>
              </div>
              <p
                class="text-slate-800 text-sm leading-relaxed italic font-semibold"
              >
                "{{ rev.ai_summary }}"
              </p>

              <div class="mt-3 flex gap-1">
                <div v-for="(val, key) in rev.ai_aspects" :key="key">
                  <Badge
                    v-if="val !== 'tidak_disebutkan'"
                    variant="outline"
                    class="text-[12px] py-0 px-1 opacity-70"
                  >
                    {{ key.replaceAll("_", " ") }}: {{ val }}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          v-else
          class="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300"
        >
          <p class="text-slate-400 text-sm">
            Tidak ditemukan ulasan untuk kriteria ini.
          </p>
        </div>
      </section>
    </main>

    <div v-else-if="isLoading" class="p-10 text-center text-slate-400">
      Memuat profil kafe...
    </div>
  </div>
</template>
