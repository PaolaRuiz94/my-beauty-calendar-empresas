import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'peluquerias'), where('ownerId', '==', user.uid));
          const snap = await getDocs(q);
          setStore(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
        } catch (err) {
          // Sin esto, un error de red o de permisos dejaba `loading` en true
          // para siempre y la app se quedaba trabada en "Cargando...".
          console.error('No se pudo cargar la tienda de la cuenta.', err);
          setStore(null);
        }
      } else {
        setStore(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <StoreContext.Provider value={{ store, setStore, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
