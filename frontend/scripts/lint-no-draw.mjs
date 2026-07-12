#!/usr/bin/env node
/**
 * Lint: "no dibujar en páginas"
 * Falla si un *.module.css dentro de features/ declara box-shadow, border o border-radius
 * con valores crudos en vez de tokens semánticos.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

const FEATURES_DIR = resolve(process.cwd(), 'src/features');

// Propiedades CSS a revisar
const PROPERTIES_TO_CHECK = [
  'box-shadow',
  'border',
  'border-radius',
  'border-width',
  'border-color',
  'border-style',
];

// Patrones de valores permitidos (no son "crudos")
const ALLOWED_VALUE_PATTERNS = [
  /^\s*0(?:px)?\s*$/,
  /^\s*none\s*$/,
  /^\s*inherit\s*$/,
  /^\s*initial\s*$/,
  /^\s*unset\s*$/,
  // Valores que contienen var(--...) en cualquier parte
  /var\(--/,
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

function extractPropertyValue(line, property) {
  // Busca la propiedad y extrae su valor hasta el siguiente ; o fin de línea
  const regex = new RegExp(`\\b${property}\\s*:\\s*([^;]+)`, 'i');
  const match = line.match(regex);
  return match ? match[1].trim() : null;
}

function isValueAllowed(value) {
  if (!value) return false;
  return ALLOWED_VALUE_PATTERNS.some(pattern => pattern.test(value));
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(resolve(process.cwd(), 'frontend/src'), filePath);
  const errors = [];

  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('//')) return;

    for (const prop of PROPERTIES_TO_CHECK) {
      const value = extractPropertyValue(line, prop);
      if (value && !isValueAllowed(value)) {
        errors.push({
          file: relativePath,
          line: lineNum + 1,
          column: line.indexOf(prop) + 1,
          message: `Valor crudo detectado en "${prop}": "${value}" - usar token semántico (var(--...))`,
          line: line.trim(),
        });
      }
    }
  });

  return errors;
}

function main() {
  console.log('🔍 Ejecutando lint "no dibujar en páginas"...');
  console.log(`📁 Directorio: ${FEATURES_DIR}\n`);

  const cssFiles = findCssFiles(FEATURES_DIR);
  console.log(`📄 Archivos .module.css encontrados: ${cssFiles.length}\n`);

  let totalErrors = 0;
  const allErrors = [];

  for (const file of cssFiles) {
    const errors = checkFile(file);
    if (errors.length > 0) {
      totalErrors += errors.length;
      allErrors.push(...errors);
    }
  }

  if (totalErrors > 0) {
    console.log('❌ ERRORES ENCONTRADOS:\n');
    for (const error of allErrors) {
      console.log(`  📄 ${error.file}:${error.line}:${error.column}`);
      console.log(`     ${error.message}`);
      console.log(`     > ${error.line}\n`);
    }
    console.log(`Total: ${totalErrors} error(es)`);
    process.exit(1);
  } else {
    console.log('✅ No se encontraron valores crudos. Todas las páginas usan tokens semánticos.');
    process.exit(0);
  }
}

main();