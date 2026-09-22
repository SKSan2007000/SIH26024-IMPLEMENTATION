import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Mine, type MineZone } from '../services/api';
import { MineTwin3D } from '../components/MineTwin3D';
import { TelemetryChart } from '../components/TelemetryChart';

const MineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mine, setMine] = useState<Mine | null>(null);
  const [zones, setZones] = useState<MineZone[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'twin' | 'zones' | 'sensors' | 'risk' | 'actions' | 'timeline'>('twin');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchMineData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [m, z, s, intel, acts, tl] = await Promise.all([
        api.getMine(id).catch(() => null),
        api.getMineZones(id).catch(() => []),
        api.getMineSensors(id).catch(() => []),
        api.getMineIntelligence(id).catch(() => null),
        api.getGovernanceActions(id).catch(() => []),
        api.getTimelineEvents(id).catch(() => [])
      ]);

      setMine(m);
      setZones(z || []);
      setSensors(s || []);
      setIntelligence(intel);
      setActions(acts || []);
      setTimeline(tl || []);

      if (s && s.length > 0) {
        setSelectedSensor(s[0]);
        api.getSensorTelemetry(s[0].id).then(t => setTelemetry(t || [])).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching mine detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMineData();
  }, [id]);

  const handleSelectSensor = async (sensor: any) => {
    setSelectedSensor(sensor);
    try {
      const data = await api.getSensorTelemetry(sensor.id);
      setTelemetry(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalculate = async () => {
    if (!id) return;
    setRecalculating(true);
    try {
      await api.calculateMineRisk(id);
      await fetchMineData();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading Mine Operational Twin...</p>
        </div>
      </div>
    );
  }

  if (!mine) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-400">Mine Not Found</h2>
        <p className="text-slate-400">The requested coal mine block could not be loaded.</p>
        <Link to="/mines" className="inline-block px-4 py-2 bg-blue-600 rounded-xl text-white font-bold text-sm">
          Return to Mines Directory
        </Link>
      </div>
    );
  }

  const score = mine.risk_score ?? (intelligence?.baseline?.score ?? 50.0);
  const isCritical = score >= 75;
  const isHigh = score >= 50 && score < 75;
  const isMedium = score >= 25 && score < 50;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Mine Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/mines" className="hover:text-blue-400">Mines Directory</Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">{mine.code}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-3xl font-black text-white">{mine.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-black border ${isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' : isHigh ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : isMedium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {mine.risk_level || (isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW')}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            📍 {mine.region || 'Central'} Region • {mine.state || 'Chhattisgarh'} • Coordinates: [{(mine.latitude ?? 22.35).toFixed(4)}, {(mine.longitude ?? 82.68).toFixed(4)}] • Capacity: {mine.production_capacity || '5.0 MTPA'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {recalculating ? 'Recalculating Fusion...' : '⚡ Recalculate Risk Engine'}
          </button>
          <Link
            to="/command-center"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Command Center Map →
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'twin', label: '🌐 3D Digital Twin & Sensors' },
          { id: 'zones', label: `📍 Operational Zones (${zones.length})` },
          { id: 'sensors', label: `📡 IoT Telemetry (${sensors.length})` },
          { id: 'risk', label: '🧠 AI Risk Triad & SHAP' },
          { id: 'actions', label: `📋 Corrective Actions (${actions.length})` },
          { id: 'timeline', label: `⚡ Event Timeline (${timeline.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: 3D Digital Twin & Sensor Telemetry */}
      {activeTab === 'twin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[550px] bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
            <MineTwin3D
              sensors={sensors}
              onSelectSensor={handleSelectSensor}
              selectedSensorId={selectedSensor?.id || null}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
                Selected Sensor Telemetry
              </h3>
              {selectedSensor ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-lg text-white">{selectedSensor.sensor_name}</div>
                      <div className="text-xs text-slate-400">{selectedSensor.sensor_type} • Zone: {selectedSensor.zone_id || 'Pit Alpha'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedSensor.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : selectedSensor.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {selectedSensor.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                    <span className="text-slate-400">Current Reading</span>
                    <span className="text-xl font-black text-white">
                      {selectedSensor.value} <span className="text-xs font-normal text-slate-400">{selectedSensor.unit}</span>
                    </span>
                  </div>

                  <div className="h-44 w-full bg-slate-950 rounded-xl p-2 border border-slate-800">
                    <TelemetryChart
                      data={telemetry}
                      unit={selectedSensor.unit || ''}
                      warningThreshold={selectedSensor.threshold_warning || 50}
                      criticalThreshold={selectedSensor.threshold_critical || 100}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-10">
                  Select a sensor node on the 3D twin to view real-time curve.
                </div>
              )}
            </div>

            {/* Quick Zone Distribution */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Active Mine Zones</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {zones.map(z => (
                  <span key={z.id} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium">
                    {z.name} ({z.zone_type})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operational Zones */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map(z => (
            <div key={z.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{z.zone_type}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{z.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  Risk: {(z.current_risk_score ?? 25).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-slate-400">{z.description || 'Standard operational mining zone with compliance sensors installed.'}</p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Elevation: <strong>{z.elevation_meters ?? z.elevation ?? 150}m</strong></span>
                <span>Coordinates: <strong>[{(z.latitude ?? 22.3).toFixed(3)}, {(z.longitude ?? 82.6).toFixed(3)}]</strong></span>
              </div>
            </div>
          ))}
          {zones.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-500">
              No zones registered for this mine.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sensors List & Telemetry */}
      {activeTab === 'sensors' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">IoT Sensor Network Telemetry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3">Sensor Name & ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Current Value</th>
                  <th className="pb-3">Thresholds (Warn / Crit)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sensors.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-white">{s.sensor_name}</td>
                    <td className="py-3 text-slate-400">{s.sensor_type}</td>
                    <td className="py-3 font-black text-white">{s.value} {s.unit}</td>
                    <td className="py-3 text-slate-400">{s.threshold_warning} / {s.threshold_critical} {s.unit}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : s.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => { setSelectedSensor(s); setActiveTab('twin'); }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                      >
                        Inspect Node →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI Risk Triad & SHAP Explanation */}
      {activeTab === 'risk' && intelligence && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Dept Baseline Risk</span>
              <div className="text-4xl font-black text-white">{intelligence.baseline?.score?.toFixed(1) || score.toFixed(1)}</div>
              <div className="text-xs text-slate-400">Fused across Environmental, Safety, Contractor, and Inspection modules.</div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30 space-y-2 relative overflow-hidden">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">XGBoost 30-Day Critical Warning</span>
              <div className="text-4xl font-black text-blue-400">{intelligence.prediction?.probability_percent || 78.5}%</div>
              <div className="text-xs text-slate-400">Probability of critical statutory non-compliance in the next 30 days.</div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-purple-500/30 space-y-2 relative overflow-hidden">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Isolation Forest Anomaly Score</span>
              <div className="text-4xl font-black text-purple-400">{intelligence.anomaly?.score?.toFixed(3) || '0.742'}</div>
              <div className="text-xs text-slate-400">Status: <strong className="text-white">{intelligence.anomaly?.severity || 'HIGH_ANOMALY'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Corrective Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map(a => (
              <div key={a.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-base">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.status === 'CLOSED' || a.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : a.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{a.description}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Priority: <strong>{a.priority}</strong></span>
                  <span>Due: <strong>{new Date(a.deadline).toLocaleDateString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
          {actions.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              No open actions for this mine block.
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Timeline Feed */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Mine Activity Audit Timeline</h3>
          <div className="space-y-3">
            {timeline.map(t => (
              <div key={t.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-200">{t.title}</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{t.description}</p>
                  <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                    <span>Dept: <strong>{t.department}</strong></span>
                    <span>Actor: <strong>{t.actor_name}</strong></span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MineDetail;
