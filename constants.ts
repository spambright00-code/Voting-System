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
    otp: '123456',
    votingSubCounty: 'Kilifi North'
  },
  {
    id: 'v3',
    membershipId: 'MEM003',
    name: 'Fatuma Ahmed',
    phone: '+254700000003',
    ward: 'Eastleigh',
    constituency: 'Kamukunji',
    county: 'Nairobi',
    status: VoterStatus.VOTED,
    votingSubCounty: 'Malindi'
  },
  {
    id: 'v4',
    membershipId: 'MEM004',
    name: 'David Kimani',
    phone: '+254700000004',
    ward: 'Westlands',
    constituency: 'Westlands',
    county: 'Nairobi',
    status: VoterStatus.VERIFIED,
    otp: '654321',
    votingSubCounty: 'Ganze'
  },
  {
    id: 'v5',
    membershipId: 'MEM005',
    name: 'Lucy Wanjiku',
    phone: '+254700000005',
    ward: 'Kilimani',
    constituency: 'Dagoretti North',
    county: 'Nairobi',
    status: VoterStatus.UNVERIFIED
  },
  {
    id: 'v6',
    membershipId: 'MEM006',
    name: 'Mohammed Ali',
    phone: '+254700000006',
    ward: 'Eastleigh',
    constituency: 'Kamukunji',
    county: 'Nairobi',
    status: VoterStatus.VERIFIED,
    otp: '987654',
    votingSubCounty: 'Rabai'
  },
  {
    id: 'v7',
    membershipId: 'MEM007',
    name: 'John Doe',
    phone: '+254700000007',
    ward: 'Westlands',
    constituency: 'Westlands',
    county: 'Nairobi',
    status: VoterStatus.VOTED,
    votingSubCounty: 'Chonyi'
  },
  {
    id: 'v8',
    membershipId: 'MEM008',
    name: 'Esther Muli',
    phone: '+254700000008',
    ward: 'Karen',
    constituency: 'Langata',
    county: 'Nairobi',
    status: VoterStatus.UNVERIFIED
  }
];

export const ADMIN_PASSWORD = 'admin';

export const AI_PROMPTS = [
  "Draft an SMS to remind unverified voters to register.",
  "Summarize the current voter turnout.",
  "Write a thank you message for after the election.",
  "Analyze the distribution of voters by ward."
];