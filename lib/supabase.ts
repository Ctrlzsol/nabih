import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL) || 'https://cfsuudoubadwplagpcvw.supabase.co';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmc3V1ZG91YmFkd3BsYWdwY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjA0MTAsImV4cCI6MjA4MzI5NjQxMH0.H4hDB-KdeNkYY8FaIn7rexVMGLNjRGByspgQBx_fpUM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);