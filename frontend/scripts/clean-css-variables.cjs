const fs = require('fs');
const path = require('path');

const MAP = {
  '--color-orange-red': '--color-primary',
  '--brand-orange': '--color-primary',
  '--brand-orange-light': '--color-primary-light',
  '--bg-primary-light': '--color-primary-light',
  '--bg-card': '--color-surface',
  '--bg-app': '--color-bg',
  '--bg-main': '--color-bg',
  '--bg-hover': '--color-bg-hover',
  '--text-dark': '--color-text',
  '--text-main': '--color-text',
  '--text-muted': '--color-text-muted',
  '--text-light': '--color-text-light',
  '--border-color': '--color-border',
  '--bg-success-light': '--color-success-bg',
  '--bg-success': '--color-success-bg',
  '--bg-danger-light': '--color-danger-bg',
  '--bg-danger': '--color-danger-bg',
  '--bg-warning-light': '--color-warning-bg',
  '--bg-warning': '--color-warning-bg',
  '--bg-info-light': '--color-info-bg',
  '--bg-info': '--color-info-bg',
  '--color-green-700': '--color-success',
  '--color-green-800': '--color-success',
  '--color-red-700': '--color-danger',
  '--color-red-800': '--color-danger',
  '--color-yellow-700': '--color-warning',
  '--color-amber-800': '--color-warning',
  '--color-orange-800': '--color-warning',
  '--color-primary-hover': '--color-primary-hover',
  '--btn-radius': '--btn-radius',
  '--card-radius': '--card-radius',
  '--brand': '--color-primary',
  '--border': '--color-border',
  '--bg-secondary': '--color-bg-hover',
  '--bg-tertiary': '--color-bg-active',
  '--text-on-primary': '--color-on-primary',
};

function mapVariable(name) {
  return MAP[name] || name;
}

function removeFallbacks(content) {
  let output = '';
  let i = 0;
  while (i < content.length) {
    if (content.substr(i, 4) === 'var(') {
      let parenthesesCount = 1;
      let j = i + 4;
      let innerText = '';
      while (j < content.length && parenthesesCount > 0) {
        if (content[j] === '(') parenthesesCount++;
        else if (content[j] === ')') parenthesesCount--;
        
        if (parenthesesCount > 0) {
          innerText += content[j];
        }
        j++;
      }
      
      // Split by comma at level 0 of nesting
      let commaIndex = -1;
      let innerParens = 0;
      for (let k = 0; k < innerText.length; k++) {
        if (innerText[k] === '(') innerParens++;
        else if (innerText[k] === ')') innerParens--;
        else if (innerText[k] === ',' && innerParens === 0) {
          commaIndex = k;
          break;
        }
      }
      
      let varName = innerText.trim();
      if (commaIndex !== -1) {
        varName = innerText.substring(0, commaIndex).trim();
      }
      
      // Map legacy variable names
      varName = mapVariable(varName);
      
      output += `var(${varName})`;
      i = j;
    } else {
      output += content[i];
      i++;
    }
  }
  return output;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && file.endsWith('.css')) {
      callback(filePath);
    }
  }
}

const srcDir = path.join(__dirname, '../src');

console.log('Cleaning up CSS files and variables...');
let count = 0;
walkDir(srcDir, (filePath) => {
  const filename = path.basename(filePath);
  // Exclude primitive/semantic tokens definitions
  if (filename === 'primitives.css' || filename === 'semantic.css') {
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = removeFallbacks(content);
  if (content !== cleaned) {
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log(`- Cleaned: ${path.relative(srcDir, filePath)}`);
    count++;
  }
});

console.log(`Cleanup finished. Refactored ${count} CSS files.`);
