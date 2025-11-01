import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://gyeevveqllqnglsfraxy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWV2dmVxbGxxbmdsc2ZyYXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDg1MjgsImV4cCI6MjA3NzU4NDUyOH0.Q5ZOA5dRvcrzoaFZIu_JVfEQtgDlrzAGUujp07yclWE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
