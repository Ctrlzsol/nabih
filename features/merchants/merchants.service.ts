
import { supabase } from '../../lib/supabase';
import { MerchantAd, AccountStatus, AdStatus } from '../../config/types';

export const createMerchantRequest = async (userId: string, storeName: string, crNumber?: string): Promise<void> => {
  // Kept for backward compatibility during auth, but profile updates now go strictly to 'merchants'
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
      if (error && error.code !== '23505') console.error("Merchant Request Error:", error.message);
  } catch (err: any) {
      console.warn("Create Merchant Request Warning:", err.message || err);
  }
};

export const getMerchantRequestStatus = async (userId: string): Promise<AccountStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('merchant_requests')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.status as AccountStatus;
  } catch {
    return null;
  }
};

export const getMerchantAds = async (merchantId: string): Promise<MerchantAd[]> => {
  try {
    // JOIN with campaigns to get the name
    // REMOVED: .neq('status', 'deleted') filter to allow merchants to see removed ads
    const { data, error } = await supabase
        .from('ads') 
        .select('*, campaigns(title)')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;

    return (data || []).map((ad: any) => ({
        id: ad.id,
        merchantId: ad.merchant_id,
        merchantName: ad.merchant_name,
        title: ad.title,
        description: ad.description,
        imageUrl: ad.image_url,
        targetUrl: ad.target_url,
        targetCountries: ['JO'], // Defaulting as not in strict schema
        category: ad.category,
        tags: [], // Not in strict schema
        status: ad.status,
        rejectionReason: ad.rejection_reason || null, // Map the reason correctly
        impressions: 0, 
        clicks: 0,
        ctr: 0,
        createdAt: ad.created_at || new Date().toISOString(),
        isDeleted: ad.status === 'deleted',
        entryType: ad.entry_type || 'single',
        campaignId: ad.campaign_id,
        campaignName: ad.campaigns?.title // Mapped from join
    }));
  } catch (err: any) { 
      console.warn("Error fetching ads:", err.message || err);
      return []; 
  }
};

export const uploadAdImage = async (file: File, merchantId: string): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop() || 'png';
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20); 
        const timestamp = Date.now();
        const filePath = `${merchantId}/${timestamp}-${cleanFileName}.${fileExt}`;
        const bucketName = 'ad-images';

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return urlData.publicUrl;
    } catch (e: any) {
        console.error("Upload Error:", e);
        throw e;
    }
};

export const createMerchantAd = async (adData: Partial<MerchantAd>): Promise<{success: boolean, message?: string}> => {
  try {
      // STRICT SCHEMA MAPPING: Single Ad
      const { error } = await supabase.from('ads').insert({ 
          merchant_id: adData.merchantId,
          merchant_name: adData.merchantName,
          title: adData.title,
          description: adData.description,
          image_url: adData.imageUrl,
          target_url: adData.targetUrl,
          category: adData.category,
          status: 'active',
          entry_type: 'single',
          campaign_id: null
      });
      if (error) throw error;
      return { success: true };
  } catch (err: any) {
      // --- AD BLOCKER BYPASS LOGIC (CREATE) ---
      const msg = err?.message || (typeof err === 'string' ? err : '');
      if (msg.includes('Failed to fetch') || msg.includes('Network') || (err instanceof TypeError)) {
          try {
              // RPC Fallback for creation
              // Ensure we don't send undefined, which might cause RPC signature mismatch
              const { error: rpcError } = await supabase.rpc('create_ad_secure', {
                  p_merchant_id: adData.merchantId,
                  p_merchant_name: adData.merchantName,
                  p_title: adData.title || 'Untitled',
                  p_description: adData.description || '',
                  p_image_url: adData.imageUrl || '',
                  p_target_url: adData.targetUrl || '',
                  p_category: adData.category || 'General'
              });
              if (!rpcError) return { success: true };
              // Silent fail on RPC to avoid console noise if function missing
          } catch (e) { /* ignore secondary error */ }
      }
      // ----------------------------------------

      console.error("Create Ad Error:", err);
      return { success: false, message: err.message || 'Unknown error' };
  }
};

