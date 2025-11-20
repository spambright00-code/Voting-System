import React, { useMemo } from 'react';
import { AppState, VoterStatus } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  state: AppState;
}

const STATUS_COLORS = {
  [VoterStatus.UNVERIFIED]: '#cbd5e1', // Slate 300
  [VoterStatus.VERIFIED]: '#fbbf24', // Amber 400
  [VoterStatus.VOTED]: '#10b981' // Emerald 500
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
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-gray-800 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value}
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
        <Card title="Voter Status Distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {verificationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Verification Growth">
           <div className="h-80 w-full">
             {verificationProgressData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={verificationProgressData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                   <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                   <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeDasharray: '3 3'}} />
                   <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} 
                    activeDot={{r: 6, strokeWidth: 0}} 
                    name="Verified Voters" 
                   />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                 <span className="mb-1">No verification data yet</span>
                 <span className="text-xs opacity-75">Chart will update as voters verify</span>
               </div>
             )}
           </div>
        </Card>
      </div>

      {/* Bottom Row: Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Voters by Location (Sub-County)">
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={votingSubCountyData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24} name="Verified Voters" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>

        <Card title="Ward Turnout Analysis">
          <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wardTurnout} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                 <Legend iconType="circle" />
                 <Bar dataKey="total" name="Registered" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                 <Bar dataKey="voted" name="Votes Cast" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};