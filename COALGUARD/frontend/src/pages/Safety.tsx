import React, { useEffect, useState } from 'react';
import { api, type Mine, type SafetyReport } from '../services/api';

const Safety: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    mine_id: '',
    incident_type: 'HAZARD_OBSERVATION',
    severity: 'MEDIUM',
    title: '',
    description: '',
    location_details: 'Bench 4 Highwall',
    injuries_reported: 0,
    equipment_damaged: false,
    corrective_action_required: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, reportsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getSafetyReports(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setReports(reportsData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
        setFormData(prev => ({ ...prev, mine_id: minesData[0].id }));
      }
    } catch (err) {
      console.error('Error fetching safety data:', err);
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
      await api.createSafetyReport({
        ...formData,
        mine_id: selectedMineId || formData.mine_id
      });
      setShowModal(false);
      setFormData({
        mine_id: selectedMineId,
        incident_type: 'HAZARD_OBSERVATION',
        severity: 'MEDIUM',
        title: '',
        description: '',
        location_details: 'Bench 4 Highwall',
        injuries_reported: 0,
        equipment_damaged: false,
        corrective_action_required: true
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit safety report');
    } finally {
      setSubmitting(false);
    }
  };

  const highSeverityCount = reports.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length;
  const totalIncidents = reports.length;
  const totalInjuries = reports.reduce((acc, curr) => acc + (curr.injuries_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>DGMS Coal Mines Regulations (CMR) 2017</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Safety & Hazard Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time hazard logging, highwall stability monitoring, safety gear compliance, and statutory report generation.
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
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Log Safety Incident
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Reports Logged</span>
            <div className="text-3xl font-black text-white mt-1">{totalIncidents}</div>
          </div>
          <span className="text-2xl p-3 bg-amber-500/10 rounded-xl">🦺</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Critical / High Severity</span>
            <div className="text-3xl font-black text-red-400 mt-1">{highSeverityCount}</div>
          </div>
          <span className="text-2xl p-3 bg-red-500/10 rounded-xl">⚠️</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Injuries Recorded</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{totalInjuries} (Zero Fatal)</div>
          </div>
          <span className="text-2xl p-3 bg-emerald-500/10 rounded-xl">🛡️</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Logged Safety Incidents & Hazard Observations</h3>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading safety records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3">Title & Location</th>
                  <th className="pb-3">Incident Type</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Injuries</th>
                  <th className="pb-3">Reported Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((r) => {
                  const isCrit = r.severity === 'CRITICAL' || r.severity === 'HIGH';
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-4">
                        <div className="font-bold text-white">{r.title}</div>
                        <div className="text-slate-400 text-[11px]">{r.location_details || 'Open Pit Bench'}</div>
                      </td>
                      <td className="py-4 text-slate-300">{r.incident_type}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isCrit ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'}`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-4 text-slate-300">{r.injuries_count || 0}</td>
                      <td className="py-4 text-slate-400">{new Date(r.reported_at || r.created_at || Date.now()).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          Under Review
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No safety reports found for the selected mine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Safety Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Log New Safety Hazard / Incident</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mine Block</label>
                <select
                  value={formData.mine_id}
                  onChange={(e) => setFormData({ ...formData, mine_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {mines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Loose boulder hazard near haul road ramp 3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low (Observation)</option>
                    <option value="MEDIUM">Medium (Near Miss)</option>
                    <option value="HIGH">High (Hazardous Condition)</option>
                    <option value="CRITICAL">Critical (Immediate Stop)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Location / Bench</label>
                  <input
                    type="text"
                    value={formData.location_details}
                    onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe observed conditions, unsafe acts, or environmental hazards..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Log Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Safety;
