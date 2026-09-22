import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadStoreImage(storeId, folder, file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen no puede pesar más de 5MB.');
  }
  const path = `peluquerias/${storeId}/${folder}/${Date.now()}-${file.name}`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}