// Helper to create campaign in 'campaigns' table
const createCampaign = async (merchantId: string, name: string, budget?: string, startDate?: string, endDate?: string) => {
    const { data, error } = await supabase
        .from('campaigns')
        .insert({ 
            merchant_id: merchantId, 
            title: name, 
            status: 'active',
            budget: budget ? parseFloat(budget) : null,
            start_date: startDate || null,
            end_date: endDate || null
        })
        .select()
        .single();
    if (error) throw error;
    return data;
};

// NEW: Multi-Product Campaign Creation
export const createFullCampaign = async (
    merchantId: string, 
    merchantName: string,
    campaignData: { title: string, budget: string, startDate: string, endDate: string },
    products: { title: string, description: string, price: string, targetUrl: string, category: string, file: File | null }[]
): Promise<{ success: boolean; message?: string; count?: number }> => {
    try {
        // 1. Create the Campaign Wrapper
        const campaign = await createCampaign(
            merchantId, 
            campaignData.title, 
            campaignData.budget, 
            campaignData.startDate, 
            campaignData.endDate
        );

        if (!campaign || !campaign.id) throw new Error("Failed to create campaign record.");

        // 2. Process Products (Upload Images & Map Data)
        const adPromises = products.map(async (prod) => {
            let imageUrl = '';
            if (prod.file) {
                const url = await uploadAdImage(prod.file, merchantId);
                if (url) imageUrl = url;
            }

            // Append Price to description if needed, or handle as metadata if DB supports it
            const finalDesc = prod.price 
                ? `${prod.description}\nPrice: ${prod.price}` 
                : prod.description;

            return {
                merchant_id: merchantId,
                merchant_name: merchantName,
                title: prod.title,
                description: finalDesc,
                image_url: imageUrl,
                target_url: prod.targetUrl,
                category: prod.category || 'General',
                status: 'active',
                entry_type: 'campaign',
                campaign_id: campaign.id
            };
        });

        const adsToInsert = await Promise.all(adPromises);

        // 3. Bulk Insert Ads
        const { error: adsError } = await supabase.from('ads').insert(adsToInsert);
        
        if (adsError) throw adsError;

        return { success: true, count: adsToInsert.length };

    } catch (err: any) {
        console.error("Full Campaign Creation Error:", err);
        return { success: false, message: err.message || 'Unknown error' };
    }
};

export const bulkCreateMerchantAds = async (ads: Partial<MerchantAd>[], campaignInfo?: { isCampaign: boolean, name: string }): Promise<{success: boolean, count: number, message?: string}> => {
    try {
        if (ads.length === 0) return { success: true, count: 0 };

        let campaignId = null;
        let entryType = 'single';

        // 1. Create Campaign if needed
        if (campaignInfo?.isCampaign && campaignInfo.name && ads[0].merchantId) {
             const camp = await createCampaign(ads[0].merchantId, campaignInfo.name);
             campaignId = camp.id;
             entryType = 'campaign';
        }

        // 2. Map Data to Strict Schema
        const insertData = ads.map(ad => ({
            merchant_id: ad.merchantId,
            merchant_name: ad.merchantName,
            title: ad.title,
            description: ad.description,
            image_url: ad.imageUrl,
            target_url: ad.targetUrl,
            category: ad.category || 'General',
            status: 'active',
            entry_type: entryType,
            campaign_id: campaignId
        }));

        const { error } = await supabase.from('ads').insert(insertData);
        if (error) throw error;
        
        return { success: true, count: ads.length };
    } catch (err: any) {
        console.error("Bulk Import Error:", err);
        return { success: false, count: 0, message: err.message || 'Unknown error' };
    }
};

