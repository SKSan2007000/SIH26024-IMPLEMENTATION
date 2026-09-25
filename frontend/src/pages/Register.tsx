import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FIELD_OFFICER');
  const [department, setDepartment] = useState('Safety & Operations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        department
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white mx-auto shadow-lg shadow-blue-500/20">
            C
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create CoalGuard Account</h1>
          <p className="text-xs text-slate-400">
            Register your official mining credentials for CoalGuard AI compliance portal.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center">
            ✓ Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
            <input
              type="email"
              required
              placeholder="e.g. ramesh@coalguard.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Operational Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="FIELD_OFFICER">Field Officer</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="ENVIRONMENTAL_OFFICER">Environmental Officer</option>
                <option value="CONTRACTOR_OFFICER">Contractor Officer</option>
                <option value="MINE_MANAGER">Mine Manager</option>
                <option value="AUDITOR_REGULATOR">Auditor</option>
                <option value="HEAD_ADMIN">Head Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition hover:scale-[1.02] disabled:opacity-50 mt-2"
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-blue-400 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
