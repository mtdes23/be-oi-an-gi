import { ref, computed } from 'vue'

const currentUser = ref(null)
const FREE_SPINS = 10

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem('be-oi-users') || '{}')
  } catch { return {} }
}

function saveUsers(users) {
  localStorage.setItem('be-oi-users', JSON.stringify(users))
}

function initAuth() {
  const saved = localStorage.getItem('be-oi-current-user')
  if (saved) {
    currentUser.value = JSON.parse(saved)
  }
}

function register(name, phone, password) {
  const users = loadUsers()
  const key = phone.trim()
  if (users[key]) return { ok: false, msg: 'Số điện thoại đã được đăng ký' }
  if (!name.trim() || !phone.trim() || !password.trim()) return { ok: false, msg: 'Vui lòng nhập đầy đủ thông tin' }
  if (password.length < 4) return { ok: false, msg: 'Mật khẩu phải có ít nhất 4 ký tự' }

  users[key] = {
    name: name.trim(),
    phone: phone.trim(),
    password,
    spinsLeft: FREE_SPINS,
    totalSpins: 0,
    createdAt: Date.now()
  }
  saveUsers(users)
  currentUser.value = { ...users[key], phone: key }
  localStorage.setItem('be-oi-current-user', JSON.stringify(currentUser.value))
  return { ok: true }
}

function login(phone, password) {
  const users = loadUsers()
  const key = phone.trim()
  if (!users[key]) return { ok: false, msg: 'Tài khoản không tồn tại' }
  if (users[key].password !== password) return { ok: false, msg: 'Sai mật khẩu' }

  currentUser.value = { ...users[key], phone: key }
  localStorage.setItem('be-oi-current-user', JSON.stringify(currentUser.value))
  return { ok: true }
}

function logout() {
  currentUser.value = null
  localStorage.removeItem('be-oi-current-user')
}

function useSpin() {
  if (!currentUser.value) return false
  if (currentUser.value.spinsLeft <= 0) return false

  currentUser.value.spinsLeft--
  currentUser.value.totalSpins++

  const users = loadUsers()
  users[currentUser.value.phone].spinsLeft = currentUser.value.spinsLeft
  users[currentUser.value.phone].totalSpins = currentUser.value.totalSpins
  saveUsers(users)
  localStorage.setItem('be-oi-current-user', JSON.stringify(currentUser.value))
  return true
}

function canSpin() {
  return currentUser.value && currentUser.value.spinsLeft > 0
}

const isLoggedIn = computed(() => !!currentUser.value)
const spinsLeft = computed(() => currentUser.value?.spinsLeft ?? 0)
const hasSpins = computed(() => spinsLeft.value > 0)

export function useAuth() {
  return {
    currentUser,
    isLoggedIn,
    spinsLeft,
    hasSpins,
    FREE_SPINS,
    initAuth,
    register,
    login,
    logout,
    useSpin,
    canSpin
  }
}
