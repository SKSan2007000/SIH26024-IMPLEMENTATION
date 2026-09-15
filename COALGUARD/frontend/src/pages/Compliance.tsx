import React, { useEffect, useState } from 'react';
import { api, type Mine, type ComplianceDoc } from '../services/api';

const Compliance: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('ENVIRONMENT_CLEARANCE');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [minesData, docsData] = await Promise.all([
        api.getMines().catch(() => []),
        api.getComplianceDocs(selectedMineId || undefined).catch(() => [])
      ]);

      setMines(minesData || []);
      setDocs(docsData || []);
      if (!selectedMineId && minesData && minesData.length > 0) {
        setSelectedMineId(minesData[0].id);
      }
    } catch (err) {
      console.error('Error loading compliance documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMineId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF or image file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('document_type', docType);
      formData.append('expiry_date', expiryDate);
      formData.append('mine_id', selectedMineId || (mines[0]?.id ?? ''));

      const res = await api.uploadComplianceDoc(formData);
      setOcrResult(res);
      setShowUploadModal(false);
      setTitle('');
      setSelectedFile(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload compliance document');
    } finally {
      setUploading(false);
    }
  };

  const validDocsCount = docs.filter(d => d.status === 'VALID').length;
  const expiringDocsCount = docs.filter(d => d.status === 'EXPIRING_SOON').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase tracking-wider">
            <span>Statutory Clearance & Legal Approvals Repository</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Compliance Vault & OCR Verification</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ministry of Environment, Forest & Climate Change (MoEFCC) clearances, State SPCB Consent-to-Operate, and automated OCR validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
          >
            <option value="">All Mines</option>
            {mines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition hover:scale-105"
          >
            + Upload & OCR Parse Document
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Statutory Clearances</span>
            <div className="text-3xl font-black text-white mt-1">{docs.length}</div>
          </div>
          <span className="text-2xl p-3 bg-cyan-500/10 rounded-xl">📜</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Valid Clearances</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{validDocsCount}</div>
          </div>
          <span className="text-2xl p-3 bg-emerald-500/10 rounded-xl">✅</span>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Expiring / Critical</span>
            <div className="text-3xl font-black text-amber-400 mt-1">{expiringDocsCount}</div>
          </div>
          <span className="text-2xl p-3 bg-amber-500/10 rounded-xl">⏳</span>
        </div>
      </div>

      {/* OCR Result Banner if any */}
      {ocrResult && (
        <div className="bg-cyan-950/40 border border-cyan-500/50 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
              <span>🤖 AI OCR Extraction Successful</span>
            </h4>
            <button onClick={() => setOcrResult(null)} className="text-slate-400 hover:text-white text-xs">✕ Dismiss</button>
          </div>
          <p className="text-xs text-slate-300">
            Document <strong>{ocrResult.title}</strong> processed. Extracted validity: <strong>{new Date(ocrResult.expiry_date).toLocaleDateString()}</strong>.
          </p>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading statutory documents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map(d => {
            const isValid = d.status === 'VALID';
            const isExpiring = d.status === 'EXPIRING_SOON';

            return (
              <div key={d.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {d.document_type?.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isExpiring ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {d.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{d.title}</h3>
                  <p className="text-xs text-slate-400">
                    File: <span className="text-slate-300">{d.file_name || 'statutory_doc.pdf'}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Valid Until:</span>
                    <strong className="text-white">{d.expiry_date || d.valid_to ? new Date(d.expiry_date || d.valid_to).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{(d.uploaded_at || d.created_at) ? new Date(d.uploaded_at || d.created_at || '').toLocaleDateString() : 'Recent'}</span>
                  </div>

                  {d.file_url && (
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl transition mt-2"
                    >
                      View Original Clearance PDF ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Upload Statutory Compliance Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MoEFCC Environmental Clearance 2024-2029"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ENVIRONMENT_CLEARANCE">Environmental Clearance (EC)</option>
                    <option value="CONSENT_TO_OPERATE">Consent to Operate (CTO)</option>
                    <option value="CONSENT_TO_ESTABLISH">Consent to Establish (CTE)</option>
                    <option value="DGMS_GROUND_CONTROL">DGMS Ground Control Approval</option>
                    <option value="MINING_LEASE_DEED">Mining Lease Deed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select PDF / Image File</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold disabled:opacity-50">
                  {uploading ? 'Parsing with OCR...' : 'Upload & Validate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compliance;
