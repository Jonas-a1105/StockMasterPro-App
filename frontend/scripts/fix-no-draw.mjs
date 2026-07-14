import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const TARGET_DIRS = [
  resolve(process.cwd(), 'src/features'),
  resolve(process.cwd(), 'src/shared'),
  resolve(process.cwd(), 'src/pages')
];

const REPLACEMENTS = [
  // Border Style
  { regex: /border-style\s*:\s*solid\s*(!important)?\s*;?/gi, replace: 'border-style: var(--border-style) $1;' },

  // Border Radius
  { regex: /border-radius\s*:\s*50%\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-full) $1;' },
  { regex: /border-radius\s*:\s*0\s*!important\s*;?/gi, replace: 'border-radius: 0;' },
  { regex: /border-radius\s*:\s*2px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-sm) $1;' },
  { regex: /border-radius\s*:\s*4px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-sm) $1;' },
  { regex: /border-radius\s*:\s*6px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-md) $1;' },
  { regex: /border-radius\s*:\s*8px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-md) $1;' },
  { regex: /border-radius\s*:\s*10px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-lg) $1;' },
  { regex: /border-radius\s*:\s*12px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-lg) $1;' },
  { regex: /border-radius\s*:\s*16px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-xl) $1;' },
  { regex: /border-radius\s*:\s*20px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-xl) $1;' },
  { regex: /border-radius\s*:\s*24px\s*(!important)?\s*;?/gi, replace: 'border-radius: var(--radius-2xl) $1;' },

  // Border Width
  { regex: /border-width\s*:\s*1px\s*(!important)?\s*;?/gi, replace: 'border-width: var(--border-width) $1;' },
  { regex: /border-width\s*:\s*2px\s*(!important)?\s*;?/gi, replace: 'border-width: var(--border-width-focus) $1;' },
  { regex: /border-width\s*:\s*15px\s*(!important)?\s*;?/gi, replace: 'border-width: var(--border-width-activation, 15px) $1;' },

  // Border Color
  { regex: /border-color\s*:\s*transparent\s*(!important)?\s*;?/gi, replace: 'border-color: var(--color-transparent, transparent) $1;' },
  { regex: /border-color\s*:\s*(?:rgb\(226,\s*232,\s*240\)|\#e2e8f0)\s*(!important)?\s*;?/gi, replace: 'border-color: var(--color-border) $1;' },
  { regex: /border-color\s*:\s*rgba\(22,\s*163,\s*74,\s*0\.3\)\s*(!important)?\s*;?/gi, replace: 'border-color: color-mix(in srgb, var(--color-success) 30%, transparent) $1;' },
  { regex: /border-color\s*:\s*rgba\(107,\s*114,\s*128,\s*0\.3\)\s*(!important)?\s*;?/gi, replace: 'border-color: color-mix(in srgb, var(--color-text-muted) 30%, transparent) $1;' },
  { regex: /border-color\s*:\s*rgba\(220,\s*38,\s*38,\s*0\.3\)\s*(!important)?\s*;?/gi, replace: 'border-color: color-mix(in srgb, var(--color-danger) 30%, transparent) $1;' },
  { regex: /border-color\s*:\s*rgba\(245,\s*158,\s*11,\s*0\.3\)\s*(!important)?\s*;?/gi, replace: 'border-color: color-mix(in srgb, var(--color-warning) 30%, transparent) $1;' },

  // Borders
  { regex: /border\s*:\s*none\s*!important\s*;?/gi, replace: 'border: none;' },
  
  // 1. Border with custom colors/variables (e.g. 1px solid var(...), 1px solid #..., 1px solid color-mix(...))
  { regex: /border\s*:\s*1px\s*solid\s+([^;!]+)\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) $1 $2;' },
  { regex: /border\s*:\s*2px\s*solid\s+([^;!]+)\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width-focus) var(--border-style) $1 $2;' },
  
  // 2. Border standard style-only (e.g. 1px solid, 2px solid)
  { regex: /border\s*:\s*1px\s*solid\s*(!important)?\s*;/gi, replace: 'border: var(--border-width) var(--border-style) $1;' },
  { regex: /border\s*:\s*2px\s*solid\s*(!important)?\s*;/gi, replace: 'border: var(--border-width-focus) var(--border-style) $1;' },
  
  // 3. Specific patterns
  { regex: /border\s*:\s*2px\s*solid\s*currentcolor\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width-focus) var(--border-style) currentColor $1;' },
  { regex: /border\s*:\s*1px\s*solid\s*transparent\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) transparent $1;' },
  { regex: /border\s*:\s*1px\s*solid\s*(?:rgb\(226,\s*232,\s*240\)|\#e2e8f0)\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) var(--color-border) $1;' },
  { regex: /border\s*:\s*1px\s*solid\s*rgba\(0,\s*0,\s*0,\s*0\.1\)\s*(!important)?\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) var(--color-border) $1;' },
  { regex: /border\s*:\s*1px\s*solid\s*rgb\(220,\s*38,\s*38,\s*0\.2\)\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) color-mix(in srgb, var(--color-danger) 20%, transparent);' },
  { regex: /border\s*:\s*1px\s*solid\s*rgb\(240,\s*90,\s*40,\s*0\.1\)\s*;?/gi, replace: 'border: var(--border-width) var(--border-style) color-mix(in srgb, var(--color-primary) 10%, transparent);' },

  // Box Shadows
  { regex: /box-shadow\s*:\s*none\s*!important\s*;?/gi, replace: 'box-shadow: none;' },
  
  // Specific patterns matched in second pass
  { regex: /box-shadow\s*:\s*0\s*1px\s*3px\s*(?:rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)|rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)|\#000000[0-9a-f]{2}|rgb\(0\s*0\s*0\s*\/\s*[0-9]+%\))\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-sm) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*8px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-sm) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*8px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-sm) $1;' },
  { regex: /box-shadow\s*:\s*0\s*8px\s*24px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*8px\s*24px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*10px\s*25px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*10px\s*25px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*20px\s*60px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*-2px\s*0\s*20px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*-2px\s*0\s*20px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*12px\s*20px\s*rgba?\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*-8px\s*32px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*25px\s*50px\s*-12px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*4px\s*16px\s*rgb\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 40%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*6px\s*rgb\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 2px 6px color-mix(in srgb, var(--color-primary) 40%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*6px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-md) $1;' },
  { regex: /box-shadow\s*:\s*inset\s*0\s*0\s*0\s*36px\s*rgb\(22,\s*163,\s*74,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: inset 0 0 0 36px color-mix(in srgb, var(--color-success) 10%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*-4px\s*12px\s*-4px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-sm) $1;' },
  { regex: /box-shadow\s*:\s*0\s*1px\s*2px\s*0\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xs) $1;' },
  { regex: /box-shadow\s*:\s*0\s*1px\s*2px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xs) $1;' },
  { regex: /box-shadow\s*:\s*0\s*1px\s*2px\s*0\s*rgb\(0\s*0\s*0\s*\/\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xs) $1;' },
  { regex: /box-shadow\s*:\s*0\s*10px\s*40px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*10px\s*40px\s*rgb\(0\s*0\s*0\s*\/\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*6px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-md) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*4px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-md) $1;' },
  { regex: /box-shadow\s*:\s*0\s*4px\s*12px\s*rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  
  // Shared & Additional Patterns
  { regex: /box-shadow\s*:\s*0\s*4px\s*24px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*4px\s*10px\s*rgb\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 4px 10px color-mix(in srgb, var(--color-primary) 20%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*0\s*0\s*3px\s*rgb\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*8px\s*30px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-xl) $1;' },
  { regex: /box-shadow\s*:\s*0\s*0\s*20px\s*rgb\(255,\s*255,\s*255,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 0 20px var(--color-transparent-white, rgba(255, 255, 255, 0.2)) $1;' },
  { regex: /box-shadow\s*:\s*0\s*2px\s*6px\s*rgba\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 2px 6px color-mix(in srgb, var(--color-primary) 40%, transparent) $1;' },
  { regex: /box-shadow\s*:\s*0\s*4px\s*12px\s*rgb\(0,\s*0,\s*0,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: var(--shadow-lg) $1;' },
  { regex: /box-shadow\s*:\s*0\s*0\s*0\s*2px\s*rgb\(240,\s*90,\s*40,\s*0\.[0-9]+\)\s*(!important)?\s*;?/gi, replace: 'box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 12%, transparent) $1;' },
];

function findCssFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findCssFiles(fullPath));
      }
    } else if (entry.name.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let originalContent = content;

  for (const replacement of REPLACEMENTS) {
    content = content.replace(replacement.regex, replacement.replace);
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

function main() {
  console.log('🚀 Starting styling auto-fixer script (Entire App)...');
  const cssFiles = [];
  for (const targetDir of TARGET_DIRS) {
    cssFiles.push(...findCssFiles(targetDir));
  }
  console.log(`🔍 Found ${cssFiles.length} CSS module files. Processing...`);

  for (const file of cssFiles) {
    fixFile(file);
  }
  console.log('🎉 Auto-fixer completed.');
}

main();
