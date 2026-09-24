// Regenera todas las imágenes derivadas del logo: íconos de la PWA, splash
// screens de iPhone/iPad, favicon.ico y las copias viejas del logo en public/.
//
//   npm run iconos                        -> usa branding/logo-cirsub.png
//   npm run iconos -- ruta/al/logo.png    -> usa otro archivo
//
// El origen tiene que tener fondo transparente y estar en la mayor resolución
// que haya: los íconos grandes y los splash lo usan a casi 1000 px, y agrandar
// una imagen chica la deja borrosa. El maestro se arma con `npm run logo`.
//
// La composición de cada archivo (fondo, qué porcentaje ocupa el logo) copia
// la de los que se generaron originalmente, medida sobre esos archivos.

import { readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const PUBLIC = 'public';
const ICONOS = join(PUBLIC, 'icons');
const ORIGEN = process.argv[2] ?? join('branding', 'logo-cirsub.png');

const BLANCO = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Nunca se agranda el logo más de esta cantidad de veces su tamaño original.
 * Con el maestro a tamaño completo no llega a actuar; está por si alguien
 * corre esto con un logo chico: en los splash lo deja más chico pero nítido,
 * que se ve mejor que uno enorme y borroso.
 */
const TOPE_AMPLIACION = 2;

const { width: ANCHO_ORIGEN } = await sharp(ORIGEN).metadata();
const TOPE = ANCHO_ORIGEN * TOPE_AMPLIACION;

/** El logo a `lado` px, centrado en un lienzo de `ancho`x`alto`. */
async function componer({ ancho, alto, lado, fondo }) {
  const logo = await sharp(ORIGEN)
    .resize(lado, lado, { fit: 'contain', background: TRANSPARENTE, kernel: 'lanczos3' })
    .toBuffer();

  return sharp({ create: { width: ancho, height: alto, channels: 4, background: fondo } })
    .composite([{ input: logo, gravity: 'center' }]);
}

/**
 * Proporción del logo según el ícono. Los "maskable" van más chicos que los
 * demás a propósito: Android los recorta con la forma que quiera (círculo,
 * gota, cuadrado redondeado) y sólo garantiza el 80% central. Los viejos
 * estaban al 88% y el borde del escudo se cortaba en algunos teléfonos.
 */
function proporcionIcono(nombre) {
  if (/^manifest-icon-\d+\.maskable\.png$/.test(nombre)) return 0.78;
  if (nombre === 'apple-icon-180.png' || nombre === 'favicon-196.png') return 0.76;
  if (/^icon-\d+x\d+\.png$/.test(nombre) || nombre === 'apple-touch-icon-180.png') return 0.88;
  return null;
}

async function generarIconos(archivos) {
  let cuenta = 0;

  for (const nombre of archivos) {
    const proporcion = proporcionIcono(nombre);
    if (proporcion === null) continue;

    const ruta = join(ICONOS, nombre);
    const { width } = await sharp(ruta).metadata();
    const lado = Math.min(Math.round(width * proporcion), TOPE);

    // Fondo blanco y opaco: iOS rellena la transparencia de los íconos con
    // negro, y el logo quedaría flotando sobre un cuadrado oscuro.
    const imagen = await componer({ ancho: width, alto: width, lado, fondo: BLANCO });
    await imagen.flatten({ background: BLANCO }).png({ compressionLevel: 9 }).toFile(ruta + '.tmp');
    await reemplazar(ruta);
    cuenta++;
  }

  return cuenta;
}

async function generarSplash(archivos) {
  let cuenta = 0;

  for (const nombre of archivos) {
    const match = /^apple-splash-(\d+)-(\d+)\.jpg$/.exec(nombre);
    if (!match) continue;

    const ancho = Number(match[1]);
    const alto = Number(match[2]);
    // Mismas proporciones que los splash originales: en vertical el logo ocupa
    // el 76% del ancho; en horizontal, el 48% del alto.
    const deseado = alto >= ancho ? ancho * 0.756 : alto * 0.477;
    const lado = Math.min(Math.round(deseado), TOPE);

    const ruta = join(ICONOS, nombre);
    const imagen = await componer({ ancho, alto, lado, fondo: BLANCO });
    await imagen.flatten({ background: BLANCO }).jpeg({ quality: 90, mozjpeg: true }).toFile(ruta + '.tmp');
    await reemplazar(ruta);
    cuenta++;
  }

  return cuenta;
}

/**
 * Las copias viejas del logo en la raíz de public/. La app ya no las usa,
 * pero se regeneran igual: si algún sistema de afuera las enlaza (un mail,
 * una plantilla, el sistema de gestión), también tiene que mostrar el logo
 * nuevo. Se respeta el tamaño y el fondo de cada una.
 */
async function generarCopiasViejas() {
  const copias = [
    { nombre: 'cirsub.png', ancho: 958, alto: 955, proporcion: 0.98, fondo: TRANSPARENTE },
    { nombre: 'cirsubicon.png', ancho: 192, alto: 192, proporcion: 1, fondo: TRANSPARENTE },
    { nombre: 'logo.png', ancho: 1024, alto: 1024, proporcion: 0.88, fondo: BLANCO },
  ];

  for (const { nombre, ancho, alto, proporcion, fondo } of copias) {
    const ruta = join(PUBLIC, nombre);
    const lado = Math.round(Math.min(ancho, alto) * proporcion);
    const imagen = await componer({ ancho, alto, lado, fondo });
    await imagen.png({ compressionLevel: 9 }).toFile(ruta + '.tmp');
    await reemplazar(ruta);
  }

  return copias.length;
}

/**
 * favicon.ico con 16, 32 y 48 px. Cada tamaño va como PNG dentro del ICO,
 * que es lo que entienden todos los navegadores actuales. Fondo transparente:
 * en la pestaña se ve mejor que un cuadrado blanco.
 */
async function generarFavicon() {
  const tamanios = [16, 32, 48];
  const pngs = await Promise.all(tamanios.map(t =>
    sharp(ORIGEN).resize(t, t, { fit: 'contain', background: TRANSPARENTE }).png().toBuffer()
  ));

  const cabecera = Buffer.alloc(6);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // 1 = ícono
  cabecera.writeUInt16LE(tamanios.length, 4);

  let desplazamiento = 6 + 16 * tamanios.length;
  const entradas = tamanios.map((t, i) => {
    const entrada = Buffer.alloc(16);
    entrada.writeUInt8(t, 0);
    entrada.writeUInt8(t, 1);
    entrada.writeUInt8(0, 2);   // sin paleta
    entrada.writeUInt8(0, 3);   // reservado
    entrada.writeUInt16LE(1, 4);  // planos
    entrada.writeUInt16LE(32, 6); // bits por pixel
    entrada.writeUInt32LE(pngs[i].length, 8);
    entrada.writeUInt32LE(desplazamiento, 12);
    desplazamiento += pngs[i].length;
    return entrada;
  });

  await writeFile(join(PUBLIC, 'favicon.ico'), Buffer.concat([cabecera, ...entradas, ...pngs]));
}

/** sharp no puede escribir sobre el archivo que está leyendo: va por un .tmp. */
async function reemplazar(ruta) {
  await rename(ruta + '.tmp', ruta);
}

const archivos = (await readdir(ICONOS)).sort();

console.log(`Logo de origen: ${ORIGEN} (${ANCHO_ORIGEN}px). Tope de ampliación: ${TOPE}px.`);
console.log(`Íconos PWA:      ${await generarIconos(archivos)}`);
console.log(`Splash iOS:      ${await generarSplash(archivos)}`);
console.log(`Copias viejas:   ${await generarCopiasViejas()}`);
await generarFavicon();
console.log('favicon.ico:     1 (16, 32 y 48 px)');
