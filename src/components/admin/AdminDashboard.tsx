
import React, { useState } from 'react';
import { useElection } from '../../contexts/ElectionContext';
import { useAuth } from '../../contexts/AuthContext';
import { VoterManagement } from './VoterManagement';
import { CandidateManagement } from './CandidateManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { AppState, Candidate, ElectionPhase, ElectionSettings, Voter } from '../../../types';
import { LayoutDashboard, Users, Vote, Settings, AlertTriangle, LogOut, Activity, CheckCircle, BarChart3, Layers } from 'lucide-react';

interface AdminDashboardProps {
  state?: AppState;
  setPhase?: (phase: ElectionPhase) => void;
  onLogout?: () => void;
  totalVoters?: number;
  verifiedCount?: number;
  votesCast?: number;
  onVoterAction?: (id: string, action: 'VERIFY' | 'RESET') => void;
  candidates?: Candidate[];
  onAddCandidate?: (candidate: Omit<Candidate, 'id'>) => void;
  onEditCandidate?: (id: string, updates: Omit<Candidate, 'id'>) => void;
  onDeleteCandidate?: (id: string) => void;
  onAddVoter?: (voter: Omit<Voter, 'id' | 'status'>) => void;
  onBulkAddVoters?: (voters: Omit<Voter, 'id' | 'status'>[]) => void;
  onEditVoter?: (id: string, updates: Partial<Voter>) => void;
  onDeleteVoter?: (id: string) => void;
  onUpdateSettings?: (settings: ElectionSettings) => void;
  onResetVotes?: () => void;
  onFactoryReset?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { state: ctxState, refreshData, updatePhase: ctxUpdatePhase, updateSettings: ctxUpdateSettings } = useElection();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'candidates' | 'settings'>('overview');
  const [phaseConfirm, setPhaseConfirm] = useState<ElectionPhase | null>(null);

  // Use props if provided (Local State Mode), otherwise fall back to Context (Supabase Mode)
  const state = props.state || ctxState;
  const updatePhase = props.setPhase || ctxUpdatePhase;
  const handleLogout = props.onLogout || signOut;
  
  const updateSettings = async (settings: ElectionSettings) => {
    if (props.onUpdateSettings) {
      props.onUpdateSettings(settings);
    } else {
      await ctxUpdateSettings(settings);
    }
  };
  
  const handleRefresh = () => {
    if (props.state) {
      // No-op for local state
    } else {
      refreshData();
    }
  };

  const handleVerifyVoter = (id: string) => props.onVoterAction && props.onVoterAction(id, 'VERIFY');
  const handleResetVoter = (id: string) => props.onVoterAction && props.onVoterAction(id, 'RESET');

  const getPhaseDescription = (phase: ElectionPhase) => {
    switch(phase) {
      case ElectionPhase.SETUP: return "System configuration mode. Public access is restricted.";
      case ElectionPhase.VERIFICATION: return "Registration period. Voters can verify their identity.";
      case ElectionPhase.VOTING: return "Polls are open! Voters can log in and cast their ballots.";
      case ElectionPhase.ENDED: return "Election closed. Results are finalized.";
      default: return "";
    }
  };

  const handlePhaseClick = (phase: ElectionPhase) => {
     if (phase === state.phase) return;
     if (phase === ElectionPhase.SETUP && state.votes.length > 0) {
       alert("Cannot return to SETUP phase while votes exist. Please reset votes first.");
       return;
     }
     setPhaseConfirm(phase);
  };

  const confirmPhaseChange = () => {
     if (phaseConfirm) {
       updatePhase(phaseConfirm);
       setPhaseConfirm(null);
     }
  };

