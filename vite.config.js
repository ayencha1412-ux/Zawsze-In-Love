import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const MARCH10_ASSET = './assets/march-10/march10-sprite.webp';
const VIRTUAL_MARCH10 = '\0virtual:march10-sprite';

function embeddedMarch10Sprite() {
  return {
    name: 'embedded-march10-sprite',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === MARCH10_ASSET && importer?.endsWith('/src/App.jsx')) {
        return VIRTUAL_MARCH10;
      }
      return null;
    },
    load(id) {
      if (id !== VIRTUAL_MARCH10) return null;

      return `
        import chunk1 from '/src/data/march10SpriteChunk1.js';
        import chunk2 from '/src/data/march10SpriteChunk2.js';
        import chunk3 from '/src/data/march10SpriteChunk3.js';
        import chunk4 from '/src/data/march10SpriteChunk4.js';
        import chunk5 from '/src/data/march10SpriteChunk5.js';
        import chunk6 from '/src/data/march10SpriteChunk6.js';
        import chunk7 from '/src/data/march10SpriteChunk7.js';
        export default 'data:image/webp;base64,' + chunk1 + chunk2 + chunk3 + chunk4 + chunk5 + chunk6 + chunk7;
      `;
    },
  };
}

export default defineConfig({
  plugins: [embeddedMarch10Sprite(), react()],
});
