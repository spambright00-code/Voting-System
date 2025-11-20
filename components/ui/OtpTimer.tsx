import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface OtpTimerProps {
  targetTime: number;
  onExpire: () => void;
  className?: string;
}

export const OtpTimer: React.FC<OtpTimerProps> = ({ targetTime, onExpire, className = '' }) => {
  const calculateTimeLeft = () => Math.max(0, targetTime - Date.now());
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  // Use ref to prevent effect re-triggering on callback change
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    }, 1000);

    // Initial check
    if (calculateTimeLeft() <= 0) {
      onExpireRef.current();
    }

    return () => clearInterval(timer);
  }, [targetTime]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  if (timeLeft <= 0) {
    return (
      <span className={`text-red-600 font-bold flex items-center text-xs uppercase tracking-wide animate-pulse ${className}`}>
        <AlertTriangle className="w-3 h-3 mr-1.5"/> Expired
      </span>
    );
  }

  return (
    <span className={`font-mono font-bold flex items-center text-xs tabular-nums ${timeLeft < 60000 ? 'text-amber-600' : 'text-slate-500'} ${className}`}>
      <Clock className="w-3 h-3 mr-1.5"/> 
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};