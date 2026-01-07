
import { supabase } from '../../lib/supabase';
import { UserProfile, MerchantAd, AccountStatus, AdStatus, UserRole, HistoryItem } from '../../config/types';

// --- USERS MANAGEMENT ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // 1. Fetch ALL profiles (Source of Truth)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (profileError) {
        console.error("Admin Service: Error fetching profiles", profileError.message);
        // Fail gracefully to allow UI to render empty state rather than crash
    }

    // 2. Fetch ALL Roles
    const { data: rolesData } = await supabase.from('user_roles').select('*');

    // 3. Fetch ALL Merchant Requests
    const { data: requests } = await supabase.from('merchant_requests').select('*');

    const safeProfiles = profiles || [];
    const safeRoles = rolesData || [];
    const safeRequests = requests || [];

    // 4. Map and Merge Data with Strict Logic
    return safeProfiles.map((p: any) => {
        // Determine roles from DB
        const userRoleEntries = safeRoles.filter((r: any) => r.user_id === p.id);
        let userRoles: UserRole[] = userRoleEntries.map((r: any) => r.role as UserRole);

        // SYNC LOGIC: If no roles in DB, they are INDIVIDUAL by default.
        if (userRoles.length === 0) {
            userRoles = ['individual'];
        }

        // Merchant Request Check - Attach store details if available
        const reqObj = safeRequests.find((r: any) => r.user_id === p.id);

        // Determine Primary Status
        let status: AccountStatus = p.status || 'active';
        
        // If they have a merchant component, prioritize merchant status
        if (userRoles.includes('merchant') && reqObj) {
            status = reqObj.status as AccountStatus;
        }

        return {
            id: p.id,
            name: p.full_name || 'مستخدم نبيه',
            email: p.email || 'No Email',
            phone: p.phone || '-',
            country: p.country || 'JO',
            // Primary role for display (Admin > Merchant > Individual)
            role: userRoles.includes('admin') ? 'admin' : userRoles.includes('merchant') ? 'merchant' : 'individual',
            roles: userRoles, // Complete array for Hybrid detection
            status: status,
            storeName: reqObj?.store_name,
            crNumber: reqObj?.commercial_register,
            taxNumber: reqObj?.tax_number,
            storeCategory: reqObj?.store_category,
            storeAddress: reqObj?.store_address,
            createdAt: p.created_at || new Date().toISOString(),
            isDeleted: p.is_deleted || false
        };
    }).filter(p => !p.isDeleted); // Soft delete filter

  } catch (err: any) {
    console.error("Admin: Get Users Failed", err.message || err);
    return [];
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase.from('profiles').update({
        full_name: updates.name,
        phone: updates.phone,
        country: updates.country,
        email: updates.email 
    }).eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err: any) { 
      console.error("Update Profile Error", err.message || err);
      return false; 
  }
};

// --- MULTI-ROLE TOGGLE LOGIC ---
export const toggleUserRole = async (userId: string, role: string, shouldHaveRole: boolean) => {
  try {
    if (shouldHaveRole) {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role });

      if (error && error.code !== '23505') throw error; // Ignore duplicates
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    }
    return true;
  } catch (err: any) {
    console.error("Toggle Role Final Error:", err.message || err);
    return false;
  }
};

export const deleteUserAccount = async (userId: string) => {
    try {
        await supabase.from('profiles').update({ is_deleted: true, status: 'deleted' }).eq('id', userId);
    } catch (e: any) {
        console.error("Soft delete failed:", e.message || e);
    }
};

// --- ADS / CONTENT CONTROL ---

export const getAllAds = async (): Promise<MerchantAd[]> => {
    try {
        const { data, error } = await supabase
            .from('ads') 
            .select('*')
            .order('created_at', { ascending: false }); // Newest first
        
        if (error) throw error;

        let filteredAds = data || [];
        filteredAds = filteredAds.filter((ad: any) => ad.is_deleted !== true && ad.status !== 'deleted');

        return filteredAds.map((ad: any) => ({
            id: ad.id,
            merchantId: ad.merchant_id,
            merchantName: ad.merchant_name,
            title: ad.title,
            description: ad.description,
            imageUrl: ad.image_url,
            targetUrl: ad.target_url,
            targetCountries: ad.target_countries,
            category: ad.category,
            tags: ad.tags,
            status: ad.status,
            rejectionReason: ad.rejection_reason, 
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: ad.ctr,
            createdAt: ad.created_at
        }));
    } catch (e: any) {
        console.error("Get Ads Error", e.message || e);
        return [];
    }
};

export const updateAdStatus = async (adId: string, status: AdStatus) => {
    try {
        const updateData: any = { 
            status: status,
            updated_at: new Date().toISOString()
        };
        
        // CRITICAL FIX: Explicitly nullify rejection reason on approval
        if (status === 'active') {
            updateData.rejection_reason = null;
        }

        const { error } = await supabase.from('ads').update(updateData).eq('id', adId);
        
        if (error) throw error;
        return true;
    } catch (e: any) {
        const msg = e.message || e.toString();
        console.error("Update Ad Status Failed:", msg);
        return false;
    }
};

export const updateAdStatusWithReason = async (adId: string, status: AdStatus, reason: string) => {
    try {
        const { error } = await supabase.from('ads').update({ 
            status: status,
            rejection_reason: reason,
            updated_at: new Date().toISOString()
        }).eq('id', adId);
        
        if (error) throw error;
        return true;
    } catch (e: any) {
        const msg = e.message || e.toString();
        console.error("Update Ad Status w/ Reason Error:", msg);
        return false;
    }
};

export const deleteAd = async (adId: string, reason?: string) => {
    try {
        const updates: any = { is_deleted: true, status: 'deleted', updated_at: new Date().toISOString() };
        if (reason) updates.rejection_reason = reason;
        await supabase.from('ads').update(updates).eq('id', adId); 
        return true;
    } catch (e: any) {
        const msg = e.message || e.toString();
        console.error("Delete Ad Failed:", msg);
        return false;
    }
};

// --- ANALYTICS ---

export const getGlobalSearchHistory = async (): Promise<any[]> => {
    try {
        const { data: history, error } = await supabase
            .from('search_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500); 
        
        if (error) throw error;
        if (!history || history.length === 0) return [];

        const userIds = Array.from(new Set(history.map((h: any) => h.user_id).filter(Boolean)));
        let profilesMap: Record<string, string> = {};
        
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);
            
            if (profiles) {
                profiles.forEach((p: any) => { profilesMap[p.id] = p.full_name; });
            }
        }

        return history.map((item: any) => ({
            id: item.id,
            query: item.query,
            country: item.country,
            userName: profilesMap[item.user_id] || 'Guest',
            timestamp: item.created_at
        }));
    } catch (e: any) {
        console.error("Get History Failed:", e.message || e);
        return [];
    }
};
