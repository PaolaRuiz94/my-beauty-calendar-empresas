import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Servicios que ofrece una peluquería: peluquerias/{storeId}/servicios/{servicioId}
function serviciosRef(storeId) {
  return collection(db, 'peluquerias', storeId, 'servicios');
}

export async function getStoreServices(storeId) {
  const snap = await getDocs(query(serviciosRef(storeId), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStoreService(storeId, data) {
  const ref = await addDoc(serviciosRef(storeId), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStoreService(storeId, servicioId, data) {
  await updateDoc(doc(db, 'peluquerias', storeId, 'servicios', servicioId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStoreService(storeId, servicioId) {
  await deleteDoc(doc(db, 'peluquerias', storeId, 'servicios', servicioId));
}
