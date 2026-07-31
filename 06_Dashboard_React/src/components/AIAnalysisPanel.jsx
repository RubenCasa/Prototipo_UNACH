import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Download, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

export default function AIAnalysisPanel({ mode = 'general', fusedData, studentData }) {
  const [status, setStatus] = useState('loading'); // loading | typing | done | error
  const [fullText, setFullText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const textRef = useRef(null);

  const fetchAnalysis = async () => {
    setStatus('loading');
    setDisplayedText('');
    setFullText('');
    setErrorMsg('');

    let prompt = '';

    if (mode === 'general') {
      const sample = fusedData.rows.slice(0, 5);
      prompt = `Eres un experto en Learning Analytics de la UNACH.
Analiza la siguiente base de datos fusionada (SICOA + Moodle).

RESUMEN:
- Registros totales: ${fusedData.rows.length}
- Columnas: ${fusedData.columns.join(', ')}

MUESTRA DE DATOS:
${JSON.stringify(sample, null, 2)}

Genera un reporte estructurado con:
📊 RESUMEN GENERAL DE LOS DATOS CRUZADOS
Identifica qué información aportan las diferentes variables ahora que están juntas.

🎯 PATRONES DE RIESGO
¿Qué combinaciones de variables (ej. notas bajas + poca asistencia) podrían indicar riesgo alto?

📋 RECOMENDACIONES GLOBALES PARA PROFESORES
Al menos 5 acciones concretas para evitar la deserción basadas en estos datos cruzados.`;

    } else if (mode === 'individual') {
      prompt = `Eres un tutor académico de IA en la UNACH.
Necesitas crear un Plan de Intervención Urgente para el siguiente estudiante, cuyos datos provienen de la plataforma SICOA y Moodle.

DATOS DEL ESTUDIANTE:
${JSON.stringify(studentData, null, 2)}

Genera un plan estructurado y empático con:
👤 PERFIL ACADÉMICO DEL ESTUDIANTE
Breve diagnóstico de su situación actual según sus variables (asistencia, notas, accesos, etc.).

🚨 FACTORES DE RIESGO IDENTIFICADOS
¿Qué métricas específicas muestran que está en peligro de reprobar o desertar?

📝 PLAN DE ACCIÓN DE 3 PASOS
Tres acciones concretas, alcanzables y motivadoras que el estudiante debe hacer esta misma semana para mejorar.

🗣️ MENSAJE SUGERIDO PARA EL PROFESOR
Un borrador de correo electrónico o mensaje corto que el profesor le puede enviar al estudiante para acercarse a él y ofrecerle ayuda.`;
    }

    try {
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
              content: `Eres un asistente de IA experto en retención estudiantil para la Universidad Nacional de Chimborazo. Responde en español de manera profesional, estructurada y empática.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 1500,
        }),
      });

      if (!groqResponse.ok) {
        const errData = await groqResponse.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Error ${groqResponse.status} de Groq API`);
      }

      const groqData = await groqResponse.json();
      setFullText(groqData.choices[0].message.content);
      setStatus('typing');
      
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setErrorMsg(err.message || 'Error conectando con la IA.');
      setStatus('error');
    }
  };

  useEffect(() => {
    // We re-fetch if mode or studentData changes
    if (fusedData) {
      fetchAnalysis();
    }
  }, [mode, studentData, fusedData]);

  useEffect(() => {
    if (status === 'typing' && fullText) {
      let i = 0;
      const speed = 8; // ms per char
      const intervalId = setInterval(() => {
        setDisplayedText(fullText.slice(0, i));
        i += 2;
        if (textRef.current) {
          textRef.current.scrollTop = textRef.current.scrollHeight;
        }
        if (i > fullText.length) {
          clearInterval(intervalId);
          setStatus('done');
        }
      }, speed);
      return () => clearInterval(intervalId);
    }
  }, [status, fullText]);

  const handleExportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    
    const title = mode === 'individual' ? `Plan de Intervencion - ${studentData.ID_Unificado || 'Estudiante'}` : `Reporte de Fusion de Datos UNACH`;
    
    pdf.text(title, 15, 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(fullText, 180);
    pdf.text(lines, 15, 32);
    pdf.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="ai-analysis-panel fade-in">
      <div className="ai-analysis-header">
        <Bot size={28} color="var(--text-accent)" />
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
            {mode === 'individual' ? 'Plan de Intervención IA' : 'Reporte General de Datos Cruzados'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            {mode === 'individual' 
              ? `Generando plan para el estudiante ${studentData?.ID_Unificado || ''}`
              : `Analizando ${fusedData?.rows.length || 0} registros fusionados`}
          </p>
        </div>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' }}>
          <Sparkles size={48} className="pulse-icon" color="var(--text-accent)" />
          <p style={{ color: 'var(--text-muted)' }}>Analizando con Groq (Llama 3.3-70B)...</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' }}>
          <AlertCircle size={48} color="var(--status-red)" />
          <p style={{ color: 'var(--status-red)', textAlign: 'center', maxWidth: '400px' }}>{errorMsg}</p>
          <button className="btn-primary" onClick={fetchAnalysis}>
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      )}

      {(status === 'typing' || status === 'done') && (
        <>
          <div ref={textRef} className="ai-text-container" style={{ maxHeight: '400px', marginTop: '1rem' }}>
            <pre className="ai-generated-text" style={{ color: 'var(--text-main)' }}>{displayedText}</pre>
            {status === 'typing' && <span className="cursor-blink" style={{ color: 'var(--text-main)' }}>|</span>}
          </div>

          {status === 'done' && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={fetchAnalysis}>
                <RefreshCw size={14} style={{ marginRight: 6 }} /> Regenerar
              </button>
              <button className="btn-primary" onClick={handleExportPDF} style={{ background: 'var(--text-accent)' }}>
                <FileText size={16} /> Exportar PDF
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
