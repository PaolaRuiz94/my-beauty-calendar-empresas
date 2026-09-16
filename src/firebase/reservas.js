import { collection, doc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';

// Citas agendadas por clientes desde la app de consumidores: reservas/{reservaId}
// storeId identifica a qué peluquería pertenece cada cita.
// Se ordena en el cliente (por fecha y hora) para no depender de un índice
// compuesto de Firestore para storeId + fecha.
export async function getStoreReservas(storeId) {
  const snap = await getDocs(query(collection(db, 'reservas'), where('storeId', '==', storeId)));
  const reservas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  reservas.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  return reservas;
}

export async function confirmReserva(reservaId) {
  await updateDoc(doc(db, 'reservas', reservaId), { estado: 'confirmada' });
}

// Cancela la cita y libera sus slots (peluquerias/{storeId}/slots/{slotId}) en una sola
// escritura atómica, para que el horario vuelva a aparecer disponible.
export async function cancelReserva(storeId, reservaId, slotIds = []) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reservas', reservaId), { estado: 'cancelada' });
  for (const slotId of slotIds) {
    batch.delete(doc(db, 'peluquerias', storeId, 'slots', slotId));
  }
  await batch.commit();
}
