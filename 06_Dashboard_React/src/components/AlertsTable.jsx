import React, { useState, useMemo } from 'react';
import AIPlanModal from './AIPlanModal';
import StudentProfileModal from './StudentProfileModal';
import CompareStudentsModal from './CompareStudentsModal';
import { Sparkles, User, GitCompare, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AlertsTable({ data }) {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter data
  const filteredData = useMemo(() => {
    let result = data || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.id_estudiante.toLowerCase().includes(q) ||
          a.carrera.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== 'ALL') {
      result = result.filter((a) => a.nivel_riesgo === riskFilter);
    }
    return result;
  }, [data, searchQuery, riskFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  const handleFilterChange = (filter) => {
    setRiskFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCheckboxChange = (student, index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    setSelectedForComparison((prev) => {
      if (prev.find((s) => s.tableIndex === globalIndex)) {
        return prev.filter((s) => s.tableIndex !== globalIndex);
      }
      if (prev.length < 2) return [...prev, { ...student, tableIndex: globalIndex }];
      return prev;
    });
  };

  return (
    <>
      <div className="glass-panel" style={{ position: 'relative' }}>
        {/* Header with compare button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className="panel-title" style={{ marginBottom: 0 }}>
            Listado General ({filteredData.length})
          </h3>
          {selectedForComparison.length === 2 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="btn-primary fade-in"
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <GitCompare size={16} /> Comparar (A/B)
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 250px', maxWidth: '350px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por ID o carrera..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="filter-group">
            {['ALL', 'ALTO', 'MEDIO', 'BAJO'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${riskFilter === f ? 'active' : ''}`}
                onClick={() => handleFilterChange(f)}
              >
                {f === 'ALL' ? 'Todos' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '36px' }}></th>
                <th>Estudiante</th>
                <th>Riesgo ML</th>
                <th>Semáforo</th>
                <th>Acción Recomendada</th>
                <th>IA</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((alerta, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                let color = 'var(--status-green)';
                if (alerta.nivel_riesgo === 'ALTO') color = 'var(--status-red)';
                if (alerta.nivel_riesgo === 'MEDIO') color = 'var(--status-yellow)';

                let badge = 'badge-green';
                if (alerta.nivel_riesgo === 'ALTO') badge = 'badge-red';
                if (alerta.nivel_riesgo === 'MEDIO') badge = 'badge-yellow';

                const isSelected = !!selectedForComparison.find(
                  (s) => s.tableIndex === globalIndex
                );

                return (
                  <tr
                    key={globalIndex}
                    style={{
                      background: isSelected ? 'rgba(14, 165, 233, 0.05)' : '',
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(alerta, index)}
                        disabled={
                          selectedForComparison.length >= 2 && !isSelected
                        }
                        style={{ cursor: 'pointer', accentColor: 'var(--text-accent)' }}
                        title="Seleccionar para comparar (Máx 2)"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedStudent(alerta);
                          setIsProfileModalOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                        title="Ver Perfil 360°"
                      >
                        <strong
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'var(--text-accent)',
                          }}
                        >
                          <User size={13} /> {alerta.id_estudiante}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {alerta.carrera}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color }}>{alerta.probabilidad_riesgo_ml}%</span>
                      <div className="risk-bar-bg">
                        <div
                          className="risk-bar-fill"
                          style={{
                            width: `${alerta.probabilidad_riesgo_ml}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badge}`}>
                        {alerta.semaforo.split(' ')[0]}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: '0.78rem',
                        maxWidth: '200px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {alerta.accion_recomendada}
                    </td>
                    <td>
                      <button
                        className="btn-ai-sparkle"
                        onClick={() => {
                          setSelectedStudent(alerta);
                          setIsAIModalOpen(true);
                        }}
                        title="Generar Plan de Rescate con IA"
                      >
                        <Sparkles size={14} /> Plan IA
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={currentPage === pageNum ? 'active' : ''}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <AIPlanModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        studentData={selectedStudent}
      />
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentData={selectedStudent}
      />
      <CompareStudentsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        students={selectedForComparison}
      />
    </>
  );
}
