import { ref, computed } from 'vue'

const locale = ref('vi')

const messages = {
  vi: {
    appName: 'BÉ ƠI ĂN GÌ',
    title: 'Bé ơi ăn gì?',
    subtitle: 'Quay để tìm quán ngon nào ✨',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tên quán, món ăn...',
    district: 'Khu vực',
    allDistricts: 'Tất cả khu vực',
    foodType: 'Loại món',
    allTypes: 'Tất cả loại món',
    nearby: 'Quán gần đây',
    map: 'Bản đồ',
    challenge: 'Thử thách',
    spin: 'Quay ngay',
    spinning: 'Đang quay...',
    loading: 'Đang tải...',
    freeSpins: 'lượt quay miễn phí',
    loginToSpin: 'Đăng nhập để nhận thêm',
    noSpins: 'Hết lượt quay',
    remaining: 'Còn',
    of: '/',
    result: 'Kết quả quay',
    dish: 'Món',
    price: 'Giá',
    directions: 'Chỉ đường',
    share: 'Chia sẻ',
    confirm: 'Chốt luôn!',
    favorite: 'Yêu thích',
    favorites: 'Nhà hàng yêu thích',
    noFavorites: 'Chưa có nhà hàng yêu thích',
    noFavoritesHint: 'Nhấn ❤️ trên kết quả quay để lưu',
    stats: 'Thống kê',
    totalSpins: 'Lượt quay',
    saved: 'Đã lưu',
    favorited: 'Yêu thích',
    topFoodTypes: 'Loại hay quay',
    history: 'Lịch sử quay',
    noHistory: 'Chưa có lịch sử quay',
    clearAll: 'Xóa tất cả',
    dailyChallenge: 'Thử thách hôm nay',
    weeklyChallenge: 'Thử thách tuần',
    spin3times: 'Quay 3 lần để hoàn thành!',
    dayProgress: 'lượt quay',
    completed: 'Hoàn thành!',
    close: 'Đóng',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    loginDesc: 'Đăng nhập để nhận thêm lượt quay!',
    registerDesc: 'Tạo tài khoản để nhận 10 lượt quay miễn phí',
    or: 'hoặc',
    loginGoogle: 'Đăng nhập bằng Google',
    name: 'Họ tên',
    namePlaceholder: 'Nguyễn Văn A',
    email: 'Email',
    emailPlaceholder: 'email@example.com',
    password: 'Mật khẩu',
    passwordPlaceholder: 'Ít nhất 6 ký tự',
    processing: 'Đang xử lý...',
    noAccount: 'Chưa có tài khoản?',
    hasAccount: 'Đã có tài khoản?',
    registerNow: 'Đăng ký ngay',
    loginNow: 'Đăng nhập',
    noSpinsTitle: 'Hết lượt quay rồi!',
    noSpinsDesc: 'Bạn đã sử dụng hết lượt quay miễn phí. Hãy donate để nhận thêm nhé!',
    donateMoMo: 'Donate qua MoMo',
    donateNow: 'Donate ngay',
    donateDesc: 'Mỗi donate = 10 lượt quay thêm 🎰',
    mapTitle: 'Bản đồ quán ăn',
    mapHint: 'Nhấn marker để xem chi tiết',
    nearbyTitle: 'Quán gần bạn',
    noNearby: 'Không tìm thấy quán gần đây',
    leaderboard: 'Bảng xếp hạng',
    rank: 'Hạng',
    score: 'Điểm',
    noLeaderboard: 'Chưa có dữ liệu',
    today: 'Hôm nay',
    thisWeek: 'Tuần này',
    daysOfWeek: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    before: 'Trước đây thuộc',
    copied: 'Đã copy vào clipboard!',
  },
  en: {
    appName: 'BABY WHAT TO EAT',
    title: 'Baby, what to eat?',
    subtitle: 'Spin to find a great restaurant ✨',
    search: 'Search',
    searchPlaceholder: 'Restaurant name, dish...',
    district: 'District',
    allDistricts: 'All districts',
    foodType: 'Food type',
    allTypes: 'All food types',
    nearby: 'Nearby',
    map: 'Map',
    challenge: 'Challenge',
    spin: 'SPIN NOW',
    spinning: 'Spinning...',
    loading: 'Loading...',
    freeSpins: 'free spins',
    loginToSpin: 'Login for more',
    noSpins: 'No spins left',
    remaining: 'Remaining',
    of: '/',
    result: 'Spin Result',
    dish: 'Dish',
    price: 'Price',
    directions: 'Directions',
    share: 'Share',
    confirm: 'Let\'s go!',
    favorite: 'Favorite',
    favorites: 'Favorite Restaurants',
    noFavorites: 'No favorite restaurants yet',
    noFavoritesHint: 'Tap ❤️ on results to save',
    stats: 'Statistics',
    totalSpins: 'Total Spins',
    saved: 'Saved',
    favorited: 'Favorites',
    topFoodTypes: 'Most Spun Types',
    history: 'Spin History',
    noHistory: 'No spin history yet',
    clearAll: 'Clear All',
    dailyChallenge: 'Daily Challenge',
    weeklyChallenge: 'Weekly Challenge',
    spin3times: 'Spin 3 times to complete!',
    dayProgress: 'spins',
    completed: 'Completed!',
    close: 'Close',
    login: 'Login',
    register: 'Register',
    loginDesc: 'Login to get more spins!',
    registerDesc: 'Create an account for 10 free spins',
    or: 'or',
    loginGoogle: 'Login with Google',
    name: 'Full Name',
    namePlaceholder: 'John Doe',
    email: 'Email',
    emailPlaceholder: 'email@example.com',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    processing: 'Processing...',
    noAccount: 'Don\'t have an account?',
    hasAccount: 'Already have an account?',
    registerNow: 'Register now',
    loginNow: 'Login',
    noSpinsTitle: 'Out of spins!',
    noSpinsDesc: 'You\'ve used all free spins. Donate to get more!',
    donateMoMo: 'Donate via MoMo',
    donateNow: 'Donate Now',
    donateDesc: 'Each donation = 10 extra spins 🎰',
    mapTitle: 'Restaurant Map',
    mapHint: 'Tap markers for details',
    nearbyTitle: 'Nearby Restaurants',
    noNearby: 'No restaurants found nearby',
    leaderboard: 'Leaderboard',
    rank: 'Rank',
    score: 'Score',
    noLeaderboard: 'No data yet',
    today: 'Today',
    thisWeek: 'This Week',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    before: 'Previously in',
    copied: 'Copied to clipboard!',
  }
}

function setLocale(lang) {
  locale.value = lang
  localStorage.setItem('be-oi-locale', lang)
  document.documentElement.lang = lang
}

function toggleLocale() {
  setLocale(locale.value === 'vi' ? 'en' : 'vi')
}

function loadLocale() {
  try {
    const saved = localStorage.getItem('be-oi-locale')
    if (saved && (saved === 'vi' || saved === 'en')) {
      locale.value = saved
    }
  } catch {
    locale.value = 'vi'
  }
}

const t = computed(() => messages[locale.value] || messages.vi)

export function useI18n() {
  loadLocale()

  return {
    locale,
    t,
    setLocale,
    toggleLocale
  }
}
