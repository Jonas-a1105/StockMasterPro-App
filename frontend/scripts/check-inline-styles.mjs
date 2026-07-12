import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(__dirname, '../src');
const INLINE_STYLE_RE = /style=\{ *\{/g;

let errors = 0;

function hasNonCustomProps(block) {
  const props = block.match(/[-\w]+:/g);
  if (!props) return false;
  return props.some(p => !p.startsWith('--'));
}

function extractInlineStyleObject(content, startIndex) {
  let i = startIndex;
  // skip past style={{
  while (i < content.length && content[i] !== '{') i++;
  i++; // skip first {
  while (i < content.length && content[i] !== '{') i++;
  i++; // skip second {
  let depth = 1;
  const start = i;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  return content.slice(start, i - 1);
}

function checkFile(filePath) {
  const relPath = filePath.replace(srcDir.replace(/\\/g, '/'), '').replace(/^[/\\]/, '');
  const content = readFileSync(filePath, 'utf-8');
  const matches = [...content.matchAll(INLINE_STYLE_RE)];

  if (matches.length > 0) {
    for (const match of matches) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const styleBlock = extractInlineStyleObject(content, match.index);
      if (styleBlock && !hasNonCustomProps(styleBlock)) {
        continue;
      }
      console.error(`INLINE STYLE: ${relPath}:${lineNum}`);
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
    } else if (entry.isFile() && (entry.name.endsWith('.tsx'))) {
      checkFile(fullPath);
    }
  }
}

walkDir(srcDir);

if (errors > 0) {
  console.error(`\n${errors} inline style(s) found. Migrate to CSS modules / <Text> / <Card>.`);
  process.exit(1);
} else {
  console.log('✓ No inline styles found.');
}
