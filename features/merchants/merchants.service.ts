
import { supabase } from '../../lib/supabase';
import { MerchantAd, AccountStatus, AdStatus } from '../../config/types';

export const createMerchantRequest = async (userId: string, storeName: string, crNumber?: string): Promise<void> => {
  // New Schema: merchant_requests (user_id, status, commercial_register)
  
  const merchantData = {
    user_id: userId,
    store_name: storeName, 
    commercial_register: crNumber || null,
    status: 'pending'
  };

  try {
      const { error } = await supabase
        .from('merchant_requests')
        .insert(merchantData);

      if (error) {
        if (error.code === '23505') return; // Ignore duplicates
        console.error("Merchant Request Error:", error.message || error);
        throw new Error(error.message);
      }
  } catch (err: any) {
      // Re-throw meaningful string errors for the UI
      throw new Error(err.message || "Failed to create merchant request");
  }
};

export const getMerchantRequestStatus = async (userId: string): Promise<AccountStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('merchant_requests')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) return null;
    if (!data) return null;
    return data.status as AccountStatus;
  } catch {
    return null;
  }
};

export const getMerchantAds = async (merchantId: string): Promise<MerchantAd[]> => {
  try {
    const { data } = await supabase
        .from('ads') 
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
    return (data || []).map((ad: any) => ({
        id: ad.id,
        merchantId: ad.merchant_id,
        merchantName: ad.merchant_name,
        title: ad.title,
        description: ad.description,
        imageUrl: ad.image_url,
        targetUrl: ad.target_url,
        targetCountries: ad.target_countries || [],
        category: ad.category,
        tags: ad.tags || [],
        status: ad.status,
        impressions: ad.impressions || 0,
        clicks: ad.clicks || 0,
        ctr: ad.ctr || 0,
        createdAt: ad.created_at
    }));
  } catch { return []; }
};

export const createMerchantAd = async (adData: Partial<MerchantAd>): Promise<boolean> => {
  try {
      const { error } = await supabase.from('ads').insert({ 
          merchant_id: adData.merchantId,
          merchant_name: adData.merchantName,
          title: adData.title,
          description: adData.description,
          image_url: adData.imageUrl,
          target_url: adData.targetUrl,
          target_countries: adData.targetCountries,
          category: adData.category,
          tags: adData.tags,
          status: 'active' // Direct posting - No approval needed
      });
      return !error;
  } catch { return false; }
};

export const updateMerchantAd = async (adId: string, adData: Partial<MerchantAd>): Promise<boolean> => {
    try {
        const { error } = await supabase.from('ads').update({ 
            ...adData,
            // Keep status as is or set to active if it was draft. Do not reset to pending.
            updated_at: new Date().toISOString()
        }).eq('id', adId);
        return !error;
    } catch { return false; }
};

export const updateMerchantProfile = async (userId: string, data: any): Promise<boolean> => {
    try {
        const updateData: any = {};
        if (data.phone) updateData.phone = data.phone;
        
        // Update profile phone
        if (Object.keys(updateData).length > 0) {
             await supabase.from('profiles').update(updateData).eq('id', userId);
        }

        // Update store name in merchant_requests
        if (data.storeName) {
             await supabase.from('merchant_requests').update({ store_name: data.storeName }).eq('user_id', userId);
        }

        return true;
    } catch { return false; }
};

// --- PUBLIC MERCHANT PROFILE METHODS ---

export const getPublicMerchantProfile = async (merchantId: string) => {
    try {
        // Fetch store details from merchant_requests
        const { data, error } = await supabase
            .from('merchant_requests')
            .select('store_name, store_category, profiles(full_name, email, phone)')
            .eq('user_id', merchantId)
            .single();
        
        if (error || !data) return null;

        return {
            id: merchantId,
            storeName: data.store_name,
            category: data.store_category || 'General Store',
            contactName: (data.profiles as any)?.full_name,
            email: (data.profiles as any)?.email,
            phone: (data.profiles as any)?.phone
        };
    } catch {
        return null;
    }
};

export const getPublicMerchantAds = async (merchantId: string): Promise<MerchantAd[]> => {
    try {
        const { data } = await supabase
            .from('ads') 
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('status', 'active') // Only Active Ads
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        return (data || []).map((ad: any) => ({
            id: ad.id,
            merchantId: ad.merchant_id,
            merchantName: ad.merchant_name,
            title: ad.title,
            description: ad.description,
            imageUrl: ad.image_url,
            targetUrl: ad.target_url,
            targetCountries: ad.target_countries || [],
            category: ad.category,
            tags: ad.tags || [],
            status: ad.status,
            impressions: ad.impressions || 0,
            clicks: ad.clicks || 0,
            ctr: ad.ctr || 0,
            createdAt: ad.created_at
        }));
    } catch { return []; }
};
