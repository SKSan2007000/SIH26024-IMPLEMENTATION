import React, { useEffect, useState } from 'react';
import { api, type Mine, type Contractor } from '../services/api';

const Contractors: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    service_type: 'Overburden Removal',
    total_workers: 85,
    trained_workers: 82,
    ppe_compliance_rate: 96.5,
    safety_score: 88.0,
    contract_valid_until: '2026-12-31'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, contractorsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getContractors(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setContractors(contractorsData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching contractor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId]);

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.createContractor({
        ...formData,
        mine_id: selectedMineId || (mines[0]?.id ?? '')
      });
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create contractor record');
    } finally {
      setCreating(false);
    }
  };

  const avgSafetyScore = contractors.length > 0
    ? (contractors.reduce((acc, curr) => acc + (curr.safety_score || 0), 0) / contractors.length).toFixed(1)
    : '89.5';

  const totalWorkers = contractors.reduce((acc, curr) => acc + (curr.total_workers || curr.worker_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold uppercase tracking-wider">
            <span>Contract Labour (Regulation & Abolition) Act & DGMS Guidelines</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Contractor Compliance & Safety Auditing</h1>
          <p className="text-slate-400 text-sm mt-1">
            Vendor safety index, worker training ratios, mandatory PPE verification, and statutory contract expiry alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Assigned Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Onboard Contractor
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Active Vendors</span>
            <div className="text-3xl font-black text-white mt-1">{contractors.length}</div>
          </div>
          <span className="text-2xl p-3 bg-purple-500/10 rounded-xl">👷</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Contract Workers</span>
            <div className="text-3xl font-black text-blue-400 mt-1">{totalWorkers}</div>
          </div>
          <span className="text-2xl p-3 bg-blue-500/10 rounded-xl">👥</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Safety Rating</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{avgSafetyScore} / 100</div>
          </div>
          <span className="text-2xl p-3 bg-emerald-500/10 rounded-xl">⭐</span>
        </div>
      </div>

      {/* Contractors Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading contractor registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractors.map(c => {
            const score = c.safety_score || 85.0;
            const isHighRisk = score < 70;
            const total = c.total_workers || c.worker_count || 1;
            const trained = c.trained_workers || c.trained_worker_count || 0;
            const trainingPct = total > 0 ? ((trained / total) * 100).toFixed(0) : '100';

            return (
              <div key={c.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{c.service_type || c.contract_type || 'Operations'}</span>
                    <h3 className="text-xl font-bold text-white mt-1">{c.name || c.company_name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isHighRisk ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                    {score.toFixed(1)} Safety Score
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Active Deployed Headcount:</span>
                    <strong className="text-white">{total} Personnel</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mandatory VTC Training Rate:</span>
                    <strong className="text-emerald-400">{trained} / {total} ({trainingPct}%)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>PPE Compliance Audit:</span>
                    <strong className="text-blue-400">{c.ppe_compliance_rate?.toFixed(1) || '96.0'}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract Expiry Date:</span>
                    <strong className="text-slate-200">{(c.contract_valid_until || c.valid_until) ? new Date(c.contract_valid_until || c.valid_until || '').toLocaleDateString() : 'Active'}</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${isHighRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard Contractor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Onboard Mining Contractor Agency</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateContractor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vendor / Contractor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bharat Earthmovers & Haulage Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contract Service Scope</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Overburden Haulage / CHPP Maintenance"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Total Workers</label>
                  <input
                    type="number"
                    required
                    value={formData.total_workers}
                    onChange={(e) => setFormData({ ...formData, total_workers: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Safety Trained</label>
                  <input
                    type="number"
                    required
                    value={formData.trained_workers}
                    onChange={(e) => setFormData({ ...formData, trained_workers: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">PPE Compliance %</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ppe_compliance_rate}
                    onChange={(e) => setFormData({ ...formData, ppe_compliance_rate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contract Expiry</label>
                  <input
                    type="date"
                    required
                    value={formData.contract_valid_until}
                    onChange={(e) => setFormData({ ...formData, contract_valid_until: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold disabled:opacity-50">
                  {creating ? 'Onboarding...' : 'Onboard Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contractors;
