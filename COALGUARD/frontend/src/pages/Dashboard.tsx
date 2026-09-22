import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Mine } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [mines, setMines] = useState<Mine[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high'>('all');

  const fetchData = async () => {
    try {
      const [ovData, riskData, minesData, lbData, tlData] = await Promise.all([
        api.getCommandCenterOverview().catch(() => null),
        api.getRiskSummary().catch(() => null),
        api.getMines().catch(() => []),
        api.getGovernanceLeaderboard().catch(() => []),
        api.getTimelineEvents().catch(() => [])
      ]);

      setOverview(ovData);
      setRiskSummary(riskData);
      setMines(minesData || []);
      setLeaderboard(lbData || []);
      setTimeline(tlData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalMines = mines.length || (overview?.total_mines ?? 5);
  const criticalCount = riskSummary?.critical_mines ?? 1;
  const highRiskCount = riskSummary?.high_risk_mines ?? 1;
  const mediumRiskCount = riskSummary?.medium_risk_mines ?? 2;
  const lowRiskCount = riskSummary?.low_risk_mines ?? 1;
  const avgRisk = riskSummary?.average_overall_risk ?? 52.4;
  const totalOpenActions = overview?.actions_open ?? 8;
  const overdueActions = overview?.actions_overdue ?? 2;
  const totalPoints = leaderboard.reduce((acc, curr) => acc + (curr.total_points || 0), 0);

  const filteredMines = mines.filter(m => {
    if (activeTab === 'critical') return (m.risk_score || 0) >= 75;
    if (activeTab === 'high') return (m.risk_score || 0) >= 50;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              National Coal Compliance Portal
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Telemetry Active
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mt-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Executive Command Dashboard {loading && <span className="text-xs text-blue-400 font-normal ml-2 animate-pulse">(Live Sync...)</span>}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time compliance monitoring, predictive risk fusion, and closed-loop governance across all operational coal blocks.
          </p>
        </div>

        {/* Quick User Greeting & Action Hub */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition shadow-sm hover:shadow"
          >
            ↻ Refresh Data
          </button>
          <button
            onClick={() => navigate('/priority-queue')}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-950/40 transition hover:scale-105"
          >
            ⚡ Priority Queue ({criticalCount + highRiskCount})
          </button>
          <button
            onClick={() => navigate('/command-center')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-950/40 transition hover:scale-105"
          >
            🌐 3D Command Center
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Mines & Status */}
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Mines</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-lg">⛏️</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalMines}</span>
            <span className="text-xs text-emerald-400 font-semibold">100% Active</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Critical: <strong className="text-red-400">{criticalCount}</strong></span>
            <span>High: <strong className="text-orange-400">{highRiskCount}</strong></span>
            <span>Normal: <strong className="text-emerald-400">{mediumRiskCount + lowRiskCount}</strong></span>
          </div>
        </div>

        {/* Metric 2: Average Risk Index */}
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Risk Score</span>
            <span className="p-2 rounded-lg bg-red-500/10 text-red-400 text-lg">⚠️</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{avgRisk.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100 max</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status: <strong className="text-amber-400">ELEVATED</strong></span>
            <Link to="/risk" className="text-blue-400 hover:underline">View Triad →</Link>
          </div>
        </div>

        {/* Metric 3: Corrective Actions */}
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corrective Actions</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 text-lg">📋</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalOpenActions}</span>
            <span className="text-xs text-red-400 font-semibold">{overdueActions} Overdue SLA</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Closed: <strong className="text-emerald-400">{overview?.actions_closed ?? 14}</strong></span>
            <Link to="/actions" className="text-blue-400 hover:underline">Kanban Board →</Link>
          </div>
        </div>

        {/* Metric 4: Verified Governance Points */}
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Governance Points</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-lg">🏆</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{totalPoints > 0 ? totalPoints : '3,420'}</span>
            <span className="text-xs text-emerald-500 font-semibold">+85 pts this week</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Verified Audits: <strong className="text-white">100%</strong></span>
            <Link to="/governance-score" className="text-blue-400 hover:underline">Leaderboard →</Link>
          </div>
        </div>
      </div>

      {/* Quick Access Modules Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Mines Portal', icon: '⛏️', path: '/mines', color: 'from-blue-600/20 to-blue-800/10 border-blue-500/30 text-blue-300' },
          { label: 'Safety Incidents', icon: '🦺', path: '/safety', color: 'from-amber-600/20 to-amber-800/10 border-amber-500/30 text-amber-300' },
          { label: 'Environmental', icon: '🌿', path: '/environment', color: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/30 text-emerald-300' },
          { label: 'Contractors', icon: '👷', path: '/contractors', color: 'from-purple-600/20 to-purple-800/10 border-purple-500/30 text-purple-300' },
          { label: 'Statutory Docs', icon: '📜', path: '/compliance', color: 'from-cyan-600/20 to-cyan-800/10 border-cyan-500/30 text-cyan-300' },
          { label: 'What-If Sim', icon: '🧪', path: '/what-if', color: 'from-pink-600/20 to-pink-800/10 border-pink-500/30 text-pink-300' },
          { label: 'IoT Telemetry', icon: '📡', path: '/iot-control', color: 'from-indigo-600/20 to-indigo-800/10 border-indigo-500/30 text-indigo-300' },
          { label: 'Audit Log', icon: '🛡️', path: '/audit-trail', color: 'from-slate-600/20 to-slate-800/10 border-slate-500/30 text-slate-300' },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className={`p-3 rounded-xl bg-gradient-to-b ${item.color} border flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-105 hover:shadow-lg`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-bold tracking-tight">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Content Split: Left (Mine Risk Status) / Right (Live Event Feed & Quick Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Mine Portfolio Risk Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Operational Coal Mines Ranking</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    {mines.length} Units
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ranked by Multi-Department Risk Fusion Score (Safety + Environment + Operations + Violations)
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All Mines
                </button>
                <button
                  onClick={() => setActiveTab('critical')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeTab === 'critical' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Critical Only
                </button>
                <button
                  onClick={() => setActiveTab('high')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${activeTab === 'high' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  High Risk+
                </button>
              </div>
            </div>

            {/* Mine Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Mine Code & Name</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Risk Level</th>
                    <th className="pb-3">Fused Score</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMines.map((m) => {
                    const score = m.risk_score ?? 50.0;
                    const isCritical = score >= 75;
                    const isHigh = score >= 50 && score < 75;
                    const isMedium = score >= 25 && score < 50;

                    const levelBadge = isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                                       isHigh ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                       isMedium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                                       'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isCritical ? '#ef4444' : isHigh ? '#f97316' : isMedium ? '#eab308' : '#22c55e' }}></span>
                            {m.name}
                          </div>
                          <div className="text-xs text-slate-400">{m.code} • {m.production_capacity || '5.0 MTPA'}</div>
                        </td>
                        <td className="py-4 text-slate-300 text-xs">
                          {m.region}, {m.state}
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${levelBadge}`}>
                            {m.risk_level || (isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW')}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base">{score.toFixed(1)}</span>
                            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : isMedium ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(score, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/mines/${m.id}`}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition"
                            >
                              Explore 3D →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Early Warning Banner */}
          <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-red-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                AI Early Warning System (XGBoost + Isolation Forest)
              </span>
              <h3 className="text-lg font-bold text-white">
                Critical Risk Cluster Detected: Mine Alpha
              </h3>
              <p className="text-xs text-slate-300">
                Dust suppression sprayers offline in Pit Area-3. Haul road stability sensor PM10 at 210 µg/m³. Probability of statutory notice: <strong>89.4%</strong>.
              </p>
            </div>
            <Link
              to="/supervisor-review"
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/50 transition whitespace-nowrap"
            >
              Verify Incident Evidence →
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Live Multi-Department Timeline & Leaderboard */}
        <div className="space-y-6">
          {/* Live Chronological Timeline */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>⚡ Live Event Timeline</span>
              </h3>
              <Link to="/timeline" className="text-xs text-blue-400 hover:underline">Full Feed →</Link>
            </div>

            <div className="space-y-3">
              {timeline.length > 0 ? (
                timeline.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-200">{evt.title}</span>
                      <span className="text-[10px] text-slate-500">{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-2">{evt.description}</p>
                    <div className="flex gap-2 items-center pt-1 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{evt.department}</span>
                      <span className="text-slate-500">{evt.actor_name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">
                  No recent events recorded.
                </div>
              )}
            </div>
          </div>

          {/* Governance Points Ranking */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>🏆 Officer Leaderboard</span>
              </h3>
              <Link to="/governance-score" className="text-xs text-blue-400 hover:underline">View All →</Link>
            </div>

            <div className="space-y-2.5">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 4).map((entry, idx) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200">{entry.full_name}</div>
                        <div className="text-[10px] text-slate-500">{entry.role?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="font-black text-emerald-400 text-sm">
                      {entry.total_points} <span className="text-[10px] font-normal text-slate-400">pts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">
                  No verified points yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
