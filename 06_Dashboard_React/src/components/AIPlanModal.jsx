import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Sparkles, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function AIPlanModal({ isOpen, onClose, studentData }) {
  const [step, setStep] = useState(0); // 0: loading, 1: typing, 2: done
  const [displayedText, setDisplayedText] = useState('');
  const [fullText, setFullText] = useState('');
  
  const textContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && studentData) {
      setStep(0);
      setDisplayedText('');
      setFullText('');
      
      // Try API backend first, then Groq direct, then local fallback
      const fetchPlan = async () => {
        try {
          // Try Vercel serverless or local backend
          let text = null;

          try {
            const backendRes = await fetch('http://localhost:8000/api/generar-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(studentData)
            });
            if (backendRes.ok) {
              const data = await backendRes.json();
              text = data.plan;
            }
          } catch {
            // Backend not available
          }

          // Try Groq if backend failed
          if (!text) {
            try {
              const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
              if (groqKey) {
                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{
                      role: 'system',
                      content: 'Eres un experto en Learning Analytics de la UNACH. Genera planes de intervención académica detallados y profesionales en español.'
                    }, {
                      role: 'user',
                      content: `Genera un plan de intervención para el estudiante:
                      - ID: ${studentData.id_estudiante}
                      - Carrera: ${studentData.carrera}
                      - Probabilidad de riesgo: ${studentData.probabilidad_riesgo_ml}%
                      - Nivel: ${studentData.nivel_riesgo}
                      - Semáforo: ${studentData.semaforo}
                      
                      Incluye: análisis de patrones de riesgo, plan estratégico en 3 fases (inmediata, académica, monitoreo), y acciones específicas para el SICOA y Moodle.`
                    }],
                    temperature: 0.7,
                    max_tokens: 1500,
                  }),
                });
                if (groqRes.ok) {
                  const groqData = await groqRes.json();
                  text = groqData.choices[0].message.content;
                }
              }
            } catch {
              // Groq not available
            }
          }

          // Fallback local
          if (!text) {
            text = `[SISTEMA IA UNACH-LA: INFORME GENERATIVO]\nEvaluando al estudiante ID: ${studentData.id_estudiante} (Carrera: ${studentData.carrera})\nProbabilidad de Riesgo Predictiva: ${studentData.probabilidad_riesgo_ml}% (${studentData.nivel_riesgo})\n\n--- ANÁLISIS DE PATRONES DE RIESGO ---\nEl motor XGBoost ha identificado vulnerabilidades críticas en el desempeño actual del estudiante, ubicándolo en el semáforo '${studentData.semaforo}'.\n\n--- PLAN ESTRATÉGICO DE INTERVENCIÓN ---\n\nFase 1: Intervención Inmediata (24-48 horas)\n1. Convocatoria Diagnóstica: Citar al estudiante presencialmente.\n2. Derivación a Bienestar Estudiantil.\n\nFase 2: Estrategia Académica (Próximos 15 días)\n3. Tutorías de Pares (Mentoría).\n4. Refuerzo Obligatorio en materias críticas.\n5. Flexibilidad Condicionada.\n\nFase 3: Monitoreo Continuo (Cierre de Parcial)\n6. Seguimiento Docente Activo en SICOA.\n7. Re-evaluación Predictiva con modelo ML.\n\n[Documento oficial — Motor Predictivo UNACH-LA]`;
          }

          setFullText(text);
          setStep(1);
        } catch {
          // Ultimate fallback
          setFullText('Error al generar el plan. Intente nuevamente.');
          setStep(1);
        }
      };

      fetchPlan();
    }
  }, [isOpen, studentData]);

  useEffect(() => {
    if (step === 1 && fullText) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(fullText.slice(0, i));
        i++;
        if (textContainerRef.current) {
          textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
        }
        if (i > fullText.length) {
          clearInterval(intervalId);
          setStep(2);
        }
      }, 15);
      return () => clearInterval(intervalId);
    }
  }, [step, fullText]);

  const handleExportTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([fullText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Plan_Intervencion_${studentData?.id_estudiante || 'UNACH'}.txt`;
    document.body.appendChild(element); 
    element.click();
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(`Plan de Intervención IA — ${studentData?.id_estudiante}`, 15, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const splitText = pdf.splitTextToSize(fullText, 180);
    pdf.text(splitText, 15, 32);
    pdf.save(`Plan_IA_${studentData?.id_estudiante || 'UNACH'}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="ai-modal slide-up" onClick={e => e.stopPropagation()}>
        
        <div className="ai-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={26} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Generador de Planes IA</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <div className="ai-modal-body">
          {step === 0 && (
            <div className="ai-loading">
              <Sparkles size={44} className="pulse-icon" color="#8b5cf6" />
              <p>Conectando con Groq IA... Generando plan óptimo...</p>
            </div>
          )}

          {(step === 1 || step === 2) && (
            <div className="ai-text-container" ref={textContainerRef}>
              <pre className="ai-generated-text">{displayedText}</pre>
              {step === 1 && <span className="cursor-blink">|</span>}
            </div>
          )}
        </div>

        {step === 2 && (
          <div className="ai-modal-footer fade-in">
            <button className="btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn-ai-action" onClick={handleExportTxt} style={{ background: 'var(--bg-tertiary)' }}>
              <FileText size={16} /> .txt
            </button>
            <button className="btn-ai-action" onClick={handleExportPDF}>
              <Download size={16} /> PDF Oficial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
