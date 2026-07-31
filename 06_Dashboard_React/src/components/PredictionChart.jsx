import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

export default function PredictionChart() {
  const data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago (Pred)', 'Sep (Pred)', 'Oct (Pred)', 'Nov (Pred)', 'Dic (Pred)'],
    datasets: [
      {
        label: 'Promedio Histórico SICOA (Escala 1-10)',
        data: [7.8, 7.9, 7.5, 7.2, 7.4, 7.6, 7.5, null, null, null, null, null],
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(14, 165, 233, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#0b1120',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
      {
        label: 'Proyección XGBoost (Tendencia de Riesgo)',
        data: [null, null, null, null, null, null, 7.5, 7.3, 6.9, 6.4, 5.8, 5.1],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(239, 68, 68, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
          return gradient;
        },
        fill: true,
        borderDash: [6, 4],
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#0b1120',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#334155',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        titleFont: { family: 'Inter', weight: 600 },
        bodyFont: { family: 'Inter' },
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' },
        min: 0,
        max: 10
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart',
    }
  };

  return (
    <div className="glass-panel fade-in" style={{ height: '420px', display: 'flex', flexDirection: 'column', marginTop: '1.5rem' }}>
      <h3 className="panel-title">Predicción de Trayectoria Global (Series Temporales)</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
        El modelo proyecta una caída sostenida en los promedios globales si no se aplican los planes de intervención.
      </p>
      <div style={{ flex: 1, position: 'relative' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
