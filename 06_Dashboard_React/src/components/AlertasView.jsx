import React from 'react';
import AlertsTable from './AlertsTable';
import { AlertTriangle } from 'lucide-react';

export default function AlertasView({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header">
        <div>
          <h1>
            <AlertTriangle size={24} color="var(--status-red)" style={{ marginRight: 10 }} />
            Centro de Alertas Críticas
          </h1>
          <p>Listado completo de estudiantes detectados por el modelo predictivo XGBoost.</p>
        </div>
      </div>
      <AlertsTable data={data} />
    </div>
  );
}
