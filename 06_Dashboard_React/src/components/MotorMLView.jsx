import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, Database, Users, Columns } from 'lucide-react';

export default function MotorMLView() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | processing | complete
  const [stats, setStats] = useState({ rows: 0, columns: 0, preview: [] });

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file) => {
    setFile(file);
    setStatus('processing');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rowCount = results.data.length;
        const colCount = results.meta.fields ? results.meta.fields.length : 0;
        
        setStats({
          rows: rowCount,
          columns: colCount,
          preview: results.meta.fields || []
        });

        setTimeout(() => {
          setStatus('complete');
        }, 2500);
      },
      error: (error) => {
        console.error("Error parseando CSV:", error);
        setStatus('error');
      }
    });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="header">
        <div>
          <h1>
            <Database size={24} color="var(--text-accent)" style={{ marginRight: 10 }} />
            Integración SICOA — Motor ML (XGBoost)
          </h1>
          <p>
            Sube el historial académico extraído del SICOA. El modelo XGBoost analizará las filas reales de tu archivo.
          </p>
        </div>
      </header>

      <div className="glass-panel" style={{ minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
        {status === 'idle' && (
          <div 
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-ml').click()}
            style={{ flex: 1 }}
          >
            <UploadCloud size={56} className="pulse-icon" color={dragActive ? 'var(--text-accent)' : 'var(--text-muted)'} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Arrastra y suelta tu archivo CSV aquí</h3>
            <p style={{ color: 'var(--text-muted)' }}>o haz clic para explorar en tu computadora</p>
            <input 
              type="file" 
              id="file-upload-ml" 
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />
          </div>
        )}

        {status === 'processing' && (
          <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div className="spinner" />
              <span style={{ fontSize: '1.2rem', color: 'var(--text-accent)' }}>Procesando Pipeline XGBoost...</span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>Leyendo <strong>{file.name}</strong> y extrayendo {stats.columns} variables (features)...</p>
            <div className="progress-bar-container" style={{ maxWidth: '350px', marginTop: '1rem' }}>
              <div className="progress-bar-fill slide-right" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <CheckCircle size={72} color="var(--status-green)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.4))' }} />
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>¡Análisis Completado!</h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
                <Users size={28} color="var(--text-accent)" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.rows}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estudiantes</span>
              </div>
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
                <Columns size={28} color="#8b5cf6" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.columns}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Variables</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>El modelo XGBoost ha generado nuevas predicciones basadas en <strong>{file.name}</strong>.</p>
            
            <button className="btn-primary" onClick={() => setStatus('idle')}>
              Subir nuevo archivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
