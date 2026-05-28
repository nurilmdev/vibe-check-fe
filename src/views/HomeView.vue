<script>
export default {
  name: 'HomeView',
};
</script>
<script setup>
import { ref, computed, onMounted } from 'vue';

// Import komponen Shadcn (Sekarang ada Input dan Button!)
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'vue-router';
import { Search, MapPin, X, AlertCircle, Sun, Moon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next';
import { inject } from 'vue';

const { isDark, toggleTheme } = inject('theme');

const router = useRouter();

const cafes = ref([]);
const isLoading = ref(true);
const searchQuery = ref(''); // Menyimpan teks yang diketik user
const isErrorApi = ref(false);

const limit = 10;
const skip = ref(0);
const hasMore = ref(true);

const isRequesting = ref(false);
const requestSuccess = ref(false);
const requestAreaSuccess = ref(false);
const rateLimitError = ref('');

const locationQuery = ref('');
const sortOrder = ref(''); // '' = no sort, 'desc' = terbanyak, 'asc' = tersedikit

// Computed: sorted cafes berdasarkan total_review_gmaps
const sortedCafes = computed(() => {
  if (!sortOrder.value) return cafes.value;
  return [...cafes.value].sort((a, b) => {
    console.log("masuk kondisi 2")
    const aVal = a.total_reviews_gmaps || 0;
    const bVal = b.total_reviews_gmaps || 0;
    return sortOrder.value === 'desc' ? bVal - aVal : aVal - bVal;
  });
});

const toggleSort = () => {
  console.log("toggle sort clicked")
  console.log(sortOrder.value)
  console.log(sortedCafes.value)
  if (sortOrder.value === '') sortOrder.value = 'desc';
  else if (sortOrder.value === 'desc') sortOrder.value = 'asc';
  else sortOrder.value = '';
};

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
      method: 'GET',
      headers: {
        // 🚨 INI ADALAH KUNCI UNTUK MELEWATI LAYAR NGROK
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
        'X-API-KEY': import.meta.env.VITE_API_KEY,
      },
    });

    if (response.status === 429) {
      rateLimitError.value =
        'Tunggu sebentar, Anda melakukan terlalu banyak request. Silakan coba lagi nanti.';
      throw new Error('Rate limited');
    }

    const result = await response.json();
    rateLimitError.value = ''; // Reset jika berhasil
    if (result.status === 'success') {
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
    console.error('Gagal mengambil data:', error);
  } finally {
    isLoading.value = false;
  }
};

const requestArea = async () => {
  if (!locationQuery.value) return;

  isRequesting.value = true;
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/request-area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Jika masih pakai ngrok
        'X-API-KEY': import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify({ area_name: locationQuery.value }),
    });

    if (response.status === 429) {
      rateLimitError.value =
        'Tunggu sebentar, Anda melakukan terlalu banyak request. Silakan coba lagi nanti.';
      throw new Error('Rate limited');
    }

    const result = await response.json();
    rateLimitError.value = ''; // Reset jika berhasil
    if (result.status === 'success') {
      requestAreaSuccess.value = true;
    }
  } catch (error) {
  } finally {
    isRequesting.value = false;
  }
};

const goToDetail = (id) => {
  router.push({ name: 'detail', params: { id } });
};

// Fungsi yang dipanggil saat user menekan tombol cari
const handleSearch = () => {
  fetchCafes(true);
  requestSuccess.value = false; // Reset status request saat melakukan pencarian baru
  console.log(requestSuccess.value);
};
const clearInput = () => {
  locationQuery.value = ''; // Manually clear the specific field
  handleSearch(); // Trigger search to refresh results
};

onMounted(() => {
  fetchCafes();
});
</script>

