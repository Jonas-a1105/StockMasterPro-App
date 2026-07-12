import * as XLSX from 'xlsx';

export interface ColumnMapping {
  header: string;
  key: string;
  type?: 'string' | 'number' | 'boolean';
}

/**
 * Exports a JSON array to an Excel or CSV file.
 * @param data Array of objects to export
 * @param columns Array of column definitions
 * @param filename Base filename (without extension)
 * @param format 'xlsx' or 'csv'
 */
export function exportToExcel(
  data: any[],
  columns: ColumnMapping[],
  filename: string,
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  // Map internal keys to user-facing headers
  const worksheetData = data.map((item) => {
    const row: any = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  if (format === 'csv') {
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: 'xlsx' });
  }
}

/**
 * Generates and downloads a blank template file.
 * @param columns Array of column definitions
 * @param filename Base filename
 * @param format 'xlsx' or 'csv'
 */
export function downloadTemplate(
  columns: ColumnMapping[],
  filename: string,
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  const exampleRow: any = {};

  columns.forEach((col) => {
    // Provide nice examples
    if (col.key === 'name') exampleRow[col.header] = 'Producto Ejemplo';
    else if (col.key === 'barcode') exampleRow[col.header] = '123456789';
    else if (col.key === 'price') exampleRow[col.header] = 99.99;
    else if (col.key === 'cost') exampleRow[col.header] = 49.99;
    else if (col.key === 'stock') exampleRow[col.header] = 100;
    else if (col.key === 'minStock') exampleRow[col.header] = 10;
    else if (col.key === 'brand') exampleRow[col.header] = 'Marca Premium';
    else if (col.key === 'description') exampleRow[col.header] = 'Breve descripción';
    else if (col.key === 'phone') exampleRow[col.header] = '+123456789';
    else if (col.key === 'email') exampleRow[col.header] = 'ejemplo@correo.com';
    else if (col.key === 'contact') exampleRow[col.header] = 'Contacto Ejemplo';
    else if (col.key === 'address') exampleRow[col.header] = 'Dirección Ejemplo';
    else exampleRow[col.header] = '';
  });

  const worksheet = XLSX.utils.json_to_sheet([exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

  if (format === 'csv') {
    XLSX.writeFile(workbook, `${filename}_plantilla.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, `${filename}_plantilla.xlsx`, { bookType: 'xlsx' });
  }
}

/**
 * Parses an uploaded Excel or CSV file into a JSON array.
 * @param file The File object from input
 * @param columns Array of column definitions to validate and map
 * @returns Promise with parsed and mapped rows
 */
export function parseExcelFile(
  file: File,
  columns: ColumnMapping[]
): Promise<{ success: boolean; data: any[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            data: [],
            errors: ['No se pudieron leer los datos del archivo.'],
          });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse rows
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        if (rawRows.length === 0) {
          resolve({ success: false, data: [], errors: ['El archivo está vacío.'] });
          return;
        }

        // Map column headers back to internal keys
        const parsedData: any[] = [];
        const errors: string[] = [];

        rawRows.forEach((row) => {
          const mappedRow: any = {};
          let hasData = false;

          columns.forEach((col) => {
            // Find key in row (case-insensitive check)
            const matchedKey = Object.keys(row).find(
              (k) => k.trim().toLowerCase() === col.header.trim().toLowerCase()
            );

            if (matchedKey) {
              let value = row[matchedKey];
              hasData = true;

              // Type coercion
              if (col.type === 'number') {
                const num = Number(value);
                mappedRow[col.key] = isNaN(num) ? 0 : num;
              } else if (col.type === 'boolean') {
                mappedRow[col.key] = String(value).toLowerCase() === 'true' || value === 1;
              } else {
                mappedRow[col.key] =
                  value !== undefined && value !== null ? String(value).trim() : '';
              }
            } else {
              // Missing column
              mappedRow[col.key] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : '';
            }
          });

          if (hasData) {
            parsedData.push(mappedRow);
          }
        });

        resolve({ success: true, data: parsedData, errors });
      } catch (err: any) {
        resolve({ success: false, data: [], errors: [`Error de procesamiento: ${err.message}`] });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, data: [], errors: ['Error al leer el archivo.'] });
    };

    reader.readAsBinaryString(file);
  });
}
