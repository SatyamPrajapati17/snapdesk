
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch profile
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (pError) throw pError;

    const user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.full_name,
    };

    useAuth.getState().setUser(user);
    return user;
  },

  async logout() {
    await supabase.auth.signOut();
    useAuth.getState().logout();
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) return null;

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.full_name,
    };
  }
};
