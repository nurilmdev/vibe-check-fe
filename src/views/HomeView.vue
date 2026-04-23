<script>
export default {
  name: "HomeView",
};
</script>
<script setup>
import { ref, onMounted } from "vue";

// Import komponen Shadcn (Sekarang ada Input dan Button!)
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "vue-router";
import { Search, MapPin, X, AlertCircle } from "lucide-vue-next";

const router = useRouter();

const cafes = ref([]);
const isLoading = ref(true);
const searchQuery = ref(""); // Menyimpan teks yang diketik user
const isErrorApi = ref(false);

const limit = 10;
const skip = ref(0);
const hasMore = ref(true);

const isRequesting = ref(false);
const requestSuccess = ref(false);

const locationQuery = ref("");

// Fungsi fetch sekarang menerima parameter 'vibe'
const fetchCafes = async (reset = false) => {
  if (reset) {
    skip.value = 0;
    cafes.value = [];
    hasMore.value = true;
  }
  isLoading.value = true; // Set loading ke true setiap kali mulai mencari

  try {
    // Susun URL secara dinamis. Jika ada vibe, tambahkan parameternya
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    let url = `${baseUrl}/api/cafes?limit=${limit}&skip=${skip.value}`;
    if (searchQuery.value) url += `&vibe=${searchQuery.value}`;
    if (locationQuery.value) url += `&location=${locationQuery.value}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        // 🚨 INI ADALAH KUNCI UNTUK MELEWATI LAYAR NGROK
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (result.status === "success") {
      requestSuccess.value = true;
    }
    let finalArray = [];
    if (Array.isArray(result.data)) {
      finalArray = result.data;
    } else if (result.data && Array.isArray(result.data.data)) {
      finalArray = result.data.data;
    }

    if (
      finalArray.length > 0 ||
      (finalArray.length === 0 && skip.value === 0)
    ) {
      if (finalArray.length < limit) hasMore.value = false;
      cafes.value = [...cafes.value, ...finalArray];
      skip.value += limit;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    isErrorApi.value = true;
    console.error("Gagal mengambil data:", error);
  } finally {
    isLoading.value = false;
  }
};

const requestArea = async () => {
  if (!locationQuery.value) return;

  isRequesting.value = true;
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/request-area`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // Jika masih pakai ngrok
      },
      body: JSON.stringify({ area_name: locationQuery.value }),
    });

    const result = await response.json();
    if (result.status === "success") {
      requestSuccess.value = true;
    }
  } catch (error) {
    console.error("Gagal request area:", error);
  } finally {
    isRequesting.value = false;
  }
};

const goToDetail = (id) => {
  router.push({ name: "detail", params: { id } });
};

// Fungsi yang dipanggil saat user menekan tombol cari
const handleSearch = () => {
  fetchCafes(true);
  requestSuccess.value = false; // Reset status request saat melakukan pencarian baru
};
const clearInput = () => {
  locationQuery.value = ""; // Manually clear the specific field
  handleSearch(); // Trigger search to refresh results
};

