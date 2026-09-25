import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    risk_weights: {
      safety_weight: 0.35,
      environment_weight: 0.25,
      contractor_weight: 0.20,
      inspection_weight: 0.20
    },
    sla_hours: {
      critical_action_sla_hours: 24,
      high_action_sla_hours: 72,
      medium_action_sla_hours: 168
    },
    anomaly_threshold: 0.70,
    notification_email_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then((data: any) => {
      if (data && Object.keys(data).length > 0) setSettings(data);
    }).catch((err: any) => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>System Architecture & Algorithmic Calibration</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Platform Settings & Risk Parameters</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure risk fusion weights, SLA escalation intervals, AI threshold cutoffs, and notification parameters.
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-400 text-xs">
          Loading platform settings...
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl text-emerald-300 font-bold text-sm">
          ✓ System settings updated and calibrated across risk engine!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Multi-Department Risk Fusion Weights */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚖️ Multi-Department Risk Fusion Weights</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure the relative weight of each operational department in the overall mine baseline risk score (Total = 1.00).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Safety Incidents Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.risk_weights?.safety_weight ?? 0.35}
                onChange={(e) => setSettings({
                  ...settings,
                  risk_weights: { ...settings.risk_weights, safety_weight: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environmental Telemetry Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.risk_weights?.environment_weight ?? 0.25}
                onChange={(e) => setSettings({
                  ...settings,
                  risk_weights: { ...settings.risk_weights, environment_weight: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contractor Compliance Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.risk_weights?.contractor_weight ?? 0.20}
                onChange={(e) => setSettings({
                  ...settings,
                  risk_weights: { ...settings.risk_weights, contractor_weight: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">DGMS Violations Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.risk_weights?.inspection_weight ?? 0.20}
                onChange={(e) => setSettings({
                  ...settings,
                  risk_weights: { ...settings.risk_weights, inspection_weight: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: SLA Escalation Thresholds */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⏱️ Corrective Action SLA Intervals (Hours)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Define statutory turnaround times before automatic multi-level escalation is triggered.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-red-400 mb-1">Critical Priority SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours?.critical_action_sla_hours ?? 24}
                onChange={(e) => setSettings({
                  ...settings,
                  sla_hours: { ...settings.sla_hours, critical_action_sla_hours: parseInt(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-1">High Priority SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours?.high_action_sla_hours ?? 72}
                onChange={(e) => setSettings({
                  ...settings,
                  sla_hours: { ...settings.sla_hours, high_action_sla_hours: parseInt(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-yellow-400 mb-1">Medium Priority SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours?.medium_action_sla_hours ?? 168}
                onChange={(e) => setSettings({
                  ...settings,
                  sla_hours: { ...settings.sla_hours, medium_action_sla_hours: parseInt(e.target.value) }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105 disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save Calibration Parameters'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
