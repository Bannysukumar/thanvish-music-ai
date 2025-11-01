import { build } from 'esbuild';
import { statSync } from 'fs';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  minify: isProduction,
  sourcemap: !isProduction,
  target: 'node20',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
})
  .then(() => {
    try {
      const outputPath = join(process.cwd(), 'dist', 'index.js');
      const stats = statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`\n  dist\\index.js  ${sizeKB}kb\n`);
    } catch (err) {
      // File might not exist or stats unavailable
    }
    console.log('Done in build');
  })
  .catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });

