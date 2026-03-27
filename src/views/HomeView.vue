<script setup>
import { ref, computed } from 'vue';
import { database } from '../data/database.js';
import { DISTRICT_CATEGORIES, CATEGORY_NAMES } from '../data/districts.js';
import { Icon } from '@iconify/vue';

const selectedCategory = ref('ALL');
const searchQuery = ref('');

const categories = [
  { id: 'ALL', name: 'Tất cả' },
  ...Object.entries(CATEGORY_NAMES).map(([id, name]) => ({ id, name }))
];

const filteredDatabase = computed(() => {
  return database.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.dish.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.dist.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    if (selectedCategory.value === 'ALL') return matchesSearch;
    
    const categoryDistricts = DISTRICT_CATEGORIES[selectedCategory.value];
    
    // Handle "Toàn Thành Phố" as a special case or check if it matches explicitly
    if (selectedCategory.value === 'KHAC' && item.dist === 'Toàn Thành Phố') return matchesSearch;
    
    return categoryDistricts.includes(item.dist) && matchesSearch;
  });
});

const getTypeColor = (type) => {
  const colors = {
    'Cơm': 'bg-amber-500/20 text-amber-500 border-amber-500/50',
    'Bánh mì': 'bg-orange-500/20 text-orange-500 border-orange-500/50',
    'Lẩu': 'bg-red-500/20 text-red-500 border-red-500/50',
    'Món nước': 'bg-sky-500/20 text-sky-500 border-sky-500/50',
    'Ăn vặt': 'bg-pink-500/20 text-pink-500 border-pink-500/50',
    'Quán nước': 'bg-teal-500/20 text-teal-500 border-teal-500/50',
    'Sang choảnh': 'bg-purple-500/20 text-purple-500 border-purple-500/50',
  };
  return colors[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/50';
};
</script>

<template>
  <div class="min-height-screen bg-slate-950 text-slate-200 font-sans pb-12">
    <!-- Header Section -->
    <header class="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 py-6 md:px-8">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
            Bé Ơi Ăn Gì?
          </h1>
          <p class="text-slate-400 mt-1 font-body">Khám phá thiên đường ẩm thực Sài Gòn và hơn thế nữa</p>
        </div>

        <div class="relative group max-w-md w-full">
          <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-sky-400 transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Tìm món ngon, quán ăn, khu vực..." 
            class="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all placeholder:text-slate-600"
          >
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="max-w-7xl mx-auto mt-8 overflow-x-auto no-scrollbar pb-2">
        <div class="flex gap-3 min-w-max">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            @click="selectedCategory = cat.id"
            class="px-5 py-2.5 rounded-xl border transition-all font-medium text-sm flex items-center gap-2"
            :class="selectedCategory === cat.id 
              ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-500/20' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'"
          >
            {{ cat.name }}
            <span class="opacity-40 text-xs" v-if="cat.id === 'ALL'">({{ database.length }})</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Content Grid -->
    <main class="max-w-7xl mx-auto px-4 mt-8 md:px-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-slate-400 font-medium flex items-center gap-2">
          <Icon icon="mdi:format-list-bulleted" />
          Hiển thị <span class="text-slate-100 font-bold font-display uppercase tracking-widest">{{ filteredDatabase.length }}</span> địa điểm
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="(item, index) in filteredDatabase" 
          :key="index"
          class="group bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden hover:border-slate-700 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/5"
        >
          <div class="p-6 h-full flex flex-col">
            <!-- Badges -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" :class="getTypeColor(item.type)">
                {{ item.type }}
              </span>
              <span class="px-3 py-1 rounded-full bg-slate-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-700/50">
                {{ item.dist }}
              </span>
            </div>

            <!-- Title & Dish -->
            <div class="flex-grow">
              <h3 class="text-xl font-display font-semibold text-slate-100 group-hover:text-sky-400 transition-colors leading-tight mb-2">
                {{ item.name }}
              </h3>
              <p class="text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
                <Icon icon="mdi:silverware-fork-knife" class="text-sky-500" />
                {{ item.dish }}
              </p>
            </div>

            <!-- Details Section -->
            <div class="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
              <div class="flex items-start gap-3">
                <Icon icon="mdi:map-marker" class="text-slate-500 mt-1 shrink-0" />
                <span class="text-slate-300 text-sm leading-relaxed">{{ item.addr }}</span>
              </div>
              
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-slate-500">
                  <Icon icon="mdi:clock-outline" />
                  <span class="text-[12px] font-medium">{{ item.time }}</span>
                </div>
                <div class="flex items-center gap-2 text-emerald-500/90 font-display font-bold">
                  <Icon icon="mdi:tag-outline" />
                  <span class="text-[12px] truncate max-w-[80px]">{{ item.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredDatabase.length === 0" class="py-24 flex flex-col items-center text-center">
        <Icon icon="mdi:food-off" class="text-6xl text-slate-800 mb-4" />
        <h3 class="text-xl text-slate-300 font-display font-bold">Không tìm thấy quán nào</h3>
        <p class="text-slate-500 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm nhé!</p>
        <button @click="searchQuery = ''; selectedCategory = 'ALL'" class="mt-6 text-sky-400 hover:text-sky-300 font-medium underline underline-offset-4 decoration-sky-400/30 transition-all">
          Xóa tất cả bộ lọc
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="mt-20 border-t border-slate-900 pt-12 text-center text-slate-600 text-sm">
      <p>© 2026 Bé Ơi Ăn Gì. Build with ❤️ in Sài Gòn.</p>
    </footer>
  </div>
</template>

<style scoped>
.font-display { font-family: 'Outfit', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
