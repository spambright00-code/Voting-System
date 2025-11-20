import React, { useMemo } from 'react';
import { AppState, VoterStatus } from '../../types';
import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface AnalyticsProps {
  state: AppState;
}

const STATUS_COLORS = {
  [VoterStatus.UNVERIFIED]: '#9ca3af',
  [VoterStatus.VERIFIED]: '#fbbf24',
  [VoterStatus.VOTED]: '#10b981'
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
      const key = v.votingSubCounty || 'Pending Selection';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.voters]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Voter Verification Status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {verificationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Voters by Voting Location">
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={votingSubCountyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                 <Tooltip cursor={{fill: '#f3f4f6'}} />
                 <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} name="Voters" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>
      </div>

      <Card title="Ward Turnout Analysis">
        <div className="h-72 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={wardTurnout} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
               <XAxis dataKey="name" tick={{fontSize: 12}} />
               <YAxis />
               <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{fill: '#f9fafb'}} />
               <Legend />
               <Bar dataKey="total" name="Registered Voters" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
               <Bar dataKey="voted" name="Votes Cast" fill="#3b82f6" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};