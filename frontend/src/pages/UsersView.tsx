import React from 'react';

const DEMO_USERS = [
  { email: 'admin@coalguard.ai', role: 'HEAD_ADMIN', name: 'Dr. Rajesh Sharma', dept: 'System Administration', points: 1200 },
  { email: 'manager@coalguard.ai', role: 'MINE_MANAGER', name: 'Vikram Singh', dept: 'Mine Operations', points: 850 },
  { email: 'supervisor@coalguard.ai', role: 'SUPERVISOR', name: 'Anil Deshmukh', dept: 'Pit Supervision', points: 740 },
  { email: 'safety@coalguard.ai', role: 'SAFETY_OFFICER', name: 'Priya Nair', dept: 'Safety & DGMS Compliance', points: 680 },
  { email: 'environment@coalguard.ai', role: 'ENVIRONMENTAL_OFFICER', name: 'Siddharth Roy', dept: 'Environmental Monitoring', points: 620 },
  { email: 'contractor@coalguard.ai', role: 'CONTRACTOR_OFFICER', name: 'Kavita Patel', dept: 'Contractor Safety Management', points: 510 },
  { email: 'field@coalguard.ai', role: 'FIELD_OFFICER', name: 'Ramesh Kumar', dept: 'Field Operations & Evidence', points: 490 },
  { email: 'auditor@coalguard.ai', role: 'AUDITOR_REGULATOR', name: 'Sunil Mathur', dept: 'DGMS / Regulatory Audit', points: 400 },
  { email: 'regional@coalguard.ai', role: 'REGIONAL_MANAGER', name: 'Deepak Sengupta', dept: 'Eastern Region Oversight', points: 350 },
  { email: 'area@coalguard.ai', role: 'AREA_MANAGER', name: 'Manoj Tiwari', dept: 'Dhanbad Mining Area', points: 320 },
];

const UsersView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">User Directory & Role Permissions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Official personnel roster across all governance tiers with assigned departmental roles and credentials.
          </p>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_USERS.map((u) => (
          <div key={u.email} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                {u.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{u.name}</h3>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {u.role.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Email:</span>
                <strong className="text-slate-200">{u.email}</strong>
              </div>
              <div className="flex justify-between">
                <span>Department:</span>
                <strong className="text-slate-300">{u.dept}</strong>
              </div>
              <div className="flex justify-between">
                <span>Governance Score:</span>
                <strong className="text-emerald-400">{u.points} pts</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersView;
