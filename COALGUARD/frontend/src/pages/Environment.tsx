import React, { useEffect, useState } from 'react';
import { api, type Mine, type EnvironmentReading } from '../services/api';

const Environment: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [readings, setReadings] = useState<EnvironmentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    mine_id: '',
    pm25: 45.0,
    pm10: 165.0,
    so2: 24.5,
    no2: 32.0,
    water_ph: 7.2,
    noise_db: 68.0,
    wind_speed: 12.5,
    wind_direction: 'NE'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, readingsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getEnvironmentReadings(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setReadings(readingsData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
        setFormData(prev => ({ ...prev, mine_id: minesData[0].id }));
      }
    } catch (err) {
      console.error('Error fetching environment data:', err);
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
      await api.createEnvironmentReading({
        ...formData,
        mine_id: selectedMineId || formData.mine_id
      });
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit environment reading');
    } finally {
      setSubmitting(false);
    }
  };

  const latest = readings[0] || {
    pm25: 58.2,
    pm10: 185.4,
    so2: 28.1,
    no2: 36.4,
    water_ph: 7.4,
    noise_db: 74.2
  };

  const pm10Exceeded = (latest.pm10 || 0) > 100;
  const pm25Exceeded = (latest.pm25 || 0) > 60;
  const noiseExceeded = (latest.noise_db || 0) > 75;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <span>CPCB / SPCB National Ambient Air Quality Standards (NAAQS)</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Environmental Compliance & Telemetry</h1>
          <p className="text-slate-400 text-sm mt-1">
            Continuous ambient air quality, PM2.5/PM10 particulate levels, mine effluent water discharge pH, and noise monitoring.
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
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Record Daily Station Log
          </button>
        </div>
      </div>

      {/* Real-time Environmental Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* PM10 Card */}
        <div className={`p-5 rounded-2xl border shadow-xl backdrop-blur-md ${pm10Exceeded ? 'bg-red-950/30 border-red-500/40' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PM10 Particulate</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pm10Exceeded ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {pm10Exceeded ? 'EXCEEDED' : 'COMPLIANT'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${pm10Exceeded ? 'text-red-400' : 'text-white'}`}>{latest.pm10?.toFixed(1) || '142.0'}</span>
            <span className="text-xs text-slate-400">µg/m³ (Limit: 100)</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${pm10Exceeded ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(((latest.pm10 || 0) / 250) * 100, 100)}%` }} />
          </div>
        </div>

        {/* PM2.5 Card */}
        <div className={`p-5 rounded-2xl border shadow-xl backdrop-blur-md ${pm25Exceeded ? 'bg-orange-950/30 border-orange-500/40' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PM2.5 Fine Dust</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pm25Exceeded ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {pm25Exceeded ? 'ELEVATED' : 'COMPLIANT'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${pm25Exceeded ? 'text-orange-400' : 'text-white'}`}>{latest.pm25?.toFixed(1) || '48.5'}</span>
            <span className="text-xs text-slate-400">µg/m³ (Limit: 60)</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${pm25Exceeded ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(((latest.pm25 || 0) / 120) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Water Discharge pH */}
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mine Water pH</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              OPTIMAL
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{latest.water_ph?.toFixed(1) || '7.4'}</span>
            <span className="text-xs text-slate-400">pH (Norm: 6.5 - 8.5)</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '74%' }} />
          </div>
        </div>

        {/* Ambient Noise dB */}
        <div className={`p-5 rounded-2xl border shadow-xl backdrop-blur-md ${noiseExceeded ? 'bg-yellow-950/30 border-yellow-500/40' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industrial Noise</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {latest.noise_db?.toFixed(1) || '68.0'} dB
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{latest.noise_db?.toFixed(1) || '68.0'}</span>
            <span className="text-xs text-slate-400">dB(A) (Day Limit: 75)</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${Math.min(((latest.noise_db || 0) / 100) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Historical Readings Log Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Continuous Environmental Station Telemetry Logs</h3>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading station telemetry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">PM10 (µg/m³)</th>
                  <th className="pb-3">PM2.5 (µg/m³)</th>
                  <th className="pb-3">SO2 / NO2</th>
                  <th className="pb-3">Water pH</th>
                  <th className="pb-3">Noise (dB)</th>
                  <th className="pb-3">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {readings.map(r => {
                  const isViolation = (r.pm10 || 0) > 100 || (r.pm25 || 0) > 60;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-200">{new Date(r.recorded_at || r.created_at || Date.now()).toLocaleString()}</td>
                      <td className={`py-3 font-bold ${(r.pm10 || 0) > 100 ? 'text-red-400' : 'text-slate-300'}`}>{r.pm10?.toFixed(1)}</td>
                      <td className={`py-3 font-bold ${(r.pm25 || 0) > 60 ? 'text-orange-400' : 'text-slate-300'}`}>{r.pm25?.toFixed(1)}</td>
                      <td className="py-3 text-slate-400">{r.so2?.toFixed(1)} / {r.no2?.toFixed(1)}</td>
                      <td className="py-3 text-slate-300">{r.water_ph?.toFixed(1)}</td>
                      <td className="py-3 text-slate-300">{r.noise_db?.toFixed(1)} dB</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isViolation ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                          {isViolation ? 'EXCEEDANCE ALERT' : 'PASS (CPCB)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {readings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No telemetry logs found for the selected mine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Station Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Record Environmental Station Reading</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">PM10 (µg/m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.pm10}
                    onChange={(e) => setFormData({ ...formData, pm10: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">PM2.5 (µg/m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.pm25}
                    onChange={(e) => setFormData({ ...formData, pm25: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Water Discharge pH</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.water_ph}
                    onChange={(e) => setFormData({ ...formData, water_ph: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Noise Level (dB)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.noise_db}
                    onChange={(e) => setFormData({ ...formData, noise_db: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50">
                  {submitting ? 'Logging...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Environment;
