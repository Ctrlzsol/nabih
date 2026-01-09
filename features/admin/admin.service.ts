
import { supabase } from '../../lib/supabase';
import { UserProfile, MerchantAd, AccountStatus, AdStatus } from '../../config/types';

// --- STRICT ANALYTICS FETCHING ---

export const fetchIndividualStats = async () => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'individual');
    return data || [];
  } catch (error) {
    return [];
  }
};

export const fetchMerchantStats = async () => {
  try {
    const { data } = await supabase
      .from('merchants')
      .select('*');
    return data || [];
  } catch (error) {
    return [];
  }
};

export const getStrictSystemCounts = async () => {
  try {
    const { count: individualCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'individual');
    
    const { count: merchantCount } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true });
    
    // Check for active ads (not deleted)
    const { count: adsCount } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'deleted');

    return {
      individuals: individualCount || 0,
      merchants: merchantCount || 0,
      ads: adsCount || 0
    };
  } catch (err) {
    return { individuals: 0, merchants: 0, ads: 0 };
  }
};

// --- STATS ---
export const getRealTimeStats = async () => {
  try {
    const stats = await getStrictSystemCounts();
    return {
      individualCount: stats.individuals,
      merchantCount: stats.merchants,
      adminCount: 1, 
      activeAdCount: stats.ads,
      campaignCount: 0
    };
  } catch (error) {
    return { individualCount: 0, merchantCount: 0, adminCount: 0, activeAdCount: 0, campaignCount: 0 };
  }
};

// --- USERS MANAGEMENT ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: rolesData } = await supabase.from('user_roles').select('*');
    const { data: merchantsData } = await supabase.from('merchants').select('*'); // Fetch source of truth for merchants
    
    const safeProfiles = profiles || [];
    const safeRoles = rolesData || [];
    const safeMerchants = merchantsData || [];

    return safeProfiles.map((p: any) => {
        const userRoleEntries = safeRoles.filter((r: any) => r.user_id === p.id);
        const userRoles = userRoleEntries.map((r: any) => r.role);
        
        if (p.role && !userRoles.includes(p.role)) {
            userRoles.push(p.role);
        }
        
        if (userRoles.length === 0) {
            userRoles.push('individual');
        }

        // Find merchant details if available
        const merchant = safeMerchants.find((m: any) => m.id === p.id);

        return {
            id: p.id,
            name: p.full_name || 'User',
            email: p.email || '',
            phone: merchant?.phone || p.phone || '', // Prefer merchant phone
            country: p.country || 'JO',
            role: userRoles.includes('admin') ? 'admin' : userRoles.includes('merchant') ? 'merchant' : 'individual',
            roles: userRoles,
            status: p.status || 'active',
            createdAt: p.created_at || new Date().toISOString(),
            storeName: merchant?.store_name || p.store_name, // Prefer merchant table store_name
            crNumber: p.cr_number,
            storeCategory: p.store_category
        };
    });
  } catch (err) {
    console.error("Admin: Get Users Failed", err);
    return [];
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase.from('profiles').update({
        full_name: updates.name,
        phone: updates.phone,
        country: updates.country,
    }).eq('id', userId);
    return !error;
  } catch { return false; }
};

export const toggleUserRole = async (userId: string, roleToToggle: string, shouldHaveRole: boolean): Promise<{ success: boolean; message?: string }> => {
  try {
    if (shouldHaveRole) {
      const { error } = await supabase
        .from('user_roles')
        .upsert(
            { user_id: userId, role: roleToToggle }, 
            { onConflict: 'user_id, role' }
        );

      if (error) return { success: false, message: `Failed to add role: ${error.message}` };
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .match({ user_id: userId, role: roleToToggle });
        
      if (error) return { success: false, message: `Failed to remove role: ${error.message}` };
    }

    const { data: currentRoles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    let roleList = currentRoles?.map((r: any) => r.role) || [];
    
    if (shouldHaveRole && !roleList.includes(roleToToggle)) roleList.push(roleToToggle);
    else if (!shouldHaveRole) roleList = roleList.filter((r: string) => r !== roleToToggle);

    let primaryRole = 'individual';
    if (roleList.includes('admin')) primaryRole = 'admin';
    else if (roleList.includes('merchant')) primaryRole = 'merchant';
    
    await supabase.from('profiles').update({ role: primaryRole }).eq('id', userId);

    return { success: true };
  } catch (err: any) { 
    return { success: false, message: err.message || "Unknown error occurred" }; 
  }
};

export const deleteUserAccount = async (userId: string) => {
    try { 
        const { error } = await supabase.from('profiles').update({ status: 'deleted' }).eq('id', userId);
        if (error) await supabase.from('profiles').delete().eq('id', userId);
    } catch {}
};

// --- ADS ---

export const getAllAds = async (): Promise<MerchantAd[]> => {
    try {
        // ADMIN VIEW: Join with campaigns to get name
        const { data } = await supabase
            .from('ads')
            .select('*, campaigns(title)')
            .neq('status', 'deleted') // Filter deleted ads by default in standard view
            .order('created_at', { ascending: false });
            
        return (data || []).map((ad: any) => ({
            id: ad.id,
            merchantId: ad.merchant_id,
            merchantName: ad.merchant_name,
            title: ad.title,
            description: ad.description,
            imageUrl: ad.image_url,
            targetUrl: ad.target_url,
            category: ad.category,
            status: ad.status,
            createdAt: ad.created_at,
            entryType: ad.entry_type || 'single',
            campaignId: ad.campaign_id,
            campaignName: ad.campaigns?.title, // Mapped from join
            isDeleted: ad.status === 'deleted', // Ensure we map deletion status
            rejectionReason: ad.rejection_reason // Map rejection reason
        }));
    } catch { return []; }
};

export const updateAdStatus = async (adId: string, status: AdStatus) => {
    try {
        const { error } = await supabase.from('ads').update({ status }).eq('id', adId);
        if (error) throw error;
        return true;
    } catch (e) { return false; }
};

export const bulkSuspendAds = async (adIds: string[], reason: string) => {
    try {
        if (!adIds || adIds.length === 0) return { success: true };

        // USE RPC 'suspend_ad_entry'
        const promises = adIds.map(id => 
            supabase.rpc('suspend_ad_entry', { 
                ad_id: id, 
                reason: reason 
            })
        );

        const results = await Promise.all(promises);
        
        const failure = results.find(r => r.error);
        if (failure?.error) throw failure.error;

        return { success: true };
    } catch (err: any) {
        console.error("Bulk Suspend RPC Error:", err);
        return { success: false, message: err.message || "Unknown RPC error" };
    }
};

export const removeAdEntries = async (adIds: string[], reason: string) => {
    if (!adIds || adIds.length === 0) return { success: true };
    try {
        // USE NEW RPC 'soft_delete_ad' with Reason
        const promises = adIds.map(id => 
            supabase.rpc('soft_delete_ad', { 
                ad_id: id,
                reason: reason
            })
        );
        
        const results = await Promise.all(promises);

        const failure = results.find(r => r.error);
        if (failure?.error) throw failure.error;

        return { success: true };
    } catch (err: any) {
         console.error("Remove Ads RPC Error:", err);
         return { success: false, message: err.message || "Unknown error" };
    }
};

// --- ANALYTICS ---

export const getGlobalSearchHistory = async (): Promise<any[]> => {
    try {
        const { data } = await supabase.from('search_history').select('*').order('created_at', { ascending: false }).limit(200);
        return (data || []).map((item: any) => ({
            id: item.id,
            query: item.query,
            country: item.country,
            timestamp: item.created_at
        }));
    } catch { return []; }
};
