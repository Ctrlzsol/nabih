
import { supabase } from '../../lib/supabase';
import { UserProfile, UserRole, AccountStatus } from '../../config/types';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // EMERGENCY FIX: Use maybeSingle() instead of single() to prevent crashing if row is missing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
        console.error("Supabase Profile Fetch Error:", profileError.message);
        return null;
    }

    if (!profile) {
        console.warn(`Profile missing for User ID: ${userId}. RLS might be off, but row doesn't exist.`);
        return null;
    }

    // 2. Fetch All Roles (Safe Fetch)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles: UserRole[] = roleData?.map((r: any) => r.role) || [];
    
    // Default to individual if no roles found
    if (roles.length === 0) roles.push('individual');

    // Admin Override (Hardcoded Safety)
    if (profile.email === 'hamzaamink@outlook.com' && !roles.includes('admin')) {
        roles.push('admin');
    }

    // Determine Primary Role
    let primaryRole: UserRole = 'individual';
    if (roles.includes('admin')) primaryRole = 'admin';
    else if (roles.includes('merchant')) primaryRole = 'merchant';

    let status: AccountStatus = 'active';
    let storeName: string | undefined = undefined;

    // 3. If Merchant, fetch Merchant Details safely
    if (roles.includes('merchant')) {
      const { data: merchantData } = await supabase
        .from('merchant_requests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (merchantData) {
        status = merchantData.status || 'pending';
        storeName = merchantData.store_name;
      }
    }

    // 4. Construct Object
    return {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      role: primaryRole,
      roles: roles,
      status: status,
      storeName: storeName,
      createdAt: profile.created_at
    };

  } catch (err) {
    console.error("Critical getUserProfile Exception:", err);
    return null;
  }
};
