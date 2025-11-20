
export enum ElectionPhase {
  SETUP = 'SETUP',
  VERIFICATION = 'VERIFICATION',
  VOTING = 'VOTING',
  ENDED = 'ENDED'
}

export enum VoterStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  VOTED = 'VOTED'
}

export interface ElectionSettings {
  electionTitle: string;
  organizationName: string;
  smsApiKey?: string;
  smsSenderId?: string;
  // Scheduling
  enableAutoSchedule?: boolean;
  verificationStartTime?: string;
  verificationEndTime?: string;
  votingStartTime?: string;
  votingEndTime?: string;
}

export interface Voter {
  id: string;
  membershipId: string;
  name: string;
  phone: string;
  ward: string;
  constituency: string;
  county: string;
  status: VoterStatus;
  otp?: string; // Transient OTP for verification
  otpTimestamp?: number; // Timestamp for OTP generation to handle expiration
  verifiedAt?: string; // ISO timestamp of when verification occurred
  votingSubCounty?: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  party: string;
  avatarUrl: string;
  subCounty?: string; // 'All' or specific subcounty name
}

export interface Vote {
  id: string;
  voterHash: string; // Anonymized ID
  selections: Record<string, string>; // Position -> CandidateID
  timestamp: number;
}

export interface AdminState {
  isAuthenticated: boolean;
}

export interface AppState {
  phase: ElectionPhase;
  voters: Voter[];
  votes: Vote[];
  candidates: Candidate[];
  settings: ElectionSettings;
}
