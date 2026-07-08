import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(__dirname, '../src');
const IMPORT_RE = /from\s+['"](.+)['"]/g;

let errors = 0;

function isFeatureModule(importPath) {
  return importPath.startsWith('@features/') || importPath.startsWith('features/');
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = relative(srcDir, filePath).replace(/\\/g, '/');

  for (const match of content.matchAll(IMPORT_RE)) {
    const importPath = match[1];

    if (importPath.startsWith('.')) {
      const dir = filePath.substring(0, filePath.lastIndexOf(/\\|\//.test(filePath) ? '\\' : '/'));
      const resolved = resolve(dir, importPath);
      const resolvedRel = relative(srcDir, resolved).replace(/\\/g, '/');

      if (resolvedRel.startsWith('features') && relPath.startsWith('shared')) {
        console.error(`BOUNDARY ERROR: ${relPath} imports from features/ (${importPath})`);
        errors++;
      }
      continue;
    }

    if (relPath.startsWith('shared') && isFeatureModule(importPath)) {
      console.error(`BOUNDARY ERROR: ${relPath} imports from features/ (${importPath})`);
      errors++;
    }
  }
}

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      checkFile(fullPath);
    }
  }
}

walkDir(srcDir);

if (errors > 0) {
  console.error(`\n${errors} boundary violation(s) found.`);
  process.exit(1);
} else {
  console.log('✓ No boundary violations found.');
}
