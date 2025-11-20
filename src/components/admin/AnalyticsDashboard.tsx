
import React, { useMemo } from 'react';
import { AppState, VoterStatus } from '../../../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  state: AppState;
}

const STATUS_COLORS = {
  [VoterStatus.UNVERIFIED]: '#e2e8f0', // Slate 200
  [VoterStatus.VERIFIED]: '#8b5cf6',   // Violet 500
  [VoterStatus.VOTED]: '#10b981'       // Emerald 500
};

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ state }) => {
  const verificationStats = useMemo(() => {
    const stats = {
      [VoterStatus.UNVERIFIED]: 0,
      [VoterStatus.VERIFIED]: 0,
      [VoterStatus.VOTED]: 0
    };
    state.voters.forEach(v => stats[v.status]++);
    return [
      { name: 'Unverified', value: stats[VoterStatus.UNVERIFIED], color: STATUS_COLORS[VoterStatus.UNVERIFIED] },
      { name: 'Verified', value: stats[VoterStatus.VERIFIED], color: STATUS_COLORS[VoterStatus.VERIFIED] },
      { name: 'Voted', value: stats[VoterStatus.VOTED], color: STATUS_COLORS[VoterStatus.VOTED] }
    ];
  }, [state.voters]);

  const wardTurnout = useMemo(() => {
    const wards: Record<string, { total: number, voted: number }> = {};
    state.voters.forEach(v => {
      if (!wards[v.ward]) wards[v.ward] = { total: 0, voted: 0 };
      wards[v.ward].total++;
      if (v.status === VoterStatus.VOTED) wards[v.ward].voted++;
    });
    return Object.entries(wards).map(([name, data]) => ({
      name,
      total: data.total,
      voted: data.voted,
      turnoutPct: data.total > 0 ? Math.round((data.voted / data.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [state.voters]);

  const votingSubCountyData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.voters.forEach(v => {
      if (v.status !== VoterStatus.UNVERIFIED) {
        const key = v.votingSubCounty || 'Unknown';
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.voters]);

  const verificationProgressData = useMemo(() => {
    const verifiedVoters = state.voters
      .filter(v => (v.status === VoterStatus.VERIFIED || v.status === VoterStatus.VOTED) && v.verifiedAt)
      .map(v => ({ date: new Date(v.verifiedAt!).toLocaleDateString(), timestamp: new Date(v.verifiedAt!).getTime() }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const dataPoints: { date: string, count: number }[] = [];
    let runningCount = 0;
    
    const dateCounts = new Map<string, number>();
    verifiedVoters.forEach(v => {
      dateCounts.set(v.date, (dateCounts.get(v.date) || 0) + 1);
    });

    dateCounts.forEach((count, date) => {
      runningCount += count;
      dataPoints.push({ date, count: runningCount });
    });

    return dataPoints;
  }, [state.voters]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 border border-white/20 shadow-xl rounded-xl text-sm ring-1 ring-black/5">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></span>
              {entry.name}: <span className="text-slate-600 ml-auto pl-4">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Row: Pie & Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Voter Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {verificationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm transition-all duration-300 hover:opacity-80" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Verification Growth</h3>
           <div className="h-80 w-full">
             {verificationProgressData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={verificationProgressData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                   <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={false} tickLine={false} dx={-10} />
                   <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeDasharray: '3 3'}} />
                   <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={4} 
                    dot={{r: 0}} 
                    activeDot={{r: 6, strokeWidth: 0, fill: '#8b5cf6'}} 
                    name="Verified Voters" 
                    animationDuration={1500}
                   />
                   <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                 <span className="mb-1 font-medium">No verification data yet</span>
                 <span className="text-xs opacity-75">Chart will update as voters verify</span>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Bottom Row: Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Voters by Location</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={votingSubCountyData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} name="Verified Voters" animationDuration={1500}>
                    {votingSubCountyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(217, 91%, ${60 - index * 3}%)`} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ward Turnout Analysis</h3>
          <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wardTurnout} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barGap={0}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} dx={-10} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                 <Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop: '20px'}} />
                 <Bar dataKey="total" name="Registered" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={16} />
                 <Bar dataKey="voted" name="Votes Cast" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
