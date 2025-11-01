
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be set by the user when they enable Supabase
const supabaseUrl = 'https://gyeevveqllqnglsfraxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWV2dmVxbGxxbmdsc2ZyYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg1MjgsImV4cCI6MjA3NzU4NDUyOH0.Q5ZOA5dRvcrzoaFZIu_JVfEQtgDlrzAGUujp07yclWE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '';
};
