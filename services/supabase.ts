import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmhquynjyekclwxjgupk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptaHF1eW5qeWVrY2x3eGpndXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTA1NTcsImV4cCI6MjA3MjEyNjU1N30.j1KZiJbE97cNNCXsC-Eeg9FKByY0JhSumHNQwTHlKrU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);