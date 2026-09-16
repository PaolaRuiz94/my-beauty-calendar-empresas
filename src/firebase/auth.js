import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

function generateStoreId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Escribe en `peluquerias`, la misma colección que lee el consumidor (ExplorarScreen.js),
// para que una tienda creada acá aparezca ahí sin cambios del lado del consumidor.
// direccion/tipo/horarios/especialidades quedan en null hasta completarse desde "Mi perfil".
export async function registerStore({ name, city, whatsapp, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  let storeId = generateStoreId(name);

  const existing = await getDoc(doc(db, 'peluquerias', storeId));
  if (existing.exists()) {
    storeId = `${storeId}-2`;
  }

  const data = {
    nombre: name,
    ciudad: city,
    telefono: whatsapp,
    email,
    storeId,
    ownerId: uid,
    status: 'activo',
    direccion: null,
    tipo: null,
    horarios: null,
    especialidades: null,
    lat: null,
    lng: null,
    rating: 0,
    totalResenias: 0,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'peluquerias', storeId), data);

  return { ...data, id: storeId };
}

export async function loginStore(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const storesRef = await getDocs(query(collection(db, 'peluquerias'), where('ownerId', '==', uid)));

  if (storesRef.empty) throw new Error('No se encontró la tienda asociada a esta cuenta.');

  return { id: storesRef.docs[0].id, ...storesRef.docs[0].data() };
}

export async function logoutStore() {
  await signOut(auth);
}
