import { supabase } from './supabase';

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

export async function checkAdminAccess(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return isAdmin(user.id);
}