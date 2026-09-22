import React, { useState } from 'react';

interface DemoIoTControlsProps {
  onSimulateSpike: (eventType: string) => Promise<void>;
  loading: boolean;
}

export const DemoIoTControls: React.FC<DemoIoTControlsProps> = ({ onSimulateSpike, loading }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl w-64 mb-2 animate-fade-in">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Demo IoT Scenarios
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          
          <div className="text-[10px] text-slate-400 mb-3 italic">
            SYNTHETIC CLOSED-LOOP DEMO
            <div className="mt-1 leading-tight text-slate-500">
              Triggering a spike dynamically maps to legacy data schemas, invoking XGBoost & Isolation Forest models.
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => onSimulateSpike('NORMAL')} 
              disabled={loading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded transition-colors text-left flex justify-between items-center"
            >
              Normal Operations <span>✅</span>
            </button>
            <button 
              onClick={() => onSimulateSpike('PM10_SPIKE')} 
              disabled={loading}
              className="text-xs bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-900/50 px-3 py-2 rounded transition-colors text-left flex justify-between items-center"
            >
              PM10 Spike (Dust) <span>💨</span>
            </button>
            <button 
              onClick={() => onSimulateSpike('METHANE_SPIKE')} 
              disabled={loading}
              className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-3 py-2 rounded transition-colors text-left flex justify-between items-center"
            >
              Methane Leak <span>🔥</span>
            </button>
            <button 
              onClick={() => onSimulateSpike('VIBRATION_SPIKE')} 
              disabled={loading}
              className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-900/50 px-3 py-2 rounded transition-colors text-left flex justify-between items-center"
            >
              Conveyor Vibration <span>⚠️</span>
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        Demo Controls
      </button>
    </div>
  );
};
