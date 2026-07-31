import React, { useState } from 'react';
import {
  Link2,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Database,
  BrainCircuit,
  BarChart3,
  Users,
  FileText,
  Monitor
} from 'lucide-react';

export default function IntegrationsView() {
  const [moodleSyncing, setMoodleSyncing] = useState(false);
  const [sicoaSyncing, setSicoaSyncing] = useState(false);
  const [moodleSynced, setMoodleSynced] = useState(false);
  const [sicoaSynced, setSicoaSynced] = useState(false);

  const handleMoodleSync = () => {
    setMoodleSyncing(true);
    setMoodleSynced(false);
    setTimeout(() => {
      setMoodleSyncing(false);
      setMoodleSynced(true);
    }, 3000);
  };

  const handleSicoaSync = () => {
    setSicoaSyncing(true);
    setSicoaSynced(false);
    setTimeout(() => {
      setSicoaSyncing(false);
      setSicoaSynced(true);
    }, 2500);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="header">
        <div>
          <h1>
            <Link2 size={24} color="var(--text-accent)" style={{ marginRight: 10 }} />
            Integraciones del Sistema
          </h1>
          <p>Conexión con plataformas académicas institucionales de la UNACH.</p>
        </div>
      </header>

      {/* Integration Cards */}
      <div className="integrations-grid">
        {/* Moodle Card */}
        <div className="glass-panel integration-card moodle">
          <div className="integration-status">
            <div className={`status-dot ${moodleSynced ? 'connected' : 'simulated'}`} />
            <span style={{ fontSize: '0.85rem', color: moodleSynced ? 'var(--status-green)' : 'var(--status-yellow)' }}>
              {moodleSynced ? 'Sincronizado' : 'Simulación Activa'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #f98012, #f9c912)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Moodle LMS</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Entorno Virtual de Aprendizaje</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Moodle aporta datos de actividad del estudiante: calificaciones de tareas, participación en foros,
            tiempo en plataforma, acceso a recursos y evaluaciones en línea. Estos datos enriquecen el modelo
            predictivo XGBoost con variables de comportamiento digital.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Datos disponibles via API REST
            </h4>
            {['Calificaciones de actividades', 'Participación en foros', 'Tiempo de sesión por curso', 'Entregas y tareas pendientes', 'Acceso a recursos educativos'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} color="var(--status-green)" />
                {item}
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleMoodleSync}
            disabled={moodleSyncing}
            style={{ width: '100%', justifyContent: 'center', ...(moodleSyncing ? { opacity: 0.7, cursor: 'wait' } : {}) }}
          >
            {moodleSyncing ? (
              <><RefreshCw size={16} className="spinner" /> Sincronizando...</>
            ) : moodleSynced ? (
              <><CheckCircle size={16} /> ¡Sincronizado!</>
            ) : (
              <><RefreshCw size={16} /> Sincronizar con Moodle</>
            )}
          </button>
        </div>

        {/* SICOA Card */}
        <div className="glass-panel integration-card sicoa">
          <div className="integration-status">
            <div className={`status-dot ${sicoaSynced ? 'connected' : 'simulated'}`} />
            <span style={{ fontSize: '0.85rem', color: sicoaSynced ? 'var(--status-green)' : 'var(--status-yellow)' }}>
              {sicoaSynced ? 'Sincronizado' : 'Simulación Activa'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--unach-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>SICOA</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Sistema Integrado de Control Académico</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            El SICOA es el sistema central de la UNACH que contiene el historial académico completo:
            notas parciales, finales, asistencia, matriculación, reprobaciones y datos socioeconómicos.
            Es la fuente principal de datos para el modelo de Machine Learning.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Datos del SICOA
            </h4>
            {['Notas parciales y finales', 'Porcentaje de asistencia', 'Datos de matrícula', 'Historial de reprobaciones', 'Información socioeconómica'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} color="var(--status-green)" />
                {item}
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleSicoaSync}
            disabled={sicoaSyncing}
            style={{ width: '100%', justifyContent: 'center', ...(sicoaSyncing ? { opacity: 0.7, cursor: 'wait' } : {}) }}
          >
            {sicoaSyncing ? (
              <><RefreshCw size={16} className="spinner" /> Sincronizando...</>
            ) : sicoaSynced ? (
              <><CheckCircle size={16} /> ¡Sincronizado!</>
            ) : (
              <><RefreshCw size={16} /> Sincronizar con SICOA</>
            )}
          </button>
        </div>
      </div>

      {/* Data Flow Diagram */}
      <div className="glass-panel">
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} color="var(--text-accent)" />
          Flujo de Datos del Sistema
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Así fluyen los datos desde las plataformas institucionales hasta las predicciones del dashboard.
        </p>

        <div className="data-flow-diagram">
          <div className="flow-node">
            <GraduationCap size={24} color="var(--text-accent)" />
            <span className="flow-node-title">SICOA</span>
            <span className="flow-node-label">Datos Académicos</span>
          </div>

          <span className="flow-arrow">→</span>

          <div className="flow-node">
            <BookOpen size={24} color="#f98012" />
            <span className="flow-node-title">Moodle</span>
            <span className="flow-node-label">Actividad LMS</span>
          </div>

          <span className="flow-arrow">→</span>

          <div className="flow-node">
            <FileText size={24} color="var(--status-yellow)" />
            <span className="flow-node-title">Dataset</span>
            <span className="flow-node-label">CSV/Excel Unificado</span>
          </div>

          <span className="flow-arrow">→</span>

          <div className="flow-node" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
            <BrainCircuit size={24} color="#8b5cf6" />
            <span className="flow-node-title">XGBoost</span>
            <span className="flow-node-label">Motor ML</span>
          </div>

          <span className="flow-arrow">→</span>

          <div className="flow-node" style={{ borderColor: 'rgba(14,165,233,0.3)' }}>
            <BarChart3 size={24} color="var(--text-accent)" />
            <span className="flow-node-title">Dashboard</span>
            <span className="flow-node-label">Alertas & KPIs</span>
          </div>

          <span className="flow-arrow">→</span>

          <div className="flow-node" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <Users size={24} color="var(--status-green)" />
            <span className="flow-node-title">Intervención</span>
            <span className="flow-node-label">Planes de Acción</span>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="glass-panel">
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Monitor size={18} color="var(--text-accent)" />
          Detalles Técnicos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div className="ai-insight-card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>API de Moodle</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: '1.5' }}>
              Se conecta vía <strong>REST API</strong> de Moodle usando tokens de servicio web.
              Endpoints: <code>core_enrol_get_enrolled_users</code>, <code>mod_assign_get_grades</code>,
              <code>report_competency_data_for_report</code>.
            </p>
          </div>
          <div className="ai-insight-card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Modelo XGBoost</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: '1.5' }}>
              Modelo entrenado con <strong>Scikit-Learn + XGBoost</strong> sobre dataset de 4,000 registros.
              Features: notas, asistencia, actividad Moodle, datos socioeconómicos.
              F1-Score: <strong>0.4952</strong>.
            </p>
          </div>
          <div className="ai-insight-card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>IA Generativa (Groq)</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: '1.5' }}>
              Usa <strong>Llama 3.3-70B</strong> vía Groq API para generar planes de intervención
              personalizados y análisis de datos importados. ~500 tokens/seg.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