onMounted(() => {
  fetchCafes();
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 p-6 font-sans pb-20">
    <div class="max-w-2xl mx-auto mb-8 text-center">
      <h1 class="text-4xl font-bold tracking-tight text-slate-900 mb-2">
        ☕ Cafe Vibe Explorer
      </h1>
      <p class="text-slate-500">
        Temukan tempat WFH atau nongkrong terbaik berdasarkan analisis AI.
      </p>
    </div>
    <div class="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        >
          <MapPin class="h-4 w-4 text-slate-400" />
        </div>
        <Input
          v-model="locationQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Di area mana? (Cth: Kemang, Bandung)"
          class="pl-9 bg-white shadow-sm border-slate-200 w-full"
        />
        <Button
          v-if="locationQuery"
          type="button"
          variant="ghost"
          class="absolute right-2 top-2.5 h-4 w-4 p-0"
          @click="clearInput"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        >
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <Input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Cari vibe... (wfh, skena, estetik)"
          class="pl-9 bg-white shadow-sm border-slate-200 w-full"
        />
      </div>

      <Button
        @click="handleSearch"
        class="bg-slate-900 text-white hover:bg-slate-800 px-8"
      >
        Cari
      </Button>
    </div>

    <div
      v-if="isLoading && cafes.length === 0"
      class="flex justify-center items-center py-20"
    >
      <div class="animate-pulse flex flex-col items-center">
        <div class="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
        <div class="text-slate-400">Menganalisis data kafe...</div>
      </div>
    </div>

    <div
      v-else-if="cafes.length === 0 && !isLoading && !isErrorApi"
      class="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm"
    >
      <div
        class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="text-2xl">🕵️‍♂️</span>
      </div>
      <h3 class="text-lg font-bold text-slate-800 mb-2">
        Area "{{ locationQuery }}"
        <span v-if="searchQuery != 0">dengan vibe "{{ searchQuery }}"</span>
        belum ada di database kami
      </h3>
      <p class="text-slate-500 mb-6 text-sm">
        Ingin AI kami melakukan scanning dan analisis vibe untuk area ini?
      </p>

      <div
        v-if="requestSuccess"
        class="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm inline-block font-medium"
      >
        ✅ Berhasil masuk antrean! Cek terus secara berkala ya biar nggak
        ketinggalan update!.
      </div>

      <div v-else class="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          @click="requestArea"
          :disabled="isRequesting"
          class="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {{ isRequesting ? "Mengirim Request..." : "✨ Request Area Ini" }}
        </Button>
        <Button
          variant="outline"
          @click="
            () => {
              searchQuery = '';
              locationQuery = '';
              fetchCafes(true);
            }
          "
        >
          Tampilkan Semua Kafe
        </Button>
      </div>
    </div>
    <div
      v-else-if="!requestSuccess"
      class="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm"
    >
      <p class="text-slate-800 mb-6 text-lg font-bold">Error Server API :(</p>
      <p class="text-slate-400 mb-6 text-sm font-normal">
        TF Developer dong biar bisa sewa server sendiri hehe
      </p>
    </div>

    <div v-else class="max-w-2xl mx-auto space-y-4">
      <Card
        v-for="cafe in cafes"
        :key="cafe.id"
        @click="goToDetail(cafe.id)"
        class="cursor-pointer transition-all hover:border-slate-400 hover:shadow-lg bg-white"
      >
        <!-- <div
          v-if="cafe.image_url"
          class="h-48 w-full overflow-hidden bg-slate-200"
        >
          <img
            :src="cafe.image_url"
            class="w-16 h-16 object-cover transition-transform group-hover:scale-105"
          />
        </div> -->
        <CardHeader class="pb-3">
          <div class="flex justify-between items-start">
            <div>
              <CardTitle class="text-xl font-semibold">{{
                cafe.name
              }}</CardTitle>
              <CardDescription
                v-if="cafe.rating"
                class="mt-1 flex items-center text-amber-600"
              >
                ★ {{ cafe.rating }} / 5.0
              </CardDescription>
            </div>

            <div>
              <div class="text-right">
                <div v-if="cafe.sentiment_analytics != null">
                  <span class="text-xs text-slate-500 block mb-1"
                    >Skor Sentimen</span
                  >
                  <span
                    class="text-lg font-bold"
                    :class="
                      cafe.sentiment_analytics >= 0.8
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    "
                  >
                    {{ Math.round(cafe.sentiment_analytics * 100) }}%
                  </span>
                </div>
                <div v-else>
                  <span class="text-xs text-slate-600 block mb-2"
                    >Not Analyzed</span
                  >
                </div>

                <div
                  v-if="cafe.image_url"
                  class="flex-none overflow-hidden rounded-lg bg-slate-100 border border-slate-200"
                  style="width: 111px; height: 84px"
                >
                  <img
                    :src="cafe.image_url"
                    class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="tag in cafe.vibe_tags"
              :key="tag"
              variant="secondary"
              class="bg-slate-300 text-slate-900 hover:bg-slate-200 font-normal"
            >
              {{ tag }}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div v-if="hasMore" class="flex justify-center pt-6">
        <Button
          variant="outline"
          @click="fetchCafes(false)"
          :disabled="isLoading"
        >
          {{ isLoading ? "Memuat data baru..." : "Tampilkan Lebih Banyak" }}
        </Button>
      </div>
    </div>
  </main>
</template>
