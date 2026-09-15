import React, { useEffect, useState } from 'react';
import { api, type DailyTask, type Mine } from '../services/api';
import { useAuth } from '../services/AuthContext';

const DailyReporting: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [pointsEarnedMessage, setPointsEarnedMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, tasksData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getDailyTasks(selectedMineId || undefined, user?.role).catch(() => [])
      ]);

      setMines(minesData || []);
      setTasks(tasksData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
      }
    } catch (err) {
      console.error('Error loading daily reporting:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId, user?.role]);

  const handleUpdateStatus = async (taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      setUpdatingTaskId(taskId);
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.points_awarded) {
        setPointsEarnedMessage(`🎉 Task completed! +${res.points_awarded} Governance Points awarded to your profile.`);
        setTimeout(() => setPointsEarnedMessage(null), 4000);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'ALL') return true;
    return t.status === activeFilter;
  });

  const pendingCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter(t => t.status === 'OVERDUE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Role-Based Operational Governance</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Daily Reporting & Shift Compliance</h1>
          <p className="text-slate-400 text-sm mt-1">
            Statutory shift checklists, safety inspections, dust suppression logs, and live governance task fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Assigned Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Points Banner Notification */}
      {pointsEarnedMessage && (
        <div className="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl text-emerald-300 font-bold text-sm shadow-xl animate-bounce">
          {pointsEarnedMessage}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Pending / In Progress</span>
            <div className="text-3xl font-black text-blue-400 mt-1">{pendingCount}</div>
          </div>
          <span className="text-2xl p-3 bg-blue-500/10 rounded-xl">⏳</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Completed Today</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <span className="text-2xl p-3 bg-emerald-500/10 rounded-xl">✅</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Overdue SLA</span>
            <div className="text-3xl font-black text-red-400 mt-1">{overdueCount}</div>
          </div>
          <span className="text-2xl p-3 bg-red-500/10 rounded-xl">⚠️</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        {(['ALL', 'PENDING', 'COMPLETED', 'OVERDUE'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl transition ${activeFilter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            {f === 'ALL' ? `All Tasks (${tasks.length})` : f}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading daily checklists...</div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(t => {
            const isDone = t.status === 'COMPLETED';
            const isOverdue = t.status === 'OVERDUE';
            const isInProgress = t.status === 'IN_PROGRESS';

            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDone ? 'bg-slate-900/40 border-slate-800/60 opacity-80' : isOverdue ? 'bg-red-950/20 border-red-500/40 shadow-lg' : 'bg-slate-900/80 border-slate-800 shadow-lg hover:border-slate-700'}`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${t.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : t.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-300'}`}>
                      {t.priority}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">• Shift {t.shift || 'General'}</span>
                    <span className="text-xs text-blue-400 font-semibold">• Assigned: {t.assigned_role?.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className={`text-base font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400">{t.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDone ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : isOverdue ? 'bg-red-500/20 text-red-400 border-red-500/40' : isInProgress ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {t.status}
                  </span>

                  {!isDone && (
                    <div className="flex gap-2">
                      {t.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                          disabled={updatingTaskId === t.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                        >
                          Start Task
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                        disabled={updatingTaskId === t.id}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
                      >
                        ✓ Mark Completed (+10 pts)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
              No tasks found under selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyReporting;
