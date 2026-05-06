const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

mkdirSync('.test-build', { recursive: true });
writeFileSync(join('.test-build', 'package.json'), '{"type":"commonjs"}\n');