export const updateMerchantAd = async (adId: string, adData: Partial<MerchantAd>): Promise<{success: boolean, message?: string}> => {
    try {
        // When updating, we reset status to 'active' and clear rejection_reason
        // This allows the ad to go back into the system after a fix
        const { error } = await supabase.from('ads').update({ 
            title: adData.title,
            description: adData.description,
            image_url: adData.imageUrl,
            target_url: adData.targetUrl,
            category: adData.category,
            status: 'active', 
            rejection_reason: null
        }).eq('id', adId);
        
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        // --- AD BLOCKER BYPASS LOGIC (UPDATE) ---
        const msg = err?.message || (typeof err === 'string' ? err : '');
        
        // Check specifically for network failures common with AdBlockers blocking 'ads' table
        if (msg.includes('Failed to fetch') || msg.includes('Network') || (err instanceof TypeError)) {
            try {
                console.warn("Update blocked by network (AdBlocker likely). Attempting Secure RPC Fallback.");
                // Ensure no undefined values are sent to RPC
                const { error: rpcError } = await supabase.rpc('update_ad_secure', {
                    p_id: adId,
                    p_title: adData.title || null,
                    p_description: adData.description || null,
                    p_image_url: adData.imageUrl || null,
                    p_target_url: adData.targetUrl || null,
                    p_category: adData.category || null
                });
                
                if (!rpcError) return { success: true };
                // Silent fail on RPC
            } catch (rpcErr) {
               // Ignore
            }
        }
        // ----------------------------------------

        return { success: false, message: err.message || 'Unknown error' };
    }
};

export const toggleMerchantAdStatus = async (adId: string, currentStatus: AdStatus): Promise<{ success: boolean; message?: string }> => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
        // Attempt Direct Update
        const { error } = await supabase.from('ads').update({ status: newStatus }).eq('id', adId);
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        const msg = err?.message || (typeof err === 'string' ? err : '');
        
        // Detect AdBlocker interference or Network failure
        if (msg.includes('Failed to fetch') || msg.includes('Network') || (err instanceof TypeError)) {
             try {
                 // RPC Fallback: Bypass URL filters by calling a stored procedure
                 // NOTE: Ensure 'update_ad_status' function exists in Supabase DB
                 const { error: rpcError } = await supabase.rpc('update_ad_status', { 
                     p_ad_id: adId, 
                     p_status: newStatus 
                 });
                 
                 if (!rpcError) return { success: true };
                 
                 console.error("RPC Status Update failed:", rpcError.message);
             } catch (rpcErr) {
                 // Fall through to return error message
             }
             
             return { success: false, message: "Network error. Please disable AdBlocker as it might be blocking the 'ads' update." };
        }
        return { success: false, message: msg || 'Failed to update status.' };
    }
};

// Retry helper for soft delete to handle "Failed to fetch" transient errors
const retrySoftDelete = async (adId: string, retries = 3, delay = 500): Promise<void> => {
    try {
        // CRITICAL UPDATE: 
        // We MUST use .select() to verify the update actually touched a row.
        // If RLS denies update, 'error' might be null but 'data' will be empty.
        // This prevents "Silent Failures" where UI says success but DB didn't update.
        const { data, error } = await supabase.from('ads')
            .update({ status: 'deleted' })
            .eq('id', adId)
            .select(); 
        
        if (error) throw error;
        
        // If data is empty, it means no row was updated (likely RLS or ID not found)
        if (!data || data.length === 0) {
            throw new Error("Update verification failed: No rows modified. Check permissions.");
        }

    } catch (err: any) {
        const msg = err?.message || (typeof err === 'string' ? err : '');
        
        // 1. Check for Network/AdBlocker interference (Common with 'ads' table)
        // AdBlockers often block requests to 'ads' endpoints, causing 'Failed to fetch'
        const isNetworkError = msg.toLowerCase().includes('failed to fetch') || 
                             msg.toLowerCase().includes('network') ||
                             (err instanceof TypeError);

        // Also check for the custom verification error we just threw
        const isVerificationError = msg.includes("verification failed");

        if (isNetworkError || isVerificationError) {
             // Attempt RPC Fallback (Bypasses URL filters AND acts as secondary update method)
             try {
                // Silently attempt fallback to avoid confusing the user with warnings
                const { error: rpcError } = await supabase.rpc('soft_delete_ad', { 
                    ad_id: adId, 
                    reason: 'merchant_delete_fallback' 
                });
                
                if (!rpcError) return; // Success!
             } catch (e) {
                // RPC failed too, continue to retry logic
             }
        }

        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return retrySoftDelete(adId, retries - 1, delay * 2);
        }
        
        if (err instanceof Error) throw err;
        throw new Error(msg || 'Operation failed');
    }
};

