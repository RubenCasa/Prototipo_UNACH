import React from 'react';
import KPIGrid from './KPIGrid';
import PredictionChart from './PredictionChart';
import { TrendingUp } from 'lucide-react';

export default function RendimientoView({ kpis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header">
        <div>
          <h1>
            <TrendingUp size={24} color="var(--status-yellow)" style={{ marginRight: 10 }} />
            Rendimiento Académico
          </h1>
          <p>Análisis de métricas institucionales y proyección del rendimiento estudiantil.</p>
        </div>
      </div>
      <KPIGrid data={kpis} />
      <PredictionChart />
    </div>
  );
}
