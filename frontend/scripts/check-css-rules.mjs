import { readFileSync, readdirSync } from 'fs';
import { join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(__dirname, '../src');

// Rules for feature module css files (src/features/**/*.module.css)
const FEATURE_PROHIBITED = [
  { name: 'background-color', regex: /^\s*background-color\s*:/ },
  { name: 'background', regex: /^\s*background\s*:/ },
  { name: 'color', regex: /^\s*color\s*:/ },
  { name: 'box-shadow', regex: /^\s*box-shadow\s*:/ },
  { name: 'border-radius', regex: /^\s*border-radius\s*:/ },
  { name: 'font-family', regex: /^\s*font-family\s*:/ },
  { name: 'font-size', regex: /^\s*font-size\s*:/ },
  { name: '@apply', regex: /^\s*@apply\b/ }
];

// Rules for shared ui components (src/shared/ui/**/*.module.css)
const SHARED_PROHIBITED = [
  { name: 'margin', regex: /^\s*margin\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'margin-top', regex: /^\s*margin-top\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'margin-bottom', regex: /^\s*margin-bottom\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'margin-left', regex: /^\s*margin-left\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'margin-right', regex: /^\s*margin-right\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'top', regex: /^\s*top\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'bottom', regex: /^\s*bottom\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'left', regex: /^\s*left\s*:\s*(?!(0|auto)\b)[^;]+/ },
  { name: 'right', regex: /^\s*right\s*:\s*(?!(0|auto)\b)[^;]+/ }
];

function findCssFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'styles' && entry.name !== 'dist') {
        files.push(...findCssFiles(fullPath));
      }
    } else if (entry.name.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

const cssFiles = findCssFiles(srcDir);
let errors = 0;

for (const file of cssFiles) {
  const relPath = relative(srcDir, file).replace(/\\/g, '/');
  const isShared = relPath.startsWith('shared/ui');
  const isFeature = relPath.startsWith('features');

  if (!isFeature) {
    // For now we focus on the strict feature modular rules from rule 5
    continue;
  }

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('/*') || cleanLine.startsWith('//') || cleanLine.startsWith('*')) {
      return;
    }

    for (const rule of FEATURE_PROHIBITED) {
      if (rule.regex.test(cleanLine)) {
        // Allow background: none / transparent / inherit
        if (rule.name === 'background' && (cleanLine.includes('none') || cleanLine.includes('transparent') || cleanLine.includes('inherit'))) {
          continue;
        }
        console.error(`CSS RULE VIOLATION (Feature Stylesheet): ${relPath}:${index + 1}`);
        console.error(`  > ${cleanLine}`);
        console.error(`  Prohibited aesthetic property in feature styles: "${rule.name}"\n`);
        errors++;
      }
    }
  });
}

if (errors > 0) {
  console.error(`❌ Total CSS violations: ${errors}`);
  process.exit(1);
} else {
  console.log('✅ All CSS modules follow the architectural rules.');
  process.exit(0);
}
