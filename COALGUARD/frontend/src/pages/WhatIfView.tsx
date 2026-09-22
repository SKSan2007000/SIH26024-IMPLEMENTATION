import React, { useEffect, useState } from 'react';
import { api, type Mine } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { WhatIfSimulator } from '../components/WhatIfSimulator';

const WhatIfView: React.FC = () => {
  const { user } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');

  const fetchData = async () => {
    try {
      const data = await api.getMines();
      setMines(data || []);
      if (data && data.length > 0 && !selectedMineId) {
        setSelectedMineId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-pink-400 font-bold uppercase tracking-wider">
            <span>Prescriptive Decision Optimization</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">What-If Intervention Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulate the impact of operational interventions (water suppression, haul road speed reduction, contractor audits) on projected multi-department risk.
          </p>
        </div>

        <select
          value={selectedMineId}
          onChange={(e) => setSelectedMineId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
        >
          {mines.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
          ))}
        </select>
      </div>

      {/* Simulator Component */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        {selectedMineId ? (
          <WhatIfSimulator mineId={selectedMineId} role={user?.role || "MINE_MANAGER"} />
        ) : (
          <div className="text-center py-12 text-slate-500">Loading simulator...</div>
        )}
      </div>
    </div>
  );
};

export default WhatIfView;
