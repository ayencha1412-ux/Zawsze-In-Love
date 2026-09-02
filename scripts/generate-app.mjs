import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const partsDir = path.join(root, 'src', 'app-parts');
const output = path.join(root, 'src', '__zawsze_app_v2__.jsx');

const source = fs.readdirSync(partsDir)
  .filter((name) => name.endsWith('.jsx.txt'))
  .sort()
  .map((name) => fs.readFileSync(path.join(partsDir, name), 'utf8'))
  .join('\n');

fs.writeFileSync(output, source, 'utf8');
console.log(`Generated ${path.relative(root, output)} from ${partsDir}`);
