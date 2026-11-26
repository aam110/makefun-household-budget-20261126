// Anggaran Kita — program penyerahan entry (Node 22 stdlib saja).
// Menyalin app/ dan screenshots/ dari repo ini ke direktori output lalu
// menulis dossier.json persis seperti yang ditulis buildDossier dari
// vendor/makefun-frontend.ts. Deterministik: salinan berurutan, tanpa
// cap waktu, tanpa angka acak, tanpa akses jaringan. Direktori output
// tidak pernah dihapus — hanya dibuat bila belum ada, lalu diisi.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

if (!existsSync(join(outDir, 'app', 'index.html'))) {
  throw new Error('app/index.html tidak ditemukan di output');
}
