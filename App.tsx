
import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './src/components/admin/AdminDashboard';
import { VoterPortal } from './components/VoterPortal';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { OtpInput } from './components/ui/OtpInput';
import { OtpTimer } from './components/ui/OtpTimer';
import { AppState, Candidate, ElectionPhase, Voter, VoterStatus, Vote, ElectionSettings } from './types';
import { INITIAL_VOTERS, ADMIN_PASSWORD, MOCK_CANDIDATES, SUBCOUNTIES } from './constants';
import { Lock, ArrowRight, Smartphone, CheckSquare, AlertCircle, ClipboardCheck, ChevronLeft, MapPin, RefreshCw, ShieldCheck, CheckCircle, Vote as VoteIcon } from 'lucide-react';
import { generateOTP, sendSMS } from './src/services/smsService';

// Initial State
const initialState: AppState = {
  phase: ElectionPhase.SETUP,
  voters: INITIAL_VOTERS,
  votes: [],
  candidates: MOCK_CANDIDATES,
  settings: {
    electionTitle: 'SecureVote',
    organizationName: 'Teacher Welfare Association',
    smsSenderId: 'MobiPoll',
    enableAutoSchedule: false
  }
};

type ViewState = 
  | 'HOME' 
  | 'ADMIN_LOGIN' 
  | 'ADMIN_DASH' 
  | 'REGISTRATION' 
  | 'VOTING_LOGIN' 
  | 'VOTER_PORTAL';

type FlowStep = 'ID_INPUT' | 'OTP_INPUT' | 'SUBCOUNTY_SELECT' | 'SUCCESS';

