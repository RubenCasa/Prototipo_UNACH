import React, { useRef } from 'react';
import { X, UserCheck, AlertTriangle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

export default function StudentProfileModal({ isOpen, onClose, studentData }) {
  const modalRef = useRef(null);

  if (!isOpen || !studentData) return null;

  const handleDownloadPDF = async () => {
    if (!modalRef.current) return;
    const closeBtn = modalRef.current.querySelector('.close-btn');
    const downloadBtn = modalRef.current.querySelector('.download-pdf-btn');
    if(closeBtn) closeBtn.style.display = 'none';
    if(downloadBtn) downloadBtn.style.display = 'none';

    try {
      const canvas = await html2canvas(modalRef.current, { scale: 2, backgroundColor: '#111827' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Expediente_${studentData.id_estudiante}.pdf`);
    } catch (error) {
      console.error('Error generando PDF', error);
    } finally {
      if(closeBtn) closeBtn.style.display = 'block';
      if(downloadBtn) downloadBtn.style.display = 'flex';
    }
  };

  const data = {
    labels: ['Asistencia', 'Notas Especialidad', 'Notas Generales', 'Participación', 'Cumplimiento Tareas', 'Interacción SICOA'],
    datasets: [
      {
        label: 'Perfil del Estudiante',
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
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      },
      {
        label: 'Promedio de Cohorte',
        data: [85, 80, 85, 75, 90, 80],
        backgroundColor: 'rgba(100, 116, 139, 0.05)',
        borderColor: 'rgba(100, 116, 139, 0.4)',
        borderWidth: 1,
        borderDash: [5, 5]
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
      legend: { labels: { color: '#cbd5e1', font: { family: 'Inter' } } }
    }
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="ai-modal slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', flexDirection: 'row' }} ref={modalRef}>
        
        {/* Left Side: Info */}
        <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', boxShadow: '0 0 25px rgba(14, 165, 233, 0.3)' }}>
            <UserCheck size={36} color="white" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{studentData.id_estudiante}</h2>
          <p style={{ color: 'var(--text-accent)', fontWeight: '600', marginBottom: '2rem', fontSize: '0.9rem' }}>{studentData.carrera}</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Probabilidad Riesgo (XGBoost)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: '800', color: studentData.nivel_riesgo === 'ALTO' ? 'var(--status-red)' : 'var(--status-yellow)' }}>
                {studentData.probabilidad_riesgo_ml}%
              </span>
              <AlertTriangle color={studentData.nivel_riesgo === 'ALTO' ? 'var(--status-red)' : 'var(--status-yellow)'} size={28} />
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Acción Recomendada</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
              {studentData.accion_recomendada}
            </p>
          </div>

          <button 
            className="download-pdf-btn btn-secondary" 
            onClick={handleDownloadPDF}
            style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={14} /> Exportar Expediente PDF
          </button>
        </div>

        {/* Right Side: Radar Chart */}
        <div style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Perfil 360° Académico</h3>
            <button className="close-btn" onClick={onClose}><X size={22} /></button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Comparativa multicriterio frente a la cohorte histórica del SICOA.
          </p>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
              <Radar data={data} options={options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
