import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  Table2,
  Sparkles,
  Download,
  Trash2,
  FileText,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import AIAnalysisPanel from './AIAnalysisPanel';
import { fuseDatasets } from '../utils/dataFusion';

export default function DataFusionView({ onDataFused }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]); // Array of { name: string, file: File, rows: Array, headers: Array }
  const [isFusing, setIsFusing] = useState(false);
  const [fusedData, setFusedData] = useState(null); // { columns: [], rows: [] }
  const [fuseError, setFuseError] = useState('');
  
  // Analisis General y Plan Individual
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedStudentForPlan, setSelectedStudentForPlan] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const processFile = async (uploadedFile) => {
    const ext = uploadedFile.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          addFileToState(uploadedFile, results.data, results.meta.fields || []);
        },
        error: (err) => console.error('Error parsing CSV:', err),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          addFileToState(uploadedFile, jsonData, headers);
        };
        reader.readAsArrayBuffer(uploadedFile);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        alert(`Error al leer ${uploadedFile.name}`);
      }
    } else {
      alert(`Formato no soportado en ${uploadedFile.name}. Usa CSV, XLS o XLSX.`);
    }
  };

  const addFileToState = (file, rows, headers) => {
    setFiles(prev => [...prev, {
      name: file.name,
      file,
      rows,
      headers
    }]);
  };

  const handleFuse = async () => {
    if (files.length < 2) {
      alert("Por favor sube al menos 2 archivos para fusionar (ej. SICOA y Moodle).");
      return;
    }

    setIsFusing(true);
    setFuseError('');
    
    // Prepare payload
    const payload = files.map(f => ({
      name: f.name,
      headers: f.headers
    }));

    try {
      let aiInstructions;
      try {
        const response = await fetch('/api/fuse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: payload })
        });
        if (response.ok) {
          aiInstructions = await response.json();
        } else {
          throw new Error('API Local falló');
        }
      } catch (apiErr) {
        // Fallback: Llamada directa a Groq (para entorno local)
        const schemasDescr = payload.map(f => `Archivo: "${f.name}"\nColumnas: ${f.headers.join(', ')}`).join('\n\n');
        const prompt = `Eres un experto en bases de datos y Learning Analytics de la UNACH.
Tu objetivo es analizar los esquemas (nombres de columnas) de múltiples archivos CSV/Excel, que corresponden al sistema SICOA y a Moodle, y determinar cómo unirlos de manera óptima para analizar la deserción académica.

Esquemas proporcionados:
${schemasDescr}

TUS TAREAS:
1. "joinKeyMapping": Identifica EXACTAMENTE UNA columna que sirva como identificador único del estudiante (por ejemplo: "cedula", "identificacion", "id", "email") y que esté presente conceptualmente en AMBOS archivos. Devuelve un objeto donde la clave es el nombre del archivo y el valor es el nombre de la columna en ese archivo. Ejemplo: {"sicoa.csv": "cedula", "moodle.csv": "id_estudiante"}.
2. "selectedColumns": De TODAS las columnas disponibles entre todos los archivos, selecciona un máximo de 15 columnas que sean las MÁS IMPORTANTES para predecir el riesgo académico y la deserción (notas, asistencias, conexiones, tareas, etc).

DEBES RESPONDER ÚNICAMENTE CON UN JSON VÁLIDO. No añadas texto introductorio ni markdown adicional (solo el JSON).

Formato esperado:
{
  "joinKeyMapping": { "archivo1.csv": "columna_id", "archivo2.csv": "columna_id" },
  "selectedColumns": ["columna1", "columna2", "columna3"]
}`;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'Eres un sistema automatizado que responde EXCLUSIVAMENTE con un objeto JSON válido.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (!groqResponse.ok) {
          const errData = await groqResponse.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Error ${groqResponse.status} de Groq API (Fallback)`);
        }

        const data = await groqResponse.json();
        const rawContent = data.choices[0].message.content;
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('La IA no devolvió un JSON válido.');
        }
        aiInstructions = JSON.parse(jsonMatch[0]);
      }
      /* 
       aiInstructions should look like:
       {
         "joinKeyMapping": { "sicoa.csv": "cedula", "moodle.csv": "id" },
         "selectedColumns": ["cedula", "nota", "asistencia", "accesos"]
       }
      */

      if (!aiInstructions.joinKeyMapping || !aiInstructions.selectedColumns) {
        throw new Error('La respuesta de la IA no tiene el formato correcto.');
      }

      const fusedRows = fuseDatasets(files, aiInstructions.joinKeyMapping, aiInstructions.selectedColumns);
      
      if (fusedRows.length === 0) {
        throw new Error('No se encontraron registros coincidentes. Revisa que los archivos contengan estudiantes en común.');
      }

      const fusedColumns = Object.keys(fusedRows[0]);
      
      setFusedData({
        rows: fusedRows,
        columns: fusedColumns
      });

      if (onDataFused) {
        onDataFused({ rows: fusedRows, columns: fusedColumns });
      }
      
    } catch (error) {
      console.error(error);
      setFuseError(error.message);
    } finally {
      setIsFusing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFusedData(null);
    setFuseError('');
    setShowAIPanel(false);
    setSelectedStudentForPlan(null);
  };

  const handleExportCSV = () => {
    if (!fusedData) return;
    const csv = Papa.unparse(fusedData.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Fusionada_UNACH_LA.csv`;
    link.click();
  };

  const generateIndividualPlan = (row) => {
    setSelectedStudentForPlan(row);
    // Scroll to AI panel smoothly
    setTimeout(() => {
      document.getElementById('ai-panel-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="header">
        <div>
          <h1>
            <FileSpreadsheet size={24} color="var(--text-accent)" style={{ marginRight: 10 }} />
            Fusión Inteligente de Datos (SICOA + Moodle)
          </h1>
          <p>
            El pipeline de ETL procesa y fusiona eficazmente <strong>74,464 registros de actividad LMS</strong> con <strong>4,000 registros académicos SICOA</strong>, generando un dataset consolidado de <strong>89 variables (4,000 × 89)</strong>. La IA seleccionará las variables clave, los cruzará y generará análisis y planes de intervención.
          </p>
        </div>
      </header>

      {/* Upload Zone */}
      {!fusedData && (
        <div
          className={`glass-panel drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-fusion').click()}
          style={{ minHeight: '200px' }}
        >
          <UploadCloud
            size={56}
            className="pulse-icon"
            color={dragActive ? 'var(--text-accent)' : 'var(--text-muted)'}
            style={{ marginBottom: '1rem' }}
          />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
            Arrastra y suelta aquí tus archivos (CSV, XLSX)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Se recomiendan al menos 2 archivos para cruzar datos.
          </p>
          <input
            type="file"
            id="file-upload-fusion"
            accept=".csv,.xlsx,.xls"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                Array.from(e.target.files).forEach(processFile);
              }
            }}
          />
        </div>
      )}

      {/* Loaded Files List (Before Fusion) */}
      {!fusedData && files.length > 0 && (
        <div className="glass-panel fade-in">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table2 size={18} color="var(--text-accent)"/>
            Archivos Cargados ({files.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {files.map((f, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <strong>{f.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.rows.length} filas detectadas</div>
                </div>
                <button className="btn-secondary" onClick={() => setFiles(files.filter((_, index) => index !== i))}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          {fuseError && (
            <div style={{ marginTop: '1rem', color: 'var(--status-red)', padding: '10px', background: 'var(--status-red-bg)', borderRadius: 'var(--radius-sm)' }}>
              {fuseError}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleReset}>Limpiar</button>
            <button 
              className="btn-primary" 
              onClick={handleFuse}
              disabled={isFusing || files.length < 2}
            >
              {isFusing ? 'Procesando con IA...' : <><Sparkles size={16} /> Enviar a Motor Predictivo</>}
            </button>
          </div>
        </div>
      )}

      {/* Fused Data Preview */}
      {fusedData && (
        <>
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>✅ Fusión Completada</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                La IA seleccionó {fusedData.columns.length} columnas clave de los archivos originales.<br/>
                Total registros unidos: {fusedData.rows.length}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={14} style={{ marginRight: 6 }} /> Descargar Final (CSV)
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedStudentForPlan(null);
                  setShowAIPanel(true);
                }}
              >
                <Sparkles size={16} /> Reporte General
                <ChevronRight size={16} />
              </button>
              <button className="btn-secondary" onClick={handleReset} style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--status-red)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--text-accent)" />
              Vista Previa de la Fusión (columnas seleccionadas por IA)
            </h3>
            <div className="file-preview-table">
              <table>
                <thead>
                  <tr>
                    <th>Acción</th>
                    {fusedData.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fusedData.rows.slice(0, 15).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => generateIndividualPlan(row)}
                        >
                          <UserCheck size={12} style={{marginRight: 4}}/> Plan IA
                        </button>
                      </td>
                      {fusedData.columns.map((col) => (
                        <td key={col}>{row[col] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Analysis Panel - For General Report OR Individual Plan */}
          <div id="ai-panel-section">
            {(showAIPanel || selectedStudentForPlan) && (
              <AIAnalysisPanel 
                mode={selectedStudentForPlan ? 'individual' : 'general'}
                fusedData={fusedData}
                studentData={selectedStudentForPlan} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
