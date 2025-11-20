
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, ElectionPhase, ElectionSettings, Voter, Candidate, Vote, VoterStatus } from '../../types';
import { fetchElectionState, setElectionPhase, updateElectionSettings, mapVoter } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ElectionContextType {
  state: AppState;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updatePhase: (phase: ElectionPhase) => Promise<void>;
  updateSettings: (settings: ElectionSettings) => Promise<void>;
}

const initialState: AppState = {
  phase: ElectionPhase.SETUP,
  voters: [],
  candidates: [],
  votes: [],
  settings: {
    electionTitle: 'Loading...',
    organizationName: '...',
  },
};

const ElectionContext = createContext<ElectionContextType>({
  state: initialState,
  loading: true,
  error: null,
  refreshData: async () => {},
  updatePhase: async () => {},
  updateSettings: async () => {},
});

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchElectionState();
      setState(prev => ({ ...prev, ...data }));
      setError(null);
    } catch (err: any) {
      console.error('Failed to load election data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to changes
    const settingsSub = supabase
      .channel('public:election_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_settings' }, (payload: any) => {
        // Map DB fields to local state
        if (payload.new) {
             setState(prev => ({
                ...prev,
                phase: payload.new.phase as ElectionPhase,
                settings: {
                    ...prev.settings,
                    electionTitle: payload.new.election_title,
                    organizationName: payload.new.organization_name,
                    // ... map other fields as needed
                }
             }));
        }
      })
      .subscribe();

    // Only admin should subscribe to sensitive tables like 'voters' updates
    let votersSub: any;
    
    if (isAdmin) {
        votersSub = supabase
        .channel('public:voters')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, (payload: any) => {
            // Optimize updates by using the payload directly instead of re-fetching
            setState(prevState => {
              const currentVoters = [...prevState.voters];
              
              if (payload.eventType === 'INSERT') {
                 // Prevent duplicates if re-render happens
                 const exists = currentVoters.find(v => v.id === payload.new.id);
                 if (!exists) return { ...prevState, voters: [...currentVoters, mapVoter(payload.new)] };
              } 
              else if (payload.eventType === 'UPDATE') {
                 return { 
                   ...prevState, 
                   voters: currentVoters.map(v => v.id === payload.new.id ? mapVoter(payload.new) : v) 
                 };
              } 
              else if (payload.eventType === 'DELETE') {
                 return { 
                   ...prevState, 
                   voters: currentVoters.filter(v => v.id !== payload.old.id) 
                 };
              }
              return prevState;
            });
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(settingsSub);
      if (votersSub) supabase.removeChannel(votersSub);
    };
  }, [isAdmin]);

  const updatePhase = async (phase: ElectionPhase) => {
    await setElectionPhase(phase);
    // Optimistic update
    setState(prev => ({ ...prev, phase }));
  };

  const handleUpdateSettings = async (settings: ElectionSettings) => {
    await updateElectionSettings(settings);
    setState(prev => ({ ...prev, settings }));
  };

  return (
    <ElectionContext.Provider 
      value={{ 
        state, 
        loading, 
        error, 
        refreshData: loadData, 
        updatePhase, 
        updateSettings: handleUpdateSettings 
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => useContext(ElectionContext);
