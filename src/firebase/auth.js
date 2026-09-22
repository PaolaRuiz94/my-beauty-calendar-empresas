import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp, runTransaction } from 'firebase/firestore';
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
export async function registerStore({ name, city, whatsapp, website, businessType, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const baseId = generateStoreId(name);

  const data = {
    nombre: name,
    ciudad: city,
    pais: 'Colombia',
    telefono: whatsapp,
    website: website ? website.trim() : null,
    businessType,
    email,
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

  // Transacción: busca el primer storeId libre (baseId, baseId-2, baseId-3, ...) y lo
  // reserva atómicamente, para que dos registros concurrentes con el mismo nombre no
  // puedan pisar el documento de la tienda del otro.
  const storeId = await runTransaction(db, async (transaction) => {
    let candidateId = baseId;
    let suffix = 2;
    while (true) {
      const ref = doc(db, 'peluquerias', candidateId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        transaction.set(ref, { ...data, storeId: candidateId });
        return candidateId;
      }
      candidateId = `${baseId}-${suffix}`;
      suffix++;
    }
  });

  return { ...data, storeId, id: storeId };
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

export async function resetStorePassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function updateStoreWebsite(storeId, website) {
  await updateDoc(doc(db, 'peluquerias', storeId), { website: website ? website.trim() : null });
}

export async function updateStoreHorarios(storeId, horarios) {
  await updateDoc(doc(db, 'peluquerias', storeId), { horarios });
}
