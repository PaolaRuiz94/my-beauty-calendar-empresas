import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCyz7uHEdmgwzQQpwSdkwNm-Y6IJKGZzn4',
  authDomain: 'my-beauty-calendar-72f2b.firebaseapp.com',
  projectId: 'my-beauty-calendar-72f2b',
  storageBucket: 'my-beauty-calendar-72f2b.firebasestorage.app',
  messagingSenderId: '242764281250',
  appId: '1:242764281250:web:8cdae366ebda245c51eefb',
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
