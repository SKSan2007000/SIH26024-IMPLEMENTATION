import React, { useEffect, useState } from 'react';
import { api, type Mine } from '../services/api';
import { DemoIoTControls } from '../components/DemoIoTControls';
import { TelemetryChart } from '../components/TelemetryChart';

const IoTControl: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const minesData = await api.getMines();
      setMines(minesData || []);

      const mineId = selectedMineId || (minesData[0]?.id ?? '');
      if (mineId) {
        setSelectedMineId(mineId);
        const sensorData = await api.getMineSensors(mineId);
        setSensors(sensorData || []);
        if (sensorData.length > 0) {
          setSelectedSensor(sensorData[0]);
          const t = await api.getSensorTelemetry(sensorData[0].id);
          setTelemetry(t || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId]);

  const handleSelectSensor = async (s: any) => {
    setSelectedSensor(s);
    try {
      const t = await api.getSensorTelemetry(s.id);
      setTelemetry(t || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateSpike = async (eventType: string) => {
    if (!selectedMineId) return;
    try {
      setLoading(true);
      await api.generateDemoTelemetry(selectedMineId, eventType);
      await fetchData();
    } catch (err) {
      console.error("Failed to inject demo spike", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <span>High-Frequency Sensor Mesh Telemetry</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">IoT Telemetry & Anomaly Injection</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time environmental and structural sensor feeds with simulated spike injection for judge evaluation.
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

      {/* Demo Injection Controls */}
      <DemoIoTControls
        onSimulateSpike={handleSimulateSpike}
        loading={loading}
      />

      {/* Sensors & Telemetry Graph Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sensor List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Active Sensor Nodes ({sensors.length})
          </h2>

          <div className="space-y-3">
            {sensors.map(s => {
              const isSelected = selectedSensor?.id === s.id;
              const isCrit = s.status === 'CRITICAL';
              const isWarn = s.status === 'WARNING';

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSensor(s)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-950/40 border-indigo-500 shadow-lg' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white">{s.sensor_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isWarn ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">{s.sensor_type}</span>
                    <span className="text-base font-black text-white">{s.value} <span className="text-xs font-normal text-slate-400">{s.unit}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry Graph */}
        <div className="lg:col-span-2">
          {selectedSensor ? (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Live Time Series Ingestion</span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedSensor.sensor_name} ({selectedSensor.sensor_type})</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{selectedSensor.value} {selectedSensor.unit}</div>
                  <span className="text-[10px] text-slate-500">Limits: Warn {selectedSensor.threshold_warning} | Crit {selectedSensor.threshold_critical}</span>
                </div>
              </div>

              <div className="h-72 w-full bg-slate-950 p-4 rounded-xl border border-slate-800">
                <TelemetryChart
                  data={telemetry}
                  unit={selectedSensor.unit || ''}
                  warningThreshold={selectedSensor.threshold_warning || 50}
                  criticalThreshold={selectedSensor.threshold_critical || 100}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
              Select a sensor node to view live chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IoTControl;
