import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(__dirname, '../src');

const replacements = [
  // font-size (exact pixel values - integers)
  [/font-size:\s*80px/g, 'font-size: var(--font-size-hero)'],
  [/font-size:\s*48px/g, 'font-size: var(--font-size-hero)'],
  [/font-size:\s*40px/g, 'font-size: var(--font-size-5xl, 40px)'],
  [/font-size:\s*36px/g, 'font-size: var(--font-size-5xl, 36px)'],
  [/font-size:\s*32px/g, 'font-size: var(--font-size-5xl, 32px)'],
  [/font-size:\s*30px/g, 'font-size: var(--font-size-4xl, 30px)'],
  [/font-size:\s*28px/g, 'font-size: var(--font-size-3xl, 28px)'],
  [/font-size:\s*26px/g, 'font-size: var(--font-size-2xl, 26px)'],
  [/font-size:\s*24px/g, 'font-size: var(--font-size-4xl)'],
  [/font-size:\s*22px/g, 'font-size: var(--font-size-3xl)'],
  [/font-size:\s*20px/g, 'font-size: var(--font-size-2xl)'],
  [/font-size:\s*18px/g, 'font-size: var(--font-size-xl)'],
  [/font-size:\s*16px/g, 'font-size: var(--font-size-lg)'],
  [/font-size:\s*15px/g, 'font-size: var(--font-size-md-plus)'],
  [/font-size:\s*14px/g, 'font-size: var(--font-size-md)'],
  [/font-size:\s*13px/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*12px/g, 'font-size: var(--font-size-caption)'],
  [/font-size:\s*11px/g, 'font-size: var(--font-size-xs)'],
  [/font-size:\s*10px/g, 'font-size: var(--font-size-2xs)'],
  [/font-size:\s*9px/g, 'font-size: var(--font-size-2xs)'],
  [/font-size:\s*8px/g, 'font-size: var(--font-size-2xs)'],

  // font-size (half-pixel values)
  [/font-size:\s*13\.5px/g, 'font-size: var(--font-size-sm)'],
  [/font-size:\s*12\.5px/g, 'font-size: var(--font-size-caption)'],
  [/font-size:\s*11\.5px/g, 'font-size: var(--font-size-xs)'],
  [/font-size:\s*10\.5px/g, 'font-size: var(--font-size-2xs)'],
  [/font-size:\s*9\.5px/g, 'font-size: var(--font-size-2xs)'],
  [/font-size:\s*8\.5px/g, 'font-size: var(--font-size-2xs)'],

  // border-radius sizes
  [/border-radius:\s*9999px/g, 'border-radius: var(--border-radius-full)'],
  [/border-radius:\s*999px/g, 'border-radius: var(--border-radius-full)'],
  [/border-radius:\s*20px/g, 'border-radius: var(--border-radius-xl)'],
  [/border-radius:\s*16px/g, 'border-radius: var(--border-radius-xl)'],
  [/border-radius:\s*14px/g, 'border-radius: var(--card-radius, 14px)'],
  [/border-radius:\s*12px/g, 'border-radius: var(--card-radius)'],
  [/border-radius:\s*10px/g, 'border-radius: var(--border-radius-lg)'],
  [/border-radius:\s*8px/g, 'border-radius: var(--btn-radius)'],
  [/border-radius:\s*6px/g, 'border-radius: var(--border-radius-md)'],
  [/border-radius:\s*4px/g, 'border-radius: var(--border-radius-sm)'],
  [/border-radius:\s*2px/g, 'border-radius: var(--border-radius-sm)'],

  // compound border-radius values (multi-component)
  [/border-radius:\s*var\(--btn-radius\)\s*8px\s+0\s+0/g, 'border-radius: var(--btn-radius) var(--border-radius-md) 0 0'],
  [/border-radius:\s*0\s+0\s+8px\s+8px/g, 'border-radius: 0 0 var(--border-radius-md) var(--border-radius-md)'],
  [/border-radius:\s*0\s+0\s+0\s+8px/g, 'border-radius: 0 0 0 var(--border-radius-md)'],

  // compound: var(--card-radius) + sm
  [/var\(--card-radius\)\s*4px/g, 'var(--card-radius) var(--border-radius-sm)'],

  // border-radius with !important
  [/border-radius:\s*9999px\s*!important/g, 'border-radius: var(--border-radius-full) !important'],

  // font-weight
  [/font-weight:\s*900/g, 'font-weight: var(--font-weight-black, 900)'],
  [/font-weight:\s*800/g, 'font-weight: var(--font-weight-extrabold, 800)'],
  [/font-weight:\s*700/g, 'font-weight: var(--font-weight-bold)'],
  [/font-weight:\s*600/g, 'font-weight: var(--font-weight-semibold)'],
  [/font-weight:\s*500/g, 'font-weight: var(--font-weight-medium)'],
  [/font-weight:\s*400/g, 'font-weight: var(--font-weight-normal)'],
  [/font-weight:\s*300/g, 'font-weight: var(--font-weight-light, 300)'],

  // common colors - exact hex
  [/color:\s*#dc2626/gi, 'color: var(--color-danger, #dc2626)'],
  [/color:\s*#ef4444/gi, 'color: var(--color-danger, #ef4444)'],
  [/color:\s*#16a34a/gi, 'color: var(--color-success, #16a34a)'],
  [/color:\s*#22c55e/gi, 'color: var(--color-success, #22c55e)'],
  [/color:\s*#10b981/gi, 'color: var(--color-success, #10b981)'],
  [/color:\s*#e53935/gi, 'color: var(--color-danger, #e53935)'],
  [/color:\s*#f05a28/gi, 'color: var(--color-primary, #f05a28)'],
  [/color:\s*#ea580c/gi, 'color: var(--color-primary, #ea580c)'],
  [/color:\s*#eb8c00/gi, 'color: var(--color-orange, #eb8c00)'],
  [/color:\s*#3b82f6/gi, 'color: var(--color-blue, #3b82f6)'],
  [/color:\s*#f59e0b/gi, 'color: var(--color-orange, #f59e0b)'],
  [/color:\s*#2563eb/gi, 'color: var(--color-blue, #2563eb)'],
  [/color:\s*#d97706/gi, 'color: var(--color-orange, #d97706)'],
  [/color:\s*#c2410c/gi, 'color: var(--color-primary, #c2410c)'],
  [/color:\s*#2f80ed/gi, 'color: var(--color-blue, #2f80ed)'],
  [/color:\s*#ca8a04/gi, 'color: var(--color-yellow-600, #ca8a04)'],
  [/color:\s*#25D366/gi, 'color: var(--color-whatsapp, #25D366)'],
  [/color:\s*#128C7E/gi, 'color: var(--color-whatsapp-dark, #128C7E)'],
  [/color:\s*#0FF/gi, 'color: var(--color-cyan, #0FF)'],
  [/color:\s*#555(?![0-9a-fA-F])/gi, 'color: var(--color-gray-600, #555)'],

  // border-color (common status colors) - with hex boundary to avoid matching 8-digit alpha colors
  [/border-color:\s*#dc2626(?![0-9a-fA-F])/gi, 'border-color: var(--color-danger, #dc2626)'],
  [/border-color:\s*#ef4444(?![0-9a-fA-F])/gi, 'border-color: var(--color-danger, #ef4444)'],
  [/border-color:\s*#16a34a(?![0-9a-fA-F])/gi, 'border-color: var(--color-success, #16a34a)'],
  [/border-color:\s*#f05a28(?![0-9a-fA-F])/gi, 'border-color: var(--color-primary, #f05a28)'],
  [/border-color:\s*#ea580c(?![0-9a-fA-F])/gi, 'border-color: var(--color-primary, #ea580c)'],
  [/border-color:\s*#25D366(?![0-9a-fA-F])/gi, 'border-color: var(--color-whatsapp, #25D366)'],
  [/border-color:\s*#fecaca(?![0-9a-fA-F])/gi, 'border-color: var(--color-danger-light, #fecaca)'],
  [/border-color:\s*#0FF(?![0-9a-fA-F])/gi, 'border-color: var(--color-cyan, #0FF)'],

  // background-color for status backgrounds
  [/background-color:\s*#f0fdf4/gi, 'background-color: var(--bg-success, #f0fdf4)'],
  [/background-color:\s*#fef2f2/gi, 'background-color: var(--bg-danger, #fef2f2)'],
  [/background-color:\s*#fef9c3/gi, 'background-color: var(--bg-warning-light, #fef9c3)'],
  [/background-color:\s*#e8fdf0/gi, 'background-color: var(--bg-whatsapp, #e8fdf0)'],
  [/background-color:\s*#dcfce7/gi, 'background-color: var(--bg-success-light, #dcfce7)'],
  [/background-color:\s*#dbeafe/gi, 'background-color: var(--bg-primary-light, #dbeafe)'],
  [/background-color:\s*#2a2b30/gi, 'background-color: var(--color-gray-800, #2a2b30)'],
  [/background-color:\s*#e8e8ec/gi, 'background-color: var(--color-gray-200, #e8e8ec)'],

  // 8-digit hex colors with alpha (e.g., #16a34a15)
  [/background:\s*#16a34a[\da-fA-F]{2}(?![\da-fA-F])/gi, 'background: var(--color-success-transparent, #16a34a15)'],
  [/background:\s*#6b7280[\da-fA-F]{2}(?![\da-fA-F])/gi, 'background: var(--color-gray-500-transparent, #6b728015)'],

  // background shorthand colors
  [/background:\s*#d1fae5/gi, 'background: var(--bg-success-light, #d1fae5)'],
  [/background:\s*#fee2e2/gi, 'background: var(--bg-danger-light, #fee2e2)'],
  [/background:\s*#dbeafe/gi, 'background: var(--bg-primary-light, #dbeafe)'],
  [/background:\s*#e5e7eb/gi, 'background: var(--color-gray-200, #e5e7eb)'],
  [/background:\s*#dcfce7/gi, 'background: var(--bg-success-light, #dcfce7)'],
  [/background:\s*#fef2f2/gi, 'background: var(--bg-danger, #fef2f2)'],
  [/background:\s*#f05a28/gi, 'background: var(--color-primary, #f05a28)'],
  [/background:\s*#eab308/gi, 'background: var(--color-yellow-500, #eab308)'],
  [/background:\s*#ef4444(?![0-9a-fA-F])/gi, 'background: var(--color-danger, #ef4444)'],
  [/background:\s*#dc2626(?![0-9a-fA-F])/gi, 'background: var(--color-danger, #dc2626)'],
  [/background:\s*#fff(?![0-9a-fA-F])/gi, 'background: var(--bg-card, #fff)'],
  [/background:\s*#000(?![0-9a-fA-F])/gi, 'background: var(--color-black, #000)'],

  // font-weight: bold (keyword value)
  [/font-weight:\s*bold(?:\s*!important)?/g, (m) => m.includes('!important') ? 'font-weight: var(--font-weight-bold) !important' : 'font-weight: var(--font-weight-bold)'],

  // additional specific colors (auth page: register accent, etc.)
  [/background-color:\s*#9ee63c/gi, 'background-color: var(--color-register-green, #9ee63c)'],
  [/border-color:\s*#9ee63c/gi, 'border-color: var(--color-register-green, #9ee63c)'],
  [/color:\s*#9ee63c/gi, 'color: var(--color-register-green, #9ee63c)'],
  [/color:\s*#f97316/gi, 'color: var(--color-orange, #f97316)'],
  [/color:\s*#444(?![0-9a-fA-F])/gi, 'color: var(--color-gray-700, #444)'],

  // additional specific colors (accounts-payable, returns, etc.)
  [/color:\s*#a16207/gi, 'color: var(--color-yellow-700, #a16207)'],
  [/color:\s*#15803d/gi, 'color: var(--color-green-700, #15803d)'],

  // additional specific colors (cash-register, accounts-receivable, etc.)
  [/color:\s*#065f46/gi, 'color: var(--color-green-800, #065f46)'],
  [/color:\s*#059669/gi, 'color: var(--color-success, #059669)'],
  [/color:\s*#991b1b/gi, 'color: var(--color-red-800, #991b1b)'],
  [/color:\s*#1e40af/gi, 'color: var(--color-blue-800, #1e40af)'],
  [/color:\s*#374151/gi, 'color: var(--color-gray-700, #374151)'],
  [/color:\s*#92400e/gi, 'color: var(--color-amber-800, #92400e)'],
  [/color:\s*#9a3412/gi, 'color: var(--color-orange-800, #9a3412)'],

  // background shorthand colors (for status badges)
  [/background:\s*#fef3c7/gi, 'background: var(--bg-warning, #fef3c7)'],
  [/background:\s*#ffedd5/gi, 'background: var(--bg-orange-light, #ffedd5)'],

  // POS page specific colors
  [/background-color:\s*#17181c/gi, 'background-color: var(--color-gray-800, #17181c)'],
  [/background-color:\s*#15803d/gi, 'background-color: var(--color-green-700, #15803d)'],

  // color: #fff
  [/color:\s*#fff(?![0-9a-fA-F])(?:\s*!important)?/gi, (m) => `color: var(--text-on-primary, #fff)`],

  // common gray / neutral colors (with hex word boundary)
  [/color:\s*#000(?![0-9a-fA-F])/gi, 'color: var(--color-black, #000)'],
  [/color:\s*#111(?![0-9a-fA-F])/gi, 'color: var(--color-gray-900, #111)'],
  [/color:\s*#1a1a1e/gi, 'color: var(--color-surface, #1a1a1e)'],
  [/color:\s*#222(?![0-9a-fA-F])/gi, 'color: var(--color-gray-800, #222)'],
  [/color:\s*#333(?![0-9a-fA-F])/gi, 'color: var(--color-gray-800, #333)'],
  [/color:\s*#475569/gi, 'color: var(--color-gray-600, #475569)'],
  [/color:\s*#4a5568/gi, 'color: var(--color-gray-600, #4a5568)'],
  [/color:\s*#64748b/gi, 'color: var(--color-gray-500, #64748b)'],
  [/color:\s*#666(?![0-9a-fA-F])/gi, 'color: var(--color-gray-500, #666)'],
  [/color:\s*#6b7280/gi, 'color: var(--color-gray-500, #6b7280)'],
  [/color:\s*#777(?![0-9a-fA-F])/gi, 'color: var(--color-gray-400, #777)'],
  [/color:\s*#888(?![0-9a-fA-F])/gi, 'color: var(--color-gray-400, #888)'],
  [/color:\s*#94a3b8/gi, 'color: var(--color-gray-400, #94a3b8)'],
  [/color:\s*#999(?![0-9a-fA-F])/gi, 'color: var(--color-gray-400, #999)'],
  [/color:\s*#a0aec0/gi, 'color: var(--color-gray-400, #a0aec0)'],
  [/color:\s*#9ca3af/gi, 'color: var(--color-gray-400, #9ca3af)'],
  [/color:\s*#aaa(?![0-9a-fA-F])/gi, 'color: var(--color-gray-400, #aaa)'],
  [/color:\s*#ccc(?![0-9a-fA-F])/gi, 'color: var(--color-gray-300, #ccc)'],
  [/color:\s*#cbd5e1/gi, 'color: var(--color-gray-300, #cbd5e1)'],
  [/color:\s*#d1d5db/gi, 'color: var(--color-gray-300, #d1d5db)'],
  [/color:\s*#e2e8f0/gi, 'color: var(--color-gray-200, #e2e8f0)'],
  [/color:\s*#e5e7eb/gi, 'color: var(--color-gray-200, #e5e7eb)'],
  [/color:\s*#eee(?![0-9a-fA-F])/gi, 'color: var(--color-gray-100, #eee)'],
  [/color:\s*#f1f5f9/gi, 'color: var(--bg-hover, #f1f5f9)'],
  [/color:\s*#f3f4f6/gi, 'color: var(--color-gray-100, #f3f4f6)'],

  // background-color grays / neutrals (with hex word boundary)
  [/background-color:\s*#000(?![0-9a-fA-F])/gi, 'background-color: var(--color-black, #000)'],
  [/background-color:\s*#111(?![0-9a-fA-F])/gi, 'background-color: var(--color-gray-900, #111)'],
  [/background-color:\s*#1a1a1e/gi, 'background-color: var(--color-surface, #1a1a1e)'],
  [/background-color:\s*#222(?![0-9a-fA-F])/gi, 'background-color: var(--color-gray-800, #222)'],
  [/background-color:\s*#333(?![0-9a-fA-F])/gi, 'background-color: var(--color-gray-800, #333)'],
  [/background-color:\s*#1C1C1C/gi, 'background-color: var(--color-gray-800, #1C1C1C)'],
  [/background-color:\s*#121212/gi, 'background-color: var(--color-gray-900, #121212)'],
  [/background-color:\s*#f0f0f0/gi, 'background-color: var(--color-gray-100, #f0f0f0)'],
  [/background-color:\s*#f8f9fa/gi, 'background-color: var(--color-gray-50, #f8f9fa)'],
  [/background-color:\s*#f9fafb/gi, 'background-color: var(--color-gray-50, #f9fafb)'],
  [/background-color:\s*#fff(?![0-9a-fA-F])/gi, 'background-color: var(--bg-card, #fff)'],
  [/background-color:\s*#ffffff/gi, 'background-color: var(--bg-card, #fff)'],

  // border-color grays
  [/border-color:\s*#e5e7eb/gi, 'border-color: var(--border-color, #e5e7eb)'],
  [/border-color:\s*#e2e8f0/gi, 'border-color: var(--border-color, #e2e8f0)'],
  [/border-color:\s*#d1d5db/gi, 'border-color: var(--border-color, #d1d5db)'],
  [/border-color:\s*#cbd5e1/gi, 'border-color: var(--border-color, #cbd5e1)'],
  [/border-color:\s*#ccc/gi, 'border-color: var(--border-color, #ccc)'],
  [/border-color:\s*#333/gi, 'border-color: var(--color-gray-800, #333)'],

  // border-color for component-specific borders
  [/border-color:\s*#0F0F0F/gi, 'border-color: var(--color-black, #0F0F0F)'],

  // background for grids / overlays (animation specific)
  [/background-color:\s*#0F0F0F/gi, 'background-color: var(--color-black, #0F0F0F)'],

  // font-family
  [/font-family:\s*'Courier New', Courier, monospace/gi, "font-family: var(--font-family-mono)"],
  [/font-family:\s*'Courier New', monospace/gi, "font-family: var(--font-family-mono)"],
  [/font-family:\s*'Courier New', Courier, monospace !important/gi, "font-family: var(--font-family-mono) !important"],
  [/font-family:\s*'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif/gi, "font-family: var(--font-family)"],
  [/font-family:\s*'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important/gi, "font-family: var(--font-family) !important"],
  [/font-family:\s*'Segoe UI', system-ui, -apple-system, sans-serif !important/gi, "font-family: var(--font-family) !important"],
  [/font-family:\s*system-ui, -apple-system, sans-serif/gi, "font-family: var(--font-family)"],

  // border shorthands (expandShorthand catches these, so fix them)
  [/border:\s*2px\s+dashed\s+#1a1a1a/g, 'border: 2px dashed var(--color-gray-800, #1a1a1a)'],
  [/border:\s*1px\s+solid\s+#222/g, 'border: 1px solid var(--color-gray-800, #222)'],
  [/border:\s*1px\s+solid\s+#1C1C1C/g, 'border: 1px solid var(--color-gray-800, #1C1C1C)'],
  [/border:\s*1px\s+solid\s+#111/g, 'border: 1px solid var(--color-gray-900, #111)'],
  [/border:\s*6px\s+solid\s+#fff/g, 'border: 6px solid var(--text-on-primary, #fff)'],
  [/border:\s*2px\s+solid\s+#fff/g, 'border: 2px solid var(--text-on-primary, #fff)'],
  [/border:\s*1px\s+solid\s+#ef4444/g, 'border: 1px solid var(--color-danger, #ef4444)'],

  // rare but used colors
  [/color:\s*#FF4500/gi, 'color: var(--color-primary, #FF4500)'],
  [/color:\s*#7FFF00/gi, 'color: var(--color-success, #7FFF00)'],
];

let fixedCount = 0;
let fileCount = 0;

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.module.css')) {
      let content = readFileSync(fullPath, 'utf-8');
      let original = content;
      for (const [pattern, replacement] of replacements) {
        content = content.replace(pattern, replacement);
      }
      if (content !== original) {
        writeFileSync(fullPath, content, 'utf-8');
        const rel = fullPath.replace(srcDir, '').replace(/^[/\\]/, '');
        const changes = (content.match(/\bvar\(--/g) || []).length - (original.match(/\bvar\(--/g) || []).length;
        console.log(`${rel}: +${changes} var()`);
        fixedCount += changes;
        fileCount++;
      }
    }
  }
}

walkDir(srcDir);
console.log(`\n=== Resumen ===`);
console.log(`Archivos modificados: ${fileCount}`);
console.log(`Variables aplicadas: ${fixedCount}`);
