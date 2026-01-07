
import { supabase } from '../../lib/supabase';
import { UserProfile, UserRole, AccountStatus } from '../../config/types';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // 1. Fetch Basic Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) return null;

    // 2. Fetch All Roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles: UserRole[] = roleData?.map((r: any) => r.role) || [];
    if (roles.length === 0) roles.push('individual');

    // Admin Override for specific user (Failsafe)
    if (profile.email === 'hamzaamink@outlook.com' && !roles.includes('admin')) {
        roles.push('admin');
    }

    // Determine Primary Role (Priority: Admin > Merchant > Individual)
    let primaryRole: UserRole = 'individual';
    if (roles.includes('admin')) primaryRole = 'admin';
    else if (roles.includes('merchant')) primaryRole = 'merchant';

    let status: AccountStatus = 'active';
    let storeName: string | undefined = undefined;

    // 3. If Merchant, fetch Merchant Details
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
      name: profile.full_name,
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
    console.error("Get User Profile Error:", err);
    return null;
  }
};
