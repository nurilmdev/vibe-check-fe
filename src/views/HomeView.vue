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

const router = useRouter();

const cafes = ref([]);
const isLoading = ref(true);
const searchQuery = ref(""); // Menyimpan teks yang diketik user

const limit = 10;
const skip = ref(0);
const hasMore = ref(true);

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
    const url = `http://localhost:8000/api/cafes?limit=${limit}&skip=${skip.value}${searchQuery.value ? "&vibe=" + searchQuery.value : ""}`;

    const response = await fetch(url);
    const result = await response.json();
    // 🚨 SABUK PENGAMAN: Pastikan API sukses dan data benar-benar ada/berbentuk Array
    console.log("Response API:", result); // Debug: Lihat apa yang dikembalikan API
    if (result.status === "success" && Array.isArray(result.data)) {
      if (result.data.length < limit) {
        hasMore.value = false;
      }

      // Menggabungkan array dengan aman
      cafes.value = [...cafes.value, ...result.data];
      skip.value += limit;
    } else {
      // Jika API error (misal salah query SQL), tangkap di sini agar layar tidak putih
      console.error("API mengembalikan error:", result);
      hasMore.value = false;
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  } finally {
    isLoading.value = false;
  }
};

const goToDetail = (id) => {
  router.push({ name: "detail", params: { id } });
};

// Fungsi yang dipanggil saat user menekan tombol cari
const handleSearch = () => {
  fetchCafes(true);
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

    <div class="max-w-2xl mx-auto mb-8 flex gap-2">
      <Input
        v-model="searchQuery"
        @keyup.enter="handleSearch"
        type="text"
        placeholder="Cari vibe... (Cth: wfh, skena, kopi enak)"
        class="flex-1 bg-white shadow-sm border-slate-200"
      />
      <Button
        @click="handleSearch"
        class="bg-slate-900 text-white hover:bg-slate-800"
      >
        Cari
      </Button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-pulse flex flex-col items-center">
        <div class="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
        <div class="text-slate-400">Menganalisis data kafe...</div>
      </div>
    </div>

    <div
      v-else-if="cafes.length === 0"
      class="max-w-2xl mx-auto text-center py-20 bg-white rounded-xl border border-dashed border-slate-300"
    >
      <p class="text-slate-500 mb-4">
        Wah, sepertinya tidak ada kafe dengan vibe "{{ searchQuery }}"
      </p>
      <Button
        variant="outline"
        @click="
          () => {
            searchQuery = '';
            handleSearch();
          }
        "
      >
        Tampilkan Semua Kafe
      </Button>
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
              class="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal"
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
          {{ isLoading ? "Memuat..." : "Tampilkan Lebih Banyak" }}
        </Button>
      </div>
    </div>
  </main>
</template>
