import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'node:zlib';

const isWatch = process.argv.includes('--watch');
const outdir = 'dist';

// Clean output
if (fs.existsSync(outdir)) {
  fs.rmSync(outdir, { recursive: true });
}
fs.mkdirSync(outdir, { recursive: true });
fs.mkdirSync(`${outdir}/popup`, { recursive: true });
fs.mkdirSync(`${outdir}/options`, { recursive: true });
fs.mkdirSync(`${outdir}/assets`, { recursive: true });

// Resolve workspace packages to their source
const workspaceAlias = {
  '@draftly/shared': path.resolve('../../packages/shared/src/index.ts'),
  '@draftly/providers': path.resolve('../../packages/providers/src/index.ts'),
  '@draftly/core': path.resolve('../../packages/core/src/index.ts'),
  '@draftly/ui': path.resolve('../../packages/ui/src/index.ts'),
};

const aliasPlugin = {
  name: 'workspace-alias',
  setup(build) {
    for (const [name, target] of Object.entries(workspaceAlias)) {
      build.onResolve({ filter: new RegExp(`^${name.replace('/', '\\/')}$`) }, () => ({
        path: target,
      }));
      build.onResolve({ filter: new RegExp(`^${name.replace('/', '\\/')}\/`) }, (args) => {
        const subpath = args.path.replace(name, '').replace(/^\//, '');
        return {
          path: path.resolve(path.dirname(target), subpath),
        };
      });
    }
  },
};

// Build Tailwind CSS for content script
console.log('Building Tailwind CSS...');
try {
  execSync(
    `npx tailwindcss -i src/content/styles.css -o ${outdir}/content.css --minify`,
    { stdio: 'inherit' },
  );
} catch (e) {
  console.warn('Tailwind build failed, creating minimal CSS fallback');
  fs.writeFileSync(`${outdir}/content.css`, '/* Tailwind build pending — run pnpm install first */');
}

// Shared esbuild options
const shared = {
  bundle: true,
  sourcemap: isWatch ? 'inline' : false,
  target: 'chrome110',
  plugins: [aliasPlugin],
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  logLevel: 'info',
};

// Build all entry points in parallel
await Promise.all([
  // Content script (IIFE — injected into pages)
  esbuild.build({
    ...shared,
    entryPoints: ['src/content/index.tsx'],
    outfile: `${outdir}/content.js`,
    format: 'iife',
    jsx: 'automatic',
    jsxImportSource: 'react',
  }),
  // Service worker (ESM)
  esbuild.build({
    ...shared,
    entryPoints: ['src/background/service-worker.ts'],
    outfile: `${outdir}/service-worker.js`,
    format: 'esm',
  }),
  // Popup
  esbuild.build({
    ...shared,
    entryPoints: ['src/popup/main.tsx'],
    outfile: `${outdir}/popup/main.js`,
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'react',
  }),
  // Options page
  esbuild.build({
    ...shared,
    entryPoints: ['src/options/main.tsx'],
    outfile: `${outdir}/options/main.js`,
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'react',
  }),
]);

// Copy static files
fs.copyFileSync('manifest.json', `${outdir}/manifest.json`);
fs.copyFileSync('src/popup/index.html', `${outdir}/popup/index.html`);
fs.copyFileSync('src/options/index.html', `${outdir}/options/index.html`);
fs.copyFileSync('src/options/options.css', `${outdir}/options/options.css`);

// Generate icons from SVG
await generateIcons(outdir);

console.log('\nBuild complete! Load dist/ as unpacked extension in chrome://extensions');

async function generateIcons(dir) {
  const svgPath = path.resolve('src/assets/icon.svg');
  if (!fs.existsSync(svgPath)) return;

  try {
    const sharp = (await import('sharp')).default;
    await Promise.all([16, 32, 48, 128].map(s =>
      sharp(svgPath, { density: 300 })
        .resize(s, s)
        .png()
        .toFile(`${dir}/assets/icon-${s}.png`)
    ));
    console.log('Icons generated from SVG');
  } catch {
    console.log('sharp unavailable, using fallback icons');
    for (const size of [16, 32, 48, 128]) {
      fs.writeFileSync(`${dir}/assets/icon-${size}.png`, createMinimalPNG(size, [76, 110, 245]));
    }
  }
}

function createMinimalPNG(size, rgb) {
  const width = size;
  const height = size;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rawRow = Buffer.alloc(1 + width * 3);
  rawRow[0] = 0; // filter: None
  for (let x = 0; x < width; x++) {
    rawRow[1 + x * 3] = rgb[0];
    rawRow[2 + x * 3] = rgb[1];
    rawRow[3 + x * 3] = rgb[2];
  }

  const rawData = Buffer.concat(Array.from({ length: height }, () => Buffer.from(rawRow)));
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
