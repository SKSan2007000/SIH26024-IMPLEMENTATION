import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Mine } from '../services/api';

const Mines: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: 'Eastern',
    state: 'Jharkhand',
    latitude: 23.7957,
    longitude: 86.4304,
    production_capacity: '5.0 MTPA'
  });

  const fetchMines = async () => {
    try {
      setLoading(true);
      const data = await api.getMines();
      setMines(data || []);
    } catch (err) {
      console.error('Failed to load mines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMines();
  }, []);

  const handleCreateMine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.createMine(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        region: 'Eastern',
        state: 'Jharkhand',
        latitude: 23.7957,
        longitude: 86.4304,
        production_capacity: '5.0 MTPA'
      });
      await fetchMines();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create mine');
    } finally {
      setCreating(false);
    }
  };

  const filteredMines = mines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.state || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'ALL' || (m.region || 'Central') === regionFilter;
    const score = m.risk_score || 0;
    let matchesRisk = true;
    if (riskFilter === 'CRITICAL') matchesRisk = score >= 75;
    if (riskFilter === 'HIGH') matchesRisk = score >= 50 && score < 75;
    if (riskFilter === 'MEDIUM') matchesRisk = score >= 25 && score < 50;
    if (riskFilter === 'LOW') matchesRisk = score < 25;

    return matchesSearch && matchesRegion && matchesRisk;
  });

  const uniqueRegions = Array.from(new Set(mines.map(m => m.region || 'Central')));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span>⛏️ Operational Coal Mines Directory</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Registered Coal India / SCCL blocks with continuous environmental telemetry, safety records, and digital twin assets.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Register New Mine
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search by mine name, code, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Regions</option>
            {uniqueRegions.map(r => (
              <option key={r} value={r}>{r} Region</option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk (75-100)</option>
            <option value="HIGH">High Risk (50-74)</option>
            <option value="MEDIUM">Medium Risk (25-49)</option>
            <option value="LOW">Low Risk (0-24)</option>
          </select>
        </div>
      </div>

      {/* Grid of Mine Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading mine directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMines.map((m) => {
            const score = m.risk_score || 50.0;
            const isCritical = score >= 75;
            const isHigh = score >= 50 && score < 75;
            const isMedium = score >= 25 && score < 50;

            const badgeColor = isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                               isHigh ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                               isMedium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                               'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

            return (
              <div
                key={m.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 p-6 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:scale-[1.01]"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                        {m.code}
                      </span>
                      <h2 className="text-xl font-bold text-white mt-1.5 group-hover:text-blue-400 transition">
                        {m.name}
                      </h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                      {m.risk_level || (isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    📍 {m.region || 'Central'} Region • {m.state || 'Chhattisgarh'} ({(m.latitude ?? 22.35).toFixed(3)}, {(m.longitude ?? 82.68).toFixed(3)})
                  </p>

                  <div className="mt-5 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Risk Fusion Index</span>
                      <span className="font-black text-white">{score.toFixed(1)} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : isMedium ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>Capacity: <strong className="text-slate-200">{m.production_capacity || '5.0 MTPA'}</strong></span>
                      <span>Twin Status: <strong className="text-emerald-400">Operational</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
                  <Link
                    to={`/mines/${m.id}`}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl text-center transition"
                  >
                    View Operational Twin →
                  </Link>
                  <Link
                    to={`/command-center`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                    title="Open in National Command Center"
                  >
                    🌐 Map
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Mine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Register New Coal Mine Block</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMine} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jharia Open Cast Block VII"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mine Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., JHA-OC-07"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Capacity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 6.5 MTPA"
                    value={formData.production_capacity}
                    onChange={(e) => setFormData({ ...formData, production_capacity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Region</label>
                  <input
                    type="text"
                    required
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Register Mine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mines;
