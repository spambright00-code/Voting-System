
import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { OtpInput } from './ui/OtpInput';
import { OtpTimer } from './ui/OtpTimer';
import { Voter } from '../types';
import { ArrowRight, ChevronLeft, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthFlowStep } from './Registration';
import { OTP_EXPIRY_MINUTES } from '../constants';

interface AuthFlowProps {
  children?: React.ReactNode;
  // Data
  title: string;
  subtitle: string;
  idLabel: string;
  idPlaceholder: string;
  otpLabel: string;
  activeVoter: Voter | null;
  voterIdInput: string;
  otpInput: string;
  errorMsg: string;
  isSendingOtp: boolean;
  otpExpired: boolean;

  // Callbacks
  setVoterIdInput: (value: string) => void;
  setOtpInput: (value: string) => void;
  onIdSubmit: (e: React.FormEvent) => Promise<void>;
  onOtpSubmit: (e: React.FormEvent) => void;
  onResendOtp: () => Promise<void>;
  onBack: () => void;
  onNavigateHome: () => void;
  setStep: (step: AuthFlowStep) => void;
  onExpire: () => void;

  // Theming
  themeColor: 'teal' | 'blue';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  title,
  subtitle,
  idLabel,
  idPlaceholder,
  otpLabel,
  activeVoter,
  voterIdInput,
  otpInput,
  errorMsg,
  isSendingOtp,
  otpExpired,
  setVoterIdInput,
  setOtpInput,
  onIdSubmit,
  onOtpSubmit,
  onResendOtp,
  onBack,
  onNavigateHome,
  setStep,
  themeColor,
  children,
  onExpire
}) => {
  const step = activeVoter && activeVoter.otp ? 'OTP_INPUT' : 'ID_INPUT';

  const themeClasses = {
    teal: {
      gradient: 'from-teal-400 to-teal-600',
      focusRing: 'focus:ring-teal-500/10',
      focusBorder: 'focus:border-teal-500',
      buttonBg: 'bg-teal-600 hover:bg-teal-700',
      buttonShadow: 'shadow-teal-600/20',
      otpBg: 'bg-teal-50 border-teal-100 text-teal-900',
      otpIcon: 'text-teal-600',
      resendText: 'text-teal-600 hover:text-teal-800'
    },
    blue: {
      gradient: 'from-blue-500 to-indigo-600',
      focusRing: 'focus:ring-blue-500/10',
      focusBorder: 'focus:border-blue-500',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonShadow: 'shadow-blue-600/20',
      otpBg: 'bg-blue-50 border-blue-100 text-blue-900',
      otpIcon: 'text-blue-600',
      resendText: 'text-blue-600 hover:text-blue-800'
    }
  };
  const currentTheme = themeClasses[themeColor];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 bg-slate-50">
        <div className={`absolute top-0 left-0 w-full h-64 ${themeColor === 'teal' ? 'bg-teal-600/5' : 'bg-blue-600/5'}`}></div>
      </div>

      <Card className="max-w-md w-full relative overflow-hidden shadow-xl border-slate-100 z-10">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentTheme.gradient}`}></div>

        <div className="mb-8">
          <button onClick={onNavigateHome} className="text-slate-400 hover:text-slate-700 flex items-center text-sm mb-6 transition-colors font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>

        {step === 'ID_INPUT' ? (
          <form onSubmit={onIdSubmit} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{idLabel}</label>
              <input
                type="text"
                className={`block w-full rounded-xl border-slate-200 bg-slate-50/50 shadow-sm p-4 border uppercase transition-all text-lg font-medium placeholder-slate-300 text-slate-900 ${currentTheme.focusBorder} ${currentTheme.focusRing}`}
                value={voterIdInput}
                onChange={(e) => setVoterIdInput(e.target.value)}
                placeholder={idPlaceholder}
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
            <Button type="submit" fullWidth className={`${currentTheme.buttonBg} text-white h-14 text-lg shadow-lg ${currentTheme.buttonShadow}`} isLoading={isSendingOtp}>
              Verify Identity <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
            {children}
          </form>
        ) : (
          <form onSubmit={onOtpSubmit} className="space-y-8 animate-fade-in">
             <div className={`p-4 rounded-xl text-sm mb-4 border flex items-start gap-3 transition-colors ${otpExpired ? 'bg-red-50 border-red-100 text-red-900' : currentTheme.otpBg}`}>
              {otpExpired ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> : <Smartphone className={`w-5 h-5 ${currentTheme.otpIcon} mt-0.5 flex-shrink-0`} />}
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <span className="leading-relaxed pr-2">
                      {otpExpired
                        ? <span>The code sent to <b>{activeVoter?.phone}</b> has expired.</span>
                        : <span>Enter the code sent to <b>{activeVoter?.phone}</b>.</span>}
                    </span>
                    <OtpTimer
                      targetTime={(activeVoter?.otpTimestamp || 0) + (OTP_EXPIRY_MINUTES * 60 * 1000)}
                      onExpire={onExpire}
                    />
                 </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">{otpLabel}</label>
              <OtpInput
                value={otpInput}
                onChange={setOtpInput}
                autoFocus={!otpExpired}
                disabled={otpExpired}
              />
            </div>
            {errorMsg && <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg animate-fade-in border border-red-100">{errorMsg}</p>}

            <Button type="submit" fullWidth className={`${currentTheme.buttonBg} h-14 text-lg shadow-lg ${currentTheme.buttonShadow}`} disabled={otpExpired}>
              {otpExpired ? 'Code Expired' : 'Verify & Proceed'}
            </Button>

            <div className="flex justify-between mt-6 pt-6 border-t border-slate-100">
               <button type="button" onClick={() => setStep('ID_INPUT')} className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors">
                 Change ID
               </button>
               <button
                 type="button"
                 onClick={onResendOtp}
                 className={`text-sm flex items-center font-bold transition-colors ${otpExpired ? 'text-red-600 hover:text-red-800' : currentTheme.resendText}`}
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
};
