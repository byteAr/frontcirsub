// Prepara el logo a partir del original en JPG (sin transparencia):
//
//   npm run logo                          -> usa branding/logo-nuevo.jpg
//   npm run logo -- ruta/al/logo.jpg      -> usa otro archivo
//
// Genera:
//   branding/logo-cirsub.png        maestro con fondo transparente, tamaño completo
//   public/cirsublogo-nuevo.webp    el que usa la app en pantalla
//
// Después hay que correr `npm run iconos` para regenerar íconos y splash.
//
// Cómo se saca el fondo: el logo es un sello circular con un anillo negro
// sobre fondo blanco. No alcanza con borrar "lo blanco", porque el interior
// del sello también es blanco y quedaría agujereado. Tampoco alcanza con un
// círculo fijo, porque el anillo no es perfecto (su radio varía ~10 px según
// el ángulo) y un círculo lo cortaría de un lado y dejaría fondo del otro.
// Entonces se mide el borde del anillo ángulo por ángulo: hasta la mitad del
// anillo todo queda opaco, y de ahí hacia afuera la transparencia sale de qué
// tan oscuro es cada pixel, así el borde queda suavizado sobre cualquier fondo.

import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

const ORIGEN = process.argv[2] ?? 'branding/logo-nuevo.jpg';
const MAESTRO = 'branding/logo-cirsub.png';
const PARA_LA_APP = 'public/cirsublogo-nuevo.webp';

/** Lado del logo que usa la app. Alcanza para 120 px de CSS en pantallas 3x. */
const LADO_APP = 512;

/** Un pixel más oscuro que esto es parte del anillo. */
const UMBRAL_OSCURO = 128;

/** Pasos angulares al medir el anillo: 1440 = cada 0,25°. */
const PASOS = 1440;

const { data: gris, info } = await sharp(ORIGEN).greyscale().raw().toBuffer({ resolveWithObject: true });
const { data: rgb } = await sharp(ORIGEN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const luz = (x, y) => gris[y * W + x];

// Color del fondo: el promedio de las cuatro esquinas.
const fondo = Math.round((luz(0, 0) + luz(W - 1, 0) + luz(0, H - 1) + luz(W - 1, H - 1)) / 4);

// Centro: el de la caja que encierra todo lo oscuro, que es el anillo.
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (luz(x, y) < UMBRAL_OSCURO) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
}
const cx = (x0 + x1) / 2;
const cy = (y0 + y1) / 2;
const radioMaximo = Math.max(x1 - x0, y1 - y0) / 2 + 20;

// Borde exterior y grosor del anillo en cada ángulo, entrando desde afuera.
const exterior = new Float64Array(PASOS);
const grosores = [];
for (let i = 0; i < PASOS; i++) {
  const a = (i / PASOS) * 2 * Math.PI;
  let borde = null;
  for (let r = radioMaximo; r > 0; r -= 0.25) {
    const x = Math.round(cx + r * Math.cos(a));
    const y = Math.round(cy + r * Math.sin(a));
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const oscuro = luz(x, y) < UMBRAL_OSCURO;
    if (borde === null && oscuro) borde = r;
    if (borde !== null && !oscuro) { grosores.push(borde - r); break; }
  }
  exterior[i] = borde ?? radioMaximo;
}

// Se suaviza el borde medido con una mediana corta: descarta un pixel suelto
// de ruido del JPG sin redondear las irregularidades reales del anillo.
const suavizado = new Float64Array(PASOS);
for (let i = 0; i < PASOS; i++) {
  const ventana = [];
  for (let k = -3; k <= 3; k++) ventana.push(exterior[(i + k + PASOS) % PASOS]);
  suavizado[i] = ventana.sort((a, b) => a - b)[3];
}

const grosor = grosores.sort((a, b) => a - b)[Math.floor(grosores.length / 2)];
const mitadAnillo = grosor / 2;

const salida = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy;
    const r = Math.hypot(dx, dy);
    let angulo = Math.atan2(dy, dx);
    if (angulo < 0) angulo += 2 * Math.PI;
    const borde = suavizado[Math.round((angulo / (2 * Math.PI)) * PASOS) % PASOS];

    const i = (y * W + x) * 3;
    const o = (y * W + x) * 4;
    let [rr, gg, bb] = [rgb[i], rgb[i + 1], rgb[i + 2]];
    let alfa;

    if (r <= borde - mitadAnillo) {
      alfa = 1; // dentro del sello: todo se conserva, incluido su blanco
    } else if (r > borde + 3) {
      alfa = 0; // fondo
    } else {
      // Borde exterior del anillo: se separa la tinta del blanco del fondo.
      alfa = Math.min(1, Math.max(0, (fondo - luz(x, y)) / fondo));
      if (alfa > 0) {
        const des = c => Math.min(255, Math.max(0, Math.round((c - (1 - alfa) * fondo) / alfa)));
        [rr, gg, bb] = [des(rr), des(gg), des(bb)];
      }
    }

    salida[o] = rr; salida[o + 1] = gg; salida[o + 2] = bb;
    salida[o + 3] = Math.round(alfa * 255);
  }
}

// Recorte cuadrado centrado en el sello, con un margen mínimo, para que en
// los íconos quede centrado de verdad y no según el centro del JPG.
const radio = Math.ceil(Math.max(...suavizado)) + 4;
const izquierda = Math.max(0, Math.round(cx - radio));
const arriba = Math.max(0, Math.round(cy - radio));
const lado = Math.min(2 * radio, W - izquierda, H - arriba);

await mkdir(dirname(MAESTRO), { recursive: true });

const maestro = sharp(salida, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: izquierda, top: arriba, width: lado, height: lado });

await maestro.clone().png({ compressionLevel: 9 }).toFile(MAESTRO);
await maestro.clone()
  .resize(LADO_APP, LADO_APP, { kernel: 'lanczos3' })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(PARA_LA_APP);

console.log(`Origen: ${ORIGEN} (${W}x${H}), fondo ${fondo}`);
console.log(`Anillo: centro (${cx}, ${cy}), radio exterior ${Math.min(...suavizado)}-${Math.max(...suavizado)}, grosor ${grosor}`);
console.log(`Maestro: ${MAESTRO} (${lado}x${lado})`);
console.log(`App:     ${PARA_LA_APP} (${LADO_APP}x${LADO_APP})`);
