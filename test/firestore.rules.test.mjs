// Verifica firestore.rules contra el emulador de Firestore/Storage.
//
// Uso:
//   npm run test:rules
//
// Eso levanta el emulador (firebase.json → emulators.firestore, puerto 8080;
// emulators.storage, puerto 9199), corre este archivo contra él y lo apaga al
// terminar. Requiere Java en el PATH (lo usa el emulador). En esta máquina
// Java se instaló con `brew install openjdk`, que queda keg-only — si "java
// -version" falla, correr:
//   echo 'export PATH=/opt/homebrew/opt/openjdk/bin:$PATH' >> ~/.zshrc
//
// No pega contra Firestore/Storage reales en ningún momento.
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getBytes,
} from 'firebase/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FIRESTORE_PORT = 8080;
const STORAGE_PORT = 9199;

const results = [];
function record(name, promise) {
  // assertSucceeds/assertFails ya encapsulan la expectativa: la promesa
  // resuelve cuando la operación se comportó como se esperaba (tuvo éxito, o
  // fue efectivamente denegada) y rechaza cuando no.
  return promise
    .then(() => { results.push({ name, ok: true }); })
    .catch((err) => { results.push({ name, ok: false, err: err.message }); });
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    // Tiene que ser el mismo project id con el que arranca el emulador
    // (.firebaserc / firebase emulators:exec, hoy my-beauty-calendar-72f2b):
    // las reglas de Storage que llaman a firestore.get() resuelven contra el
    // proyecto del hub del emulador, no contra el projectId que le pasemos
    // acá — si no coinciden, firestore.get() no encuentra el doc y explota
    // con "Null value error" aunque el dato sí exista del lado de Firestore.
    projectId: 'my-beauty-calendar-72f2b',
    firestore: {
      rules: readFileSync(join(ROOT, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: FIRESTORE_PORT,
    },
    storage: {
      rules: readFileSync(join(ROOT, 'storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: STORAGE_PORT,
    },
  });

  const OWNER_A = 'ownerA_uid';
  const OWNER_B = 'ownerB_uid';
  const CLIENT_X = 'clientX_uid';
  const CLIENT_Y = 'clientY_uid';

  // ── Seed: datos base como admin, sin pasar por las reglas ────────────────
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'peluquerias', 'tienda-a'), {
      nombre: 'Tienda A', ownerId: OWNER_A, rating: 4.5, totalResenias: 10, status: 'activo',
    });
    await setDoc(doc(db, 'peluquerias', 'tienda-b'), {
      nombre: 'Tienda B', ownerId: OWNER_B, rating: 3.0, totalResenias: 2, status: 'activo',
    });
    await setDoc(doc(db, 'reservas', 'reserva-1'), {
      storeId: 'tienda-a', clienteUid: CLIENT_X, estado: 'pendiente', fecha: '2026-10-01', hora: '10:00',
    });
    await setDoc(doc(db, 'Post', 'post-1'), {
      autorId: CLIENT_X, texto: 'hola', likesUsuarios: [], commentsCount: 0,
    });
  });

  const ownerA = testEnv.authenticatedContext(OWNER_A);
  const ownerB = testEnv.authenticatedContext(OWNER_B);
  const clientX = testEnv.authenticatedContext(CLIENT_X);
  const clientY = testEnv.authenticatedContext(CLIENT_Y);
  const anon = testEnv.unauthenticatedContext();

  const dbOwnerA = ownerA.firestore();
  const dbOwnerB = ownerB.firestore();
  const dbClientX = clientX.firestore();
  const dbClientY = clientY.firestore();
  const dbAnon = anon.firestore();

  // ── peluquerias ────────────────────────────────────────────────────────
  await record('dueña A puede editar su propia tienda (website)',
    assertSucceeds(updateDoc(doc(dbOwnerA, 'peluquerias', 'tienda-a'), { website: 'https://a.com' })));
  await record('dueña B NO puede editar la tienda de A',
    assertFails(updateDoc(doc(dbOwnerB, 'peluquerias', 'tienda-a'), { website: 'https://hack.com' })));
  await record('dueña A NO puede tocar su propio rating',
    assertFails(updateDoc(doc(dbOwnerA, 'peluquerias', 'tienda-a'), { rating: 5 })));
  await record('anónimo NO puede leer una tienda',
    assertFails(getDoc(doc(dbAnon, 'peluquerias', 'tienda-a'))));

  // ── reservas ───────────────────────────────────────────────────────────
  await record('clienta X puede crear su propia reserva',
    assertSucceeds(setDoc(doc(dbClientX, 'reservas', 'reserva-2'), {
      storeId: 'tienda-a', clienteUid: CLIENT_X, estado: 'pendiente', fecha: '2026-10-02', hora: '11:00',
    })));
  await record('clienta X NO puede crear una reserva a nombre de Y',
    assertFails(setDoc(doc(dbClientX, 'reservas', 'reserva-3'), {
      storeId: 'tienda-a', clienteUid: CLIENT_Y, estado: 'pendiente', fecha: '2026-10-03', hora: '12:00',
    })));
  await record('clienta Y NO puede leer la reserva de X',
    assertFails(getDoc(doc(dbClientY, 'reservas', 'reserva-1'))));
  await record('dueña A (de tienda-a) SÍ puede leer la reserva de X',
    assertSucceeds(getDoc(doc(dbOwnerA, 'reservas', 'reserva-1'))));
  await record('dueña A puede confirmar (solo estado) la reserva',
    assertSucceeds(updateDoc(doc(dbOwnerA, 'reservas', 'reserva-1'), { estado: 'confirmada' })));
  await record('dueña A NO puede modificar otro campo además de estado',
    assertFails(updateDoc(doc(dbOwnerA, 'reservas', 'reserva-1'), { estado: 'confirmada', hora: '23:59' })));
  await record('dueña B NO puede tocar una reserva de tienda-a',
    assertFails(updateDoc(doc(dbOwnerB, 'reservas', 'reserva-1'), { estado: 'cancelada' })));

  // ── slots ──────────────────────────────────────────────────────────────
  await record('clienta X puede crear su propio slot',
    assertSucceeds(setDoc(doc(dbClientX, 'peluquerias', 'tienda-a', 'slots', '2026-10-02_11:00'), {
      fecha: '2026-10-02', hora: '11:00', clienteUid: CLIENT_X, reservaId: 'reserva-2',
    })));
  await record('clienta Y NO puede crear un slot a nombre de X',
    assertFails(setDoc(doc(dbClientY, 'peluquerias', 'tienda-a', 'slots', '2026-10-02_12:00'), {
      fecha: '2026-10-02', hora: '12:00', clienteUid: CLIENT_X, reservaId: 'x',
    })));
  await record('clienta X puede borrar su propio slot (cancelar)',
    assertSucceeds(deleteDoc(doc(dbClientX, 'peluquerias', 'tienda-a', 'slots', '2026-10-02_11:00'))));

  // ── Post (comunidad) ──────────────────────────────────────────────────
  await record('clienta Y puede likear el post de X (solo likesUsuarios)',
    assertSucceeds(updateDoc(doc(dbClientY, 'Post', 'post-1'), { likesUsuarios: [CLIENT_Y] })));
  await record('clienta Y NO puede editar el texto del post de X',
    assertFails(updateDoc(doc(dbClientY, 'Post', 'post-1'), { texto: 'hackeado' })));
  await record('clienta Y NO puede borrar el post de X',
    assertFails(deleteDoc(doc(dbClientY, 'Post', 'post-1'))));
  await record('clienta X SÍ puede borrar su propio post',
    assertSucceeds(deleteDoc(doc(dbClientX, 'Post', 'post-1'))));

  // ── reports / error_logs ──────────────────────────────────────────────
  await record('clienta X puede crear un report propio',
    assertSucceeds(addDoc(collection(dbClientX, 'reports'), {
      targetType: 'post', postId: 'post-1', reason: 'spam', reporterId: CLIENT_X,
    })));
  await record('anónimo puede crear un error_log',
    assertSucceeds(addDoc(collection(dbAnon, 'error_logs'), { message: 'boom', userId: null })));
  await record('clienta X NO puede leer los reports (solo consola)',
    assertFails(getDoc(doc(dbClientX, 'reports', 'nope'))));

  // ── Storage: progress_photos (privado por usuaria) ────────────────────
  const bytes = new Uint8Array([1, 2, 3]);
  const storageX = clientX.storage();
  const storageY = clientY.storage();
  const storageAnon = anon.storage();

  await record('clienta X puede subir su propia foto de progreso',
    assertSucceeds(uploadBytes(ref(storageX, 'progress_photos/clientX_uid/1.jpg'), bytes)));
  await record('clienta Y NO puede subir a la carpeta de progreso de X',
    assertFails(uploadBytes(ref(storageY, 'progress_photos/clientX_uid/2.jpg'), bytes)));
  await record('clienta Y NO puede leer la foto de progreso de X',
    assertFails(getBytes(ref(storageY, 'progress_photos/clientX_uid/1.jpg'))));
  await record('anónimo NO puede leer una foto de progreso',
    assertFails(getBytes(ref(storageAnon, 'progress_photos/clientX_uid/1.jpg'))));

  // ── Storage: forum_posts (lectura pública entre logueadas) ────────────
  await record('clienta X puede subir su propia imagen de post',
    assertSucceeds(uploadBytes(ref(storageX, 'forum_posts/clientX_uid/1.jpg'), bytes)));
  await record('clienta Y NO puede subir a la carpeta forum_posts de X',
    assertFails(uploadBytes(ref(storageY, 'forum_posts/clientX_uid/2.jpg'), bytes)));
  await record('clienta Y SÍ puede leer la imagen de post de X',
    assertSucceeds(getBytes(ref(storageY, 'forum_posts/clientX_uid/1.jpg'))));

  // ── Storage: fotos de producto/servicio (dueña de la tienda) ──────────
  const storageOwnerA = ownerA.storage();
  const storageOwnerB = ownerB.storage();

  await record('dueña A puede subir una foto de producto a su propia tienda',
    assertSucceeds(uploadBytes(ref(storageOwnerA, 'peluquerias/tienda-a/products/1.jpg'), bytes)));
  await record('dueña B NO puede subir una foto de producto a la tienda de A',
    assertFails(uploadBytes(ref(storageOwnerB, 'peluquerias/tienda-a/products/2.jpg'), bytes)));
  await record('clienta X (no es dueña) NO puede subir una foto de servicio a tienda-a',
    assertFails(uploadBytes(ref(storageX, 'peluquerias/tienda-a/servicios/1.jpg'), bytes)));
  await record('dueña A puede subir una foto de servicio a su propia tienda',
    assertSucceeds(uploadBytes(ref(storageOwnerA, 'peluquerias/tienda-a/servicios/1.jpg'), bytes)));

  await testEnv.cleanup();

  const failed = results.filter(r => !r.ok);
  console.log('\n=== RESULTADOS ===');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}`);
    if (!r.ok && r.err) console.log(`   → ${r.err}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} OK`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fallo inesperado corriendo el script:', err);
  process.exit(1);
});