<template>
  <main class="min-h-screen bg-slate-50 dark:bg-gray-900 p-6 font-sans pb-20">
    <div class="max-w-2xl mx-auto mb-8 text-center">
      <h1
        class="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2"
      >
        ☕ Cafe Vibe Explorer
      </h1>
      <p class="text-slate-500 dark:text-gray-400">
        Temukan tempat WFH atau nongkrong terbaik berdasarkan analisis AI.
      </p>
    </div>
    <div class="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        >
          <MapPin class="h-4 w-4 text-slate-400 dark:text-gray-500" />
        </div>
        <Input
          v-model="locationQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Di area mana? (Cth: Kemang, Bandung)"
          class="pl-9 bg-white shadow-sm border-slate-200 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <Button
          v-if="locationQuery"
          type="button"
          variant="ghost"
          class="absolute right-2 top-2.5 h-4 w-4 p-0 dark:text-white"
          @click="clearInput"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="relative flex-1">
        <div
          class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        >
          <Search class="h-4 w-4 text-slate-400 dark:text-gray-500" />
        </div>
        <Input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Cari vibe... (wfh, skena, estetik)"
          class="pl-9 bg-white shadow-sm border-slate-200 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      <Button
        @click="handleSearch"
        class="bg-slate-900 text-white hover:bg-slate-800 px-8 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Cari
      </Button>

      <Button
        @click="toggleTheme"
        variant="outline"
        class="bg-white shadow-sm border-slate-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        <component :is="isDark ? Sun : Moon" class="h-4 w-4" />
      </Button>
    </div>

    <!-- Rate Limit Error Banner -->
    <div
      v-if="rateLimitError"
      class="max-w-2xl mx-auto mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
    >
      <AlertCircle class="h-5 w-5 flex-shrink-0" />
      <p class="text-sm font-medium">{{ rateLimitError }}</p>
    </div>

    <div
      v-if="isLoading && cafes.length === 0"
      class="max-w-2xl mx-auto space-y-4"
    >
      <div v-for="i in 5" :key="i">
        <div
          class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse dark:bg-gray-800 dark:border-gray-700"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <div
                class="h-6 bg-slate-200 rounded w-48 mb-2 dark:bg-gray-700"
              ></div>
              <div class="h-4 bg-slate-200 rounded w-32 dark:bg-gray-700"></div>
            </div>
            <div
              class="h-16 w-16 bg-slate-200 rounded-lg dark:bg-gray-700"
            ></div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <div class="h-5 bg-slate-200 rounded w-16 dark:bg-gray-700"></div>
            <div class="h-5 bg-slate-200 rounded w-20 dark:bg-gray-700"></div>
            <div class="h-5 bg-slate-200 rounded w-14 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="cafes.length === 0 && !isLoading && !isErrorApi"
      class="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-gray-800 dark:border-gray-700"
    >
      <div
        class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700"
      >
        <span class="text-2xl">🕵️‍♂️</span>
      </div>
      <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2">
        Area "{{ locationQuery }}"
        <span v-if="searchQuery != 0" class="dark:text-white"
          >dengan vibe "{{ searchQuery }}"</span
        >
        belum ada di database kami
      </h3>
      <p class="text-slate-500 dark:text-gray-400 mb-6 text-sm">
        Ingin AI kami melakukan scanning dan analisis vibe untuk area ini?
      </p>

      <div
        v-if="requestAreaSuccess"
        class="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm inline-block font-medium dark:bg-emerald-900 dark:text-emerald-300"
      >
        ✅ Berhasil masuk antrean! Cek terus secara berkala ya biar nggak
        ketinggalan update!.
      </div>

      <div v-else class="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          @click="requestArea"
          :disabled="isRequesting"
          class="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {{ isRequesting ? 'Mengirim Request...' : '✨ Request Area Ini' }}
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
          class="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          Tampilkan Semua Kafe
        </Button>
      </div>
    </div>
    <div
      v-else-if="!requestSuccess"
      class="max-w-2xl mx-auto text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-gray-800 dark:border-gray-700"
    >
      <p class="text-slate-800 dark:text-white mb-6 text-lg font-bold">
        Error Server API :(
      </p>
      <p class="text-slate-400 dark:text-gray-400 mb-6 text-sm font-normal">
        TF Developer dong biar bisa sewa server sendiri hehe
      </p>
    </div>

    <div v-else class="max-w-2xl mx-auto space-y-4">
      <!-- Sort Button -->
      <div class="flex items-center justify-end">
        <Button
          variant="outline"
          @click="toggleSort"
          class="gap-2 text-sm bg-white shadow-sm border-slate-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          <component
            :is="sortOrder === 'desc' ? ArrowDown : sortOrder === 'asc' ? ArrowUp : ArrowUpDown"
            class="h-4 w-4"
          />
          {{
            sortOrder === 'desc'
              ? 'Review Terbanyak'
              : sortOrder === 'asc'
                ? 'Review Tersedikit'
                : 'Urutkan Review'
          }}
        </Button>
      </div>

      <Card
        v-for="cafe in sortedCafes"
        :key="cafe.id"
        @click="goToDetail(cafe.id)"
        class="cursor-pointer transition-all hover:border-slate-400 hover:shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-500"
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
              <CardTitle class="text-xl font-semibold dark:text-white">{{
                cafe.name
              }}</CardTitle>
              <CardDescription
                v-if="cafe.rating"
                class="mt-1 flex items-center text-amber-600 dark:text-amber-400"
              >
                ★ {{ cafe.rating }} / 5.0
                <span
                  v-if="cafe.total_reviews_gmaps"
                  class="ml-2 text-slate-500 dark:text-gray-400"
                >
                  ({{ cafe.total_reviews_gmaps }} ulasan)
                </span>
              </CardDescription>
            </div>

            <div>
              <div class="text-right">
                <div v-if="cafe.sentiment_analytics != null">
                  <span
                    class="text-xs text-slate-500 block mb-1 dark:text-gray-400"
                    >Skor Sentimen</span
                  >
                  <span
                    class="text-lg font-bold"
                    :class="
                      cafe.sentiment_analytics >= 0.8
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-gray-300'
                    "
                  >
                    {{ Math.round(cafe.sentiment_analytics * 100) }}%
                  </span>
                </div>
                <div v-else>
                  <span
                    class="text-xs text-slate-600 block mb-2 dark:text-gray-400"
                    >Not Analyzed</span
                  >
                </div>

                <div
                  v-if="cafe.image_url"
                  class="flex-none overflow-hidden rounded-lg bg-slate-100 border border-slate-200 dark:bg-gray-700 dark:border-gray-600"
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
              class="bg-slate-300 text-slate-900 hover:bg-slate-200 font-normal dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
          class="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          {{ isLoading ? 'Memuat data baru...' : 'Tampilkan Lebih Banyak' }}
        </Button>
      </div>
    </div>
  </main>
</template>