  const totalVoters = props.totalVoters || state.voters.length;
  const verifiedCount = props.verifiedCount || state.voters.filter(v => v.status !== 'UNVERIFIED').length;
  const progressPercent = totalVoters > 0 ? Math.round((verifiedCount / totalVoters) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 relative font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-30 border-b border-white/50 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
               <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">MobiPoll <span className="text-slate-400 font-medium">Admin</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
              state.phase === ElectionPhase.VOTING ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              state.phase === ElectionPhase.ENDED ? 'bg-slate-100 text-slate-600 border-slate-200' : 
              state.phase === ElectionPhase.SETUP ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                state.phase === ElectionPhase.VOTING ? 'bg-emerald-500 animate-pulse' : 
                state.phase === ElectionPhase.ENDED ? 'bg-slate-500' : 
                state.phase === ElectionPhase.SETUP ? 'bg-amber-500' :
                'bg-blue-500'
              }`}></span>
              {state.phase}
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <Button variant="secondary" onClick={handleLogout} className="h-9 text-xs px-4 bg-white hover:bg-slate-50 border-slate-200 shadow-sm rounded-lg">
              <LogOut className="w-3 h-3 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs Navigation */}
        <div className="mb-8 flex justify-center sm:justify-start overflow-x-auto pb-2 no-scrollbar">
           <nav className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 gap-1">
            {[
              { id: 'overview', label: 'Dashboard', icon: Activity },
              { id: 'voters', label: 'Voters Registry', icon: Users },
              { id: 'candidates', label: 'Candidates', icon: Vote },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-100' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 scale-95 hover:scale-100'}
                `}
              >
                <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-white' : 'text-current opacity-70'}`} />
                {tab.label}
              </button>
            ))}
           </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/20 transition-transform hover:scale-[1.02] duration-300 group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24 transform rotate-12" />
                     </div>
                     <div className="relative z-10">
                       <p className="text-blue-100 font-medium mb-1">Total Voters</p>
                       <h3 className="text-4xl font-black tracking-tight">{state.voters.length}</h3>
                       <div className="mt-4 flex items-center text-sm font-medium text-blue-100 bg-blue-600/40 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-blue-400/30">
                         <CheckCircle className="w-4 h-4 mr-1.5" />
                         <span>Registered Members</span>
                       </div>
                     </div>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-transform hover:scale-[1.02] duration-300 group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Vote className="w-24 h-24 transform -rotate-12" />
                     </div>
                     <div className="relative z-10">
                       <p className="text-emerald-100 font-medium mb-1">Votes Cast</p>
                       <h3 className="text-4xl font-black tracking-tight">{state.votes.length}</h3>
                       <div className="mt-4 flex items-center text-sm font-medium text-emerald-100 bg-emerald-600/40 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-emerald-400/30">
                         <Activity className="w-4 h-4 mr-1.5" />
                         <span>
                           {totalVoters > 0 ? Math.round((state.votes.length / totalVoters) * 100) : 0}% Turnout
                         </span>
                       </div>
                     </div>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-purple-500/20 transition-transform hover:scale-[1.02] duration-300 group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-24 h-24 transform rotate-6" />
                     </div>
                     <div className="relative z-10">
                       <p className="text-purple-100 font-medium mb-1">Candidates</p>
                       <h3 className="text-4xl font-black tracking-tight">{state.candidates.length}</h3>
                       <div className="mt-4 flex items-center text-sm font-medium text-purple-100 bg-purple-600/40 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-purple-400/30">
                          <span>Across {new Set(state.candidates.map(c => c.position)).size} Positions</span>
                       </div>
                     </div>
                  </div>
              </div>

              {/* Phase Control */}
              <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
                 <div className="flex items-center mb-4 gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                       <Settings className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900">Election Lifecycle</h3>
                       <p className="text-xs text-slate-500">Manage the current state of the system</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { phase: ElectionPhase.SETUP, label: 'Setup', desc: 'Config & Data', color: 'amber' },
                    { phase: ElectionPhase.VERIFICATION, label: 'Verification', desc: 'Registration', color: 'blue' },
                    { phase: ElectionPhase.VOTING, label: 'Voting', desc: 'Polls Open', color: 'emerald' },
                    { phase: ElectionPhase.ENDED, label: 'Ended', desc: 'Results', color: 'slate' }
                  ].map((item) => {
                    const isActive = state.phase === item.phase;
                    const isDisabled = item.phase === ElectionPhase.SETUP && state.votes.length > 0;
                    
                    return (
                      <button
                        key={item.phase}
                        onClick={() => handlePhaseClick(item.phase)}
                        disabled={isDisabled}
                        className={`
                          relative group flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-300
                          ${isActive 
                            ? `border-${item.color}-500 bg-${item.color}-50 shadow-lg shadow-${item.color}-500/10` 
                            : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'}
                          ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                           <span className={`text-sm font-bold ${isActive ? `text-${item.color}-700` : 'text-slate-700'}`}>
                             {item.label}
                           </span>
                           {isActive && <span className={`h-2.5 w-2.5 rounded-full bg-${item.color}-500 animate-pulse shadow-[0_0_10px] shadow-${item.color}-500`} />}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? `text-${item.color}-600/80` : 'text-slate-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Progress Section */}
                 <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 relative z-10">Verification Progress</h3>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50" />
                    
                    <div className="flex items-center justify-center py-2 relative z-10">
                       <div className="relative h-56 w-56">
                         <svg className="h-full w-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                           <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                           <circle 
                              className="text-indigo-600 transition-all duration-1000 ease-out" 
                              strokeWidth="10" 
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                              strokeLinecap="round"
                              stroke="currentColor" 
                              fill="transparent" 
                              r="40" 
                              cx="50" 
                              cy="50" 
                           />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900 tracking-tight">{progressPercent}%</span>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified</span>
                         </div>
                       </div>
                    </div>
                    <div className="flex justify-between text-sm bg-slate-50/80 backdrop-blur-sm rounded-2xl p-4 mt-4 border border-slate-100">
                        <div>
                          <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Verified</p>
                          <p className="font-bold text-slate-900 text-2xl">{verifiedCount}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Total Registry</p>
                           <p className="font-bold text-slate-900 text-2xl">{totalVoters}</p>
                        </div>
                    </div>
                 </div>

                 {/* Quick Health / Stats */}
                 <div className="space-y-6">
                   <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-xl shadow-slate-200/50">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">System Health</h3>
                       <div className="flex items-center justify-between p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-4">
                             <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
                             <div>
                               <p className="text-sm font-bold text-emerald-900">Operational</p>
                               <p className="text-xs text-emerald-700">All systems nominal</p>
                             </div>
                          </div>
                          <span className="text-xs text-emerald-700 font-bold bg-white/60 px-3 py-1.5 rounded-lg shadow-sm">100% Uptime</span>
                       </div>
                   </div>

                   <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition-all group" onClick={() => setActiveTab('voters')}>
                          <Users className="w-5 h-5 mb-2 text-blue-300 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold block">Manage Voters</span>
                        </button>
                        <button className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition-all group" onClick={() => setActiveTab('settings')}>
                          <BarChart3 className="w-5 h-5 mb-2 text-purple-300 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold block">View Logs</span>
                        </button>
                      </div>
                   </div>
                 </div>
              </div>

              <AnalyticsDashboard state={state} />
            </div>
          )}

          {activeTab === 'voters' && (
            <VoterManagement 
              voters={state.voters} 
              electionPhase={state.phase} 
              onRefresh={handleRefresh}
              onVerify={props.onVoterAction ? handleVerifyVoter : undefined}
              onReset={props.onVoterAction ? handleResetVoter : undefined}
              onDelete={props.onDeleteVoter}
              onAdd={props.onAddVoter}
              onEdit={props.onEditVoter}
              onBulkImport={props.onBulkAddVoters}
            />
          )}

          {activeTab === 'candidates' && (
            <CandidateManagement 
              candidates={state.candidates} 
              electionPhase={state.phase} 
              onRefresh={handleRefresh} 
              onAdd={props.onAddCandidate}
              onEdit={props.onEditCandidate}
              onDelete={props.onDeleteCandidate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel settings={state.settings} onUpdate={updateSettings} />
          )}
        </div>
      </main>

      {/* Phase Change Confirmation Modal */}
      {phaseConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform scale-100 transition-all">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 mx-auto border border-amber-100 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Switch to {phaseConfirm}?
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">
                {getPhaseDescription(phaseConfirm)}
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => setPhaseConfirm(null)} className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button variant="primary" onClick={confirmPhaseChange} className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
