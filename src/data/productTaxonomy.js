// Debe coincidir exactamente con el vocabulario que matchea src/utils/productScoring.js
// en el repo del consumidor (my-beauty-calendar) — un tag fuera de esta lista nunca
// va a scorear en el motor de recomendación.
export const TAG_OPTIONS = [
  'reparador', 'daño', 'protección', 'protectora', 'brillo', 'suavidad',
  'alisado', 'desenredo', 'ligero', 'suave', 'clarificante', 'detox',
  'limpieza profunda', 'diario', 'hidratante', 'nutritivo', 'sin peso',
  'fortalecimiento', 'limpia', 'equilibrio', 'rizos', 'definición',
  'anti-frizz', 'fijación', 'control', 'volumen', 'textura', 'ligera',
];

export const CATEGORY_OPTIONS = [
  'Shampoo', 'Tratamiento', 'Acondicionador', 'Crema de Peinar',
  'Gel', 'Espumas', 'Aceites', 'Tónico', 'Accesorios',
];

// weightClass solo aplica a estas categorías (ver hairDiagnosisEngine.js del consumidor)
export const WEIGHT_CLASS_CATEGORIES = ['Crema de Peinar', 'Gel', 'Espumas'];
export const WEIGHT_CLASS_OPTIONS = ['ligero', 'medio', 'pesado'];
