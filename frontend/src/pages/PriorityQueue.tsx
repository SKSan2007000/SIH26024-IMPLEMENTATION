import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const PriorityQueue: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const minesData = await api.getMines().catch(() => []);

      // Pull recommendations and overdue actions across all mines
      const allItems: any[] = [];
      for (const m of (minesData || [])) {
        try {
          const [recs, actions] = await Promise.all([
            api.getGovernanceRecommendations(m.id).catch(() => []),
            api.getGovernanceActions(m.id).catch(() => [])
          ]);

          recs.filter(r => r.status === 'RECOMMENDED').forEach(r => {
            allItems.push({
              id: r.id,
              type: 'RECOMMENDATION',
              mineName: m.name,
              mineId: m.id,
              title: r.title,
              description: r.description,
              priority: r.priority,
              urgencyScore: r.priority === 'CRITICAL' ? 95 : r.priority === 'HIGH' ? 80 : 60,
              reason: r.reason,
              raw: r
            });
          });

          actions.filter(a => a.status === 'OVERDUE' || a.escalation_level > 0 || a.status === 'IN_REVIEW').forEach(a => {
            allItems.push({
              id: a.id,
              type: a.status === 'IN_REVIEW' ? 'PENDING_VERIFICATION' : 'ESCALATED_ACTION',
              mineName: m.name,
              mineId: m.id,
              title: a.title,
              description: a.description,
              priority: a.priority,
              urgencyScore: a.status === 'OVERDUE' ? 98 : a.status === 'IN_REVIEW' ? 88 : 75,
              reason: a.status === 'OVERDUE' ? `SLA Breached (Escalation L${a.escalation_level})` : 'Field evidence submitted, requires supervisor sign-off.',
              raw: a
            });
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Sort by urgency score descending
      allItems.sort((a, b) => b.urgencyScore - a.urgencyScore);
      setItems(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAcceptRec = async (recId: string) => {
    try {
      await api.acceptRecommendation(recId);
      await fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-red-500/30 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-red-400 font-black uppercase tracking-wider">
            <span>⚡ Automated Urgent Triage</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Priority Governance Decision Queue</h1>
          <p className="text-slate-400 text-sm mt-1">
            Algorithmic priority queue ordering critical AI recommendations, breached SLAs, and pending supervisor verifications.
          </p>
        </div>

        <button
          onClick={() => fetchQueue()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          ↻ Refresh Queue
        </button>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Ranking priority tasks...</div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const isCrit = item.priority === 'CRITICAL' || item.urgencyScore >= 90;
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all ${isCrit ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                    #{idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.mineName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isCrit ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">Urgency Index: {item.urgencyScore}</span>
                    </div>

                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.description}</p>
                    <div className="text-[11px] text-amber-300 font-medium pt-1">
                      💡 Reason: {item.reason}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.type === 'RECOMMENDATION' && (
                    <button
                      onClick={() => handleAcceptRec(item.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                      ✓ Accept & Assign Action
                    </button>
                  )}

                  {item.type === 'PENDING_VERIFICATION' && (
                    <Link
                      to="/supervisor-review"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                      🔍 Verify Evidence (Closed-Loop) →
                    </Link>
                  )}

                  {item.type === 'ESCALATED_ACTION' && (
                    <Link
                      to="/actions"
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                      🚨 Open in Action Center →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
              🎉 Priority queue clear! All critical recommendations and breached actions have been resolved.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriorityQueue;
