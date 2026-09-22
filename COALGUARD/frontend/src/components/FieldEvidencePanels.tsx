import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { authFetch } from '../services/AuthContext';

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const AuthImage: React.FC<AuthImageProps> = ({ src, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    let objectUrl = '';
    const fetchImage = async () => {
      try {
        const response = await authFetch(src);
        if (response.ok) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
        }
      } catch (e) {
        console.error('Error fetching image:', e);
      }
    };
    fetchImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return imageSrc ? <img src={imageSrc} {...props} /> : <div className={`animate-pulse bg-slate-800 ${props.className || ''}`} />;
};

interface FieldEvidencePanelProps {
  actionId: string;
  mineId: string;
  assigneeId: string;
  onEvidenceSubmitted: () => void;
  onSubmittedForReview: () => void;
}

export const FieldEvidencePanel: React.FC<FieldEvidencePanelProps> = ({ actionId, mineId, assigneeId, onEvidenceSubmitted, onSubmittedForReview }) => {
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvidence();
  }, [actionId]);

  const fetchEvidence = async () => {
    try {
      const data = await api.getEvidenceForAction(actionId);
      setEvidenceList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCaptureGPS = () => {
    setIsCapturing(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
          setAccuracy(position.coords.accuracy);
          setIsCapturing(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Could not capture GPS. Please enter manually.");
          setIsCapturing(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsCapturing(false);
    }
  };

  const handleDemoGPS = () => {
    // Random coal mine coordinates for demo
    setLat('-23.7272');
    setLng('149.8344');
    setAccuracy(15.5);
  };

  const handleSubmitEvidence = async () => {
    if (!file || !lat || !lng) {
      alert("Please provide a photo and GPS coordinates.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('corrective_action_id', actionId);
      formData.append('mine_id', mineId);
      formData.append('submitter_id', assigneeId); // Simulating Field Officer
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      if (accuracy) formData.append('accuracy', accuracy.toString());
      if (remarks) formData.append('remarks', remarks);
      formData.append('photo', file);

      await api.submitFieldEvidence(formData);
      alert("Evidence submitted successfully.");
      setFile(null);
      setRemarks('');
      await fetchEvidence();
      onEvidenceSubmitted();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (evidenceList.length === 0) {
      alert("You must submit at least one piece of evidence before submitting for review.");
      return;
    }
    try {
      await api.submitActionForReview(actionId, assigneeId);
      onSubmittedForReview();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
      <h4 className="text-sm font-bold text-blue-400 mb-3 border-b border-slate-700 pb-1">Field Evidence Collection (Officer View)</h4>
      
      {/* Existing Evidence */}
      {evidenceList.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs text-slate-400 font-bold uppercase">Submitted Evidence ({evidenceList.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {evidenceList.map(ev => (
              <div key={ev.id} className="min-w-[150px] bg-slate-800 p-2 rounded border border-slate-600 text-xs">
                {ev.photo_path && (
                  <AuthImage src={`/api/field-evidence/photo/${ev.id}`} alt="Evidence" className="w-full h-20 object-cover rounded mb-2 bg-black" />
                )}
                <div>Lat: {ev.latitude.toFixed(4)}</div>
                <div>Lng: {ev.longitude.toFixed(4)}</div>
                <div className="text-slate-400 truncate mt-1">{ev.remarks}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Photo Evidence</label>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs text-slate-400 mb-1">GPS Coordinates</label>
          <div className="flex gap-2 mb-2">
            <button onClick={handleCaptureGPS} disabled={isCapturing} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs transition-colors">
              {isCapturing ? 'Capturing...' : 'Capture GPS'}
            </button>
            <button onClick={handleDemoGPS} className="bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 px-3 py-1 rounded text-xs transition-colors border border-purple-500/30">
              Demo GPS
            </button>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" />
            <input type="text" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Remarks</label>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs h-16"
            placeholder="Add context or notes about the evidence..."
          ></textarea>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={handleSubmitEvidence} disabled={uploading || !file} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded shadow transition-colors">
            {uploading ? 'Uploading...' : 'Submit Evidence'}
          </button>
          <button onClick={handleSubmitForReview} disabled={evidenceList.length === 0} className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded shadow transition-colors">
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};

export const SupervisorReviewPanel: React.FC<{ actionId: string, onVerify: () => void }> = ({ actionId, onVerify }) => {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, any>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEvidence();
  }, [actionId]);

  const fetchEvidence = async () => {
    try {
      const data = await api.getEvidenceForAction(actionId);
      setEvidenceList(data);
      
      const newAnalyses: Record<string, any> = {};
      for (const ev of data) {
        try {
           const analysis = await api.getEvidenceAnalysis(ev.id);
           if (analysis) {
             newAnalyses[ev.id] = analysis;
           }
        } catch(e) {}
      }
      setAnalyses(newAnalyses);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async (evidenceId: string) => {
    setAnalyzing(prev => ({...prev, [evidenceId]: true}));
    try {
      const analysis = await api.analyzeEvidence(evidenceId);
      setAnalyses(prev => ({...prev, [evidenceId]: analysis}));
    } catch (e: any) {
      alert("Analysis Error: " + e.message);
    } finally {
      setAnalyzing(prev => ({...prev, [evidenceId]: false}));
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-900 border border-orange-500/30 rounded-lg">
      <h4 className="text-sm font-bold text-orange-400 mb-3 border-b border-slate-700 pb-1 flex justify-between items-center">
        Supervisor Review
        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">AI Assisted</span>
      </h4>
      
      <div className="space-y-4 mb-4">
        {evidenceList.map(ev => {
          const analysis = analyses[ev.id];
          const isAnalyzing = analyzing[ev.id];
          
          return (
          <div key={ev.id} className="bg-slate-800 p-3 rounded border border-slate-700 text-sm flex flex-col gap-3">
            <div className="flex gap-4">
              {ev.photo_path ? (
                <AuthImage src={`/api/field-evidence/photo/${ev.id}`} alt="Evidence" className="w-32 h-32 object-cover rounded bg-black" />
              ) : (
                <div className="w-32 h-32 bg-slate-900 rounded flex items-center justify-center text-slate-500 text-xs">No Photo</div>
              )}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div><span className="text-slate-500">Lat:</span> {ev.latitude.toFixed(5)}</div>
                  <div><span className="text-slate-500">Lng:</span> {ev.longitude.toFixed(5)}</div>
                  <div><span className="text-slate-500">Accuracy:</span> {ev.accuracy ? `${ev.accuracy.toFixed(1)}m` : 'N/A'}</div>
                  <div><span className="text-slate-500">Date:</span> {new Date(ev.created_at).toLocaleString()}</div>
                </div>
                <div className="text-slate-300 text-xs border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-500 font-bold">Remarks: </span>
                  {ev.remarks || 'No remarks provided.'}
                </div>
                <div className="text-[10px] text-slate-500 mt-2">Submitted By Officer ID: {ev.submitted_by_user_id}</div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="mt-2 bg-slate-900/50 p-3 rounded border border-indigo-500/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Evidence Intelligence
                </span>
                {!analysis && (
                  <button 
                    onClick={() => handleAnalyze(ev.id)} 
                    disabled={isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Evidence'}
                  </button>
                )}
                {analysis && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase">
                    {analysis.engine.replace('_', ' ')}
                  </span>
                )}
              </div>

              {analysis && analysis.analysis_status === 'ANALYZED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-800 p-1.5 rounded">
                      <span className="text-slate-400">AI Confidence:</span>
                      <span className="font-bold text-blue-400">{analysis.confidence_score?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-1.5 rounded">
                      <span className="text-slate-400">Relevance:</span>
                      <span className={`font-bold ${analysis.relevance_score > 85 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {analysis.relevance_score?.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-1.5 rounded">
                      <span className="text-slate-400">Evidence Quality:</span>
                      <span className="font-bold text-white">{analysis.quality_score?.toFixed(1)}/100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {analysis.ocr_text && (
                      <div className="bg-slate-800 p-2 rounded">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">OCR Extraction:</span>
                        <span className="text-slate-300 font-mono text-[10px]">{analysis.ocr_text}</span>
                      </div>
                    )}
                    {analysis.detected_indicators && analysis.detected_indicators.length > 0 && (
                      <div className="bg-slate-800 p-2 rounded">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">Detected Indicators:</span>
                        <div className="flex flex-wrap gap-1">
                          {analysis.detected_indicators.map((ind: string, i: number) => (
                            <span key={i} className="text-[9px] bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 bg-slate-800 p-2 rounded border border-slate-700 text-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">Analysis Summary:</span>
                    {analysis.analysis_summary}
                  </div>
                </div>
              )}

              {analysis && analysis.analysis_status === 'FAILED' && (
                <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">
                  <span className="font-bold">Analysis Failed:</span> {analysis.analysis_summary}
                </div>
              )}
              
              {!analysis && !isAnalyzing && (
                <div className="mt-2 text-[10px] text-slate-500 italic">
                  Run Evidence Intelligence to automatically detect relevance, quality, and extract text.
                </div>
              )}
            </div>
          </div>
          );
        })}
        {evidenceList.length === 0 && <div className="text-xs text-slate-500">No evidence found.</div>}
      </div>

      <button onClick={onVerify} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded shadow transition-colors">
        Verify & Complete Action
      </button>
    </div>
  );
};
