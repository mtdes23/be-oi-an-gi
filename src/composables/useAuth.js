import { ref, computed, onMounted } from 'vue'
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
const FREE_SPINS = 10

function initAuth() {
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
      }
      isLoading.value = false
      unsubscribe()
      resolve()
    })
  })
}

function loadSpinData(uid) {
  const data = localStorage.getItem(`be-oi-spins-${uid}`)
  if (data) {
    const parsed = JSON.parse(data)
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    if (now - parsed.lastReset > dayMs) {
      spinsLeft.value = FREE_SPINS
      saveSpinData(uid)
    } else {
      spinsLeft.value = parsed.spinsLeft
    }
  } else {
    spinsLeft.value = FREE_SPINS
    saveSpinData(uid)
  }
}

function saveSpinData(uid) {
  localStorage.setItem(`be-oi-spins-${uid}`, JSON.stringify({
    spinsLeft: spinsLeft.value,
    lastReset: Date.now()
  }))
}

const spinsLeft = ref(FREE_SPINS)

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
    return { ok: false, msg: translateError(err.code) }
  }
}

async function logout() {
  await signOut(auth)
  currentUser.value = null
  spinsLeft.value = FREE_SPINS
}

function useSpin() {
  if (!currentUser.value || spinsLeft.value <= 0) return false
  spinsLeft.value--
  saveSpinData(currentUser.value.uid)
  return true
}

function canSpin() {
  return currentUser.value && spinsLeft.value > 0
}

function translateError(code) {
  const map = {
    'auth/email-already-in-use': 'Email đã được đăng ký',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự',
    'auth/user-not-found': 'Tài khoản không tồn tại',
    'auth/wrong-password': 'Sai mật khẩu',
    'auth/too-many-requests': 'Thử lại sau vài phút',
    'auth/popup-closed-by-user': 'Đã đóng popup',
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
    FREE_SPINS,
    initAuth,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    useSpin,
    canSpin
  }
}
