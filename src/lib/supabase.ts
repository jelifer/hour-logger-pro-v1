import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  time_in: string;
  time_out: string;
  break_minutes: number;
  total_hours: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_statutory: boolean;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
}

export async function getUserRole(userId: string): Promise<'admin' | 'staff'> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return 'staff';
  }

  return data.role;
}
