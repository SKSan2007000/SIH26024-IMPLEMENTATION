import React, { useEffect, useState } from 'react';
import { api, type Mine, type TimelineEvent } from '../services/api';

const TimelineView: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, eventsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getTimelineEvents(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setEvents(eventsData || []);
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

  const filteredEvents = events.filter(e => {
    if (departmentFilter === 'ALL') return true;
    return e.department === departmentFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Multi-Department Event Correlation</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Operational Activity Timeline Feed</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time chronological feed linking safety incidents, environmental telemetry spikes, contractor audits, and closed-loop actions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="ALL">All Departments</option>
            <option value="SAFETY">Safety</option>
            <option value="ENVIRONMENT">Environment</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="OPERATIONS">Operations</option>
            <option value="GOVERNANCE">Governance</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading chronological feed...</div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="space-y-4">
            {filteredEvents.map(evt => {
              const deptColor = evt.department === 'SAFETY' ? 'border-amber-500/40 bg-amber-950/20 text-amber-300' :
                                evt.department === 'ENVIRONMENT' ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' :
                                evt.department === 'CONTRACTOR' ? 'border-purple-500/40 bg-purple-950/20 text-purple-300' :
                                evt.department === 'GOVERNANCE' ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300' :
                                'border-blue-500/40 bg-blue-950/20 text-blue-300';

              return (
                <div
                  key={evt.id}
                  className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${deptColor}`}>
                        {evt.department}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{evt.title}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{evt.description}</p>
                    <div className="text-[10px] text-slate-500 flex gap-3 pt-1">
                      <span>Logged by: <strong className="text-slate-300">{evt.actor_name}</strong></span>
                      <span>Event Type: <strong>{evt.event_type}</strong></span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 whitespace-nowrap bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                No events found matching the selected filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
