import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const RiskOverview: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState<string | null>(null);
  const [selectedMine, setSelectedMine] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await api.getRiskSummary();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching risk summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleCalculate = async (mineId: string) => {
    setCalculating(mineId);
    try {
      await api.calculateMineRisk(mineId);
      await fetchSummary();
      if (selectedMine?.mine_id === mineId) {
          handleViewIntelligence(selectedMine);
      }
    } catch (error) {
      console.error("Error calculating risk:", error);
    } finally {
      setCalculating(null);
    }
  };

  const handleViewIntelligence = async (mine: any) => {
    setSelectedMine(mine);
    setLoadingIntel(true);
    try {
      const data = await api.getMineIntelligence(mine.mine_id);
      setIntelligence(data);
      
      try {
        const expData = await api.getMineExplanation(mine.mine_id);
        setExplanation(expData);
      } catch (err) {
        console.error("Explanation not available", err);
        setExplanation(null);
      }
      
    } catch (error) {
      console.error("Error fetching intelligence:", error);
    } finally {
      setLoadingIntel(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading Risk Engine...</div>;

  return (
    <div className="p-8 space-y-8 animate-fade-in text-white min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
          Risk Intelligence Engine
        </h1>
        <p className="text-slate-400 mt-2">Baseline Risk Calculation & Governance Model</p>
      </header>

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur">
              <h3 className="text-slate-400 text-sm font-medium">Total Mines</h3>
              <p className="text-4xl font-bold mt-2 text-white">{summary.total_mines}</p>
            </div>
            <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30 backdrop-blur">
              <h3 className="text-red-400 text-sm font-medium">Critical Risk</h3>
              <p className="text-4xl font-bold mt-2 text-red-500">{summary.critical_mines}</p>
            </div>
            <div className="bg-orange-900/20 p-6 rounded-xl border border-orange-500/30 backdrop-blur">
              <h3 className="text-orange-400 text-sm font-medium">High Risk</h3>
              <p className="text-4xl font-bold mt-2 text-orange-500">{summary.high_risk_mines}</p>
            </div>
            <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/30 backdrop-blur">
              <h3 className="text-yellow-400 text-sm font-medium">Medium Risk</h3>
              <p className="text-4xl font-bold mt-2 text-yellow-500">{summary.medium_risk_mines}</p>
            </div>
            <div className="bg-emerald-900/20 p-6 rounded-xl border border-emerald-500/30 backdrop-blur">
              <h3 className="text-emerald-400 text-sm font-medium">Low Risk</h3>
              <p className="text-4xl font-bold mt-2 text-emerald-500">{summary.low_risk_mines}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mine Risk Ranking</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800/80 text-slate-300 text-sm uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Mine</th>
                    <th className="px-6 py-4">Overall Risk Score</th>
                    <th className="px-6 py-4">Risk Level</th>
                    <th className="px-6 py-4">Last Calculated</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {summary.top_risk_mines.map((mine: any) => {
                    const isCritical = mine.risk_level === 'CRITICAL';
                    const isHigh = mine.risk_level === 'HIGH';
                    const isMedium = mine.risk_level === 'MEDIUM';
                    return (
                      <tr key={mine.mine_id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{mine.mine_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">{mine.overall_risk.toFixed(1)}</span>
                            <div className="w-full max-w-[100px] h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : isMedium ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${mine.overall_risk}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCritical ? 'bg-red-500/10 text-red-500 border-red-500/50' : isHigh ? 'bg-orange-500/10 text-orange-500 border-orange-500/50' : isMedium ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'}`}>
                            {mine.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(mine.calculated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCalculate(mine.mine_id)}
                              disabled={calculating === mine.mine_id}
                              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                            >
                              {calculating === mine.mine_id ? 'Calculating...' : 'Recalculate'}
                            </button>
                            <button
                              onClick={() => handleViewIntelligence(mine)}
                              className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition-colors"
                            >
                              AI Intelligence
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {summary.top_risk_mines.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No risk calculations found. Click calculate on a mine to generate the first score.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedMine && intelligence && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">AI Intelligence: {selectedMine.mine_name}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Model development currently uses synthetic development data because sufficient historical operational mine data is not available.
                </p>
              </div>

              {loadingIntel ? (
                <div className="text-slate-400">Analyzing AI models...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* BASELINE */}
                  <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-600">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Current Governance Status</h3>
                    <div className="text-4xl font-bold mb-2">
                      {intelligence.baseline.score.toFixed(1)}
                    </div>
                    <div className={`inline-block px-3 py-1 rounded text-sm font-bold border ${intelligence.baseline.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-orange-500/20 text-orange-400 border-orange-500/50'}`}>
                      Baseline Risk: {intelligence.baseline.level}
                    </div>
                  </div>

                  {/* PREDICTION */}
                  <div className="bg-slate-700/30 p-5 rounded-lg border border-blue-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-xs px-2 py-1 rounded-bl-lg font-bold">XGBOOST</div>
                    <h3 className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wider">Future Early Warning</h3>
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {intelligence.prediction.probability_percent}%
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      30-Day Critical Risk Probability
                    </div>
                    {Object.keys(intelligence.prediction.top_factors || {}).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-600/50">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">TOP RISK FACTORS:</p>
                        <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                          {Object.entries(intelligence.prediction.top_factors).slice(0,3).map(([k]) => (
                            <li key={k}>{k.replace(/_/g, ' ')}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* ANOMALY */}
                  <div className="bg-slate-700/30 p-5 rounded-lg border border-purple-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-purple-600 text-xs px-2 py-1 rounded-bl-lg font-bold">ISOLATION FOREST</div>
                    <h3 className="text-sm font-semibold text-purple-400 mb-4 uppercase tracking-wider">Behavioral Anomaly</h3>
                    <div className="text-2xl font-bold text-white mb-2">
                      {intelligence.anomaly.severity.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-slate-300 mb-2">
                      Status: {intelligence.anomaly.is_anomaly ? 'Anomaly Detected' : 'Normal Operations'}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Score: {intelligence.anomaly.score.toFixed(3)}
                    </div>
                  </div>

                </div>
              )}
              
              {!loadingIntel && explanation && !explanation.error && (
                <div className="mt-8 bg-slate-700/30 p-6 rounded-lg border border-slate-600">
                  <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-600 pb-2">Why This Prediction?</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Impact on model prediction ({explanation.model_version}).
                    SHAP contributions show how features push the prediction toward or away from critical risk.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Risk Increasing Factors
                      </h4>
                      <div className="space-y-4">
                        {explanation.top_risk_factors.map((factor: any) => (
                          <div key={factor.feature_name} className="bg-slate-800/80 p-4 rounded border border-red-500/20 relative group">
                            <div className="font-semibold text-slate-200">🔴 {factor.label}</div>
                            <div className="text-xs text-slate-400 mt-1">Current Value: {factor.feature_value.toFixed(2)}</div>
                            <div className="text-sm text-red-400 mt-2 font-medium flex items-center justify-between">
                              <span>Increases predicted risk</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">
                                SHAP Contribution: +{factor.shap_value.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {explanation.top_risk_factors.length === 0 && (
                          <div className="text-sm text-slate-500 italic">No significant risk increasing factors.</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Risk Reducing Factors
                      </h4>
                      <div className="space-y-4">
                        {explanation.top_protective_factors.map((factor: any) => (
                          <div key={factor.feature_name} className="bg-slate-800/80 p-4 rounded border border-emerald-500/20 relative group">
                            <div className="font-semibold text-slate-200">🟢 {factor.label}</div>
                            <div className="text-xs text-slate-400 mt-1">Current Value: {factor.feature_value.toFixed(2)}</div>
                            <div className="text-sm text-emerald-400 mt-2 font-medium flex items-center justify-between">
                              <span>Reduces predicted risk</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs border border-slate-700">
                                SHAP Contribution: {factor.shap_value.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {explanation.top_protective_factors.length === 0 && (
                          <div className="text-sm text-slate-500 italic">No significant risk reducing factors.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RiskOverview;
