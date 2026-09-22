import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Mine {
  mine_id: string;
  mine_name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  baseline_risk_score: number;
  baseline_risk_level: string;
  predicted_critical_probability: number;
  anomaly_status: string;
  anomaly_score: number;
  open_action_count: number;
  overdue_action_count: number;
  priority_indicator: number;
}

interface MineMapProps {
  mines: Mine[];
  onSelectMine: (mineId: string) => void;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return '#ef4444'; // red-500
    case 'HIGH': return '#f97316'; // orange-500
    case 'MEDIUM': return '#eab308'; // yellow-500
    case 'LOW': return '#22c55e'; // green-500
    default: return '#94a3b8'; // slate-400
  }
};

const MineMap: React.FC<MineMapProps> = ({ mines, onSelectMine }) => {
  // Center map around Indian coal regions
  const defaultCenter: [number, number] = [22.33, 82.6];
  const defaultZoom = 10;

  const validMines = mines.filter(m => m.latitude && m.longitude);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-800 shadow-xl relative bg-slate-900 z-0 mb-8">
      {validMines.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <p className="text-slate-400 font-bold">No valid mine coordinates available.</p>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-lg text-xs">
        <h4 className="text-white font-bold mb-2 border-b border-slate-700 pb-1">Risk Levels</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-300">Critical</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-slate-300">High</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="text-slate-300">Medium</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-slate-300">Low</span></div>
        </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {validMines.map((mine) => (
          <CircleMarker
            key={mine.mine_id}
            center={[mine.latitude as number, mine.longitude as number]}
            radius={8}
            pathOptions={{ 
              color: getRiskColor(mine.baseline_risk_level), 
              fillColor: getRiskColor(mine.baseline_risk_level),
              fillOpacity: 0.7,
              weight: 2
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-slate-800 text-lg mb-1">{mine.mine_name}</h3>
                <div className="text-xs text-slate-600 mb-3">{mine.location || 'Unknown Location'}</div>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Baseline</span>
                    <span className="font-bold">{mine.baseline_risk_score.toFixed(1)} ({mine.baseline_risk_level})</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">30d Critical</span>
                    <span className="font-bold">{(mine.predicted_critical_probability * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Anomaly Status:</span>
                    <span className={`font-bold ${mine.anomaly_status === 'HIGH_ANOMALY' ? 'text-purple-600' : 'text-slate-700'}`}>
                      {mine.anomaly_status === 'HIGH_ANOMALY' ? 'High Anomaly' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Open Actions:</span>
                    <span className="font-bold text-blue-600">{mine.open_action_count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Overdue:</span>
                    <span className="font-bold text-red-600">{mine.overdue_action_count}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMine(mine.mine_id);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs transition-colors"
                >
                  View Mine Intelligence
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MineMap;
