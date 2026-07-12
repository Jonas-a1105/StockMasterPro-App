const fs = require('fs');
const content = fs.readFileSync(
  'C:/Users/Usuario/Downloads/StockMaster - PRO/frontend/src/features/settings/pages/SettingsPage.tsx',
  'utf-8'
);
const regex = /style=\{([^}]+)\}/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  const line = content.substring(0, match.index).split('\n').length;
  const val = match[1].trim();
  console.log(`Line ${line}: ${val.substring(0, 120)}`);
}
console.log(`Total: ${count}`);
