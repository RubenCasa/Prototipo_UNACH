/**
 * Unifies multiple datasets based on a join key mapping.
 * 
 * @param {Array} filesData - Array of objects { name: string, rows: Array<Object> }
 * @param {Object} joinKeyMapping - Map of filename -> keyColumn (e.g. { "sicoa.csv": "cedula", "moodle.csv": "id" })
 * @param {Array<string>} selectedColumns - List of columns to keep in the final dataset
 * @returns {Array<Object>} Fused dataset
 */
export function fuseDatasets(filesData, joinKeyMapping, selectedColumns) {
  if (!filesData || filesData.length === 0) return [];

  // We use the first file as the base.
  const baseFile = filesData[0];
  const baseKey = joinKeyMapping[baseFile.name];

  if (!baseKey) {
    throw new Error(`No se encontró la llave de unión para el archivo base ${baseFile.name}`);
  }

  // Map to store fused rows by the unified key
  const fusedMap = new Map();

  // Initialize with the base file
  baseFile.rows.forEach(row => {
    const keyVal = row[baseKey];
    if (keyVal) {
      // Normalize key value (e.g. trim spaces)
      const normalizedKey = String(keyVal).trim();
      const newRow = { _unified_id: normalizedKey, ...row };
      fusedMap.set(normalizedKey, newRow);
    }
  });

  // Join the rest of the files
  for (let i = 1; i < filesData.length; i++) {
    const currentFile = filesData[i];
    const currentKey = joinKeyMapping[currentFile.name];

    if (!currentKey) {
      console.warn(`Saltando archivo ${currentFile.name}: no tiene llave de unión.`);
      continue;
    }

    currentFile.rows.forEach(row => {
      const keyVal = row[currentKey];
      if (keyVal) {
        const normalizedKey = String(keyVal).trim();
        if (fusedMap.has(normalizedKey)) {
          // Merge properties, overwriting base properties if they exist
          const existingRow = fusedMap.get(normalizedKey);
          fusedMap.set(normalizedKey, { ...existingRow, ...row });
        } else {
          // If we want a FULL OUTER JOIN, we would add it. For now, LEFT JOIN is safer to ensure we only analyze students present in SICOA.
          // fusedMap.set(normalizedKey, { _unified_id: normalizedKey, ...row });
        }
      }
    });
  }

  // Now, filter the fused map to only keep the selectedColumns, plus the unified ID.
  const fusedRows = Array.from(fusedMap.values());
  const finalRows = fusedRows.map(row => {
    const filteredRow = {};
    // Ensure the ID is always included for reference
    filteredRow['ID_Unificado'] = row['_unified_id'];

    selectedColumns.forEach(col => {
      // It's possible the column doesn't exist if it was dropped or renamed, but we try to include it.
      if (row[col] !== undefined) {
        filteredRow[col] = row[col];
      }
    });
    return filteredRow;
  });

  return finalRows;
}
