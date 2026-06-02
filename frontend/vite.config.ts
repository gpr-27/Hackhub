import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The single shared .env lives at the repository root (one level above
// frontend/). envDir points Vite there so it reads the same file as the
// backend; only VITE_-prefixed vars are exposed to the browser bundle.
const rootDir = fileURLToPath(new URL('..', import.meta.url));

// Dev-server port comes from the environment (VITE_DEV_PORT) so it is never
// hardcoded; when unset, Vite uses its own default. Output goes to `build/`
// to match the Netlify publish directory (netlify.toml).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  const devPort = env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : undefined;

  return {
    envDir: rootDir,
    plugins: [react()],
    server: { port: devPort },
    preview: { port: devPort },
    build: { outDir: 'build' },
  };
});
