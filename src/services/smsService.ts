
import { ElectionSettings } from '../../types';

/**
 * Generates a cryptographically strong 6-digit OTP.
 * Uses window.crypto for secure randomness.
 */
export const generateOTP = (): string => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  // Generate a number between 0 and 999999
  const secureRandom = array[0] % 1000000;
  // Pad with zeros to ensure 6 digits
  return secureRandom.toString().padStart(6, '0');
};

interface SMSPayload {
  phone: string;
  message: string;
  settings: ElectionSettings;
}

/**
 * Sends an SMS using the MobileSasa API.
 * Falls back to console/alert if API key is missing or request fails (CORS/Network).
 */
export const sendSMS = async ({ phone, message, settings }: SMSPayload): Promise<boolean> => {
  // 1. Validation
  if (!phone) {
    console.error("SMS Failed: No phone number provided");
    return false;
  }

  // 2. Fallback if no API Key configured
  if (!settings.smsApiKey) {
    console.warn("SMS Configuration Missing: Using simulation mode.");
    // Note: In production, replace this alert with a Toast notification or log to a monitoring service.
    alert(`[SIMULATION SMS] To: ${phone}\n\n${message}`);
    return true;
  }

  // 3. Attempt MobileSasa API Call
  try {
    const response = await fetch('https://api.mobilesasa.com/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.smsApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        senderID: settings.smsSenderId || 'MobiPoll',
        phone: formatPhoneNumber(phone),
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'SMS API request failed');
    }

    console.log(`SMS sent successfully to ${phone}`);
    return true;

  } catch (error) {
    console.error("SMS Service Error:", error);
    alert(`[FALLBACK SMS] To: ${phone}\n\n${message}\n\n(API call failed, see console)`);
    return false;
  }
};

/**
 * Formats phone number to required format (e.g., 07XX -> 2547XX)
 * MobileSasa typically expects international format without +.
 */
const formatPhoneNumber = (phone: string): string => {
  let clean = phone.replace(/\D/g, ''); // Remove non-digits
  
  // Handle Kenyan formats
  if (clean.startsWith('07') || clean.startsWith('01')) {
    return '254' + clean.substring(1);
  }
  if (clean.startsWith('254')) {
    return clean;
  }
  
  return clean;
};
