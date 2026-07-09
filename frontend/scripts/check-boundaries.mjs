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

function getFeatureName(path) {
  const match = path.match(/(?:@features\/|features\/)([\w-]+)/);
  return match ? match[1] : null;
}

function isBarrelImport(importPath, featureName) {
  // Barrel imports are: @features/<name> or @features/<name>/index
  return importPath === `@features/${featureName}` || importPath === `@features/${featureName}/index`;
}

function isCssModule(importPath) {
  return importPath.endsWith('.module.css');
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

    // Absolute imports (@features/, @shared/)
    if (relPath.startsWith('shared') && isFeatureModule(importPath)) {
      console.error(`BOUNDARY ERROR: shared/ (${relPath}) imports from features/ (${importPath})`);
      errors++;
      continue;
    }

    // Skip CSS module imports — they are styling concerns, not logical coupling
    if (isCssModule(importPath)) continue;

    // A feature must not import internals of another feature; only barrels allowed
    const sourceFeature = getFeatureName(relPath);
    const targetFeature = getFeatureName(importPath);
    if (sourceFeature && targetFeature && sourceFeature !== targetFeature) {
      if (!isBarrelImport(importPath, targetFeature)) {
        console.error(`BOUNDARY ERROR: ${relPath} imports internal path from ${targetFeature} feature (${importPath}). Use @features/${targetFeature} instead.`);
        errors++;
      }
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
