import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function zawszeAppParts() {
  const publicId = 'virtual:zawsze-app-v2';
  const resolvedId = '\0virtual:zawsze-app-v2.jsx';
  return {
    name: 'zawsze-app-parts',
    resolveId(id) { return id === publicId ? resolvedId : null; },
    load(id) {
      if (id !== resolvedId) return null;
      const dir = path.join(root, 'src', 'app-parts');
      return fs.readdirSync(dir)
        .filter((name) => name.endsWith('.jsx.txt'))
        .sort()
        .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
        .join('\n');
    },
  };
}

export default defineConfig({ plugins: [zawszeAppParts(), react()] });
