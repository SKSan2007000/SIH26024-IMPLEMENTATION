import React, { useState } from 'react';
import { api } from '../services/api';

const PublicReport: React.FC = () => {
  const [mineCode, setMineCode] = useState('');
  const [category, setCategory] = useState('SAFETY');
  const [severity, setSeverity] = useState('LOW');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mineCode || !description || description.length < 10) {
      setError("Please provide a valid mine code and description (min 10 chars).");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        mine_code: mineCode,
        category,
        severity,
        description,
        reporter_name: reporterName,
        reporter_contact: reporterContact,
        is_anonymous: isAnonymous,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };
      
      const res = await api.submitPublicIncident(payload);
      setReportId(res.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please check the Mine Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        () => setError("Failed to retrieve location.")
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="bg-slate-900 border border-emerald-900/50 shadow-2xl rounded-2xl max-w-lg w-full p-8 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted Successfully</h2>
          <p className="text-slate-400 mb-6">Thank you for reporting this issue. Your report will be reviewed by the safety and compliance team.</p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-8">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Your Tracking ID</div>
            <div className="text-lg font-mono text-emerald-400 select-all">{reportId}</div>
          </div>
          <button onClick={() => setSuccess(false)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-slate-700 w-full">
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            CoalGuard Incident Reporting
          </h1>
          <p className="mt-3 text-slate-400">
            Secure, anonymous reporting for safety, environmental, and compliance concerns.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div className="text-sm font-medium">{error}</div>
              </div>
            )}

            <div className="space-y-4 border-b border-slate-800 pb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incident Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mine Code *</label>
                <input 
                  type="text" 
                  value={mineCode} 
                  onChange={(e) => setMineCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TM-01"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category *</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  >
                    <option value="SAFETY">SAFETY</option>
                    <option value="ENVIRONMENT">ENVIRONMENT</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Severity *</label>
                  <select 
                    value={severity} 
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description *</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the incident in detail..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow h-32"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-b border-slate-800 pb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Location (Optional)</h3>
                <button type="button" onClick={handleUseLocation} className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Use My Location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    value={latitude} 
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={longitude} 
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reporter Info (Optional)</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isAnonymous} 
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-400 font-medium select-none">Submit Anonymously</span>
                </label>
              </div>
              
              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input 
                      type="text" 
                      value={reporterName} 
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={reporterContact} 
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="Phone or Email"
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>
              )}
              {isAnonymous && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-400 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Your report will be submitted without any identifying information.
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'}`}
            >
              {loading ? 'Submitting...' : 'Submit Incident Report'}
            </button>
            <div className="text-center">
              <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Powered by CoalGuard AI</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicReport;
