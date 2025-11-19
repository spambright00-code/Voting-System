import React, { useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { VoterPortal } from './components/VoterPortal';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { AppState, Candidate, ElectionPhase, Voter, VoterStatus, Vote } from './types';
import { INITIAL_VOTERS, ADMIN_PASSWORD, MOCK_CANDIDATES, SUBCOUNTIES } from './constants';
import { Lock, ArrowRight, Smartphone, CheckSquare, AlertCircle, ClipboardCheck, ChevronLeft, MapPin } from 'lucide-react';

// Initial State
const initialState: AppState = {
  phase: ElectionPhase.SETUP, // Default to setup
  voters: INITIAL_VOTERS,
  votes: [],
  candidates: MOCK_CANDIDATES
};

type ViewState = 
  | 'HOME' 
  | 'ADMIN_LOGIN' 
  | 'ADMIN_DASH' 
  | 'REGISTRATION' 
  | 'VOTING_LOGIN' 
  | 'VOTER_PORTAL';

type FlowStep = 'ID_INPUT' | 'OTP_INPUT' | 'SUBCOUNTY_SELECT' | 'SUCCESS';

function App() {
  const [state, setState] = useState<AppState>(initialState);
  
  // Navigation State
  const [view, setView] = useState<ViewState>('HOME');
  const [step, setStep] = useState<FlowStep>('ID_INPUT');
  
  // Form State
  const [adminPassInput, setAdminPassInput] = useState('');
  const [voterIdInput, setVoterIdInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Session State
  const [activeVoter, setActiveVoter] = useState<Voter | null>(null);

  const resetForms = () => {
    setVoterIdInput('');
    setOtpInput('');
    setErrorMsg('');
    setStep('ID_INPUT');
    setActiveVoter(null);
  };

  const navigateTo = (target: ViewState) => {
    resetForms();
    setView(target);
  };

  // --- Admin Handlers ---

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_PASSWORD) {
      navigateTo('ADMIN_DASH');
      setAdminPassInput('');
    } else {
      setErrorMsg('Invalid Credentials');
    }
  };

  const handleAdminVoterAction = (id: string, action: 'VERIFY' | 'RESET') => {
    setState(prev => ({
      ...prev,
      voters: prev.voters.map(v => {
        if (v.id === id) {
          if (action === 'VERIFY') return { ...v, status: VoterStatus.VERIFIED };
          if (action === 'RESET' && v.status !== VoterStatus.VOTED) return { ...v, status: VoterStatus.UNVERIFIED, votingSubCounty: undefined };
        }
        return v;
      })
    }));
  };

  const handleAddCandidate = (newCandidate: Omit<Candidate, 'id'>) => {
    setState(prev => ({
      ...prev,
      candidates: [...prev.candidates, { ...newCandidate, id: `c_${Date.now()}` }]
    }));
  };

  const handleEditCandidate = (id: string, updates: Omit<Candidate, 'id'>) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleDeleteCandidate = (id: string) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id)
    }));
  };

  // --- Registration Handlers ---

  const handleRegistrationIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const voter = state.voters.find(v => v.membershipId.toLowerCase() === voterIdInput.toLowerCase());
    
    if (!voter) {
      setErrorMsg('Membership ID not found in the registry.');
      return;
    }

    if (voter.status !== VoterStatus.UNVERIFIED) {
      // If already verified, we allow re-verification or checking status
    }

    setActiveVoter(voter);
    setErrorMsg('');
    setStep('OTP_INPUT');
    // Simulate SMS
    console.log(`[REGISTRATION] OTP for ${voter.name}: 123456`);
    alert(`DEMO: Verification Code sent to ${voter.phone}.\nCode: 123456`);
  };

  const handleRegistrationOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === '123456') { // Mock OTP check
      if (activeVoter) {
        setStep('SUBCOUNTY_SELECT');
        setErrorMsg('');
      }
    } else {
      setErrorMsg('Invalid Verification Code');
    }
  };

  const handleSubCountySubmit = (subCounty: string) => {
    if (!activeVoter) return;

    const updatedVoter = {
      ...activeVoter,
      status: VoterStatus.VERIFIED,
      votingSubCounty: subCounty
    };

    const updatedVoters = state.voters.map(v => 
      v.id === activeVoter.id ? updatedVoter : v
    );

    setState(prev => ({ ...prev, voters: updatedVoters }));
    setActiveVoter(updatedVoter);
    setStep('SUCCESS');
  };

  // --- Voting Login Handlers ---

  const handleVotingIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const voter = state.voters.find(v => v.membershipId.toLowerCase() === voterIdInput.toLowerCase());
    
    if (!voter) {
      setErrorMsg('Membership ID not found.');
      return;
    }

    // Strict separation: Must be verified to enter voting booth
    if (voter.status === VoterStatus.UNVERIFIED) {
      setErrorMsg('Account not verified. Please complete Voter Registration first.');
      return;
    }

    setActiveVoter(voter);
    setErrorMsg('');
    setStep('OTP_INPUT');
    // Simulate SMS
    console.log(`[VOTING] OTP for ${voter.name}: 123456`);
    alert(`DEMO: Voting Access Code sent to ${voter.phone}.\nCode: 123456`);
  };

  const handleVotingOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === '123456') {
      if (activeVoter) {
        navigateTo('VOTER_PORTAL');
        // restore active voter since navigate clears it
        setActiveVoter(activeVoter); 
      }
    } else {
      setErrorMsg('Invalid Access Code');
    }
  };

  // --- Voting Submission ---

  const handleVoteSubmit = (selections: Record<string, string>) => {
    if (!activeVoter) return;

    const newVote: Vote = {
      id: `vote_${Date.now()}`,
      voterHash: btoa(activeVoter.id),
      selections,
      timestamp: Date.now()
    };

    const updatedVoters = state.voters.map(v => 
      v.id === activeVoter.id ? { ...v, status: VoterStatus.VOTED } : v
    );

    setState(prev => ({
      ...prev,
      votes: [...prev.votes, newVote],
      voters: updatedVoters
    }));

    setActiveVoter({ ...activeVoter, status: VoterStatus.VOTED });
  };

  // --- Renderers ---

  const renderHome = () => {
    const isVotingOpen = state.phase === ElectionPhase.VOTING;
    const isRegistrationOpen = state.phase === ElectionPhase.VERIFICATION;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="bg-white/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <CheckSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">SecureVote</h1>
          <p className="text-blue-200 text-lg">Teacher Welfare Association</p>
        </div>

        {state.phase === ElectionPhase.SETUP ? (
           <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center animate-fade-in">
             <div className="bg-yellow-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-300">
               <Lock className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold mb-2">Election Setup</h2>
             <p className="text-blue-200 mb-6">
               The administrator is currently configuring the ballot and voter registry. Public access is temporarily unavailable.
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Registration Card */}
            <button 
              onClick={() => isRegistrationOpen && navigateTo('REGISTRATION')}
              disabled={!isRegistrationOpen}
              className={`relative p-8 rounded-2xl text-left transition-all group border 
                ${!isRegistrationOpen ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed opacity-60' : 'bg-white text-slate-900 border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-1'}
              `}
            >
              {!isRegistrationOpen && (
                <div className="absolute top-4 right-4 bg-black/30 px-3 py-1 rounded-full text-xs font-medium text-gray-300 border border-white/10 flex items-center">
                  <Lock className="w-3 h-3 mr-1" /> Closed
                </div>
              )}
              <div className="bg-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-8 h-8 text-teal-700" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verify Registration</h2>
              <p className={isRegistrationOpen ? "text-gray-600" : "text-gray-500"}>
                Confirm your membership details and enable your account for the election.
              </p>
              <div className="mt-6 flex items-center text-teal-600 font-medium">
                {isRegistrationOpen ? (
                  <>Check Status <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <span className="text-gray-400">Active only during Verification Phase</span>
                )}
              </div>
            </button>

            {/* Voting Card */}
            <button 
              onClick={() => isVotingOpen && navigateTo('VOTING_LOGIN')}
              className={`relative p-8 rounded-2xl text-left transition-all group border
                ${!isVotingOpen 
                  ? 'bg-blue-900/40 border-blue-500/30 backdrop-blur-sm cursor-not-allowed' 
                  : 'bg-blue-600 text-white border-blue-400 shadow-xl hover:shadow-blue-500/50 hover:-translate-y-1'
                }
              `}
            >
              {!isVotingOpen && (
                <div className="absolute top-4 right-4 bg-black/30 px-3 py-1 rounded-full text-xs font-medium text-blue-200 border border-white/10 flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  {state.phase === ElectionPhase.ENDED ? 'Election Ended' : 'Voting Not Active'}
                </div>
              )}
              <div className={`${isVotingOpen ? 'bg-blue-500' : 'bg-blue-800/50'} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Smartphone className={`w-8 h-8 ${isVotingOpen ? 'text-white' : 'text-blue-300'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${!isVotingOpen && 'text-blue-100'}`}>Cast Ballot</h2>
              <p className={isVotingOpen ? "text-blue-100" : "text-blue-300"}>
                Securely cast your vote for the candidates. Voting is only available on election day.
              </p>
              <div className={`mt-6 flex items-center font-medium ${isVotingOpen ? 'text-white' : 'text-blue-400'}`}>
                {isVotingOpen ? (
                  <>Enter Booth <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <span>Wait for Voting Phase</span>
                )}
              </div>
            </button>
          </div>
        )}
        
        <div className="mt-12">
          <button 
            onClick={() => navigateTo('ADMIN_LOGIN')}
            className="flex items-center text-blue-300 hover:text-white transition-colors text-sm"
          >
            <Lock className="w-4 h-4 mr-2" /> Administrator Portal
          </button>
        </div>

        <footer className="absolute bottom-4 text-blue-400/50 text-sm">
          Powered by Mobiwave Innovations
        </footer>
      </div>
    );
  };

  const renderRegistration = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
        
        <div className="mb-6">
          <button onClick={() => navigateTo('HOME')} className="text-gray-400 hover:text-gray-600 flex items-center text-sm mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Voter Registration</h2>
          <p className="text-gray-500 text-sm mt-1">Verify your identity to participate.</p>
        </div>

        {step === 'ID_INPUT' && (
          <form onSubmit={handleRegistrationIdSubmit} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membership Number</label>
              <input 
                type="text" 
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-3 border uppercase"
                value={voterIdInput}
                onChange={(e) => setVoterIdInput(e.target.value)}
                placeholder="e.g., MEM001"
                autoFocus
              />
            </div>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            <Button type="submit" fullWidth className="bg-teal-600 hover:bg-teal-700 text-white">
              Verify Identity <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </form>
        )}

        {step === 'OTP_INPUT' && (
          <form onSubmit={handleRegistrationOtpSubmit} className="space-y-6 animate-fade-in">
             <div className="bg-teal-50 p-4 rounded-lg text-sm text-teal-800 mb-4">
              We've sent a verification code to <b>{activeVoter?.phone}</b>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input 
                type="text" 
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-3 border text-center text-2xl tracking-widest"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <Button type="submit" fullWidth className="bg-teal-600 hover:bg-teal-700 text-white">Next Step</Button>
             <button type="button" onClick={() => setStep('ID_INPUT')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">
              Change ID
            </button>
          </form>
        )}

        {step === 'SUBCOUNTY_SELECT' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2 text-center">
                Select Voting Sub-County
              </label>
              <p className="text-sm text-gray-500 text-center mb-6">
                Please choose the sub-county where you will be casting your vote.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {SUBCOUNTIES.map((sc) => (
                  <button
                    key={sc}
                    onClick={() => handleSubCountySubmit(sc)}
                    className="flex items-center justify-center p-4 rounded-xl border border-gray-200 bg-white hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 transition-all shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <MapPin className="w-4 h-4 mr-2 opacity-70" />
                    {sc}
                  </button>
                ))}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setStep('OTP_INPUT')} 
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4"
            >
              Back to Code
            </button>
          </div>
        )}

        {step === 'SUCCESS' && activeVoter && (
          <div className="text-center space-y-6 animate-fade-in py-4">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-10 h-10 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Registration Complete</h3>
              <p className="text-gray-500">You are verified and eligible to vote.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200 text-sm space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium text-gray-900">{activeVoter.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Membership ID:</span>
                <span className="font-medium text-gray-900">{activeVoter.membershipId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Voting Location:</span>
                <span className="font-bold text-teal-800">{activeVoter.votingSubCounty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-teal-600 uppercase flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" /> {activeVoter.status}
                </span>
              </div>
            </div>

            <Button fullWidth onClick={() => navigateTo('HOME')} variant="outline">
              Return to Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const renderVotingLogin = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
       <Card className="max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>

        <div className="mb-6">
          <button onClick={() => navigateTo('HOME')} className="text-gray-400 hover:text-gray-600 flex items-center text-sm mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Voter Login</h2>
          <p className="text-gray-500 text-sm mt-1">Access the ballot securely.</p>
        </div>

        {step === 'ID_INPUT' && (
          <form onSubmit={handleVotingIdSubmit} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membership Number</label>
              <input 
                type="text" 
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border uppercase"
                value={voterIdInput}
                onChange={(e) => setVoterIdInput(e.target.value)}
                placeholder="e.g., MEM001"
                autoFocus
              />
            </div>
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            <Button type="submit" fullWidth>
              Authenticate <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
            
             <div className="text-center">
              <button type="button" onClick={() => navigateTo('REGISTRATION')} className="text-sm text-blue-600 hover:underline">
                Not registered? Check your status here.
              </button>
            </div>
          </form>
        )}

        {step === 'OTP_INPUT' && (
          <form onSubmit={handleVotingOtpSubmit} className="space-y-6 animate-fade-in">
             <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
              Enter the code sent to <b>{activeVoter?.phone}</b> to unlock your ballot.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
              <input 
                type="text" 
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border text-center text-2xl tracking-widest"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <Button type="submit" fullWidth>Enter Voting Booth</Button>
            <button type="button" onClick={() => setStep('ID_INPUT')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">
              Change ID
            </button>
          </form>
        )}
      </Card>
    </div>
  );

  const renderAdminLogin = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full" title="Administrator Access">
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Access Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              placeholder="Enter admin password..."
            />
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <div className="flex flex-col gap-3">
            <Button type="submit" fullWidth>Login</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => navigateTo('HOME')}>Back</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  switch (view) {
    case 'ADMIN_LOGIN': return renderAdminLogin();
    case 'ADMIN_DASH': 
      return <AdminDashboard 
        state={state} 
        setPhase={(p) => setState(prev => ({ ...prev, phase: p }))}
        onLogout={() => navigateTo('HOME')}
        totalVoters={state.voters.length}
        verifiedCount={state.voters.filter(v => v.status !== VoterStatus.UNVERIFIED).length}
        votesCast={state.votes.length}
        onVoterAction={handleAdminVoterAction}
        candidates={state.candidates}
        onAddCandidate={handleAddCandidate}
        onEditCandidate={handleEditCandidate}
        onDeleteCandidate={handleDeleteCandidate}
      />;
    case 'REGISTRATION': return renderRegistration();
    case 'VOTING_LOGIN': return renderVotingLogin();
    case 'VOTER_PORTAL': 
      return activeVoter ? (
        <VoterPortal 
          voter={activeVoter} 
          electionPhase={state.phase} 
          onVoteSubmit={handleVoteSubmit}
          onLogout={() => navigateTo('HOME')} 
          candidates={state.candidates}
        />
      ) : renderVotingLogin();
    default: return renderHome();
  }
}

export default App;