// Constants
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  
  // Session State
  const [activeVoter, setActiveVoter] = useState<Voter | null>(null);

  // --- Automation Logic ---
  useEffect(() => {
    if (!state.settings.enableAutoSchedule) return;

    const checkSchedule = () => {
      const now = new Date().toISOString();
      const { verificationStartTime, verificationEndTime, votingStartTime, votingEndTime } = state.settings;
      
      let newPhase = state.phase;
      
      if (votingEndTime && now >= votingEndTime) {
        newPhase = ElectionPhase.ENDED;
      } else if (votingStartTime && now >= votingStartTime) {
        newPhase = ElectionPhase.VOTING;
      } else if (verificationStartTime && now >= verificationStartTime) {
        if (verificationEndTime && now >= verificationEndTime) {
          newPhase = ElectionPhase.SETUP;
        } else {
          newPhase = ElectionPhase.VERIFICATION;
        }
      } else {
        newPhase = ElectionPhase.SETUP;
      }

      if (newPhase !== state.phase) {
        setState(prev => ({ ...prev, phase: newPhase }));
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 10000);
    return () => clearInterval(interval);
  }, [state.settings.enableAutoSchedule, state.settings.verificationStartTime, state.settings.verificationEndTime, state.settings.votingStartTime, state.settings.votingEndTime, state.phase]);

  const resetForms = () => {
    setVoterIdInput('');
    setOtpInput('');
    setErrorMsg('');
    setStep('ID_INPUT');
    setActiveVoter(null);
    setIsSendingOtp(false);
    setOtpExpired(false);
  };

  const navigateTo = (target: ViewState) => {
    resetForms();
    setView(target);
  };

  // --- Admin Handlers ---

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Using import.meta.env for Vite compatibility (fallback handled in constants.ts)
    const envPassword = ADMIN_PASSWORD;
    
    if (adminPassInput === envPassword) {
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
          if (action === 'VERIFY') return { ...v, status: VoterStatus.VERIFIED, verifiedAt: new Date().toISOString() };
          if (action === 'RESET' && v.status !== VoterStatus.VOTED) return { ...v, status: VoterStatus.UNVERIFIED, votingSubCounty: undefined, verifiedAt: undefined };
        }
        return v;
      })
    }));
  };

  const handleAddVoter = (voterData: Omit<Voter, 'id' | 'status'>) => {
    const newVoter: Voter = {
      ...voterData,
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: VoterStatus.UNVERIFIED
    };
    setState(prev => ({ ...prev, voters: [...prev.voters, newVoter] }));
  };

  const handleEditVoter = (id: string, updates: Partial<Voter>) => {
    setState(prev => ({
      ...prev,
      voters: prev.voters.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  };

  const handleBulkAddVoters = (votersData: Omit<Voter, 'id' | 'status'>[]) => {
     const newVoters = votersData.map((v, idx) => ({
       ...v,
       id: `v_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
       status: VoterStatus.UNVERIFIED
     }));
     setState(prev => ({ ...prev, voters: [...prev.voters, ...newVoters] }));
  };

  const handleDeleteVoter = (id: string) => {
    setState(prev => ({
      ...prev,
      voters: prev.voters.filter(v => v.id !== id)
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

  const handleUpdateSettings = (newSettings: ElectionSettings) => {
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  const handleResetVotes = () => {
    setState(prev => ({
      ...prev,
      votes: [],
      voters: prev.voters.map(v => 
        v.status === VoterStatus.VOTED ? { ...v, status: VoterStatus.VERIFIED } : v
      )
    }));
  };

  const handleFactoryReset = () => {
    setState(initialState);
  };

  // --- Registration Handlers ---

  const handleRegistrationIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const voter = state.voters.find(v => v.membershipId.toLowerCase() === voterIdInput.toLowerCase());
    
    if (!voter) {
      setErrorMsg('Membership ID not found in the registry.');
      return;
    }

    await sendOtpToVoter(voter);
  };

  const sendOtpToVoter = async (voter: Voter) => {
    setIsSendingOtp(true);
    setOtpExpired(false);
    setErrorMsg('');

    const otp = generateOTP();
    const otpTimestamp = Date.now();

    const updatedVoter = { ...voter, otp, otpTimestamp };
    
    setState(prev => ({
      ...prev,
      voters: prev.voters.map(v => v.id === voter.id ? updatedVoter : v)
    }));
    
    setActiveVoter(updatedVoter);

    await sendSMS({
      phone: voter.phone,
      message: `Your Verification Code for ${state.settings.electionTitle} is: ${otp}. Valid for 5 minutes.`,
      settings: state.settings
    });

    setIsSendingOtp(false);
    setStep('OTP_INPUT');
  };

  const handleResendOtp = async () => {
    if (activeVoter) {
      setOtpInput('');
      setOtpExpired(false);
      await sendOtpToVoter(activeVoter);
    }
  };

  const handleRegistrationOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeVoter || !activeVoter.otp) {
      setErrorMsg("Session expired. Please start again.");
      return;
    }

    if (otpExpired) {
      setErrorMsg('Verification Code has expired. Please request a new one.');
      return;
    }

    const now = Date.now();
    const generatedTime = activeVoter.otpTimestamp || 0;

    if (now - generatedTime > OTP_EXPIRY_MS) {
      setErrorMsg('Verification Code has expired. Please request a new one.');
      setOtpExpired(true);
      return;
    }

    if (otpInput === activeVoter.otp) { 
      setStep('SUBCOUNTY_SELECT');
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid Verification Code. Please try again.');
    }
  };

  const handleSubCountySubmit = (subCounty: string) => {
    if (!activeVoter) return;

    const updatedVoter = {
      ...activeVoter,
      status: VoterStatus.VERIFIED,
      votingSubCounty: subCounty,
      verifiedAt: new Date().toISOString(),
      otp: undefined,
      otpTimestamp: undefined
    };

    const updatedVoters = state.voters.map(v => 
      v.id === activeVoter.id ? updatedVoter : v
    );

    setState(prev => ({ ...prev, voters: updatedVoters }));
    setActiveVoter(updatedVoter);
    setStep('SUCCESS');
  };

  // --- Voting Login Handlers ---

  const handleVotingIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const voter = state.voters.find(v => v.membershipId.toLowerCase() === voterIdInput.toLowerCase());
    
    if (!voter) {
      setErrorMsg('Membership ID not found.');
      return;
    }

    if (voter.status === VoterStatus.UNVERIFIED) {
      setErrorMsg('Account not verified. Please complete Voter Registration first.');
      return;
    }

    await sendVotingOtp(voter);
  };

  const sendVotingOtp = async (voter: Voter) => {
    setIsSendingOtp(true);
    setOtpExpired(false);
    setErrorMsg('');

    const otp = generateOTP();
    const otpTimestamp = Date.now();

    const updatedVoter = { ...voter, otp, otpTimestamp };
    setState(prev => ({
      ...prev,
      voters: prev.voters.map(v => v.id === voter.id ? updatedVoter : v)
    }));
    setActiveVoter(updatedVoter);

    await sendSMS({
      phone: voter.phone,
      message: `SECURE LOGIN: Your Access Code for voting is ${otp}. Valid for 5 minutes.`,
      settings: state.settings
    });

    setIsSendingOtp(false);
    setStep('OTP_INPUT');
  };

  const handleResendVotingOtp = async () => {
     if (activeVoter) {
       setOtpInput('');
       setOtpExpired(false);
       await sendVotingOtp(activeVoter);
     }
  };

  const handleVotingOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeVoter || !activeVoter.otp) {
      setErrorMsg("Session expired.");
      return;
    }

    if (otpExpired) {
      setErrorMsg('Access Code has expired. Please request a new one.');
      return;
    }

    const now = Date.now();
    const generatedTime = activeVoter.otpTimestamp || 0;

    if (now - generatedTime > OTP_EXPIRY_MS) {
      setErrorMsg('Access Code has expired. Please request a new one.');
      setOtpExpired(true);
      return;
    }

    if (otpInput === activeVoter.otp) {
      const securedVoter = { ...activeVoter, otp: undefined, otpTimestamp: undefined };
      
      setState(prev => ({
        ...prev,
        voters: prev.voters.map(v => v.id === activeVoter.id ? securedVoter : v)
      }));
      
      setActiveVoter(securedVoter);
      navigateTo('VOTER_PORTAL');
      setActiveVoter(securedVoter); 
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent)] pointer-events-none"></div>
        </div>

        <div className="relative z-10 text-center mb-16 animate-fade-in w-full max-w-3xl">
          <div className="bg-white/10 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-900/50 ring-1 ring-white/20">
            <ShieldCheck className="w-12 h-12 text-white drop-shadow-md" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-50 to-blue-200 drop-shadow-sm">
            {state.settings.electionTitle}
          </h1>
          <p className="text-blue-200 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            {state.settings.organizationName}
          </p>
        </div>

        {state.phase === ElectionPhase.SETUP ? (
           <div className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 text-center animate-fade-in shadow-2xl">
             <div className="bg-amber-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-300 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
               <Lock className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-bold mb-3 text-white">System Maintenance</h2>
             <p className="text-blue-200/70 mb-0 leading-relaxed font-light">
               The election system is currently being configured by administrators. Please check back later.
             </p>
           </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
            {/* Registration Card */}
            <button 
              onClick={() => isRegistrationOpen && navigateTo('REGISTRATION')}
              disabled={!isRegistrationOpen}
              className={`
                relative p-8 rounded-[2rem] text-left transition-all duration-300 group border overflow-hidden flex flex-col h-full
                ${!isRegistrationOpen 
                  ? 'bg-slate-800/40 border-white/5 cursor-not-allowed opacity-60' 
                  : 'bg-white/90 backdrop-blur-lg border-white/40 shadow-xl hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 hover:bg-white'}
              `}
            >
              {!isRegistrationOpen && (
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 border border-white/5 flex items-center uppercase tracking-wider">
                  <Lock className="w-3 h-3 mr-1.5" /> Closed
                </div>
              )}
              <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <ClipboardCheck className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isRegistrationOpen ? 'text-slate-900' : 'text-slate-400'}`}>Verify Registration</h2>
              <p className={`text-base leading-relaxed mb-8 flex-grow ${isRegistrationOpen ? 'text-slate-600' : 'text-slate-500'}`}>
                Confirm your membership details and enable your account for the upcoming election.
              </p>
              <div className={`flex items-center font-bold tracking-wide mt-auto ${isRegistrationOpen ? 'text-teal-700' : 'text-slate-600'}`}>
                {isRegistrationOpen ? (
                  <>Check Status <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <span className="font-medium text-sm opacity-80">Active during Verification Phase</span>
                )}
              </div>
            </button>

            {/* Voting Card */}
            <button 
              onClick={() => isVotingOpen && navigateTo('VOTING_LOGIN')}
              disabled={!isVotingOpen}
              className={`
                relative p-8 rounded-[2rem] text-left transition-all duration-300 group border overflow-hidden flex flex-col h-full
                ${!isVotingOpen 
                  ? 'bg-blue-900/20 border-blue-400/10 backdrop-blur-sm cursor-not-allowed' 
                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/30 shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1'}
              `}
            >
              {!isVotingOpen && (
                <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-blue-200 border border-white/10 flex items-center uppercase tracking-wider">
                  <Lock className="w-3 h-3 mr-1.5" /> 
                  {state.phase === ElectionPhase.ENDED ? 'Ended' : 'Wait'}
                </div>
              )}
              <div className={`${isVotingOpen ? 'bg-white/20' : 'bg-blue-800/30'} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg backdrop-blur-sm`}>
                <VoteIcon className={`w-8 h-8 ${isVotingOpen ? 'text-white' : 'text-blue-300'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${!isVotingOpen && 'text-blue-200'}`}>Cast Ballot</h2>
              <p className={`text-base leading-relaxed mb-8 flex-grow ${isVotingOpen ? 'text-blue-50' : 'text-blue-300/70'}`}>
                Securely cast your vote. Voting is available only on election day.
              </p>
              <div className={`flex items-center font-bold tracking-wide mt-auto ${isVotingOpen ? 'text-white' : 'text-blue-400/60'}`}>
                {isVotingOpen ? (
                  <>Enter Booth <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <span className="font-medium text-sm opacity-80">Wait for Voting Phase</span>
                )}
              </div>
            </button>
          </div>
        )}
        
        <div className="mt-16 relative z-10">
          <button 
            onClick={() => navigateTo('ADMIN_LOGIN')}
            className="flex items-center text-blue-300/40 hover:text-white transition-all text-xs uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <Lock className="w-3 h-3 mr-2" /> Administrator Portal
          </button>
        </div>

        <footer className="absolute bottom-6 text-blue-400/20 text-[10px] font-bold tracking-[0.2em] uppercase select-none">
          Secured by MobiWave
        </footer>
      </div>
    );
  };

  const renderRegistration = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-50">
        <div className="absolute top-0 left-0 w-full h-64 bg-teal-600/5"></div>
      </div>

      <Card className="max-w-md w-full relative overflow-hidden shadow-xl border-slate-100 z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>
        
        <div className="mb-8">
          <button onClick={() => navigateTo('HOME')} className="text-slate-400 hover:text-slate-700 flex items-center text-sm mb-6 transition-colors font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Voter Registration</h2>
          <p className="text-slate-500 text-sm mt-1">Verify your identity to participate.</p>
        </div>

        {step === 'ID_INPUT' && (
          <form onSubmit={handleRegistrationIdSubmit} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Membership Number</label>
              <input 
                type="text" 
                className="block w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 p-4 border uppercase transition-all text-lg font-medium placeholder-slate-300 text-slate-900"
                value={voterIdInput}
                onChange={(e) => setVoterIdInput(e.target.value)}
                placeholder="e.g., MEM001"
                autoFocus
                disabled={isSendingOtp}
              />
            </div>
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start border border-red-100 animate-fade-in">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            <Button type="submit" fullWidth className="bg-teal-600 hover:bg-teal-700 text-white h-14 text-lg shadow-lg shadow-teal-600/20" isLoading={isSendingOtp}>
              Verify Identity <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </form>
        )}

        {step === 'OTP_INPUT' && (
          <form onSubmit={handleRegistrationOtpSubmit} className="space-y-8 animate-fade-in">
             <div className={`p-4 rounded-xl text-sm mb-4 border flex items-start gap-3 transition-colors ${otpExpired ? 'bg-red-50 border-red-100 text-red-900' : 'bg-teal-50 border-teal-100 text-teal-900'}`}>
              {otpExpired ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> : <Smartphone className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <span className="leading-relaxed pr-2">
                      {otpExpired 
                        ? <span>The verification code sent to <b>{activeVoter?.phone}</b> has expired.</span> 
                        : <span>Enter the code sent to <b>{activeVoter?.phone}</b>.</span>}
                    </span>
                    <OtpTimer 
                      targetTime={(activeVoter?.otpTimestamp || 0) + OTP_EXPIRY_MS} 
                      onExpire={() => {
                        setOtpExpired(true);
                        setErrorMsg("Verification code has expired.");
                      }} 
                    />
                 </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Verification Code</label>
              <OtpInput 
                value={otpInput}
                onChange={setOtpInput}
                autoFocus={!otpExpired}
                disabled={otpExpired}
              />
            </div>
            {errorMsg && <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg animate-fade-in border border-red-100">{errorMsg}</p>}
            
            <Button type="submit" fullWidth className="bg-teal-600 hover:bg-teal-700 text-white h-14 text-lg shadow-lg shadow-teal-600/20" disabled={otpExpired}>
              {otpExpired ? 'Code Expired' : 'Verify & Proceed'}
            </Button>
            
            <div className="flex justify-between mt-6 pt-6 border-t border-slate-100">
               <button type="button" onClick={() => setStep('ID_INPUT')} className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors">
                 Change ID
               </button>
               <button 
                 type="button" 
                 onClick={handleResendOtp} 
                 className={`text-sm flex items-center font-bold transition-colors ${otpExpired ? 'text-red-600 hover:text-red-800' : 'text-teal-600 hover:text-teal-800'}`} 
                 disabled={isSendingOtp}
               >
                 <RefreshCw className={`w-3 h-3 mr-1.5 ${isSendingOtp ? 'animate-spin' : ''}`} /> 
                 {otpExpired ? 'Request New Code' : 'Resend Code'}
               </button>
            </div>
          </form>
        )}

        {step === 'SUBCOUNTY_SELECT' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-lg font-bold text-slate-900 mb-2 text-center">
                Select Voting Location
              </label>
              <p className="text-sm text-slate-500 text-center mb-6">
                Please choose the sub-county where you will cast your vote.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {SUBCOUNTIES.map((sc) => (
                  <button
                    key={sc}
                    onClick={() => handleSubCountySubmit(sc)}
                    className="flex items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 transition-all shadow-sm hover:shadow-md text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 group"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    {sc}
                  </button>
                ))}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setStep('OTP_INPUT')} 
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-4"
            >
              Back
            </button>
          </div>
        )}

        {step === 'SUCCESS' && activeVoter && (
          <div className="text-center space-y-6 animate-fade-in py-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Verification Successful</h3>
              <p className="text-slate-500 mt-2">Your identity has been secured.</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-5 text-left border border-slate-200 text-sm space-y-4 shadow-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-bold text-slate-900">{activeVoter.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Membership ID</span>
                <span className="font-bold text-slate-900">{activeVoter.membershipId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Voting Location</span>
                <span className="font-bold text-teal-700 flex items-center"><MapPin className="w-3 h-3 mr-1" />{activeVoter.votingSubCounty}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wide border border-green-200">
                   {activeVoter.status}
                </span>
              </div>
            </div>

            <Button fullWidth onClick={() => navigateTo('HOME')} variant="outline" className="h-12 font-bold">
              Return to Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const renderVotingLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative">
       {/* Background */}
       <div className="absolute inset-0 bg-slate-50">
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/5"></div>
      </div>
      
       <Card className="max-w-md w-full relative overflow-hidden shadow-xl border-slate-100 z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="mb-8">
          <button onClick={() => navigateTo('HOME')} className="text-slate-400 hover:text-slate-700 flex items-center text-sm mb-6 transition-colors font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Voter Login</h2>
          <p className="text-slate-500 text-sm mt-1">Access the ballot securely.</p>
        </div>

        {step === 'ID_INPUT' && (
          <form onSubmit={handleVotingIdSubmit} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Membership Number</label>
              <input 
                type="text" 
                className="block w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-4 border uppercase transition-all text-lg font-medium placeholder-slate-300 text-slate-900"
                value={voterIdInput}
                onChange={(e) => setVoterIdInput(e.target.value)}
                placeholder="e.g., MEM001"
                autoFocus
                disabled={isSendingOtp}
              />
            </div>
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start border border-red-100 animate-fade-in">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            <Button type="submit" fullWidth isLoading={isSendingOtp} className="h-14 text-lg shadow-lg shadow-blue-600/20">
              Authenticate <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
            
             <div className="text-center pt-2">
              <button type="button" onClick={() => navigateTo('REGISTRATION')} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">
                Not registered? Check your status here.
              </button>
            </div>
          </form>
        )}

        {step === 'OTP_INPUT' && (
          <form onSubmit={handleVotingOtpSubmit} className="space-y-8 animate-fade-in">
             <div className={`p-4 rounded-xl text-sm mb-4 border flex items-start gap-3 transition-colors ${otpExpired ? 'bg-red-50 border-red-100 text-red-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
              {otpExpired ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> : <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <span className="leading-relaxed pr-2">
                      {otpExpired 
                        ? <span>The access code sent to <b>{activeVoter?.phone}</b> has expired.</span> 
                        : <span>Enter the code sent to <b>{activeVoter?.phone}</b>.</span>}
                    </span>
                    <OtpTimer 
                      targetTime={(activeVoter?.otpTimestamp || 0) + OTP_EXPIRY_MS} 
                      onExpire={() => {
                        setOtpExpired(true);
                        setErrorMsg("Access code has expired.");
                      }} 
                    />
                 </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Access Code</label>
              <OtpInput 
                value={otpInput}
                onChange={setOtpInput}
                autoFocus={!otpExpired}
                disabled={otpExpired}
              />
            </div>
            {errorMsg && <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg animate-fade-in border border-red-100">{errorMsg}</p>}
            
            <Button type="submit" fullWidth className="mt-2 h-14 text-lg shadow-lg shadow-blue-600/20" disabled={otpExpired}>
               {otpExpired ? 'Code Expired' : 'Enter Voting Booth'}
            </Button>
            
            <div className="flex justify-between mt-6 pt-6 border-t border-slate-100">
               <button type="button" onClick={() => setStep('ID_INPUT')} className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors">
                 Change ID
               </button>
               <button 
                 type="button" 
                 onClick={handleResendVotingOtp} 
                 className={`text-sm flex items-center font-bold transition-colors ${otpExpired ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'}`} 
                 disabled={isSendingOtp}
               >
                 <RefreshCw className={`w-3 h-3 mr-1.5 ${isSendingOtp ? 'animate-spin' : ''}`} /> 
                 {otpExpired ? 'Request New Code' : 'Resend Code'}
               </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );

  const renderAdminLogin = () => (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <Card className="max-w-md w-full shadow-xl" title="Administrator Access">
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Password</label>
            <input 
              type="password" 
              className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-3 border transition-all"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              placeholder="Enter admin password..."
            />
          </div>
          {errorMsg && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {errorMsg}</p>}
          <div className="flex flex-col gap-3">
            <Button type="submit" fullWidth className="h-12 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20">Login</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => navigateTo('HOME')} className="h-12">Back to Home</Button>
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
        onAddVoter={handleAddVoter}
        onBulkAddVoters={handleBulkAddVoters}
        onEditVoter={handleEditVoter}
        onDeleteVoter={handleDeleteVoter}
        onUpdateSettings={handleUpdateSettings}
        onResetVotes={handleResetVotes}
        onFactoryReset={handleFactoryReset}
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
