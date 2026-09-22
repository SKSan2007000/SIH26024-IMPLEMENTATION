import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Mine } from '../services/api';
import { IncidentReportsPanel } from '../components/IncidentReportsPanel';

const Incidents: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');

  const fetchReports = async () => {
    try {
      const minesData = await api.getMines().catch(() => []);
      setMines(minesData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedMineId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>Citizen Grievance & Internal Incident Response</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Incident Triage & Grievance Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review community and worker submitted incident reports, verify geotagged photos, and convert verified hazards into corrective actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>
          <Link
            to="/public-report"
            target="_blank"
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            📢 Open Public Form ↗
          </Link>
        </div>
      </div>

      {/* Incident Panel */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <IncidentReportsPanel
          mineId={selectedMineId}
          onActionCreated={() => fetchReports()}
        />
      </div>
    </div>
  );
};

export default Incidents;
