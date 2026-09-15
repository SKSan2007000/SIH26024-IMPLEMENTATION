import React, { useEffect, useState } from 'react';
import { api, type Mine, type GovernanceAction } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { FieldEvidencePanel } from '../components/FieldEvidencePanels';

const FieldOfficer: React.FC = () => {
  const { user } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [actions, setActions] = useState<GovernanceAction[]>([]);
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
      // Filter actions relevant for field work (IN_PROGRESS, ASSIGNED, OVERDUE)
      const fieldActions = (actionsData || []).filter(a => ['ASSIGNED', 'IN_PROGRESS', 'OVERDUE'].includes(a.status));
      setActions(fieldActions);
      if (fieldActions.length > 0 && !activeAction) {
        setActiveAction(fieldActions[0]);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Mobile-First Field Evidence Capture</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Field Officer Execution Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Capture live GPS coordinates, take geotagged photographic proof, and submit physical evidence for supervisor sign-off.
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

      {/* Main Split: Left (Assigned Actions List) / Right (Field Evidence Upload Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Pending Field Actions ({actions.length})
          </h2>

          {loading ? (
            <div className="text-slate-500 text-xs py-8 text-center">Loading assigned tasks...</div>
          ) : (
            <div className="space-y-3">
              {actions.map(a => {
                const isSelected = activeAction?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setActiveAction(a)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-950/40 border-blue-500 shadow-lg' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${a.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {a.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">{a.deadline ? new Date(a.deadline).toLocaleDateString() : 'Pending'}</span>
                    </div>

                    <h3 className="font-bold text-white text-sm mt-2">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Status: <strong className="text-amber-400">{a.status}</strong></span>
                      <span className="text-blue-400 font-bold">Select Task →</span>
                    </div>
                  </div>
                );
              })}

              {actions.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
                  No active field actions requiring evidence at this time.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Active Evidence Panel */}
        <div className="lg:col-span-2">
          {activeAction ? (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Target Field Assignment
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">{activeAction.title}</h2>
                <p className="text-sm text-slate-300 mt-1">{activeAction.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <FieldEvidencePanel
                  actionId={activeAction.id}
                  mineId={activeAction.mine_id}
                  assigneeId={user?.id || (user as any)?.user_id || ''}
                  onEvidenceSubmitted={() => fetchData()}
                  onSubmittedForReview={() => {
                    alert('Evidence submitted for supervisor verification!');
                    fetchData();
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Select an assigned corrective action from the left pane to submit GPS and photographic proof.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldOfficer;
