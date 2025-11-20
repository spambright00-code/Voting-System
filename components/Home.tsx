
import React from 'react';
import { Button } from './ui/Button';
import { ShieldCheck, Lock, ArrowRight, ClipboardCheck, Vote as VoteIcon } from 'lucide-react';
import { ElectionPhase } from '../types';

interface HomeProps {
  state: {
    phase: ElectionPhase;
    settings: {
      electionTitle: string;
      organizationName: string;
    };
  };
  navigateTo: (view: 'REGISTRATION' | 'VOTING_LOGIN' | 'ADMIN_LOGIN') => void;
}

export const Home: React.FC<HomeProps> = ({ state, navigateTo }) => {
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
