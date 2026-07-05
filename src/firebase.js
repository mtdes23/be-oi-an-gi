import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCrTLPQhhOVQ1D_3Ycrttge93fQKYo8ndY",
  authDomain: "be-oi-an-gi.firebaseapp.com",
  projectId: "be-oi-an-gi",
  storageBucket: "be-oi-an-gi.firebasestorage.app",
  messagingSenderId: "142218145015",
  appId: "1:142218145015:web:52da78486f0fc06d02b7f2"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
