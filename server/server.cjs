const fs = require('fs');
const path = require('path');
const Module = require('module');

const partsDir = path.join(__dirname, 'parts');
const code = fs.readdirSync(partsDir)
  .filter((name) => name.endsWith('.cjs.txt'))
  .sort()
  .map((name) => fs.readFileSync(path.join(partsDir, name), 'utf8'))
  .join('');

const assembledName = path.join(__dirname, 'assembled-server.cjs');
const assembled = new Module(assembledName, module);
assembled.filename = assembledName;
assembled.paths = module.paths;
assembled._compile(code, assembledName);
