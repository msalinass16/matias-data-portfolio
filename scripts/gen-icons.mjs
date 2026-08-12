/**
 * Genera los PNG del icono de la PWA sin dependencias externas.
 * Marca: tres barras ascendentes sobre fondo oscuro (se ve bien en pantalla de
 * inicio clara u oscura). Se ejecuta a mano: `node scripts/gen-icons.mjs`.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const BG = [14, 11, 8, 255];
const FG = [251, 146, 60, 255];

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // Cada scanline lleva un byte de filtro (0 = ninguno) delante.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, c) => {
    const i = (y * size + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = c[3];
  };

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) put(x, y, BG);

  // Tres barras ascendentes, con margen amplio para sobrevivir el recorte
  // circular de los iconos "maskable" de Android.
  const inset = Math.round(size * 0.26);
  const usable = size - inset * 2;
  const barW = Math.round(usable * 0.22);
  const gap = Math.round((usable - barW * 3) / 2);
  const heights = [0.42, 0.7, 1];
  const radius = Math.max(1, Math.round(barW * 0.3));

  heights.forEach((h, i) => {
    const x0 = inset + i * (barW + gap);
    const barH = Math.round(usable * h);
    const y0 = inset + usable - barH;
    for (let y = y0; y < y0 + barH; y++) {
      for (let x = x0; x < x0 + barW; x++) {
        // Redondea solo las esquinas superiores de cada barra.
        const dx = Math.min(x - x0, x0 + barW - 1 - x);
        const dy = y - y0;
        if (dy < radius && dx < radius) {
          const ddx = radius - dx;
          const ddy = radius - dy;
          if (ddx * ddx + ddy * ddy > radius * radius) continue;
        }
        put(x, y, FG);
      }
    }
  });

  return encodePng(size, px);
}

mkdirSync(OUT, { recursive: true });
for (const size of [180, 192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), render(size));
  console.log(`public/icon-${size}.png`);
}
