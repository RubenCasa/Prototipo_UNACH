import React, { useState, useEffect, useRef } from 'react';
import { TrendingDown, BarChart3, Users, Cpu, Shield } from 'lucide-react';

function AnimatedValue({ value, decimals = 0, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const numVal = parseFloat(value);
          const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(numVal * eased);
            if (progress >= 1) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toFixed(decimals)}</span>;
}

export default function KPIGrid({ data }) {
  const kpis = [
    {
      key: 'KPI_01_Tasa_Riesgo_Academico',
      icon: TrendingDown,
      iconBg: 'var(--status-red-bg)',
      iconColor: 'var(--status-red)',
      decimals: 2,
    },
    {
      key: 'KPI_02_Promedio_General_Notas',
      icon: BarChart3,
      iconBg: 'var(--status-yellow-bg)',
      iconColor: 'var(--status-yellow)',
      decimals: 2,
    },
    {
      key: 'KPI_03_Asistencia_Promedio',
      icon: Users,
      iconBg: 'var(--status-green-bg)',
      iconColor: 'var(--status-green)',
      decimals: 1,
    },
    {
      key: 'KPI_04_Efectividad_Modelo_ML',
      icon: Cpu,
      iconBg: 'var(--status-blue-bg)',
      iconColor: 'var(--status-blue)',
      decimals: 4,
    },
    {
      key: 'KPI_05_Overfitting_Control',
      icon: Shield,
      iconBg: 'rgba(139, 92, 246, 0.12)',
      iconColor: '#8b5cf6',
      decimals: 1,
    }
  ];

  return (
    <div className="kpi-grid stagger-children">
      {kpis.map((item, index) => {
        const kpi = data[item.key];
        if (!kpi) return null;

        const Icon = item.icon;

        let statusClass = 'badge-green';
        if (kpi.estado === 'CRÍTICO') statusClass = 'badge-red';
        if (kpi.estado === 'ADVERTENCIA') statusClass = 'badge-yellow';

        return (
          <div key={index} className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>{kpi.nombre}</span>
              <div
                className="kpi-icon"
                style={{ background: item.iconBg }}
              >
                <Icon size={18} color={item.iconColor} />
              </div>
            </div>
            <div className="kpi-value">
              <AnimatedValue value={kpi.valor} decimals={item.decimals} />
              <span className="kpi-unit">{kpi.unidad}</span>
            </div>
            <div className="kpi-footer">
              <span>Meta: {kpi.meta_institucional}</span>
              <span className={`badge ${statusClass}`}>{kpi.estado}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
