
import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { AuthFlow } from './AuthFlow';
import { Voter } from '../types';
import { MapPin, CheckCircle } from 'lucide-react';
import { SUBCOUNTIES } from '../constants';

export type AuthFlowStep = 'ID_INPUT' | 'OTP_INPUT';

interface RegistrationProps {
  step: AuthFlowStep | 'SUBCOUNTY_SELECT' | 'SUCCESS';
  activeVoter: Voter | null;
  voterIdInput: string;
  otpInput: string;
  errorMsg: string;
  isSendingOtp: boolean;
  otpExpired: boolean;
  setVoterIdInput: (value: string) => void;
  setOtpInput: (value: string) => void;
  handleRegistrationIdSubmit: (e: React.FormEvent) => Promise<void>;
  handleRegistrationOtpSubmit: (e: React.FormEvent) => void;
  handleResendOtp: () => Promise<void>;
  handleSubCountySubmit: (subCounty: string) => void;
  navigateTo: (view: 'HOME') => void;
  setStep: (step: AuthFlowStep | 'SUBCOUNTY_SELECT' | 'SUCCESS') => void;
  onExpire: () => void;
}

export const Registration: React.FC<RegistrationProps> = ({
  step,
  activeVoter,
  voterIdInput,
  otpInput,
  errorMsg,
  isSendingOtp,
  otpExpired,
  setVoterIdInput,
  setOtpInput,
  handleRegistrationIdSubmit,
  handleRegistrationOtpSubmit,
  handleResendOtp,
  handleSubCountySubmit,
  navigateTo,
  setStep,
  onExpire
}) => {
  if (step === 'SUBCOUNTY_SELECT') {
    return (
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
    );
  }

  if (step === 'SUCCESS' && activeVoter) {
    return (
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
    );
  }

  return (
    <AuthFlow
      title="Voter Registration"
      subtitle="Verify your identity to participate."
      idLabel="Membership Number"
      idPlaceholder="e.g., MEM001"
      otpLabel="Verification Code"
      activeVoter={activeVoter}
      voterIdInput={voterIdInput}
      otpInput={otpInput}
      errorMsg={errorMsg}
      isSendingOtp={isSendingOtp}
      otpExpired={otpExpired}
      setVoterIdInput={setVoterIdInput}
      setOtpInput={setOtpInput}
      onIdSubmit={handleRegistrationIdSubmit}
      onOtpSubmit={handleRegistrationOtpSubmit}
      onResendOtp={handleResendOtp}
      onBack={() => setStep('ID_INPUT')}
      onNavigateHome={() => navigateTo('HOME')}
      setStep={setStep}
      themeColor="teal"
      onExpire={onExpire}
    />
  );
};
