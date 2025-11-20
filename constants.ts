
import { Candidate, Voter, VoterStatus } from './types';

export const SUBCOUNTIES = [
  "Magarini", 
  "Malindi", 
  "Kilifi North", 
  "Kilifi South", 
  "Ganze", 
  "Kaloleni", 
  "Rabai", 
  "Chonyi"
];

// Security Constants
export const OTP_EXPIRY_MINUTES = 5;
export const MAX_OTP_ATTEMPTS = 3;
export const PHASE_CHECK_INTERVAL_MS = 10_000;
export const ID_RANDOM_LENGTH = 9;
export const MAX_PROMPT_LENGTH = 2000;

// AI Constants
export const AI_MODEL = "gemini-2.5-flash";
export const AI_PROMPTS = [
  "Draft an SMS to remind unverified voters to register.",
  "Summarize the current voter turnout.",
  "Write a thank you message for after the election.",
  "Analyze the distribution of voters by ward."
];

// Safely access environment variable
const getEnv = () => {
  try {
    // @ts-ignore
    return import.meta.env || {};
  } catch {
    return {};
  }
};

export const ADMIN_PASSWORD = (getEnv() as any).VITE_ADMIN_PASSWORD;

// Demo Data has been removed for security.
// Voter and candidate data should be loaded from a secure, external source.
export const MOCK_CANDIDATES: Candidate[] = [];
export const INITIAL_VOTERS: Voter[] = [];