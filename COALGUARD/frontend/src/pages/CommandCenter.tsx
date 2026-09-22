import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import MineMap from '../components/MineMap';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { GovernanceScorePanel } from '../components/GovernanceScorePanel';
import { IncidentReportsPanel } from '../components/IncidentReportsPanel';
import { MineTwin3D } from '../components/MineTwin3D';
import { DemoIoTControls } from '../components/DemoIoTControls';
import { TelemetryChart } from '../components/TelemetryChart';
import { useAuth } from '../services/AuthContext';

const CommandCenter: React.FC = () => {
  const { user } = useAuth();
  const currentUserRole = user?.role || 'MINE_MANAGER';
  const currentUserId = user?.user_id || '';
  const [overview, setOverview] = useState<any>(null);
  const [mines, setMines] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [simulatingIoTTwin, setSimulatingIoTTwin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await api.getDailyTasks(undefined, currentUserRole);
      setDailyTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUserRole]);

  const fetchDashboardData = async () => {
    try {
      const [ovData, minesData, actData] = await Promise.all([
        api.getCommandCenterOverview(),
        api.getCommandCenterMines(),
        api.getCommandCenterActivity()
      ]);
      setOverview(ovData);
      setMines(minesData.mines);
      setActivities(actData.activities);
    } catch (error) {
      console.error("Error fetching command center data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectMine = async (mineId: string) => {
    setSelectedMineId(mineId);
    setLoadingIntel(true);
    try {
      const data = await api.getCommandCenterMineIntelligence(mineId);
      setIntelligence(data);
      
      // Fetch IoT sensors for this mine
      const sensorData = await api.getMineSensors(mineId);
      setSensors(sensorData);
    } catch (error) {
      console.error("Error fetching mine intelligence:", error);
    } finally {
      setLoadingIntel(false);
    }
  };

  const handleBack = () => {
    setSelectedMineId(null);
    setIntelligence(null);
    setSensors([]);
    setSelectedSensor(null);
    setTelemetry([]);
    fetchDashboardData();
  };

  const handleActionCompleteOrUpdate = async (actionId: string, status: string) => {
    if (!selectedMineId) return;
    setRecalculating(true);
    try {
      await api.updateActionStatus(actionId, status);
      // Re-fetch intelligence to show updated triad
      const data = await api.getCommandCenterMineIntelligence(selectedMineId);
      setIntelligence(data);
      await fetchDashboardData();
      await fetchTasks();
    } catch (error) {
      console.error("Error updating action:", error);
    } finally {
      setRecalculating(false);
    }
  };

  const handleAcceptRecommendation = async (recId: string) => {
    if (!selectedMineId) return;
    setRecalculating(true);
    try {
      await api.acceptRecommendation(recId);
      const data = await api.getCommandCenterMineIntelligence(selectedMineId);
      setIntelligence(data);
      await fetchDashboardData();
      await fetchTasks();
    } catch (error) {
      console.error("Error accepting recommendation:", error);
    } finally {
      setRecalculating(false);
    }
  };

  const handleDemoReset = async () => {
    if (!window.confirm("Are you sure you want to reset the demo state?")) return;
    setResetting(true);
    try {
      await api.demoReset();
      setSelectedMineId(null);
      await fetchDashboardData();
      await fetchTasks();
    } catch (err) {
      console.error("Demo reset failed", err);
    } finally {
      setResetting(false);
    }
  };

  const handleFastForward = async () => {
    setRecalculating(true);
    try {
      await api.demoFastForwardEscalation(3); // +3 days
      if (selectedMineId) {
        const data = await api.getCommandCenterMineIntelligence(selectedMineId);
        setIntelligence(data);
      } else {
        await fetchDashboardData();
      }
      await fetchTasks();
    } catch (err) {
      console.error("Fast forward failed", err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSelectSensor = async (sensor: any) => {
    setSelectedSensor(sensor);
    if (!sensor) return;
    try {
      const telData = await api.getSensorTelemetry(sensor.id);
      setTelemetry(telData);
    } catch (err) {
      console.error("Failed to load telemetry", err);
    }
  };

  const handleSimulateSpike = async (eventType: string) => {
    if (!selectedMineId) return;
    setSimulatingIoTTwin(true);
    try {
      await api.generateDemoTelemetry(selectedMineId, eventType);
      // Refresh sensors and selected sensor telemetry
      const sensorData = await api.getMineSensors(selectedMineId);
      setSensors(sensorData);
      if (selectedSensor) {
        const updatedSensor = sensorData.find((s: any) => s.id === selectedSensor.id);
        setSelectedSensor(updatedSensor);
        const telData = await api.getSensorTelemetry(selectedSensor.id);
        setTelemetry(telData);
      }
      
      // Refresh Intelligence in case a governance action was triggered!
      const data = await api.getCommandCenterMineIntelligence(selectedMineId);
      setIntelligence(data);
    } catch (err) {
      console.error("Failed to generate demo telemetry", err);
    } finally {
      setSimulatingIoTTwin(false);
    }
  };

  const renderHealthIndicator = (status: string) => {
    if (status === 'ONLINE' || status === 'CONNECTED' || status === 'READY') {
      return <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {status}</span>;
    }
    if (status === 'DEGRADED') {
      return <span className="inline-flex items-center gap-1 text-yellow-400 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> {status}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-red-400 text-xs"><span className="w-2 h-2 rounded-full bg-red-500"></span> {status}</span>;
  };

  if (loading) {
    return <div className="p-8 text-white flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-xl font-bold tracking-widest text-blue-400">INITIALIZING COMMAND CENTER...</div></div>;
  }

  // Common Header
  const health = selectedMineId && intelligence ? intelligence.system_status : (overview ? overview.system_health : null);

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in text-slate-200 bg-slate-950 min-h-screen font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
            Governance Command Center
          </h1>
          <p className="text-slate-400 mt-2 font-medium">SIH End-to-End Validation & Intelligence Dashboard</p>
        </div>
        
        {health && (
          <div className="flex flex-wrap gap-4 bg-slate-900/80 p-3 rounded-lg border border-slate-800 shadow-inner">
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Backend</span>{renderHealthIndicator(health.backend)}</div>
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Database</span>{renderHealthIndicator(health.database)}</div>
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ML Engine</span>{renderHealthIndicator(health.ml_engine)}</div>
            <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Governance</span>{renderHealthIndicator(health.governance_engine)}</div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {!selectedMineId && !overview ? (
        <div className="p-8 text-center">
          <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-8 max-w-lg mx-auto">
            <h2 className="text-red-400 text-xl font-bold mb-2">Command Center Unavailable</h2>
            <p className="text-slate-400 text-sm mb-4">Failed to load overview data from the backend.</p>
            <button onClick={() => { setLoading(true); fetchDashboardData(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">
              Retry
            </button>
          </div>
        </div>
      ) : !selectedMineId ? (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Mines</h3>
              <p className="text-3xl font-bold mt-2 text-white">{overview.total_mines}</p>
            </div>
            <div className="bg-gradient-to-br from-red-950 to-slate-900 p-5 rounded-xl border border-red-900/50 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
              <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider">Critical Baseline</h3>
              <p className="text-3xl font-bold mt-2 text-red-500">{overview.critical_mines}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-950 to-slate-900 p-5 rounded-xl border border-orange-900/50 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
              <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider">Predicted Critical</h3>
              <p className="text-3xl font-bold mt-2 text-orange-500">{overview.predicted_critical_mines}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-950 to-slate-900 p-5 rounded-xl border border-purple-900/50 shadow-md relative overflow-hidden">
              <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider">Anomalies</h3>
              <p className="text-3xl font-bold mt-2 text-purple-400">{overview.anomalies_detected}</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
              <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider">Open Actions</h3>
              <p className="text-3xl font-bold mt-2 text-blue-400">{overview.open_actions}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-950 to-slate-900 p-5 rounded-xl border border-rose-900/50 shadow-md relative overflow-hidden">
              <h3 className="text-rose-400 text-xs font-bold uppercase tracking-wider">Overdue</h3>
              <p className="text-3xl font-bold mt-2 text-rose-500">{overview.overdue_actions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Row */}
            <div className="lg:col-span-3">
              <MineMap mines={mines} onSelectMine={handleSelectMine} />
            </div>

            {/* Daily Tasks Row */}
            <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col mb-4">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  My Daily Tasks
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">MY ROLE:</span>
                  <span className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs font-bold">{currentUserRole}</span>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {dailyTasks.length === 0 && (
                  <div className="col-span-full text-slate-500 text-sm text-center py-10">
                    No pending tasks for {currentUserRole} today.
                  </div>
                )}
                {dailyTasks.map((task: any) => (
                  <div key={task.id} className={`bg-slate-950 p-4 rounded-lg border flex flex-col gap-2 relative overflow-hidden shadow-md ${task.status === 'COMPLETED' ? 'border-emerald-900/50 opacity-60' : 'border-blue-900/30'}`}>
                    {task.status === 'COMPLETED' && <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none"></div>}
                    
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : task.status === 'PENDING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                          {task.status}
                        </span>
                        {task.generation_date && <span className="text-[9px] text-slate-500">{new Date(task.generation_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-white text-sm line-clamp-2" title={task.title}>{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3" title={task.description}>{task.description}</p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-800 flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-500">{mines.find((m: any) => m.mine_id === task.mine_id)?.mine_name || 'Mine'}</span>
                       {task.status !== 'COMPLETED' && (
                         <button 
                           onClick={() => handleSelectMine(task.mine_id)}
                           className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded font-bold transition-colors border border-slate-700"
                         >
                           Investigate
                         </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Left Col: Mines Table */}
            <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Prioritized Mines
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-5 py-4">Mine</th>
                      <th className="px-5 py-4">Baseline Risk</th>
                      <th className="px-5 py-4">30-Day Pred.</th>
                      <th className="px-5 py-4">Anomaly</th>
                      <th className="px-5 py-4 text-center">Open Actions</th>
                      <th className="px-5 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {mines.map((mine: any) => (
                      <tr key={mine.mine_id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-200">{mine.mine_name}</div>
                          <div className="text-xs text-slate-500">{mine.location}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{mine.baseline_risk_score.toFixed(1)}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${mine.baseline_risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/30' : mine.baseline_risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{mine.baseline_risk_level}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className={`font-bold ${mine.predicted_critical_probability > 0.6 ? 'text-orange-400' : 'text-slate-300'}`}>{(mine.predicted_critical_probability * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {mine.anomaly_status === 'HIGH_ANOMALY' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-purple-500/10 text-purple-400 border-purple-500/30 flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> HIGH
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Normal</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {mine.open_action_count > 0 ? (
                               <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded font-bold border border-blue-800">{mine.open_action_count} Open</span>
                            ) : (
                               <span className="text-xs text-slate-600">-</span>
                            )}
                            {mine.overdue_action_count > 0 && (
                               <span className="text-xs bg-rose-900/30 text-rose-400 px-2 py-1 rounded font-bold border border-rose-800">{mine.overdue_action_count} Late</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleSelectMine(mine.mine_id)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-lg opacity-0 group-hover:opacity-100">
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Activity Feed */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col max-h-[600px]">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Live Activity
                </h2>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {activities.length === 0 && <div className="text-slate-500 text-sm text-center py-10">No recent activity</div>}
                {activities.map((act: any) => (
                  <div key={act.id} className="relative pl-4 border-l-2 border-slate-700 pb-2 last:pb-0">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div className="text-[10px] text-slate-500 font-bold mb-0.5">{new Date(act.created_at).toLocaleTimeString()}</div>
                    <div className="text-sm font-medium text-slate-300">
                      {act.event_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Status: <span className="text-slate-300">{act.new_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-slate-800/50">
             <div className="text-xs text-slate-500 italic flex items-center gap-2">
               <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Predictive models are trained and demonstrated using controlled synthetic data because sufficient historical operational mine data is not currently available.
             </div>
             <div className="flex gap-3">
               <button onClick={handleFastForward} disabled={recalculating} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold transition-all border border-slate-700">
                 Fast-Forward Time (Demo)
               </button>
               <button onClick={handleDemoReset} disabled={resetting} className="text-xs bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 px-4 py-2 rounded-lg font-bold transition-all border border-rose-900/50">
                 {resetting ? 'Resetting...' : 'Reset Demo State'}
               </button>
             </div>
          </div>
        </div>
      ) : (
        /* MINE INTELLIGENCE VIEW */
        <div className="space-y-6 animate-fade-in relative">
          
          {/* Overlay loader for recalculations */}
          {recalculating && (
             <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 rounded-xl flex flex-col items-center justify-center border border-slate-800 shadow-2xl">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold tracking-widest text-blue-400">RECALCULATING INTELLIGENCE</h3>
                <p className="text-sm text-slate-400 mt-2">Processing mathematical impact of recent actions...</p>
             </div>
          )}

          {loadingIntel ? (
            <div className="p-20 flex justify-center"><div className="animate-pulse text-blue-400 font-bold">Loading Mine Intelligence...</div></div>
          ) : intelligence ? (
            <>
              <div className="flex items-center gap-4 mb-2">
                <button onClick={handleBack} className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-lg transition-colors border border-slate-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {intelligence.mine_name} <span className="text-sm font-normal text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Intelligence Report</span>
                </h2>
              </div>

              {/* TRIAD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Stage 4: Baseline Risk</h3>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-black text-white">{intelligence.baseline.score.toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-400 mb-1">/100</span>
                  </div>
                  <div className={`mt-auto inline-flex w-max px-3 py-1 rounded text-xs font-bold border ${intelligence.baseline.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/30' : intelligence.baseline.level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {intelligence.baseline.level}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 p-6 rounded-xl border border-blue-900/30 shadow-lg flex flex-col relative overflow-hidden">
                  <div className="absolute right-0 top-0 bg-blue-900/50 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-bl-lg">XGBOOST</div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Stage 5: 30-Day Predictive AI</h3>
                  {intelligence.system_status.ml_engine === "READY" ? (
                    <>
                      <div className="text-5xl font-black text-white mb-2">
                        {(intelligence.prediction.probability * 100).toFixed(0)}<span className="text-2xl text-blue-400">%</span>
                      </div>
                      <div className="mt-auto text-xs text-slate-400 font-medium">Probability of Critical Risk</div>
                    </>
                  ) : (
                    <div className="m-auto text-slate-500 text-sm font-bold flex flex-col items-center text-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Predictive AI Unavailable
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 p-6 rounded-xl border border-purple-900/30 shadow-lg flex flex-col relative overflow-hidden">
                  <div className="absolute right-0 top-0 bg-purple-900/50 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-bl-lg">ISOLATION FOREST</div>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Stage 5: Anomaly Engine</h3>
                  {intelligence.system_status.ml_engine === "READY" ? (
                    <>
                      <div className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                        {intelligence.anomaly.severity.replace(/_/g, ' ')}
                      </div>
                      <div className="mt-auto text-xs text-slate-400 font-medium">Score: {intelligence.anomaly.score.toFixed(3)}</div>
                    </>
                  ) : (
                    <div className="m-auto text-slate-500 text-sm font-bold flex flex-col items-center text-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Anomaly Engine Unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* 3D DIGITAL TWIN */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                 <div className="xl:col-span-2">
                    <MineTwin3D 
                      sensors={sensors} 
                      onSelectSensor={handleSelectSensor} 
                      selectedSensorId={selectedSensor?.id || null} 
                    />
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-4">IoT Sensor Inspector</h3>
                    {selectedSensor ? (
                      <div className="flex-1 flex flex-col animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <div className="text-sm font-black text-white">{selectedSensor.sensor_name}</div>
                             <div className="text-xs text-slate-400">{selectedSensor.sensor_type} • {selectedSensor.zone}</div>
                           </div>
                           <span className={`text-[10px] px-2 py-1 rounded font-bold ${selectedSensor.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                             {selectedSensor.status}
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                           <div className="bg-slate-950 p-3 rounded border border-slate-800">
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Current Reading</div>
                             <div className="text-xl font-bold text-blue-400">
                               {telemetry[0] ? telemetry[0].value.toFixed(2) : '--'} <span className="text-xs font-normal text-slate-500">{selectedSensor.unit}</span>
                             </div>
                           </div>
                           <div className="bg-slate-950 p-3 rounded border border-slate-800">
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Condition</div>
                             <div className={`text-sm font-bold ${telemetry[0] && telemetry[0].value >= selectedSensor.threshold_critical ? 'text-red-500' : telemetry[0] && telemetry[0].value >= selectedSensor.threshold_warning ? 'text-orange-500' : 'text-emerald-500'}`}>
                               {telemetry[0] ? (telemetry[0].value >= selectedSensor.threshold_critical ? 'CRITICAL' : telemetry[0].value >= selectedSensor.threshold_warning ? 'WARNING' : 'NORMAL') : 'NO DATA'}
                             </div>
                           </div>
                           <div className="bg-slate-950 p-3 rounded border border-slate-800">
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Warning At</div>
                             <div className="text-sm font-bold text-slate-300">{selectedSensor.threshold_warning} {selectedSensor.unit}</div>
                           </div>
                           <div className="bg-slate-950 p-3 rounded border border-slate-800">
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Critical At</div>
                             <div className="text-sm font-bold text-slate-300">{selectedSensor.threshold_critical} {selectedSensor.unit}</div>
                           </div>
                        </div>

                        {telemetry.length > 0 && (
                          <div className="mt-auto">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Time-Series History</div>
                            <TelemetryChart 
                               data={telemetry} 
                               warningThreshold={selectedSensor.threshold_warning} 
                               criticalThreshold={selectedSensor.threshold_critical} 
                               unit={selectedSensor.unit} 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                         <div className="text-slate-500 mb-2">
                           <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                         </div>
                         <h4 className="text-sm font-bold text-slate-400">No Sensor Selected</h4>
                         <p className="text-xs text-slate-600 mt-2 max-w-[200px]">Select a sensor node in the 3D Operational Twin to view telemetry.</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* SHAP EXPLANATION */}
              {intelligence.system_status.ml_engine === "READY" && intelligence.shap_explanation && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
                  <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded font-black">STAGE 6</span> 
                       Why This Prediction? (SHAP Factors)
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Risk Increasing Factors
                      </h4>
                      <div className="space-y-3">
                        {intelligence.shap_explanation.top_risk_factors?.map((f: any) => (
                           <div key={f.feature_name} className="bg-slate-950 p-3 rounded-lg border border-red-900/30 flex justify-between items-center">
                             <div>
                               <div className="text-sm font-bold text-slate-200">{f.label}</div>
                               <div className="text-[10px] text-slate-500">Value: {f.feature_value.toFixed(2)}</div>
                             </div>
                             <div className="text-xs font-bold text-red-400">+{f.shap_value.toFixed(3)}</div>
                           </div>
                        ))}
                        {(!intelligence.shap_explanation.top_risk_factors || intelligence.shap_explanation.top_risk_factors.length === 0) && (
                          <div className="text-sm text-slate-600 italic">No significant factors.</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Risk Reducing Factors
                      </h4>
                      <div className="space-y-3">
                        {intelligence.shap_explanation.top_protective_factors?.map((f: any) => (
                           <div key={f.feature_name} className="bg-slate-950 p-3 rounded-lg border border-emerald-900/30 flex justify-between items-center">
                             <div>
                               <div className="text-sm font-bold text-slate-200">{f.label}</div>
                               <div className="text-[10px] text-slate-500">Value: {f.feature_value.toFixed(2)}</div>
                             </div>
                             <div className="text-xs font-bold text-emerald-400">{f.shap_value.toFixed(3)}</div>
                           </div>
                        ))}
                        {(!intelligence.shap_explanation.top_protective_factors || intelligence.shap_explanation.top_protective_factors.length === 0) && (
                          <div className="text-sm text-slate-600 italic">No significant factors.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INCIDENT REPORTS PANEL */}
              <div className="mt-8">
                <IncidentReportsPanel mineId={selectedMineId!} userId={currentUserId} />
              </div>

              {/* GOVERNANCE SCORE PANEL */}
              <div className="mt-8">
                <GovernanceScorePanel mineId={selectedMineId!} />
              </div>

              {/* WHAT-IF SIMULATOR */}
              <div className="mt-8">
                <WhatIfSimulator mineId={selectedMineId!} role={currentUserRole} />
              </div>

              {/* GOVERNANCE & TIMELINE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Actions */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Recommendations */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-black">STAGE 7</span>
                        AI Recommendations
                      </h3>
                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">{intelligence.recommendations.length} Pending</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {intelligence.recommendations.length === 0 && <div className="text-slate-500 text-sm">No pending recommendations.</div>}
                      {intelligence.recommendations.map((rec: any) => (
                        <div key={rec.id} className="bg-slate-950 p-4 rounded-xl border border-slate-700/50 shadow-sm relative overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${rec.priority === 'CRITICAL' ? 'bg-red-500' : rec.priority === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                          <div className="pl-3 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-white text-base">{rec.title}</h4>
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">{rec.source_type}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">{rec.description}</p>
                              <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded border border-slate-800"><span className="font-bold text-slate-300">AI Reason:</span> {rec.reason}</div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 items-start justify-end shrink-0">
                               <button onClick={() => handleAcceptRecommendation(rec.id)} disabled={recalculating} className={`bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded shadow transition-colors w-full ${recalculating ? 'opacity-50 cursor-not-allowed' : ''}`}>Accept & Assign</button>
                               <button disabled={recalculating} className={`bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded shadow transition-colors w-full ${recalculating ? 'opacity-50 cursor-not-allowed' : ''}`}>Reject</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Actions */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        Active Corrective Actions
                      </h3>
                      <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">{intelligence.active_actions.length} Active</span>
                    </div>
                    <div className="p-0">
                      {intelligence.active_actions.length === 0 ? (
                        <div className="p-5 text-slate-500 text-sm">No active actions.</div>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-800/50">
                            {intelligence.active_actions.map((act: any) => (
                              <tr key={act.id} className="hover:bg-slate-800/20">
                                <td className="px-5 py-4 w-1/2">
                                  <div className="font-bold text-slate-200 mb-1">{act.title}</div>
                                  <div className="flex gap-2">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${act.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : act.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : act.status === 'IN_REVIEW' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-400'}`}>{act.status}</span>
                                    {act.escalation_level > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">Escalation Lvl {act.escalation_level}</span>}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  {act.status === 'IN_REVIEW' && (
                                     <button onClick={() => window.location.href = '/governance'} className="bg-slate-800 hover:bg-orange-600 text-orange-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors border border-slate-700 hover:border-orange-500">
                                       Review Evidence
                                     </button>
                                  )}
                                  {act.status === 'COMPLETED' && (
                                     <button onClick={() => handleActionCompleteOrUpdate(act.id, 'VERIFIED')} disabled={recalculating} className={`bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded transition-colors border border-slate-700 hover:border-emerald-500 ${recalculating ? 'opacity-50 cursor-not-allowed hover:bg-slate-800 hover:border-slate-700 hover:text-slate-300' : ''}`}>
                                       Verify
                                     </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Col: Timeline */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full max-h-[800px]">
                   <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         Audit Timeline
                      </h3>
                   </div>
                   <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                     <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-slate-800"></div>
                     <div className="space-y-6 relative z-10">
                        {intelligence.audit_timeline.length === 0 && <div className="text-slate-500 text-sm ml-6">No timeline events yet.</div>}
                        {intelligence.audit_timeline.map((evt: any) => {
                           let colorClass = "bg-slate-500";
                           if (evt.event_type.includes('RECOMMENDATION_CREATED')) colorClass = "bg-emerald-500";
                           else if (evt.event_type.includes('ACCEPTED')) colorClass = "bg-blue-500";
                           else if (evt.event_type.includes('COMPLETED')) colorClass = "bg-green-500";
                           else if (evt.event_type.includes('ESCALATED') || evt.event_type.includes('OVERDUE')) colorClass = "bg-rose-500";
                           
                           return (
                             <div key={evt.id} className="flex gap-4 relative">
                                <div className={`w-3 h-3 rounded-full mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${colorClass} ring-4 ring-slate-900`}></div>
                                <div>
                                   <div className="text-[10px] text-slate-500 font-bold mb-1">{new Date(evt.created_at).toLocaleString()}</div>
                                   <div className="text-sm font-bold text-slate-200">{evt.event_type.replace(/_/g, ' ')}</div>
                                   <div className="text-xs text-slate-400 mt-1">{evt.new_status}</div>
                                   {evt.details?.reason && <div className="text-[10px] text-slate-500 italic mt-1">{evt.details.reason}</div>}
                                </div>
                             </div>
                           )
                        })}
                     </div>
                   </div>
                </div>

              </div>
            </>
          ) : null}
        </div>
      )}
      
      {/* Demo Controls for IoT spikes when inside a mine */}
      {selectedMineId && (
         <DemoIoTControls onSimulateSpike={handleSimulateSpike} loading={simulatingIoTTwin} />
      )}
    </div>
  );
};

export default CommandCenter;
