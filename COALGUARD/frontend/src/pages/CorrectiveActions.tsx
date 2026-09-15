import React, { useEffect, useState } from 'react';
import { api, type Mine, type GovernanceAction } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { FieldEvidencePanel, SupervisorReviewPanel } from '../components/FieldEvidencePanels';

const STATUS_COLUMNS = [
  { id: 'OPEN', label: 'Open Actions', color: 'border-slate-700 bg-slate-900/50' },
  { id: 'ASSIGNED', label: 'Assigned', color: 'border-blue-500/30 bg-blue-950/20' },
  { id: 'IN_PROGRESS', label: 'In Progress (Field)', color: 'border-amber-500/30 bg-amber-950/20' },
  { id: 'IN_REVIEW', label: 'In Review (Supervisor)', color: 'border-purple-500/30 bg-purple-950/20' },
  { id: 'VERIFIED', label: 'Verified & Recalculated', color: 'border-emerald-500/30 bg-emerald-950/20' },
  { id: 'CLOSED', label: 'Closed & Archived', color: 'border-slate-800 bg-slate-950/40' }
];

const CorrectiveActions: React.FC = () => {
  const { user } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [actions, setActions] = useState<GovernanceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fastForwarding, setFastForwarding] = useState(false);
  const [activeEvidenceActionId, setActiveEvidenceActionId] = useState<string | null>(null);
  const [activeReviewActionId, setActiveReviewActionId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, actionsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getGovernanceActions(selectedMineId || '').catch(() => [])
      ]);

      setMines(minesData || []);
      setActions(actionsData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching corrective actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId]);

  const handleStatusChange = async (actionId: string, status: string) => {
    try {
      await api.updateActionStatus(actionId, status);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFastForward = async () => {
    try {
      setFastForwarding(true);
      const res = await api.demoFastForwardEscalation(1);
      alert(`⚡ Fast-forwarded time by 1 Day! Escalated ${res.escalated_actions} overdue actions to higher management.`);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setFastForwarding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Closed-Loop Compliance Workflow</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Corrective Action Kanban Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track actions from AI generation to field evidence upload, supervisor verification, and automated risk recalculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <button
            onClick={handleFastForward}
            disabled={fastForwarding}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105 disabled:opacity-50"
          >
            {fastForwarding ? 'Simulating...' : '⏩ [Demo] Fast-Forward +1 Day'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading action board...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {STATUS_COLUMNS.map(col => {
            const colActions = actions.filter(a => {
              if (col.id === 'OPEN') return a.status === 'OPEN';
              if (col.id === 'ASSIGNED') return a.status === 'ASSIGNED';
              if (col.id === 'IN_PROGRESS') return a.status === 'IN_PROGRESS' || a.status === 'OVERDUE';
              if (col.id === 'IN_REVIEW') return a.status === 'IN_REVIEW';
              if (col.id === 'VERIFIED') return a.status === 'VERIFIED';
              if (col.id === 'CLOSED') return a.status === 'CLOSED';
              return false;
            });

            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-4 shadow-xl space-y-3 min-h-[500px] ${col.color}`}
              >
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-white">
                    {colActions.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colActions.map(action => {
                    const isCrit = action.priority === 'CRITICAL';
                    const isHigh = action.priority === 'HIGH';
                    const isOverdue = action.status === 'OVERDUE' || (action.deadline ? new Date(action.deadline) < new Date() : false);

                    return (
                      <div
                        key={action.id}
                        className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 shadow-lg space-y-2.5 transition-all text-xs"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isHigh ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-300'}`}>
                            {action.priority}
                          </span>
                          {(action.escalation_level ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-bold text-[9px] border border-red-500/40 animate-pulse">
                              Escalated L{action.escalation_level}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-white text-xs leading-snug">{action.title}</h4>
                        <p className="text-slate-400 text-[11px] line-clamp-2">{action.description}</p>

                        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                          <span>Due: <strong className={isOverdue ? 'text-red-400' : 'text-slate-300'}>{action.deadline ? new Date(action.deadline).toLocaleDateString() : 'Pending'}</strong></span>
                          <span>Dept: <strong className="text-slate-300">{action.department || action.issue_type || 'Safety'}</strong></span>
                        </div>

                        {/* Interactive Workflow Trigger Buttons */}
                        <div className="pt-2 flex flex-col gap-1.5">
                          {action.status === 'OPEN' && (
                            <button
                              onClick={() => handleStatusChange(action.id, 'ASSIGNED')}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                            >
                              Assign to Officer →
                            </button>
                          )}

                          {action.status === 'ASSIGNED' && (
                            <button
                              onClick={() => handleStatusChange(action.id, 'IN_PROGRESS')}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold"
                            >
                              Start Field Work →
                            </button>
                          )}

                          {(action.status === 'IN_PROGRESS' || action.status === 'OVERDUE') && (
                            <button
                              onClick={() => setActiveEvidenceActionId(action.id)}
                              className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold shadow"
                            >
                              📸 Upload Evidence & GPS
                            </button>
                          )}

                          {action.status === 'IN_REVIEW' && (
                            <button
                              onClick={() => setActiveReviewActionId(action.id)}
                              className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-lg text-[10px] font-bold shadow"
                            >
                              🔍 Supervisor Verify (Risk Δ)
                            </button>
                          )}

                          {action.status === 'VERIFIED' && (
                            <button
                              onClick={() => handleStatusChange(action.id, 'CLOSED')}
                              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                            >
                              Archive Action
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colActions.length === 0 && (
                    <div className="text-center py-10 text-slate-600 text-[11px] italic">
                      No items in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Field Evidence Upload Modal */}
      {activeEvidenceActionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Upload Field Evidence & Geotag</h2>
              <button onClick={() => setActiveEvidenceActionId(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <FieldEvidencePanel
              actionId={activeEvidenceActionId}
              mineId={selectedMineId}
              assigneeId={user?.id || (user as any)?.user_id || ''}
              onEvidenceSubmitted={() => {}}
              onSubmittedForReview={() => {
                handleStatusChange(activeEvidenceActionId, 'IN_REVIEW');
                setActiveEvidenceActionId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Supervisor Review Modal */}
      {activeReviewActionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Supervisor Verification & Closed-Loop Risk Recalculation</h2>
              <button onClick={() => setActiveReviewActionId(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
            <SupervisorReviewPanel
              actionId={activeReviewActionId}
              onVerify={() => {
                setActiveReviewActionId(null);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectiveActions;
