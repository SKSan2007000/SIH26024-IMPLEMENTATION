import React, { useEffect, useState } from 'react';
import { api, type Mine } from '../services/api';
import { GovernanceScorePanel } from '../components/GovernanceScorePanel';

const GovernanceScoreView: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, lbData, txData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getGovernanceLeaderboard().catch(() => []),
        api.getGovernanceTransactions(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setLeaderboard(lbData || []);
      setTransactions(txData || []);
      if (minesData && minesData.length > 0 && !selectedMineId) {
        setSelectedMineId(minesData[0].id);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <span>Verified Incentive Mechanism</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Governance Points & Officer Leaderboard {loading && <span className="text-xs text-emerald-400 font-normal ml-2 animate-pulse">(Updating...)</span>}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-proof compliance points awarded strictly upon supervisor-verified physical evidence and validated daily reporting.
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

      {/* Main Split: Left (Score Panel & Breakdown) / Right (Leaderboard & Points Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <GovernanceScorePanel mineId={selectedMineId} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Officer Leaderboard */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆 Verified Compliance Leaderboard</span>
            </h3>

            <div className="space-y-3">
              {leaderboard.map((officer, idx) => (
                <div
                  key={officer.user_id}
                  className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm">{officer.full_name}</div>
                      <div className="text-[11px] text-slate-400">{officer.role?.replace(/_/g, ' ')} • {officer.verified_actions_count || 3} verified actions</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-emerald-400 text-lg">{officer.total_points}</div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Points Earned</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Transaction Ledger */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📜 Verified Points Audit Ledger</span>
            </h3>

            <div className="space-y-2.5">
              {transactions.map(tx => (
                <div key={tx.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-200">{tx.description}</div>
                    <div className="text-[10px] text-slate-500">Category: {tx.category} • {new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                  <span className="font-black text-emerald-400 text-sm px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    +{tx.points} pts
                  </span>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No verified point transactions recorded for this mine block.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceScoreView;
