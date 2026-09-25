import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';

// Core Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicReport from './pages/PublicReport';
import CommandCenter from './pages/CommandCenter';
import Mines from './pages/Mines';
import MineDetail from './pages/MineDetail';
import PriorityQueue from './pages/PriorityQueue';
import RiskOverview from './pages/RiskOverview';
import WhatIfView from './pages/WhatIfView';
import CorrectiveActions from './pages/CorrectiveActions';
import GovernanceActionCenter from './pages/GovernanceActionCenter';
import FieldOfficer from './pages/FieldOfficer';
import SupervisorReview from './pages/SupervisorReview';
import DailyReporting from './pages/DailyReporting';
import Safety from './pages/Safety';
import Environment from './pages/Environment';
import Contractors from './pages/Contractors';
import Inspections from './pages/Inspections';
import Compliance from './pages/Compliance';
import Incidents from './pages/Incidents';
import GovernanceScoreView from './pages/GovernanceScoreView';
import TimelineView from './pages/TimelineView';
import AuditTrailView from './pages/AuditTrailView';
import IoTControl from './pages/IoTControl';
import UsersView from './pages/UsersView';
import SettingsView from './pages/SettingsView';

import './App.css';

const ROLE_LABELS: Record<string, string> = {
  HEAD_ADMIN: 'Admin',
  REGIONAL_MANAGER: 'Regional Mgr',
  AREA_MANAGER: 'Area Mgr',
  MINE_MANAGER: 'Mine Mgr',
  SAFETY_OFFICER: 'Safety',
  ENVIRONMENTAL_OFFICER: 'Env. Officer',
  CONTRACTOR_OFFICER: 'Contractor',
  FIELD_OFFICER: 'Field Officer',
  AUDITOR_REGULATOR: 'Auditor',
  SUPERVISOR: 'Supervisor'
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Authenticating CoalGuard Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 shadow-xl">
      {/* Primary Top Bar */}
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-all">
              CG
            </div>
            <div>
              <div className="font-black text-base text-white tracking-wide flex items-center gap-1.5">
                <span>COALGUARD</span>
                <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">AI</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Smart Mine Governance</div>
            </div>
          </Link>

          {/* Quick Primary Links */}
          {isAuthenticated && (
            <nav className="hidden xl:flex items-center gap-1 text-xs font-bold text-slate-300">
              <Link to="/" className={`px-3 py-1.5 rounded-lg transition-all ${isActive('/') ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-white'}`}>
                Portfolio
              </Link>
              <Link to="/command-center" className={`px-3 py-1.5 rounded-lg transition-all ${isActive('/command-center') ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-white'}`}>
                Command Center
              </Link>
              <Link to="/mines" className={`px-3 py-1.5 rounded-lg transition-all ${isActive('/mines') ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-white'}`}>
                3D Digital Twins
              </Link>
              <Link to="/priority-queue" className={`px-3 py-1.5 rounded-lg transition-all ${isActive('/priority-queue') ? 'bg-red-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-red-400'}`}>
                ⚡ Priority Queue
              </Link>
              <Link to="/actions" className={`px-3 py-1.5 rounded-lg transition-all ${isActive('/actions') ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-white'}`}>
                Closed-Loop Hub
              </Link>
            </nav>
          )}
        </div>

        {/* Right Action Tools & User Profile */}
        <div className="flex items-center gap-3">
          <Link
            to="/public-report"
            target="_blank"
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>📢</span>
            <span className="hidden sm:inline">Report Hazard (Public)</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-xs">
                  <span className="text-white font-bold">{user.full_name}</span>
                  <span className="text-blue-400 ml-1.5 text-[10px] font-semibold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/20">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-xs text-slate-400 hover:text-red-400 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="hover:text-blue-300 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg shadow-md transition-all">
              Login Portal
            </Link>
          )}
        </div>
      </div>

      {/* Secondary Category Sub-Nav for Authenticated Users */}
      {isAuthenticated && (
        <div className="bg-slate-900/90 border-t border-slate-800/60 px-4 lg:px-8 py-2 overflow-x-auto flex items-center gap-6 text-[11px] font-bold text-slate-400 whitespace-nowrap">
          {/* Intelligence */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-black">AI Triad:</span>
            <Link to="/risk" className={`px-2 py-1 rounded hover:text-white ${isActive('/risk') ? 'text-blue-400 font-black' : ''}`}>Risk Engine</Link>
            <span className="text-slate-700">•</span>
            <Link to="/what-if" className={`px-2 py-1 rounded hover:text-white ${isActive('/what-if') ? 'text-blue-400 font-black' : ''}`}>What-If Simulator</Link>
            <span className="text-slate-700">•</span>
            <Link to="/priority-queue" className={`px-2 py-1 rounded hover:text-white ${isActive('/priority-queue') ? 'text-red-400 font-black' : ''}`}>Priority Queue</Link>
          </div>

          <span className="text-slate-800">|</span>

          {/* Operations */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-amber-400 font-black">Operations:</span>
            <Link to="/daily-reporting" className={`px-2 py-1 rounded hover:text-white ${isActive('/daily-reporting') ? 'text-amber-400 font-black' : ''}`}>Daily Tasks (+10pts)</Link>
            <span className="text-slate-700">•</span>
            <Link to="/safety" className={`px-2 py-1 rounded hover:text-white ${isActive('/safety') ? 'text-amber-400 font-black' : ''}`}>Safety</Link>
            <span className="text-slate-700">•</span>
            <Link to="/environment" className={`px-2 py-1 rounded hover:text-white ${isActive('/environment') ? 'text-amber-400 font-black' : ''}`}>Environment</Link>
            <span className="text-slate-700">•</span>
            <Link to="/contractors" className={`px-2 py-1 rounded hover:text-white ${isActive('/contractors') ? 'text-amber-400 font-black' : ''}`}>Contractors</Link>
            <span className="text-slate-700">•</span>
            <Link to="/inspections" className={`px-2 py-1 rounded hover:text-white ${isActive('/inspections') ? 'text-amber-400 font-black' : ''}`}>DGMS Audits</Link>
            <span className="text-slate-700">•</span>
            <Link to="/compliance" className={`px-2 py-1 rounded hover:text-white ${isActive('/compliance') ? 'text-amber-400 font-black' : ''}`}>Compliance Vault</Link>
            <span className="text-slate-700">•</span>
            <Link to="/incidents" className={`px-2 py-1 rounded hover:text-white ${isActive('/incidents') ? 'text-amber-400 font-black' : ''}`}>Incidents</Link>
          </div>

          <span className="text-slate-800">|</span>

          {/* Closed Loop & Governance */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-purple-400 font-black">Closed-Loop:</span>
            <Link to="/field-officer" className={`px-2 py-1 rounded hover:text-white ${isActive('/field-officer') ? 'text-purple-400 font-black' : ''}`}>Field Evidence (Mobile)</Link>
            <span className="text-slate-700">•</span>
            <Link to="/supervisor-review" className={`px-2 py-1 rounded hover:text-white ${isActive('/supervisor-review') ? 'text-purple-400 font-black' : ''}`}>Supervisor Sign-Off</Link>
            <span className="text-slate-700">•</span>
            <Link to="/governance-score" className={`px-2 py-1 rounded hover:text-white ${isActive('/governance-score') ? 'text-emerald-400 font-black' : ''}`}>Governance Score</Link>
            <span className="text-slate-700">•</span>
            <Link to="/timeline" className={`px-2 py-1 rounded hover:text-white ${isActive('/timeline') ? 'text-purple-400 font-black' : ''}`}>Timeline Feed</Link>
            <span className="text-slate-700">•</span>
            <Link to="/audit-trail" className={`px-2 py-1 rounded hover:text-white ${isActive('/audit-trail') ? 'text-purple-400 font-black' : ''}`}>Immutable Audit Log</Link>
          </div>

          <span className="text-slate-800">|</span>

          {/* System & Admin */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-black">Admin:</span>
            <Link to="/iot-control" className={`px-2 py-1 rounded hover:text-white ${isActive('/iot-control') ? 'text-cyan-400 font-black' : ''}`}>IoT Telemetry Spike</Link>
            <span className="text-slate-700">•</span>
            <Link to="/users" className={`px-2 py-1 rounded hover:text-white ${isActive('/users') ? 'text-cyan-400 font-black' : ''}`}>Users & RBAC</Link>
            <span className="text-slate-700">•</span>
            <Link to="/settings" className={`px-2 py-1 rounded hover:text-white ${isActive('/settings') ? 'text-cyan-400 font-black' : ''}`}>Settings</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function AppContent() {
  return (
    <div className="app-container bg-slate-950 min-h-screen text-slate-200">
      <AppNavbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public-report" element={<PublicReport />} />

        {/* Executive & Overview */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        <Route path="/mines" element={<ProtectedRoute><Mines /></ProtectedRoute>} />
        <Route path="/mines/:id" element={<ProtectedRoute><MineDetail /></ProtectedRoute>} />

        {/* AI & Decision Support */}
        <Route path="/priority-queue" element={<ProtectedRoute><PriorityQueue /></ProtectedRoute>} />
        <Route path="/risk" element={<ProtectedRoute><RiskOverview /></ProtectedRoute>} />
        <Route path="/what-if" element={<ProtectedRoute><WhatIfView /></ProtectedRoute>} />

        {/* Closed Loop Governance */}
        <Route path="/actions" element={<ProtectedRoute><CorrectiveActions /></ProtectedRoute>} />
        <Route path="/governance" element={<ProtectedRoute><GovernanceActionCenter /></ProtectedRoute>} />
        <Route path="/field-officer" element={<ProtectedRoute><FieldOfficer /></ProtectedRoute>} />
        <Route path="/supervisor-review" element={<ProtectedRoute><SupervisorReview /></ProtectedRoute>} />
        <Route path="/governance-score" element={<ProtectedRoute><GovernanceScoreView /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/audit-trail" element={<ProtectedRoute><AuditTrailView /></ProtectedRoute>} />

        {/* Operations & Departmental Workflows */}
        <Route path="/daily-reporting" element={<ProtectedRoute><DailyReporting /></ProtectedRoute>} />
        <Route path="/safety" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
        <Route path="/environment" element={<ProtectedRoute><Environment /></ProtectedRoute>} />
        <Route path="/contractors" element={<ProtectedRoute><Contractors /></ProtectedRoute>} />
        <Route path="/inspections" element={<ProtectedRoute><Inspections /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />

        {/* System & Tools */}
        <Route path="/iot-control" element={<ProtectedRoute><IoTControl /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersView /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
