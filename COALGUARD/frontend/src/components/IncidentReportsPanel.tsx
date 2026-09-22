import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface IncidentReportsPanelProps {
  mineId: string;
  userId?: string;
  onActionCreated?: () => void;
}

export const IncidentReportsPanel: React.FC<IncidentReportsPanelProps> = ({ mineId, userId, onActionCreated }) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const fetchIncidents = async () => {
    if (!mineId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMineIncidents(mineId);
      setIncidents(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mineId) {
      fetchIncidents();
      setSelectedIncident(null);
    }
  }, [mineId, userId]);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      await api.updateIncidentStatus(selectedIncident.id, status);
      await fetchIncidents();
      setSelectedIncident(null);
      onActionCreated?.();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (loading && incidents.length === 0) {
    return <div className="p-5 text-center text-slate-400">Loading incidents...</div>;
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Public/Worker Incident Reports
        </h3>
        <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">{incidents.length} Total</span>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-0 border-r border-slate-800 ${selectedIncident ? 'hidden md:block w-1/2' : 'w-full'}`}>
          {error && <div className="p-5 text-red-400 text-sm">{error}</div>}
          {incidents.length === 0 && !error && <div className="p-5 text-slate-500 text-sm">No incident reports found for this mine.</div>}
          
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-800/50">
              {incidents.map((inc) => (
                <tr key={inc.id} onClick={() => setSelectedIncident(inc)} className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${selectedIncident?.id === inc.id ? 'bg-slate-800/60' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-200">
                        {inc.category}
                        {inc.is_anonymous && <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase">Anonymous</span>}
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                          {inc.severity}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${inc.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                          {inc.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-sm">{inc.description}</div>
                    <div className="text-[10px] text-slate-500 mt-2 font-bold flex justify-between">
                      <span>ID: {inc.id.substring(0,8)}</span>
                      <span>{new Date(inc.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedIncident && (
          <div className="w-full md:w-1/2 flex flex-col bg-slate-950/50">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h4 className="font-bold text-white">Review Incident</h4>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <div className="text-sm font-bold text-slate-200">{selectedIncident.category}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity</label>
                  <div className={`text-sm font-bold ${selectedIncident.severity === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'}`}>{selectedIncident.severity}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <div className="text-sm font-bold text-slate-300">{selectedIncident.status}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported At</label>
                  <div className="text-sm font-bold text-slate-300">{new Date(selectedIncident.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location (GPS)</label>
                <div className="text-sm text-slate-300">
                  {selectedIncident.latitude && selectedIncident.longitude 
                    ? `${selectedIncident.latitude}, ${selectedIncident.longitude}` 
                    : "No location provided"}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <div className="text-sm text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">{selectedIncident.description}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reporter Info</label>
                {selectedIncident.is_anonymous ? (
                   <div className="text-sm text-slate-400 italic">Anonymous Reporter</div>
                ) : (
                   <div className="text-sm text-slate-300">
                     <div><span className="text-slate-500">Name:</span> {selectedIncident.reporter_name || "Unknown"}</div>
                     <div><span className="text-slate-500">Contact:</span> {selectedIncident.reporter_contact || "Not provided"}</div>
                   </div>
                )}
              </div>
              
              {selectedIncident.linked_action_id && (
                <div className="bg-orange-950/20 border border-orange-900/30 p-3 rounded-lg">
                  <div className="text-xs font-bold text-orange-400 flex items-center gap-1 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Escalated to Governance Workflow
                  </div>
                  <div className="text-[10px] text-slate-400">
                    A Corrective Action has been generated to address this critical incident (ID: {selectedIncident.linked_action_id.substring(0,8)}).
                  </div>
                </div>
              )}

              {/* Review Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Manager Actions</label>
                <div className="flex gap-2 flex-wrap">
                  {selectedIncident.status === 'OPEN' && (
                    <button onClick={() => handleUpdateStatus('UNDER_REVIEW')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded transition-colors">
                      Mark Under Review
                    </button>
                  )}
                  {['OPEN', 'UNDER_REVIEW'].includes(selectedIncident.status) && (
                    <>
                      <button onClick={() => handleUpdateStatus('RESOLVED')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded transition-colors">
                        Resolve Incident
                      </button>
                      <button onClick={() => handleUpdateStatus('REJECTED')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded transition-colors border border-slate-600">
                        Reject / False Alarm
                      </button>
                    </>
                  )}
                  {['RESOLVED', 'REJECTED'].includes(selectedIncident.status) && (
                     <div className="text-xs text-slate-500 italic">No further actions available for closed incidents.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
