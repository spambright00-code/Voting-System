
import { supabase } from '../lib/supabase';
import { AppState, Candidate, ElectionPhase, ElectionSettings, Vote, Voter, VoterStatus } from '../../types';

// --- Fetch Initial State ---
// Note: fetching 'voters' here will intentionally fail for public users due to RLS.
// Admin users (authenticated) will receive data.
export const fetchElectionState = async (): Promise<Partial<AppState>> => {
  const [settingsRes, votersRes, candidatesRes, votesRes] = await Promise.all([
    supabase.from('election_settings').select('*').single(),
    supabase.from('voters').select('*'),
    supabase.from('candidates').select('*'),
    supabase.from('votes').select('*')
  ]);

  if (settingsRes.error) console.error('Error fetching settings:', settingsRes.error);
  // Voters error is expected for unauthenticated users
  if (votersRes.error && votersRes.error.code !== '42501') {
     console.error('Error fetching voters:', votersRes.error);
  }

  return {
    settings: settingsRes.data ? mapSettings(settingsRes.data) : undefined,
    phase: settingsRes.data?.phase as ElectionPhase,
    voters: votersRes.data?.map(mapVoter) || [],
    candidates: candidatesRes.data?.map(mapCandidate) || [],
    votes: votesRes.data?.map(mapVote) || []
  };
};

// --- Settings ---
export const updateElectionSettings = async (settings: ElectionSettings) => {
  const { error } = await supabase
    .from('election_settings')
    .update({
      election_title: settings.electionTitle,
      organization_name: settings.organizationName,
      sms_api_key: settings.smsApiKey,
      sms_sender_id: settings.smsSenderId,
      enable_auto_schedule: settings.enableAutoSchedule,
      verification_start_time: settings.verificationStartTime,
      verification_end_time: settings.verificationEndTime,
      voting_start_time: settings.votingStartTime,
      voting_end_time: settings.votingEndTime
    })
    .eq('id', 1);
  
  if (error) throw error;
};

export const setElectionPhase = async (phase: ElectionPhase) => {
  const { error } = await supabase
    .from('election_settings')
    .update({ phase })
    .eq('id', 1);
  if (error) throw error;
};

// --- Voters ---

// Public Secure Lookup
export const checkVoterStatus = async (membershipId: string): Promise<Voter | null> => {
  const { data, error } = await supabase.rpc('check_voter_status', {
    p_membership_id: membershipId
  });

  if (error) {
    console.error('Error checking voter status:', error);
    return null;
  }

  if (data && data.length > 0) {
    return mapVoter(data[0]);
  }
  return null;
};

export const addVoterToDb = async (voter: Omit<Voter, 'id' | 'status'>) => {
  const { data, error } = await supabase
    .from('voters')
    .insert({
      membership_id: voter.membershipId,
      name: voter.name,
      phone: voter.phone,
      ward: voter.ward,
      constituency: voter.constituency,
      county: voter.county,
      status: 'UNVERIFIED'
    })
    .select()
    .single();
  
  if (error) throw error;
  return mapVoter(data);
};

export const updateVoterStatus = async (id: string, status: VoterStatus, subCounty?: string) => {
  const updateData: any = { status };
  if (subCounty) updateData.voting_sub_county = subCounty;
  // Update verified_at if becoming verified
  if (status === VoterStatus.VERIFIED) {
    updateData.verified_at = new Date().toISOString();
  }
  
  const { error } = await supabase
    .from('voters')
    .update(updateData)
    .eq('id', id);
  
  if (error) throw error;
};

export const updateVoterDetails = async (id: string, updates: Partial<Voter>) => {
  const dbUpdates: any = {};
  if (updates.membershipId) dbUpdates.membership_id = updates.membershipId;
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.phone) dbUpdates.phone = updates.phone;
  if (updates.ward) dbUpdates.ward = updates.ward;
  if (updates.constituency) dbUpdates.constituency = updates.constituency;
  if (updates.county) dbUpdates.county = updates.county;

  const { error } = await supabase
    .from('voters')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteVoterFromDb = async (id: string) => {
  const { error } = await supabase.from('voters').delete().eq('id', id);
  if (error) throw error;
};

// --- Candidates ---
export const addCandidateToDb = async (candidate: Omit<Candidate, 'id'>) => {
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      name: candidate.name,
      position: candidate.position,
      party: candidate.party,
      avatar_url: candidate.avatarUrl,
      sub_county: candidate.subCounty
    })
    .select()
    .single();

  if (error) throw error;
  return mapCandidate(data);
};

export const deleteCandidateFromDb = async (id: string) => {
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) throw error;
};

// --- Voting (RPC) ---
export const submitVoteTransaction = async (membershipId: string, selections: Record<string, string>) => {
  const { data, error } = await supabase.rpc('submit_vote', {
    p_membership_id: membershipId,
    p_selections: selections
  });

  if (error) throw error;
  return data;
};

export const resetElectionData = async () => {
  const { error } = await supabase.rpc('reset_election');
  if (error) throw error;
};

// --- Mappers ---
export const mapVoter = (row: any): Voter => ({
  id: row.id,
  membershipId: row.membership_id,
  name: row.name,
  phone: row.phone,
  ward: row.ward || '',
  constituency: row.constituency || '',
  county: row.county || '',
  status: row.status as VoterStatus,
  votingSubCounty: row.voting_sub_county,
  verifiedAt: row.verified_at || row.updated_at,
  otpTimestamp: row.otp_timestamp // Handle if existing in DB or transient
});

const mapCandidate = (row: any): Candidate => ({
  id: row.id,
  name: row.name,
  position: row.position,
  party: row.party,
  avatarUrl: row.avatar_url,
  subCounty: row.sub_county
});

const mapVote = (row: any): Vote => ({
  id: row.id,
  voterHash: 'ANONYMOUS',
  selections: { [row.position]: row.candidate_id },
  timestamp: new Date(row.timestamp).getTime()
});

const mapSettings = (row: any): ElectionSettings => ({
  electionTitle: row.election_title,
  organizationName: row.organization_name,
  smsApiKey: row.sms_api_key,
  smsSenderId: row.sms_sender_id,
  enableAutoSchedule: row.enable_auto_schedule,
  verificationStartTime: row.verification_start_time,
  verificationEndTime: row.verification_end_time,
  votingStartTime: row.voting_start_time,
  votingEndTime: row.voting_end_time
});
