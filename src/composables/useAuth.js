import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'

const currentUser = ref(null)
const isLoading = ref(true)
const FREE_SPINS_LOGGED_IN = 10
const FREE_SPINS_GUEST = 5
const spinsLeft = ref(FREE_SPINS_GUEST)

let authInitialized = false

function initAuth() {
  if (authInitialized) return Promise.resolve()
  authInitialized = true
  loadGuestSpins()
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser.value = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL
        }
        loadSpinData(user.uid)
      } else {
        currentUser.value = null
        loadGuestSpins()
      }
      isLoading.value = false
      unsubscribe()
      resolve()
    })
  })
}

function loadGuestSpins() {
  try {
    const data = localStorage.getItem('be-oi-spins-guest')
    if (data) {
      const parsed = JSON.parse(data)
      const now = Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      if (now - parsed.lastReset > dayMs) {
        spinsLeft.value = FREE_SPINS_GUEST
        saveGuestSpins()
      } else {
        spinsLeft.value = parsed.spinsLeft
      }
    } else {
      spinsLeft.value = FREE_SPINS_GUEST
      saveGuestSpins()
    }
  } catch {
    spinsLeft.value = FREE_SPINS_GUEST
  }
}

function saveGuestSpins() {
  localStorage.setItem('be-oi-spins-guest', JSON.stringify({
    spinsLeft: spinsLeft.value,
    lastReset: Date.now()
  }))
}

function loadSpinData(uid) {
  try {
    const data = localStorage.getItem(`be-oi-spins-${uid}`)
    if (data) {
      const parsed = JSON.parse(data)
      const now = Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      if (now - parsed.lastReset > dayMs) {
        spinsLeft.value = FREE_SPINS_LOGGED_IN
        saveSpinData(uid)
      } else {
        spinsLeft.value = parsed.spinsLeft
      }
    } else {
      spinsLeft.value = FREE_SPINS_LOGGED_IN
      saveSpinData(uid)
    }
  } catch {
    spinsLeft.value = FREE_SPINS_LOGGED_IN
  }
}

function saveSpinData(uid) {
  localStorage.setItem(`be-oi-spins-${uid}`, JSON.stringify({
    spinsLeft: spinsLeft.value,
    lastReset: Date.now()
  }))
}

const isLoggedIn = computed(() => !!currentUser.value)
const hasSpins = computed(() => spinsLeft.value > 0)

async function registerWithEmail(name, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    currentUser.value = {
      uid: cred.user.uid,
      name,
      email,
      photoURL: null
    }
    spinsLeft.value = FREE_SPINS
    saveSpinData(cred.user.uid)
    return { ok: true }
  } catch (err) {
    return { ok: false, msg: translateError(err.code) }
  }
}

async function loginWithEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return { ok: true }
  } catch (err) {
    return { ok: false, msg: translateError(err.code) }
  }
}

async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider)
    return { ok: true }
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return { ok: false, msg: '' }
    return { ok: false, msg: translateError(err.code) }
  }
}

async function logout() {
  await signOut(auth)
  currentUser.value = null
  loadGuestSpins()
}

function useSpin() {
  if (spinsLeft.value <= 0) return false
  spinsLeft.value--
  if (currentUser.value) {
    saveSpinData(currentUser.value.uid)
  } else {
    saveGuestSpins()
  }
  return true
}

function canSpin() {
  return spinsLeft.value > 0
}

function translateError(code) {
  const map = {
    'auth/email-already-in-use': 'Email đã được đăng ký',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự',
    'auth/user-not-found': 'Tài khoản không tồn tại',
    'auth/wrong-password': 'Sai mật khẩu',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
    'auth/too-many-requests': 'Thử lại sau vài phút',
    'auth/popup-closed-by-user': '',
    'auth/network-request-failed': 'Lỗi mạng, thử lại sau'
  }
  return map[code] || 'Có lỗi xảy ra, thử lại sau'
}

export function useAuth() {
  return {
    currentUser,
    isLoading,
    isLoggedIn,
    spinsLeft,
    hasSpins,
    FREE_SPINS_LOGGED_IN,
    FREE_SPINS_GUEST,
    initAuth,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    useSpin,
    canSpin
  }
}
