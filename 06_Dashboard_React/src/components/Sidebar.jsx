import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileUp,
  ArrowLeft,
  GraduationCap,
  Activity
} from 'lucide-react';

export default function Sidebar({ onBackToHero, activeSection, setActiveSection }) {
  const groupModelo = [
    { id: 'modelo', icon: Activity, label: 'Nuestro Modelo Entrenado' },
    { id: 'general', icon: LayoutDashboard, label: 'Vista General' },
    { id: 'alertas', icon: Users, label: 'Todos los Estudiantes' },
  ];

  const groupFusion = [
    { id: 'fusion', icon: FileUp, label: 'Fusión de Datos IA' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div className="logo-icon">
          <GraduationCap size={22} color="var(--text-main)" />
        </div>
        <div className="logo-text">
          <h2>UNACH-LA</h2>
          <p>Learning Analytics</p>
        </div>
      </div>

      <nav className="nav-links">
        <button className="sidebar-back-btn" onClick={onBackToHero}>
          <ArrowLeft size={16} />
          Volver al Inicio
        </button>

        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Nuestro Modelo (UNACH-LA)
        </div>
        {groupModelo.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}

        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Herramienta de Continuidad
        </div>
        {groupFusion.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="system-status">
        <div className="pulse" />
        <span>Motor ML Activo • Groq IA</span>
      </div>
    </aside>
  );
}
