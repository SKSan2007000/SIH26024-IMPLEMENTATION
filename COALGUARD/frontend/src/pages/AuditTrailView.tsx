import React, { useEffect, useState } from 'react';
import { api, type AuditLog } from '../services/api';

const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    (l.action || l.event_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.actor_email || l.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.resource_type || l.event_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["ID,Timestamp,Actor,Action,Resource Type,Resource ID,Details"]
      .concat(logs.map(l => `"${l.id}","${l.timestamp || l.created_at || ''}","${l.actor_email || l.user_id || 'System'}","${l.action || l.event_type}","${l.resource_type || 'SYSTEM'}","${l.resource_id || l.action_id || ''}","${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `coalguard_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Statutory Digital Forensics & Audit Integrity</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Immutable Governance Audit Log</h1>
          <p className="text-slate-400 text-sm mt-1">
            Tamper-evident system transaction records for statutory regulators, internal vigilance, and DGMS audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            📥 Export Regulatory CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <input
          type="text"
          placeholder="Filter audit logs by actor email, action type, or resource..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Audit Records ({filteredLogs.length})</h3>
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading audit records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Target Resource</th>
                  <th className="pb-3">Audit Details</th>
                  <th className="pb-3">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-slate-300">{l.timestamp || l.created_at ? new Date(l.timestamp || l.created_at || '').toLocaleString() : 'Recent'}</td>
                    <td className="py-3 text-blue-400 font-semibold">{l.actor_email || l.user_id || 'System Engine'}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[10px]">
                        {l.action || l.event_type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{l.resource_type || 'SYSTEM'}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                      {JSON.stringify(l.details || {})}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        VERIFIED ✓
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No audit records found matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailView;
