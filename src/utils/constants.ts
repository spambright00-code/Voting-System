
import { Candidate, Voter, VoterStatus } from '../../types';

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

// Demo Data (Keep for fallback/initialization if DB is empty)
export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Alice Mwangi',
    position: 'Chairperson',
    party: 'Progressive Teachers',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    subCounty: 'All'
  }
];
