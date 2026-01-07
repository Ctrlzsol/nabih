
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../config/types';

interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  country: string;
  role: UserRole;
  storeName?: string;
  crNumber?: string;
  taxNumber?: string;
  storeCategory?: string;
  storeAddress?: string;
}

export const registerUser = async (payload: RegisterPayload) => {
  const { email, password, fullName, phone, country, role, storeName, crNumber, taxNumber, storeCategory, storeAddress } = payload;

  // Map 'consumer' to 'individual' for DB consistency
  const dbRole = role === 'consumer' ? 'individual' : role;

  // 1. Construct Metadata
  // The DB Trigger will read these values to create the Profile and Role entries.
  const metadata: Record<string, any> = {
    full_name: fullName,
    phone: phone,
    country: country,
    role: dbRole,
  };

  try {
    // 2. Perform Sign Up
    // We do NOT manually insert into 'profiles' or 'user_roles' here. 
    // The Postgres Trigger 'handle_new_user' MUST handle that to avoid race conditions.
    const { data: authData, error: authError } = await (supabase.auth as any).signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (authError) {
      console.error("Auth Signup Error:", authError);
      throw authError;
    }

    if (!authData.user || !authData.user.id) {
      throw new Error("Registration completed but User ID is missing.");
    }

    // 3. Handle Merchant Specific Data
    // The trigger only creates the base profile. If this is a merchant, we need to add the request details.
    if (authData.session && role === 'merchant') {
      try {
          // Optimization: Wait 500ms to ensure the DB Trigger has finished creating the 'profiles' row
          // to satisfy the Foreign Key constraint on 'merchant_requests'.
          await new Promise(resolve => setTimeout(resolve, 500));

          const merchantPayload: any = {
            user_id: authData.user.id,
            store_name: storeName,
            status: 'pending'
          };

          if (crNumber) merchantPayload.commercial_register = crNumber;
          if (taxNumber) merchantPayload.tax_number = taxNumber;
          if (storeCategory) merchantPayload.store_category = storeCategory;
          if (storeAddress) merchantPayload.store_address = storeAddress;

          const { error: merchantError } = await supabase
            .from('merchant_requests')
            .upsert(merchantPayload, { onConflict: 'user_id' });

          if (merchantError) {
             console.error("Merchant Details Error:", merchantError);
             // We don't throw here, as the account is created. User can update details later.
          }
      } catch (mErr) {
          console.error("Failed to save merchant details", mErr);
      }
    }

    return true;

  } catch (error: any) {
    console.error("Registration Process Error:", error);
    // Return a clean error message to the UI
    throw new Error(error.message || "Registration failed. Please try again.");
  }
};
