import React, { useState, useMemo } from 'react';
import { CheckCircle, ShieldCheck, AlertCircle, User, MapPin, LogOut, Send, ChevronRight, Check, BadgeCheck } from 'lucide-react';
import { Candidate, ElectionPhase, Voter, VoterStatus } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface VoterPortalProps {
  voter: Voter;
  electionPhase: ElectionPhase;
  onVoteSubmit: (selections: Record<string, string>) => void;
  onLogout: () => void;
  candidates: Candidate[];
}

export const VoterPortal: React.FC<VoterPortalProps> = ({ 
  voter, 
  electionPhase, 
  onVoteSubmit,
  onLogout,
  candidates
}) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const eligibleCandidates = useMemo(() => candidates.filter(c => {
    return !c.subCounty || c.subCounty === 'All' || c.subCounty === voter.votingSubCounty;
  }), [candidates, voter.votingSubCounty]);

  const candidatesByPosition = useMemo(() => {
    const groups: Record<string, Candidate[]> = {};
    eligibleCandidates.forEach(c => {
      if (!groups[c.position]) groups[c.position] = [];
      groups[c.position].push(c);
    });
    return groups;
  }, [eligibleCandidates]);

  const positions = Object.keys(candidatesByPosition);
  const totalPositions = positions.length;
  const selectedCount = Object.keys(selections).length;
  const isComplete = totalPositions > 0 && selectedCount === totalPositions;

  const handleSelect = (position: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [position]: candidateId
    }));
  };

  const handleSubmit = () => {
    onVoteSubmit(selections);
  };

  if (electionPhase !== ElectionPhase.VOTING) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-6 p-8">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Voting is not active</h2>
            <p className="text-gray-600 mt-2">
              {electionPhase === ElectionPhase.SETUP 
                ? "The election is currently being set up. Please check back later."
                : electionPhase === ElectionPhase.VERIFICATION 
                  ? "Verification is currently ongoing. Voting has not started yet." 
                  : "The election has ended."}
            </p>
          </div>
          <Button fullWidth onClick={onLogout} variant="outline">Exit Portal</Button>
        </Card>
      </div>
    );
  }

  if (voter.status === VoterStatus.VOTED) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center space-y-8 p-8 border-t-4 border-t-green-500 shadow-xl">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-green-100 w-full h-full rounded-full flex items-center justify-center">
              <ShieldCheck className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Vote Cast Successfully</h2>
            <p className="text-gray-600 mt-3 text-lg">
              Thank you, {voter.name.split(' ')[0]}.<br/>
              Your ballot is secured and anonymous.
            </p>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl text-sm border border-gray-200">
             <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2">Voting Location</p>
             <p className="font-bold text-gray-900 flex items-center justify-center gap-2 text-lg">
               <MapPin className="w-5 h-5 text-indigo-500" /> {voter.votingSubCounty}
             </p>
          </div>
          <Button fullWidth onClick={onLogout} variant="outline" className="h-12">Secure Logout</Button>
        </Card>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <h1 className="text-lg font-bold text-gray-900">Review & Confirm</h1>
            </div>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="text-xs h-9 px-4 rounded-lg">
              Edit Ballot
            </Button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
             <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
             <p className="text-sm text-blue-900 leading-relaxed">
               Please review your choices carefully below. Once you submit, your vote is final and cannot be changed.
             </p>
           </div>

           <div className="space-y-4">
             {positions.map(position => {
               const candidateId = selections[position];
               const candidate = eligibleCandidates.find(c => c.id === candidateId);
               return (
                 <div key={position} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{position}</h3>
                      <p className="text-lg font-bold text-gray-900">{candidate?.name}</p>
                      <p className="text-sm text-gray-600 flex items-center mt-0.5">
                        <BadgeCheck className="w-3 h-3 mr-1 text-indigo-500" />
                        {candidate?.party}
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md">
                      <img src={candidate?.avatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                 </div>
               );
             })}
           </div>

           <div className="pt-6">
             <Button fullWidth variant="primary" onClick={handleSubmit} className="h-14 text-lg shadow-xl shadow-indigo-600/20 bg-gradient-to-r from-indigo-600 to-indigo-700">
               <Send className="w-5 h-5 mr-2" /> Submit Official Vote
             </Button>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="bg-indigo-800 text-white shadow-lg sticky top-0 z-30 transition-all">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold leading-tight">Official Ballot</h1>
              <div className="flex flex-wrap items-center text-indigo-200 text-xs mt-1 gap-3 font-medium">
                <span className="flex items-center bg-indigo-900/50 px-2 py-0.5 rounded"><User className="w-3 h-3 mr-1" /> {voter.name}</span>
                <span className="flex items-center bg-indigo-900/50 px-2 py-0.5 rounded"><MapPin className="w-3 h-3 mr-1" /> {voter.votingSubCounty}</span>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="text-indigo-200 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[10px] text-indigo-200 mb-1.5 font-bold uppercase tracking-widest">
              <span>Ballot Progress</span>
              <span>{selectedCount} / {totalPositions}</span>
            </div>
            <div className="bg-black/20 rounded-full h-2.5 w-full overflow-hidden backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={{ width: `${(selectedCount / Math.max(totalPositions, 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {positions.map((position, idx) => {
          const isPositionSelected = !!selections[position];
          
          return (
            <div key={position} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
               {/* Section Header */}
               <div className="flex items-center gap-3 mb-4 sticky top-32 z-20 py-3 -mx-4 px-4 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 lg:static lg:bg-transparent lg:border-none lg:p-0 transition-all">
                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                   ${isPositionSelected ? 'bg-green-500 text-white scale-110 shadow-green-500/30' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    {isPositionSelected ? <Check className="w-5 h-5" /> : (idx + 1)}
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-gray-800">{position}</h2>
                   {!isPositionSelected && <p className="text-xs text-gray-500 font-medium">Please select one candidate</p>}
                 </div>
               </div>

               {/* Candidates Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
                  {candidatesByPosition[position].map((candidate) => {
                    const isSelected = selections[position] === candidate.id;
                    
                    return (
                      <div 
                        key={candidate.id}
                        onClick={() => handleSelect(position, candidate.id)}
                        className={`
                          relative group cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden
                          ${isSelected 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-200 transform scale-[1.02] z-10' 
                            : 'border-transparent bg-white hover:border-gray-300 shadow-sm hover:shadow-md hover:scale-[1.01]'}
                        `}
                      >
                        <div className="p-4 flex items-center gap-4">
                           {/* Avatar */}
                           <div className="relative flex-shrink-0">
                             <img 
                               src={candidate.avatarUrl} 
                               alt={candidate.name}
                               className={`w-16 h-16 rounded-full object-cover border-2 bg-gray-100 ${isSelected ? 'border-indigo-600' : 'border-gray-100'}`}
                             />
                             {isSelected && (
                               <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                 <Check className="w-3 h-3" />
                               </div>
                             )}
                           </div>
                           
                           {/* Info */}
                           <div className="flex-1 min-w-0">
                             <h3 className={`font-bold text-lg leading-tight truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                               {candidate.name}
                             </h3>
                             <p className="text-sm text-gray-500 mt-1 truncate flex items-center">
                               {candidate.party}
                             </p>
                             {candidate.subCounty && candidate.subCounty !== 'All' && (
                               <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                 {candidate.subCounty}
                               </span>
                             )}
                           </div>
                           
                           {/* Radio Indicator */}
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                             ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-transparent group-hover:border-gray-400'}
                           `}>
                             {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          );
        })}
      </main>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
            <div className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`} />
            {isComplete ? 'Ballot Complete' : `${totalPositions - selectedCount} positions remaining`}
          </div>
          <Button 
            fullWidth 
            variant={isComplete ? 'primary' : 'secondary'} 
            disabled={!isComplete}
            onClick={() => setShowConfirmation(true)}
            className={`sm:w-auto sm:min-w-[280px] font-bold transition-all h-12 rounded-xl ${isComplete ? 'shadow-lg shadow-indigo-500/30' : 'opacity-100'}`}
          >
            {isComplete ? 'Review Selections' : 'Complete Ballot to Continue'} <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};