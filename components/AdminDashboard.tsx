import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Users, FileCheck, Settings, AlertTriangle, Download, Search, Filter, RefreshCw, CheckCircle, BarChart2, Plus, Trash2, UserPlus, Pencil, X, AlertCircle } from 'lucide-react';
import { AppState, Candidate, ElectionPhase, VoterStatus } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SUBCOUNTIES } from '../constants';

interface AdminDashboardProps {
  state: AppState;
  setPhase: (phase: ElectionPhase) => void;
  onLogout: () => void;
  totalVoters: number;
  verifiedCount: number;
  votesCast: number;
  onVoterAction: (id: string, action: 'VERIFY' | 'RESET') => void;
  candidates: Candidate[];
  onAddCandidate: (candidate: Omit<Candidate, 'id'>) => void;
  onEditCandidate: (id: string, updates: Omit<Candidate, 'id'>) => void;
  onDeleteCandidate: (id: string) => void;
}

const STATUS_COLORS = {
  [VoterStatus.UNVERIFIED]: '#9ca3af', // gray-400
  [VoterStatus.VERIFIED]: '#fbbf24',   // amber-400
  [VoterStatus.VOTED]: '#10b981'       // emerald-500
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, 
  setPhase, 
  onLogout,
  totalVoters,
  verifiedCount,
  votesCast,
  onVoterAction,
  candidates,
  onAddCandidate,
  onEditCandidate,
  onDeleteCandidate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'voters' | 'ballot'>('overview');
  
  // Voter Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoterStatus | 'ALL'>('ALL');

  // Ballot Management State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    position: 'Chairperson',
    party: '',
    avatarUrl: '',
    subCounty: 'All'
  });

  // --- Data Calculations ---

  const voteData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.candidates.forEach(c => counts[c.id] = 0);
    state.votes.forEach(vote => {
      Object.values(vote.selections).forEach((candidateId) => {
        const id = candidateId as string;
        if (counts[id] !== undefined) counts[id]++;
      });
    });
    
    return state.candidates.map(c => ({
      name: c.name,
      votes: counts[c.id],
      position: c.position
    }));
  }, [state.votes, state.candidates]);

  const constituencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.voters.forEach(v => {
      counts[v.constituency] = (counts[v.constituency] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.voters]);

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

  const filteredVoters = state.voters.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ward.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadCSV = () => {
    const headers = ["MembershipID", "Name", "Phone", "Ward", "Constituency", "Voting Sub-County", "Status"];
    const rows = filteredVoters.map(v => 
      [v.membershipId, v.name, v.phone, v.ward, v.constituency, v.votingSubCounty || "N/A", v.status].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voter_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCandidate.name && newCandidate.position && newCandidate.party) {
      const candidateData = {
        ...newCandidate,
        avatarUrl: newCandidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(newCandidate.name)}&background=random`
      };

      if (editingId) {
        onEditCandidate(editingId, candidateData);
        setEditingId(null);
      } else {
        onAddCandidate(candidateData);
      }
      
      setNewCandidate({
        name: '',
        position: 'Chairperson',
        party: '',
        avatarUrl: '',
        subCounty: 'All'
      });
    }
  };

  const startEditing = (candidate: Candidate) => {
    setNewCandidate({
      name: candidate.name,
      position: candidate.position,
      party: candidate.party,
      avatarUrl: candidate.avatarUrl,
      subCounty: candidate.subCounty || 'All'
    });
    setEditingId(candidate.id);
  };

  const cancelEditing = () => {
    setNewCandidate({
      name: '',
      position: 'Chairperson',
      party: '',
      avatarUrl: '',
      subCounty: 'All'
    });
    setEditingId(null);
  };

  const handlePhaseChange = (newPhase: ElectionPhase) => {
    if (newPhase === state.phase) return;
    
    const messages = {
      [ElectionPhase.SETUP]: "Are you sure you want to revert to SETUP phase? Voting data will be preserved but public access will be closed.",
      [ElectionPhase.VERIFICATION]: "Start VERIFICATION phase? This will allow voters to register and verify their identity. Voting is not yet active.",
      [ElectionPhase.VOTING]: "Start VOTING phase? This will open the polls for all verified voters. Ensure candidates are finalized as modifications are disabled.",
      [ElectionPhase.ENDED]: "END ELECTION? This will close polls permanently and finalize results. This action cannot be undone."
    };

    if (window.confirm(messages[newPhase])) {
      setPhase(newPhase);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-1.5 rounded text-white">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              state.phase === ElectionPhase.VOTING 
                ? 'bg-green-50 text-green-700 border-green-200 animate-pulse' 
                : state.phase === ElectionPhase.SETUP
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : state.phase === ElectionPhase.VERIFICATION
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                state.phase === ElectionPhase.VOTING ? 'bg-green-600' : 
                state.phase === ElectionPhase.SETUP ? 'bg-purple-600' :
                state.phase === ElectionPhase.VERIFICATION ? 'bg-amber-600' : 'bg-gray-500'
              }`}></span>
              {state.phase} Phase
            </span>
            <Button variant="outline" onClick={onLogout} className="text-xs px-4 h-9">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation */}
        <div className="flex space-x-2 mb-8 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit overflow-x-auto">
          {['overview', 'analytics', 'voters', 'ballot'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-gray-900 text-white shadow-lg' 
                  : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && <FileCheck className="w-4 h-4" />}
              {tab === 'analytics' && <BarChart2 className="w-4 h-4" />}
              {tab === 'voters' && <Users className="w-4 h-4" />}
              {tab === 'ballot' && <UserPlus className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-blue-500 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Voters</p>
                    <p className="text-3xl font-bold text-gray-800">{totalVoters}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="border-l-4 border-green-500 relative overflow-hidden">
                 <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Votes Cast</p>
                    <p className="text-3xl font-bold text-gray-800">{votesCast}</p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {((votesCast / Math.max(totalVoters, 1)) * 100).toFixed(1)}% Turnout
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <FileCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="border-l-4 border-yellow-500 relative overflow-hidden">
                 <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Verified Status</p>
                    <p className="text-3xl font-bold text-gray-800">{verifiedCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalVoters - verifiedCount} Pending
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Phase Control */}
              <Card title="Election Lifecycle" className="lg:col-span-1 h-full">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Manage the current stage of the election process.</p>
                  <div className="flex flex-col space-y-3">
                    <Button 
                      variant={state.phase === ElectionPhase.SETUP ? 'primary' : 'outline'}
                      onClick={() => handlePhaseChange(ElectionPhase.SETUP)}
                      className={`justify-start relative overflow-hidden ${state.phase === ElectionPhase.SETUP ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      disabled={state.phase === ElectionPhase.SETUP}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold flex items-center"><span className="mr-2">1.</span> Setup Phase</span>
                        <span className="text-[10px] font-normal opacity-80 text-left">Configure candidates & registry. Public access closed.</span>
                      </div>
                    </Button>
                    <Button 
                      variant={state.phase === ElectionPhase.VERIFICATION ? 'primary' : 'outline'}
                      onClick={() => handlePhaseChange(ElectionPhase.VERIFICATION)}
                      className={`justify-start ${state.phase === ElectionPhase.VERIFICATION ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      disabled={state.phase === ElectionPhase.VERIFICATION}
                    >
                       <div className="flex flex-col items-start">
                        <span className="font-semibold flex items-center"><span className="mr-2">2.</span> Verification Phase</span>
                        <span className="text-[10px] font-normal opacity-80 text-left">Allow voters to verify identity. Voting closed.</span>
                      </div>
                    </Button>
                    <Button 
                      variant={state.phase === ElectionPhase.VOTING ? 'primary' : 'outline'}
                      onClick={() => handlePhaseChange(ElectionPhase.VOTING)}
                      className={`justify-start ${state.phase === ElectionPhase.VOTING ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      disabled={state.phase === ElectionPhase.VOTING}
                    >
                       <div className="flex flex-col items-start">
                        <span className="font-semibold flex items-center"><span className="mr-2">3.</span> Voting Phase</span>
                        <span className="text-[10px] font-normal opacity-80 text-left">Polls open. Live balloting active.</span>
                      </div>
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handlePhaseChange(ElectionPhase.ENDED)}
                      className="justify-start"
                      disabled={state.phase === ElectionPhase.ENDED}
                    >
                       <div className="flex flex-col items-start">
                        <span className="font-semibold flex items-center"><span className="mr-2">4.</span> End Election</span>
                        <span className="text-[10px] font-normal opacity-80 text-left">Close polls and finalize results.</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Live Results Chart */}
              <Card title="Real-time Candidate Results" className="lg:col-span-2">
                 <div className="h-72 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={voteData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#4b5563'}} />
                        <Tooltip 
                          cursor={{fill: '#f3f4f6'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="votes" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </Card>
            </div>

            {/* Recent Activity Log */}
            <Card title="Recent Activity Log">
               <div className="space-y-4">
                 {state.votes.slice(-5).reverse().map((vote, i) => (
                   <div key={vote.id} className="flex items-center space-x-3 text-sm p-2 hover:bg-gray-50 rounded transition">
                     <div className="bg-green-100 p-1.5 rounded-full">
                       <CheckCircle className="w-4 h-4 text-green-600" />
                     </div>
                     <div className="flex-1">
                       <p className="text-gray-900 font-medium">New Vote Submitted</p>
                       <p className="text-gray-500 text-xs">Hash: {vote.voterHash.substring(0, 12)}...</p>
                     </div>
                     <span className="text-gray-400 text-xs">{new Date(vote.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
                 {state.votes.length === 0 && (
                   <div className="text-center text-gray-400 py-8 text-sm">No votes recorded yet.</div>
                 )}
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
           <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verification Status Breakdown */}
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
                      <Tooltip 
                         contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Constituency Distribution */}
              <Card title="Voters by Constituency">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={constituencyData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Voters" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Ward Turnout Analysis */}
            <Card title="Ward Turnout Analysis">
              <div className="h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={wardTurnout} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                     <XAxis dataKey="name" tick={{fontSize: 12}} />
                     <YAxis />
                     <Tooltip 
                       contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                       cursor={{fill: '#f9fafb'}}
                     />
                     <Legend />
                     <Bar dataKey="total" name="Registered Voters" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                     <Bar dataKey="voted" name="Votes Cast" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Comparison of total registered voters versus actual votes cast per ward.
              </div>
            </Card>
           </div>
        )}

        {activeTab === 'voters' && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search voters..." 
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                   <select 
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                   >
                     <option value="ALL">All Statuses</option>
                     <option value={VoterStatus.UNVERIFIED}>Unverified</option>
                     <option value={VoterStatus.VERIFIED}>Verified</option>
                     <option value={VoterStatus.VOTED}>Voted</option>
                   </select>
                   <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                </div>
              </div>
              <Button variant="outline" onClick={downloadCSV} className="flex items-center gap-2 text-xs">
                 <Download className="h-3 w-3" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Voting Sub-County</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVoters.length > 0 ? filteredVoters.map(voter => (
                    <tr key={voter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{voter.membershipId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{voter.name}</div>
                        <div className="text-xs text-gray-500">{voter.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{voter.ward}</div>
                        <div className="text-xs text-gray-500">{voter.constituency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {voter.votingSubCounty ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                            {voter.votingSubCounty}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Not Selected</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full 
                          ${voter.status === VoterStatus.VOTED ? 'bg-green-100 text-green-800 border border-green-200' : 
                            voter.status === VoterStatus.VERIFIED ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                            'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                          {voter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex justify-end gap-2">
                           {voter.status === VoterStatus.UNVERIFIED && (
                             <button 
                               onClick={() => onVoterAction(voter.id, 'VERIFY')}
                               className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100"
                               title="Manually Verify"
                             >
                               <CheckCircle className="w-3 h-3" /> Verify
                             </button>
                           )}
                           {voter.status === VoterStatus.VERIFIED && (
                             <button 
                               onClick={() => onVoterAction(voter.id, 'RESET')}
                               className="text-orange-600 hover:text-orange-900 flex items-center gap-1 text-xs bg-orange-50 px-2 py-1 rounded border border-orange-100 hover:bg-orange-100"
                               title="Reset Verification Status"
                             >
                               <RefreshCw className="w-3 h-3" /> Reset
                             </button>
                           )}
                           {voter.status === VoterStatus.VOTED && (
                             <span className="text-gray-400 text-xs flex items-center justify-end gap-1 cursor-not-allowed">
                               <CheckCircle className="w-3 h-3" /> Locked
                             </span>
                           )}
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No voters found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
               <span>Showing {filteredVoters.length} of {state.voters.length} records</span>
            </div>
          </Card>
        )}

        {activeTab === 'ballot' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-1">
               <Card title={editingId ? "Edit Candidate" : "Add New Candidate"} className="sticky top-24">
                  <form onSubmit={handleAddCandidateSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                      <input 
                        type="text" 
                        required
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Full Name"
                        disabled={state.phase !== ElectionPhase.SETUP}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={newCandidate.position}
                        onChange={(e) => setNewCandidate({...newCandidate, position: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        disabled={state.phase !== ElectionPhase.SETUP}
                      >
                        <option value="Chairperson">Chairperson</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Sub-County Representative">Sub-County Representative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub-County Scope</label>
                       <select
                        value={newCandidate.subCounty}
                        onChange={(e) => setNewCandidate({...newCandidate, subCounty: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        disabled={state.phase !== ElectionPhase.SETUP}
                      >
                        <option value="All">All Sub-Counties (General)</option>
                        {SUBCOUNTIES.map(sc => (
                          <option key={sc} value={sc}>{sc}</option>
                        ))}
                      </select>
                       <p className="text-xs text-gray-500 mt-1">Select 'All' for top-level positions.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Party / Slogan</label>
                      <input 
                        type="text" 
                        required
                        value={newCandidate.party}
                        onChange={(e) => setNewCandidate({...newCandidate, party: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Political Party or Motto"
                        disabled={state.phase !== ElectionPhase.SETUP}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (Optional)</label>
                      <input 
                        type="text" 
                        value={newCandidate.avatarUrl}
                        onChange={(e) => setNewCandidate({...newCandidate, avatarUrl: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                        disabled={state.phase !== ElectionPhase.SETUP}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" fullWidth variant="primary" disabled={state.phase !== ElectionPhase.SETUP}>
                        {editingId ? (
                          <><Pencil className="w-4 h-4 mr-2" /> Update Candidate</>
                        ) : (
                          <><Plus className="w-4 h-4 mr-2" /> Add Candidate</>
                        )}
                      </Button>
                      {editingId && (
                         <Button type="button" variant="outline" onClick={cancelEditing} disabled={state.phase !== ElectionPhase.SETUP}>
                            <X className="w-4 h-4" />
                         </Button>
                      )}
                    </div>
                    
                    {state.phase !== ElectionPhase.SETUP && (
                       <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                         <AlertCircle className="w-4 h-4 flex-shrink-0" />
                         Switch to SETUP phase to modify ballot.
                       </div>
                    )}
                  </form>
               </Card>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {Array.from(new Set(candidates.map(c => c.position))).map(position => (
                <Card key={position} title={position}>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/50">
                     {candidates.filter(c => c.position === position).map(candidate => (
                       <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                          {state.phase === ElectionPhase.SETUP && (
                            <div className="absolute top-2 right-2 flex space-x-1 z-10">
                               <button 
                                 onClick={() => startEditing(candidate)}
                                 className="p-1.5 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded shadow-sm transition-colors"
                                 title="Edit"
                               >
                                 <Pencil className="w-3 h-3" />
                               </button>
                               <button 
                                 onClick={() => onDeleteCandidate(candidate.id)}
                                 className="p-1.5 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded shadow-sm transition-colors"
                                 title="Delete"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 mb-3">
                            <img src={candidate.avatarUrl} alt="" className="w-12 h-12 rounded-full bg-gray-100 object-cover border border-gray-100 flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm leading-tight truncate">{candidate.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{candidate.party}</p>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                             <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Scope</span>
                             <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${candidate.subCounty && candidate.subCounty !== 'All' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                               {candidate.subCounty || 'All'}
                             </span>
                          </div>
                       </div>
                     ))}
                   </div>
                   {candidates.filter(c => c.position === position).length === 0 && (
                     <div className="text-center text-gray-400 py-6 text-sm italic">
                       No candidates listed for {position}.
                     </div>
                   )}
                </Card>
              ))}
              {candidates.length === 0 && (
                <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-dashed border-gray-300">
                  No candidates added yet. Use the form to add candidates to the ballot.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};