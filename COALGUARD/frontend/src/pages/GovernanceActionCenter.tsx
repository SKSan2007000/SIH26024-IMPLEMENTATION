import React, { useEffect, useState } from 'react';
import { api, type Mine } from '../services/api';
import { FieldEvidencePanel, SupervisorReviewPanel } from '../components/FieldEvidencePanels';

const GovernanceActionCenter: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  
  const [intelligence, setIntelligence] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchMines();
  }, []);

  useEffect(() => {
    if (selectedMineId) {
      loadMineData(selectedMineId);
    } else {
      setIntelligence(null);
      setRecommendations([]);
      setActions([]);
    }
  }, [selectedMineId]);

  const fetchMines = async () => {
    try {
      const data = await api.getMines();
      setMines(data);
      if (data.length > 0) {
        setSelectedMineId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMineData = async (mineId: string) => {
    try {
      const intel = await api.getMineIntelligence(mineId);
      setIntelligence(intel);

      const recs = await api.getGovernanceRecommendations(mineId);
      setRecommendations(recs);

      const acts = await api.getGovernanceActions(mineId);
      setActions(acts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshIntelligence = async () => {
    if (!selectedMineId) return;
    setRefreshing(true);
    try {
      await api.calculateMineRisk(selectedMineId);
      await loadMineData(selectedMineId);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = async (recId: string) => {
    try {
      await api.acceptRecommendation(recId);
      if (selectedMineId) await loadMineData(selectedMineId);
    } catch (e) {
      console.error(e);
      alert("Error accepting recommendation");
    }
  };

  const handleReject = async (recId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.rejectRecommendation(recId, reason);
      if (selectedMineId) await loadMineData(selectedMineId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (actionId: string, status: string) => {
    try {
      await api.updateActionStatus(actionId, status);
      if (selectedMineId) await loadMineData(selectedMineId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDemoFastForward = async () => {
    try {
      const res = await api.demoFastForwardEscalation(1);
      alert(`Time fast-forwarded by 1 day. Escalated actions: ${res.escalated_actions}`);
      if (selectedMineId) await loadMineData(selectedMineId);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-8 animate-fade-in text-white min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
            Governance Action Center
          </h1>
          <p className="text-slate-400 mt-2">Closed-Loop AI Decision Support & Action Tracking</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedMineId} 
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded p-2"
          >
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>
          <button 
            onClick={handleDemoFastForward}
            className="bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/50 text-purple-300 px-4 py-2 rounded text-sm transition-colors"
          >
            [DEMO] Fast-Forward Time
          </button>
        </div>
      </header>

      {intelligence && (
        <section className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Current Intelligence</h2>
            <button 
              onClick={handleRefreshIntelligence}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {refreshing ? 'Recalculating...' : 'Refresh Intelligence'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-lg border ${intelligence.baseline.level === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-700/30 border-slate-600'}`}>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Baseline Risk</h3>
              <div className="text-3xl font-bold">{intelligence.baseline.score.toFixed(1)}</div>
              <div className="text-sm font-bold mt-1 text-slate-300">{intelligence.baseline.level}</div>
            </div>
            <div className={`p-4 rounded-lg border ${intelligence.prediction.level === 'CRITICAL' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-700/30 border-slate-600'}`}>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">30-Day Critical Risk Probability</h3>
              <div className="text-3xl font-bold text-blue-400">{intelligence.prediction.probability_percent}%</div>
              <div className="text-sm mt-1 text-slate-400">XGBoost Early Warning</div>
            </div>
            <div className={`p-4 rounded-lg border ${intelligence.anomaly.is_anomaly ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-700/30 border-slate-600'}`}>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Behavioral Anomaly</h3>
              <div className="text-3xl font-bold text-purple-400">{intelligence.anomaly.severity.replace(/_/g, ' ')}</div>
              <div className="text-sm mt-1 text-slate-400">Isolation Forest</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 italic">
            Risk and prediction values are dynamically recalculated after underlying operational data changes.
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AI Recommendations */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            AI Recommendations <span className="text-sm bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{recommendations.filter(r => r.status === 'RECOMMENDED').length}</span>
          </h2>
          <div className="space-y-4">
            {recommendations.filter(r => r.status === 'RECOMMENDED').map(rec => (
              <div key={rec.id} className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-lg">
                <div className={`px-4 py-2 text-sm font-bold border-b ${rec.priority === 'CRITICAL' ? 'bg-red-900/50 border-red-500/50 text-red-400' : rec.priority === 'HIGH' ? 'bg-orange-900/50 border-orange-500/50 text-orange-400' : 'bg-slate-700 border-slate-600'}`}>
                  Priority: {rec.priority} | Source: {rec.source_type}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2">{rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟠' : '🟡'} {rec.title}</h3>
                  <p className="text-sm text-slate-300 mb-4">{rec.description}</p>
                  
                  <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 mb-4 border border-slate-700">
                    <span className="font-bold text-slate-300">AI Explanation:</span> {rec.reason}
                    {rec.triggering_features && rec.triggering_features.shap_factor && (
                       <div className="mt-1 text-blue-400 font-semibold">
                         Model contribution identified: {rec.triggering_features.shap_factor.replace(/_/g, ' ')}
                       </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleReject(rec.id)} className="px-4 py-2 rounded text-sm bg-slate-700 hover:bg-slate-600 transition-colors">
                      Reject
                    </button>
                    <button onClick={() => handleAccept(rec.id)} className="px-4 py-2 rounded text-sm bg-emerald-600 hover:bg-emerald-500 transition-colors font-bold">
                      Accept & Assign
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {recommendations.filter(r => r.status === 'RECOMMENDED').length === 0 && (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                No active recommendations. The mine is operating within acceptable parameters.
              </div>
            )}
          </div>
        </section>

        {/* Active Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Active Actions <span className="text-sm bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{actions.filter(a => !['CLOSED', 'VERIFIED'].includes(a.status)).length}</span>
          </h2>
          <div className="space-y-4">
            {actions.filter(a => !['CLOSED', 'VERIFIED'].includes(a.status)).map(action => (
              <div key={action.id} className={`bg-slate-800 rounded-lg border-l-4 p-4 shadow-lg flex flex-col gap-3 ${action.status === 'OVERDUE' ? 'border-l-red-500' : action.status === 'COMPLETED' ? 'border-l-emerald-500' : 'border-l-blue-500'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{action.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{action.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${action.status === 'OVERDUE' ? 'bg-red-500/20 text-red-500' : action.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-400'}`}>
                    {action.status}
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 grid grid-cols-2 gap-2">
                  <div>Due: {new Date(action.deadline).toLocaleDateString()}</div>
                  {action.escalation_level > 0 && (
                    <div className="text-orange-400 font-bold">Escalation Level: {action.escalation_level}</div>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  {action.status === 'OPEN' && (
                    <button onClick={() => handleStatusChange(action.id, 'IN_PROGRESS')} className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded">
                      Start Progress
                    </button>
                  )}
                  {/* Field Officer View: When action is IN_PROGRESS, they must upload evidence, no longer directly complete */}
                  {action.status === 'IN_PROGRESS' && (
                    <FieldEvidencePanel 
                      actionId={action.id} 
                      mineId={action.mine_id} 
                      assigneeId={action.assigned_to} 
                      onEvidenceSubmitted={() => {}} 
                      onSubmittedForReview={() => handleStatusChange(action.id, 'IN_REVIEW')} 
                    />
                  )}
                  {/* Supervisor View: When action is IN_REVIEW, they verify it */}
                  {action.status === 'IN_REVIEW' && (
                    <SupervisorReviewPanel 
                      actionId={action.id} 
                      onVerify={() => handleStatusChange(action.id, 'VERIFIED')} 
                    />
                  )}
                  {(action.status === 'OVERDUE') && (
                    <button onClick={() => handleStatusChange(action.id, 'COMPLETED')} className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded">
                      Force Mark Completed
                    </button>
                  )}
                  {action.status === 'COMPLETED' && (
                    <button onClick={() => handleStatusChange(action.id, 'VERIFIED')} className="text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded">
                      Verify & Close
                    </button>
                  )}
                </div>
              </div>
            ))}
            {actions.filter(a => !['CLOSED', 'VERIFIED'].includes(a.status)).length === 0 && (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                No active actions.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default GovernanceActionCenter;
