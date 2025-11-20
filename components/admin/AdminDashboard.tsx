import React, { useState } from 'react';
import { useElection } from '../../contexts/ElectionContext';
import { useAuth } from '../../contexts/AuthContext';
import { VoterManagement } from './VoterManagement';
import { CandidateManagement } from './CandidateManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AppState, Candidate, ElectionPhase, ElectionSettings, Voter } from '../../types';
import { LayoutDashboard, Users, Vote, Settings } from 'lucide-react';

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
  onDeleteVoter?: (id: string) => void;
  onUpdateSettings?: (settings: ElectionSettings) => void;
  onResetVotes?: () => void;
  onFactoryReset?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { state: ctxState, refreshData, updatePhase: ctxUpdatePhase, updateSettings: ctxUpdateSettings } = useElection();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'candidates' | 'settings'>('overview');

  // Use props if provided (Local State Mode), otherwise fall back to Context (Supabase Mode)
  const state = props.state || ctxState;
  const updatePhase = props.setPhase || ctxUpdatePhase;
  const handleLogout = props.onLogout || signOut;
  const updateSettings = props.onUpdateSettings || ctxUpdateSettings;
  
  // Derived handlers for components
  const handleRefresh = () => {
    if (props.state) {
      // No-op for local state as App.tsx handles it, or trigger a rerender if needed
    } else {
      refreshData();
    }
  };

  const handleVerifyVoter = (id: string) => props.onVoterAction && props.onVoterAction(id, 'VERIFY');
  const handleResetVoter = (id: string) => props.onVoterAction && props.onVoterAction(id, 'RESET');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">{state.phase} Phase</span>
            <Button variant="outline" onClick={handleLogout} className="h-9 text-xs">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${activeTab === 'overview' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setActiveTab('voters')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${activeTab === 'voters' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>
            <Users className="w-4 h-4" /> Voters
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${activeTab === 'candidates' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>
            <Vote className="w-4 h-4" /> Candidates
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${activeTab === 'settings' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}>
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-6 border-l-4 border-blue-500">
                 <div className="text-gray-500 text-sm">Total Voters</div>
                 <div className="text-3xl font-bold">{state.voters.length}</div>
               </Card>
               <Card className="p-6 border-l-4 border-green-500">
                 <div className="text-gray-500 text-sm">Votes Cast</div>
                 <div className="text-3xl font-bold">{state.votes.length}</div>
               </Card>
               <Card className="p-6 border-l-4 border-yellow-500">
                 <div className="text-gray-500 text-sm">Candidates</div>
                 <div className="text-3xl font-bold">{state.candidates.length}</div>
               </Card>
            </div>
            
            <Card title="Phase Control">
              <div className="p-4 flex gap-4 flex-wrap">
                <Button 
                  variant={state.phase === ElectionPhase.SETUP ? 'primary' : 'outline'} 
                  onClick={() => updatePhase(ElectionPhase.SETUP)}
                  disabled={state.phase !== ElectionPhase.SETUP && state.votes.length > 0}
                >
                  Setup
                </Button>
                <Button 
                  variant={state.phase === ElectionPhase.VERIFICATION ? 'primary' : 'outline'} 
                  onClick={() => updatePhase(ElectionPhase.VERIFICATION)}
                >
                  Verification
                </Button>
                <Button 
                  variant={state.phase === ElectionPhase.VOTING ? 'primary' : 'outline'} 
                  onClick={() => updatePhase(ElectionPhase.VOTING)}
                >
                  Voting
                </Button>
                <Button 
                  variant={state.phase === ElectionPhase.ENDED ? 'primary' : 'outline'} 
                  onClick={() => updatePhase(ElectionPhase.ENDED)}
                >
                  End Election
                </Button>
              </div>
            </Card>

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
          />
        )}

        {activeTab === 'candidates' && (
          <CandidateManagement 
            candidates={state.candidates} 
            electionPhase={state.phase} 
            onRefresh={handleRefresh} 
            onAdd={props.onAddCandidate}
            onDelete={props.onDeleteCandidate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel settings={state.settings} onUpdate={updateSettings} />
        )}
      </main>
    </div>
  );
};