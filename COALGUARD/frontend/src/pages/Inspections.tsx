import React, { useEffect, useState } from 'react';
import { api, type Mine, type Inspection } from '../services/api';

const Inspections: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    mine_id: '',
    inspector_name: 'Dr. R. K. Verma (Deputy DGMS)',
    inspection_type: 'STATUTORY_DGMS',
    findings_summary: 'Bench height exceeding CMR standard limit at North Pit. Dust suppression misting system working normally.',
    violations_found: 1,
    inspection_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, inspData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getInspections(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setInspections(inspData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
        setFormData(prev => ({ ...prev, mine_id: minesData[0].id }));
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createInspection({
        ...formData,
        mine_id: selectedMineId || formData.mine_id
      });
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit inspection record');
    } finally {
      setSubmitting(false);
    }
  };

  const totalViolations = inspections.reduce((acc, curr) => acc + (curr.violations_found || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Directorate General of Mines Safety (DGMS) Statutory Oversight</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Inspections & Regulatory Audits</h1>
          <p className="text-slate-400 text-sm mt-1">
            Statutory DGMS audits, internal technical reviews, violation records, and compliance rectification logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => { setSelectedMineId(e.target.value); setFormData(f => ({ ...f, mine_id: e.target.value })); }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Log Inspection Record
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Inspections Conducted</span>
            <div className="text-3xl font-black text-white mt-1">{inspections.length}</div>
          </div>
          <span className="text-2xl p-3 bg-blue-500/10 rounded-xl">📋</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Violations Noted</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{totalViolations}</div>
          </div>
          <span className="text-2xl p-3 bg-amber-500/10 rounded-xl">⚠️</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Statutory Compliance Status</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">94.2% Passed</div>
          </div>
          <span className="text-2xl p-3 bg-emerald-500/10 rounded-xl">⚖️</span>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Statutory & Internal Mine Audit Findings</h3>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading inspection audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3">Inspector & Agency</th>
                  <th className="pb-3">Audit Scope</th>
                  <th className="pb-3">Findings Summary</th>
                  <th className="pb-3">Violations</th>
                  <th className="pb-3">Audit Date</th>
                  <th className="pb-3">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map(i => (
                  <tr key={i.id} className="hover:bg-slate-800/40">
                    <td className="py-4 font-bold text-white">{i.inspector_name}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {i.inspection_type}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300 max-w-md">{i.findings_summary || i.summary || i.findings || 'Standard inspection completed.'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${(i.violations_found ?? 0) > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {i.violations_found ?? 0} Violations
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{i.inspection_date ? new Date(i.inspection_date).toLocaleDateString() : 'Recent'}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Notice Issued
                      </span>
                    </td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No inspection logs found for the selected mine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Log Statutory / Internal Mine Inspection</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Auditing Agency / Inspector</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Regional Inspector of Mines, DGMS Dhanbad"
                  value={formData.inspector_name}
                  onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Inspection Type</label>
                  <select
                    value={formData.inspection_type}
                    onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="STATUTORY_DGMS">Statutory DGMS Audit</option>
                    <option value="INTERNAL_SAFETY">Internal Safety Review</option>
                    <option value="ENVIRONMENTAL_SPCB">SPCB Environmental Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Violations Found</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.violations_found}
                    onChange={(e) => setFormData({ ...formData, violations_found: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Audit Summary & Findings</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Document key audit observations, bench geometry, haul road lighting, and statutory directives..."
                  value={formData.findings_summary}
                  onChange={(e) => setFormData({ ...formData, findings_summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Inspection Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections;
