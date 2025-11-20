
import { createClient } from '@supabase/supabase-js';

// Safely access env vars
const getEnv = () => {
  try {
    // @ts-ignore
    return import.meta.env || {};
  } catch {
    return {};
  }
};

const env = getEnv() as any;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Check if configured, but provide fallbacks to prevent createClient from throwing "supabaseUrl is required"
// This allows the app to load in "Demo Mode" even without backend credentials.
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
  console.warn('Supabase URL or Key missing. Backend features will be disabled.');
}

// Use placeholders if missing. This client will fail on network requests but won't crash the app on load.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export type Database = {
  public: {
    Tables: {
      voters: {
        Row: any;
        Insert: any;
        Update: any;
      };
      candidates: {
        Row: any;
        Insert: any;
        Update: any;
      };
      votes: {
        Row: any;
        Insert: any;
      };
      election_settings: {
        Row: any;
        Update: any;
      };
    };
  };
};