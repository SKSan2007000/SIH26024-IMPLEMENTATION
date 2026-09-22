import React, { useEffect, useState } from 'react';
import { api, type Mine, type GovernanceAction } from '../services/api';
import { SupervisorReviewPanel } from '../components/FieldEvidencePanels';

const SupervisorReview: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [reviewActions, setReviewActions] = useState<GovernanceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<GovernanceAction | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, actionsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getGovernanceActions(selectedMineId || '').catch(() => [])
      ]);

      setMines(minesData || []);
      const pendingReviews = (actionsData || []).filter(a => a.status === 'IN_REVIEW');
      setReviewActions(pendingReviews);
      if (pendingReviews.length > 0 && !activeAction) {
        setActiveAction(pendingReviews[0]);
      } else if (pendingReviews.length === 0) {
        setActiveAction(null);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold uppercase tracking-wider">
            <span>Closed-Loop Compliance Verification</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Supervisor Sign-Off & Risk Recalculation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review field evidence photos, analyze AI visual verification score, sign off closed-loop resolution, and trigger instant risk recalculation.
          </p>
        </div>

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
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pending Review List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Awaiting Supervisor Sign-Off ({reviewActions.length})
          </h2>

          {loading ? (
            <div className="text-slate-500 text-xs py-8 text-center">Loading pending reviews...</div>
          ) : (
            <div className="space-y-3">
              {reviewActions.map(a => {
                const isSelected = activeAction?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setActiveAction(a)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-purple-950/40 border-purple-500 shadow-lg' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {a.priority}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Evidence Attached ✓</span>
                    </div>

                    <h3 className="font-bold text-white text-sm mt-2">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Dept: <strong className="text-slate-300">{a.issue_type || 'Safety'}</strong></span>
                      <span className="text-purple-400 font-bold">Review Evidence →</span>
                    </div>
                  </div>
                );
              })}

              {reviewActions.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
                  🎉 No actions currently awaiting supervisor verification.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Supervisor Review & Closed Loop Verification */}
        <div className="lg:col-span-2">
          {activeAction ? (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Verification Target
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">{activeAction.title}</h2>
                <p className="text-sm text-slate-300 mt-1">{activeAction.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <SupervisorReviewPanel
                  actionId={activeAction.id}
                  onVerify={() => {
                    fetchData();
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Select an action from the left list to review evidence and perform closed-loop verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorReview;
