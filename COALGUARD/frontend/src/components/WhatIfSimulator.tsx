import React, { useState } from 'react';
import { api } from '../services/api';

interface WhatIfSimulatorProps {
  mineId: string;
  role: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ mineId, role }) => {
  const [incidents, setIncidents] = useState<string>('');
  const [actions, setActions] = useState<string>('');
  const [docs, setDocs] = useState<string>('');
  const [pm10, setPm10] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const overrides: any = {};
      if (incidents !== '') overrides.critical_safety_incidents_30d = Number(incidents);
      if (actions !== '') overrides.overdue_corrective_actions = Number(actions);
      if (docs !== '') overrides.expired_compliance_documents = Number(docs);
      if (pm10 !== '') overrides.pm10_level = Number(pm10);
      
      const res = await api.runRiskSimulation(mineId, role, overrides);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIncidents('');
    setActions('');
    setDocs('');
    setPm10('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-slate-900 border border-purple-500/50 rounded-xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.1)]">
      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
        Simulation Mode
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        What-If Risk Simulator
      </h3>
      <p className="text-slate-400 text-sm mb-6">
        Test hypothetical operational conditions without modifying the real database.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Critical Safety Incidents (Last 30d)</label>
            <input 
              type="number" min="0" max="20"
              value={incidents} onChange={e => setIncidents(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Leave empty to use current"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Overdue Corrective Actions</label>
            <input 
              type="number" min="0" max="50"
              value={actions} onChange={e => setActions(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Leave empty to use current"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Expired Compliance Documents</label>
            <input 
              type="number" min="0" max="20"
              value={docs} onChange={e => setDocs(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Leave empty to use current"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">PM10 Environment Level (μg/m³)</label>
            <input 
              type="number" min="0" max="500"
              value={pm10} onChange={e => setPm10(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Leave empty to use current"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSimulate}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-bold transition-colors"
            >
              Reset
            </button>
          </div>
          
          {error && <div className="text-red-400 text-sm mt-2 font-bold p-3 bg-red-900/20 rounded border border-red-900/50">{error}</div>}
        </div>

        <div className="bg-slate-950 rounded-lg p-5 border border-slate-800 flex flex-col justify-center">
          {!result ? (
            <div className="text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              <p>Configure overrides and run simulation to see risk impact.</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 font-bold mb-1">BASELINE RISK</div>
                  <div className="text-3xl font-black text-white">{result.baseline_score.toFixed(1)}</div>
                  <div className="text-xs font-bold mt-1 text-slate-500">{result.baseline_level}</div>
                </div>
                <div className={`text-center p-4 rounded-lg border ${result.absolute_change > 0 ? 'bg-red-900/20 border-red-500/30' : result.absolute_change < 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900 border-slate-700'}`}>
                  <div className="text-xs text-slate-400 font-bold mb-1">SIMULATED RISK</div>
                  <div className="text-3xl font-black text-white">{result.simulated_score.toFixed(1)}</div>
                  <div className="text-xs font-bold mt-1" style={{color: result.absolute_change > 0 ? '#f87171' : result.absolute_change < 0 ? '#34d399' : '#94a3b8'}}>
                    {result.simulated_level}
                  </div>
                </div>
              </div>

              {result.absolute_change !== 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xl font-bold ${result.absolute_change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.absolute_change > 0 ? '+' : ''}{result.absolute_change.toFixed(1)} pts
                  </span>
                  <span className="text-slate-500 text-sm">
                    ({result.percentage_change > 0 ? '+' : ''}{result.percentage_change.toFixed(1)}%)
                  </span>
                </div>
              )}

              {result.simulated_prediction && (
                <div className="p-4 bg-slate-900 rounded border border-slate-700">
                   <div className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Simulated XGBoost Prediction</div>
                   <div className="flex justify-between items-end">
                     <div>
                       <div className="text-2xl font-bold text-blue-400">
                         {Math.round(result.simulated_prediction.probability * 100)}%
                       </div>
                       <div className="text-xs text-slate-500">Critical Risk Probability</div>
                     </div>
                     <div className="text-sm font-bold text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                       {result.simulated_prediction.level}
                     </div>
                   </div>
                </div>
              )}

              {result.factors_changed.length > 0 && (
                <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded">
                  <strong>Overrides Applied:</strong> {result.factors_changed.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
