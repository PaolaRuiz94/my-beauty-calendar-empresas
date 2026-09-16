import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Catálogo propio de cada tienda: peluquerias/{storeId}/products/{productId}
function productsRef(storeId) {
  return collection(db, 'peluquerias', storeId, 'products');
}

export async function getStoreProducts(storeId) {
  const snap = await getDocs(query(productsRef(storeId), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStoreProduct(storeId, data) {
  const ref = await addDoc(productsRef(storeId), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStoreProduct(storeId, productId, data) {
  await updateDoc(doc(db, 'peluquerias', storeId, 'products', productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStoreProduct(storeId, productId) {
  await deleteDoc(doc(db, 'peluquerias', storeId, 'products', productId));
}
