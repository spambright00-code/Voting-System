import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({ 
  length = 6, 
  value, 
  onChange, 
  disabled,
  autoFocus = false,
  className = ''
}) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const char = val.slice(-1);
    const newValue = value.split('');
    
    // Ensure array size matches length
    for (let i = 0; i < length; i++) {
        if (!newValue[i]) newValue[i] = '';
    }
    
    newValue[idx] = char;
    const newOtp = newValue.join('').slice(0, length);
    onChange(newOtp);

    // Focus next input if character entered
    if (char && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!value[idx] && idx > 0) {
        e.preventDefault();
        inputs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasteData);
    const focusIdx = Math.min(pasteData.length, length - 1);
    inputs.current[focusIdx]?.focus();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={`flex gap-2 sm:gap-3 justify-center items-center ${className}`} role="group" aria-label="Enter verification code">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold 
            border-2 rounded-xl outline-none transition-all duration-200
            bg-white shadow-sm hover:border-indigo-300
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'text-gray-800 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}
          `}
        />
      ))}
    </div>
  );
};