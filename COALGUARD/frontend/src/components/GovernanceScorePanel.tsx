import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { GovernanceScoreResponse } from '../services/api';

interface GovernanceScorePanelProps {
  mineId: string;
}

export const GovernanceScorePanel: React.FC<GovernanceScorePanelProps> = ({ mineId }) => {
  const [data, setData] = useState<GovernanceScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        setLoading(true);
        const result = await api.getGovernanceScore(mineId);
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch Governance Score');
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, [mineId]);

  if (loading) {
    return <div className="text-gray-400 p-4 animate-pulse">Calculating Verified Governance Score...</div>;
  }

  if (error || !data) {
    return <div className="text-red-400 p-4">Error: {error}</div>;
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT': return 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10';
      case 'GOOD': return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
      case 'MARGINAL': return 'text-amber-400 border-amber-400/30 bg-amber-500/10';
      case 'POOR': return 'text-rose-400 border-rose-400/30 bg-rose-500/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-500/10';
    }
  };

  const getIconForComponent = (_name: string) => {
    return <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  };

  return (
    <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center">
            Verified Governance Score
            <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">v{data.calculation_version}</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">Based on genuine field workflow verification</p>
        </div>
        <div className={`flex items-center px-4 py-2 rounded-lg border ${getLevelColor(data.governance_level)}`}>
          <span className="text-3xl font-bold tracking-tight">{data.governance_score.toFixed(1)}</span>
          <span className="ml-2 text-sm font-medium tracking-wide">/ 100</span>
          <div className="ml-4 pl-4 border-l border-current/20">
            <span className="font-semibold">{data.governance_level}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Component Bars */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Score Components</h4>
          {data.component_scores.map((comp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-300 flex items-center">
                  {getIconForComponent(comp.name)}
                  {comp.name}
                </span>
                <span className="text-sm font-medium text-slate-200">{comp.score.toFixed(1)} <span className="text-slate-500">/ {comp.max_score}</span></span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(comp.score / comp.max_score) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{comp.description}</p>
            </div>
          ))}
        </div>

        {/* Explanation & Contributors */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Analysis</h4>
            <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              {data.explanation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Positives */}
            <div>
              <h5 className="text-xs font-semibold text-emerald-400 uppercase mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Positives
              </h5>
              {data.positive_contributors.length > 0 ? (
                <ul className="space-y-2">
                  {data.positive_contributors.map((pos, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start">
                      <span className="text-emerald-400 mr-2 mt-0.5">•</span>
                      {pos}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No significant positive factors.</p>
              )}
            </div>

            {/* Negatives */}
            <div>
              <h5 className="text-xs font-semibold text-rose-400 uppercase mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Areas for Improvement
              </h5>
              {data.negative_contributors.length > 0 ? (
                <ul className="space-y-2">
                  {data.negative_contributors.map((neg, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start">
                      <span className="text-rose-400 mr-2 mt-0.5">•</span>
                      {neg}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No significant negative factors.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
