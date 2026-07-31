import React from 'react';
import { X, Users } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

export default function CompareStudentsModal({ isOpen, onClose, students }) {
  if (!isOpen || !students || students.length !== 2) return null;

  const [studentA, studentB] = students;

  const data = {
    labels: ['Asistencia', 'Notas Especialidad', 'Notas Generales', 'Participación', 'Cumplimiento Tareas', 'Interacción SICOA'],
    datasets: [
      {
        label: `A: ${studentA.id_estudiante}`,
        data: [
          Math.floor(Math.random() * 40) + 40,
          Math.floor(Math.random() * 40) + 40,
          Math.floor(Math.random() * 40) + 50,
          Math.floor(Math.random() * 40) + 30,
          Math.floor(Math.random() * 40) + 60,
          Math.floor(Math.random() * 40) + 40,
        ],
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(14, 165, 233, 1)',
      },
      {
        label: `B: ${studentB.id_estudiante}`,
        data: [
          Math.floor(Math.random() * 40) + 40,
          Math.floor(Math.random() * 40) + 40,
          Math.floor(Math.random() * 40) + 50,
          Math.floor(Math.random() * 40) + 30,
          Math.floor(Math.random() * 40) + 60,
          Math.floor(Math.random() * 40) + 40,
        ],
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
      }
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { color: 'rgba(0, 0, 0, 0.08)' },
        grid: { color: 'rgba(0, 0, 0, 0.08)' },
        pointLabels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } },
        ticks: { display: false, min: 0, max: 100 }
      }
    },
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'Inter' } }, position: 'bottom' }
    }
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="ai-modal slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', flexDirection: 'column' }}>
        
        <div className="ai-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--text-accent)" />
            <h3 style={{ margin: 0 }}>A/B Testing: Comparativa Académica</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--glass-border)' }}>
            
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid rgba(14, 165, 233, 1)' }}>
              <h4 style={{ color: 'rgba(14, 165, 233, 1)', margin: '0 0 0.3rem 0', fontSize: '0.95rem' }}>{studentA.id_estudiante}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{studentA.carrera}</p>
              <div style={{ marginTop: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Riesgo: {studentA.probabilidad_riesgo_ml}% ({studentA.nivel_riesgo})</div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid rgba(236, 72, 153, 1)' }}>
              <h4 style={{ color: 'rgba(236, 72, 153, 1)', margin: '0 0 0.3rem 0', fontSize: '0.95rem' }}>{studentB.id_estudiante}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{studentB.carrera}</p>
              <div style={{ marginTop: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Riesgo: {studentB.probabilidad_riesgo_ml}% ({studentB.nivel_riesgo})</div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
              Esta comparativa multicriterio ayuda a identificar fortalezas relativas y guiar tutorías de pares.
            </p>
          </div>

          <div style={{ flex: 1.5, padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div style={{ width: '100%', maxWidth: '380px' }}>
                <Radar data={data} options={options} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
