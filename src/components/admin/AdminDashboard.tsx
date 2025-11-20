
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
import { LayoutDashboard, Users, Vote, Settings, AlertTriangle, LogOut, Activity, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/50 pb-20 relative font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm shadow-indigo-600/20">
               <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">MobiPoll Admin</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
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
              {state.phase} Phase
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <Button variant="secondary" onClick={handleLogout} className="h-9 text-xs px-4 bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
              <LogOut className="w-3 h-3 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs Navigation */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
           <nav className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'voters', label: 'Voters Registry', icon: Users },
              { id: 'candidates', label: 'Candidates', icon: Vote },
              { id: 'settings', label: 'Configuration', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative flex items-center px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                `}
              >
                <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
           </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-medium text-slate-500 mb-1">Total Voters</p>
                         <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{state.voters.length}</h3>
                       </div>
                       <div className="p-3 bg-blue-50 rounded-xl">
                         <Users className="w-6 h-6 text-blue-600" />
                       </div>
                     </div>
                     <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
                       <CheckCircle className="w-3 h-3 mr-1 text-blue-500" />
                       <span>Registered Members</span>
                     </div>
                  </Card>

                  <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-medium text-slate-500 mb-1">Votes Cast</p>
                         <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{state.votes.length}</h3>
                       </div>
                       <div className="p-3 bg-emerald-50 rounded-xl">
                         <Vote className="w-6 h-6 text-emerald-600" />
                       </div>
                     </div>
                     <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
                       <span className="text-slate-600 font-semibold">
                         {totalVoters > 0 ? Math.round((state.votes.length / totalVoters) * 100) : 0}%
                       </span>
                       <span className="ml-1">turnout</span>
                     </div>
                  </Card>

                  <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-sm font-medium text-slate-500 mb-1">Candidates</p>
                         <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{state.candidates.length}</h3>
                       </div>
                       <div className="p-3 bg-amber-50 rounded-xl">
                         <Vote className="w-6 h-6 text-amber-600" />
                       </div>
                     </div>
                     <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
                        <span>Across {new Set(state.candidates.map(c => c.position)).size} positions</span>
                     </div>
                  </Card>
              </div>

              {/* Phase Control */}
              <Card title="Election Lifecycle Control" description="Manage the current state of the election system.">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {[
                    { phase: ElectionPhase.SETUP, label: 'Setup', desc: 'Config & Data' },
                    { phase: ElectionPhase.VERIFICATION, label: 'Verification', desc: 'Registration' },
                    { phase: ElectionPhase.VOTING, label: 'Voting', desc: 'Polls Open' },
                    { phase: ElectionPhase.ENDED, label: 'Ended', desc: 'Results' }
                  ].map((item) => {
                    const isActive = state.phase === item.phase;
                    const isDisabled = item.phase === ElectionPhase.SETUP && state.votes.length > 0;
                    
                    return (
                      <button
                        key={item.phase}
                        onClick={() => handlePhaseClick(item.phase)}
                        disabled={isDisabled}
                        className={`
                          relative group flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${isActive 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                            : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'}
                          ${isDisabled ? 'opacity-40 cursor-not-allowed hover:border-slate-100 hover:bg-white' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                           <span className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                             {item.label}
                           </span>
                           {isActive && <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse shadow-lg shadow-indigo-500/50" />}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-indigo-600/80' : 'text-slate-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                 </div>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Progress Section */}
                 <Card title="Verification Progress" description="Verified voters ready to vote">
                    <div className="flex items-center justify-center py-8">
                       <div className="relative h-48 w-48">
                         <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                           <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                           <circle 
                              className="text-indigo-600 transition-all duration-1000 ease-out" 
                              strokeWidth="8" 
                              strokeDasharray={263.8}
                              strokeDashoffset={263.8 - (263.8 * progressPercent) / 100}
                              strokeLinecap="round"
                              stroke="currentColor" 
                              fill="transparent" 
                              r="42" 
                              cx="50" 
                              cy="50" 
                           />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-slate-900 tracking-tight">{progressPercent}%</span>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified</span>
                         </div>
                       </div>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-100 pt-4 bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6 mt-2">
                        <div>
                          <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Verified</p>
                          <p className="font-bold text-slate-900 text-xl">{verifiedCount}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Total Registry</p>
                           <p className="font-bold text-slate-900 text-xl">{totalVoters}</p>
                        </div>
                    </div>
                 </Card>

                 {/* Quick Health */}
                 <Card title="System Health" description="Status of critical components">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-emerald-50/80 rounded-xl border border-emerald-100/80">
                          <div className="flex items-center gap-3">
                             <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" />
                             <div>
                               <p className="text-sm font-bold text-emerald-900">Operational</p>
                               <p className="text-xs text-emerald-700">All systems nominal</p>
                             </div>
                          </div>
                          <span className="text-xs text-emerald-700 font-bold bg-white/50 px-2 py-1 rounded">100% Uptime</span>
                       </div>
                       
                       <div className="mt-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="text-xs justify-start h-10" onClick={() => setActiveTab('voters')}>
                              <Users className="w-3 h-3 mr-2" /> Manage Voters
                            </Button>
                            <Button variant="outline" className="text-xs justify-start h-10" onClick={() => setActiveTab('settings')}>
                              <Settings className="w-3 h-3 mr-2" /> View Logs
                            </Button>
                          </div>
                       </div>
                    </div>
                 </Card>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">
                Switch to {phaseConfirm}?
              </h3>
              <p className="text-slate-500 text-sm mb-6 text-center leading-relaxed">
                {getPhaseDescription(phaseConfirm)}
              </p>
              
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 mb-2 font-medium">
                This action will immediately update the application state for all users.
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
              <Button variant="outline" onClick={() => setPhaseConfirm(null)} className="bg-white">
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmPhaseChange} className="bg-slate-900 hover:bg-slate-800">
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
