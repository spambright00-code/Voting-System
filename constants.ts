
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

export const ADMIN_PASSWORD = (getEnv() as any).VITE_ADMIN_PASSWORD || 'admin';

// Demo Data (Keep for fallback/initialization if DB is empty)
export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Alice Mwangi',
    position: 'Chairperson',
    party: 'Progressive Teachers',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    subCounty: 'All'
  },
  {
    id: 'c2',
    name: 'John Kamau',
    position: 'Chairperson',
    party: 'United Welfare',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    subCounty: 'All'
  },
  {
    id: 'c3',
    name: 'Sarah Ochieng',
    position: 'Treasurer',
    party: 'Progressive Teachers',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    subCounty: 'All'
  },
  {
    id: 'c4',
    name: 'David Koech',
    position: 'Treasurer',
    party: 'United Welfare',
    avatarUrl: 'https://picsum.photos/200/200?random=4',
    subCounty: 'All'
  }
];

export const INITIAL_VOTERS: Voter[] = [
  {
    id: 'v1',
    membershipId: 'MEM001',
    name: 'Grace Njeri',
    phone: '+254700000001',
    ward: 'Westlands',
    constituency: 'Westlands',
    county: 'Nairobi',
    status: VoterStatus.UNVERIFIED
  },
  {
    id: 'v2',
    membershipId: 'MEM002',
    name: 'Samuel Otieno',
    phone: '+254700000002',
    ward: 'Kilimani',
    constituency: 'Dagoretti North',
    county: 'Nairobi',
    status: VoterStatus.VERIFIED,
    votingSubCounty: 'Kilifi North',
    verifiedAt: new Date().toISOString()
  }
];