export const softDeleteMerchantAd = async (adId: string): Promise<{ success: boolean; message?: string }> => {
    // Basic connectivity check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { success: false, message: "No internet connection. Please check your network." };
    }

    try {
        // Attempt soft delete with retry logic
        await retrySoftDelete(adId);
        return { success: true };
    } catch (err: any) {
        let msg = "An unexpected error occurred.";
        let isNetwork = false;

        // Extract message from various possible error structures
        if (err) {
            if (typeof err === 'string') {
                msg = err;
            } else if (err.message) {
                msg = err.message;
            } else if (err.error_description) {
                msg = err.error_description;
            } else if (err.details) {
                msg = err.details;
            } else {
                try {
                    const json = JSON.stringify(err);
                    if (json !== '{}') msg = json.substring(0, 200);
                } catch {
                    msg = "Unknown Error";
                }
            }
        }

        // Detect network issues based on common browser error messages
        const lowerMsg = msg.toLowerCase();
        if (
            lowerMsg.includes("failed to fetch") || 
            lowerMsg.includes("network error") ||
            lowerMsg.includes("connection")
        ) {
            isNetwork = true;
            // Explicitly mention AdBlocker as a likely cause for 'ads' table failures
            msg = "Network error. Please disable AdBlocker (it may be blocking the 'ads' update) or check connection.";
        }

        // Log appropriately to avoid console noise for expected network errors
        if (isNetwork) {
            console.warn("Soft delete failed due to network/AdBlocker:", err.message || err);
        } else {
            console.error("Soft delete failed after retries:", err);
        }
        
        // Final cleanup for UI display
        if (msg === "{}" || msg.includes("[object Object]")) {
            msg = "Operation failed. Please try again.";
        }

        return { success: false, message: msg };
    }
};

export const updateMerchantProfile = async (userId: string, data: any): Promise<boolean> => {
    try {
        // STRICT UPDATE: Target 'merchants' table only
        const merchantData = {
            id: userId,
            store_name: data.storeName,
            email: data.email,
            website_url: data.websiteUrl,
            location_url: data.locationUrl,
            address_details: data.storeAddress,
            branches: data.branches, // JSONB
            phone: data.phone
        };

        const { error } = await supabase.from('merchants').upsert(merchantData, { onConflict: 'id' });

        if (error) {
            console.error("Merchant Update Error:", error);
            throw error;
        }
        return true;
    } catch (e: any) { 
        console.error("Profile update failed:", e.message || e);
        return false; 
    }
};

export const getPublicMerchantProfile = async (merchantId: string) => {
    try {
        const { data: merchantData, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', merchantId)
            .maybeSingle();
        
        if (!merchantData) return null;

        return {
            id: merchantId,
            storeName: merchantData.store_name,
            email: merchantData.email,
            phone: merchantData.phone,
            websiteUrl: merchantData.website_url,
            locationUrl: merchantData.location_url,
            address: merchantData.address_details, 
            branches: merchantData.branches || []
        };
    } catch (err) {
        console.error("Error fetching merchant profile:", err);
        return null;
    }
};

export const getPublicMerchantAds = async (merchantId: string): Promise<MerchantAd[]> => {
    // Reusing the general fetch but filtering for active
    try {
        const ads = await getMerchantAds(merchantId);
        return ads.filter(a => a.status === 'active');
    } catch { return []; }
};
