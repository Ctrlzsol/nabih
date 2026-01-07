
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../../lib/supabase';
import { ComparisonResult, Language, SearchPreferences, ProductOption, HistoryItem, MerchantAd } from '../../config/types';
import { COUNTRIES, STORE_SEARCH_PATTERNS } from '../../config/constants';

const API_KEY = process.env.API_KEY; 
const MODEL_ENGINE = 'gemini-3-pro-preview'; 

// --- SEARCH HISTORY LOGIC ---

export const saveSearchToHistory = async (userId: string, query: string, country: string) => {
  try {
    await supabase.from('search_history').insert({ 
        user_id: userId, 
        query, 
        country
    });
  } catch {}
};

export const getSearchHistory = async (userId: string): Promise<HistoryItem[]> => {
  try {
    const { data } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .neq('is_deleted', true)
        .order('created_at', { ascending: false })
        .limit(20);
    return (data || []).map(item => ({ 
        id: item.id, 
        query: item.query, 
        country: item.country, 
        timestamp: item.created_at 
    }));
  } catch { return []; }
};

export const deleteHistoryItem = async (id: string) => {
  try { await supabase.from('search_history').update({ is_deleted: true }).eq('id', id); } catch {}
};

export const clearAllHistory = async (userId: string) => {
  try { await supabase.from('search_history').update({ is_deleted: true }).eq('user_id', userId); } catch {}
};

export const getSearchStats = async () => {
    const { count } = await supabase.from('search_history').select('*', { count: 'exact', head: true }).neq('is_deleted', true);
    return count || 0;
};

export const getRecentSearchActivity = async () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const { data } = await supabase.from('search_history').select('created_at').neq('is_deleted', true).gt('created_at', date.toISOString());
    return data || [];
};

// --- MERCHANT ADS SEARCH (CORE BUSINESS LOGIC) ---

export const searchMerchantAds = async (query: string, countryCode: string): Promise<MerchantAd[]> => {
    try {
        // Query the 'ads' table for active ads
        const { data, error } = await supabase
            .from('ads') 
            .select('*')
            .eq('status', 'active')
            .eq('is_deleted', false)
            .ilike('title', `%${query}%`)
            // .contains('target_countries', [countryCode]) // Uncomment if target_countries is an array type in DB
            .limit(3); // Limit to top 3 matching ads to avoid overwhelming results

        if (error) {
            console.error("Supabase Ads Search Error:", error);
            return [];
        }
        
        if (!data) return [];
        
        return data.map((ad: any) => ({
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
    } catch (err) {
        console.error("Error searching merchant ads:", err);
        return [];
    }
};

// --- GEMINI LOGIC ---

let isSupabaseCacheEnabled = true;

const LocalCache = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(`nabih_cache_${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > 6 * 60 * 60 * 1000) {
        localStorage.removeItem(`nabih_cache_${key}`);
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  },
  set: (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      try {
        localStorage.setItem(`nabih_cache_${key}`, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      } catch (e) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('nabih_cache_')) localStorage.removeItem(k);
        });
        localStorage.setItem(`nabih_cache_${key}`, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      }
    } catch (e) {
      console.warn("Local storage unavailable");
    }
  }
};

function getValidLink(productName: string, storeName: string, originalUrl: string): string {
  if (!originalUrl) {
      const query = `${productName} ${storeName}`;
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  let url = originalUrl.trim();
  url = url.replace(/&amp;/g, '&');

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const domain = urlObj.hostname;
    
    if (domain.toLowerCase().includes('google.') && (path.includes('/search') || path === '/' || path.includes('/url'))) {
        const query = `${productName} ${storeName}`;
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    const validProductPatterns = [
      /\/dp\//, /\/gp\/product\//, /\/p\//, /\/ad\//, /\/itm\//, /\/products?\//, /\/item\//, /\/buy\//, /\/catalog\//, /\.html$/
    ];

    const isValidDeepLink = validProductPatterns.some(pattern => pattern.test(path));
    const hasIdParam = urlObj.searchParams.has('id') || urlObj.searchParams.has('pid') || urlObj.searchParams.has('itemId');

    if (isValidDeepLink || hasIdParam) {
       const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
       paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
       return urlObj.toString();
    }

    const cleanDomain = domain.replace(/^www\./, '');
    const query = `${productName} site:${cleanDomain}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  } catch (e) {
    const query = `${productName} ${storeName}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

function getImageProxyUrl(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith('data:')) return originalUrl;
  return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&default=ssl:images.weserv.nl/light-grey.png&n=-1&w=400&h=400&fit=contain`;
}

function parsePriceValue(rawText: string | number | undefined): number | null {
  if (rawText === undefined || rawText === null) return null;
  if (typeof rawText === 'number') return rawText;
  try {
    const text = String(rawText).trim();
    const match = text.match(/[\d,]+(\.\d+)?/);
    if (match) {
      const cleanString = match[0].replace(/,/g, '');
      const val = parseFloat(cleanString);
      return isNaN(val) ? null : val;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function robustJsonParse(text: string) {
  if (!text) return null;
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/yi;
  const match = text.match(markdownRegex);
  let cleanText = match ? match[1] : text;

  cleanText = cleanText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    try {
        const firstCurly = cleanText.indexOf('{');
        const firstSquare = cleanText.indexOf('[');
        let startIndex = -1;
        if (firstCurly !== -1 && firstSquare !== -1) startIndex = Math.min(firstCurly, firstSquare);
        else if (firstCurly !== -1) startIndex = firstCurly;
        else if (firstSquare !== -1) startIndex = firstSquare;
        
        if (startIndex === -1) return null;
        const lastCurly = cleanText.lastIndexOf('}');
        const lastSquare = cleanText.lastIndexOf(']');
        const endIndex = Math.max(lastCurly, lastSquare);
        if (endIndex > startIndex) {
            const extracted = cleanText.substring(startIndex, endIndex + 1);
            return JSON.parse(extracted);
        }
    } catch (extractionError) {}
    return null;
  }
}

export const performComparison = async (
  userQuery: string,
  lang: Language,
  countryId: string,
  prefs: SearchPreferences,
  excludeNames: string[] = [] 
): Promise<ComparisonResult> => {
  const isAr = lang === 'ar';
  const isLoadMore = excludeNames.length > 0;
  const cacheKey = `${userQuery.toLowerCase().trim()}_${countryId}_${lang}_${prefs.priority}_${prefs.isGlobal ? 'GLO' : 'LOC'}_v9_LangFix`;
  
  if (!isLoadMore) {
    const localCachedResult = LocalCache.get(cacheKey);
    if (localCachedResult) return localCachedResult as ComparisonResult;
  }

  if (isSupabaseCacheEnabled && !isLoadMore) {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: cachedData } = await supabase
        .from('search_cache')
        .select('result')
        .eq('query_key', cacheKey)
        .gt('created_at', sixHoursAgo)
        .single();
      if (cachedData && cachedData.result) {
        LocalCache.set(cacheKey, cachedData.result);
        return cachedData.result as ComparisonResult;
      }
    } catch (err) {}
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const countryObj = COUNTRIES.find(c => c.id === countryId);
  const countryName = countryObj?.en || 'Global';
  const targetLanguage = isAr ? "Arabic" : "English";
  const dateStr = new Date().toISOString().split('T')[0];
  
  const systemInstruction = `
  You are 'Nabih' (نبيه), acting as a specialized backend shopping intelligence agent.
  DATE CONTEXT: Today is ${dateStr}.
  **LANGUAGE RULE (CRITICAL):**
  You MUST OUTPUT the JSON content STRICTLY in ${targetLanguage}.
  - If target is Arabic, ALL 'refinements', 'smart_filters', 'sorting_options', 'summary', 'pros', 'cons', 'features', 'shipping', 'warranty', 'stock', 'explanation' MUST be in Arabic.
  - Do NOT mix languages.
  PHASE 1: KNOWLEDGE UPDATE & INTENT OPTIMIZATION
  1. **BRAND REBRANDING**: "Carrefour" (كارفور) in Jordan -> **"Hypermax" (هايبرماكس)**.
  2. **MARKET AVAILABILITY**:
     - **JORDAN (JO)**: "NOON" (نون) does **NOT** exist. NEVER return results from Noon for Jordan.
     - **JORDAN (JO)**: Focus on Leaders, DNA, Smartbuy, Hypermax, City Center, Talabatey, OpenSooq.
  PHASE 2: FRESHNESS PROTOCOL
  - **CLASSIFIEDS**: For OpenSooq, Haraj, Facebook, Dubizzle -> **ONLY** accept listings from the last **60 DAYS**.
  PHASE 3: EXECUTION
  - Search Google Shopping, Local Stores, and Classifieds.
  - Return the exact product options found.
  OUTPUT FORMAT: JSON ONLY.
  `;

  const searchPrompt = `
  EXECUTE SEARCH for: "${userQuery}" in "${countryName}".
  Output Language: ${targetLanguage}.
  Return 12 distinct options in this JSON format:
  {
    "summary": "Professional market summary in ${targetLanguage}.",
    "refinements": ["SubCategory1", "SubCategory2"], 
    "smart_filters": ["Attribute1", "Attribute2"],
    "sorting_options": ["SortOption1", "SortOption2"],
    "products": [
      {
        "name": "Product Title",
        "price": "123 Currency",
        "unit_price": "e.g. '2 SAR/bottle' or null",
        "store": "Store Name",
        "link": "Direct URL or Homepage",
        "imageUrl": "URL", 
        "rating": 4.5,
        "reviewsCount": "100+",
        "score": 95,
        "shipping": "Shipping info in ${targetLanguage}",
        "shipping_cost": "Cost in ${targetLanguage}",
        "delivery_time": "Time in ${targetLanguage}",
        "warranty": "Warranty in ${targetLanguage}",
        "returns": "Policy in ${targetLanguage}",
        "stock": "In Stock/Out of Stock in ${targetLanguage}",
        "pros": ["Pro1 in ${targetLanguage}"],
        "cons": ["Con1 in ${targetLanguage}"],
        "features": ["Feature1 in ${targetLanguage}"],
        "explanation": "Verdict in ${targetLanguage}"
      }
    ]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ENGINE,
      contents: searchPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const data = robustJsonParse(response.text);
    
    if (data && data.products && Array.isArray(data.products)) {
        if (countryId === 'JO') {
             data.products = data.products.filter((p: any) => {
                 const storeName = p.store?.toLowerCase() || '';
                 const link = p.link?.toLowerCase() || '';
                 if (storeName.includes('noon') || link.includes('noon.com')) {
                     return false;
                 }
                 return true;
             });
        }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks.map(c => c.web?.uri).filter((u): u is string => !!u);

    if (data && data.products && Array.isArray(data.products)) {
        data.products.forEach((p: any) => {
            const storeKey = p.store?.toLowerCase().replace(/\s/g, '').split('.')[0];
            const matchingSource = webSources.find(url => 
                url.toLowerCase().includes(storeKey) && url.length > 25 
            );
            if (matchingSource) {
                if (!p.link || p.link.length < 30 || !p.link.includes('http')) {
                    p.link = matchingSource;
                }
            }
        });
    }

    if (!data || !data.products || !Array.isArray(data.products) || data.products.length === 0) {
      throw new Error(isAr ? "لم يتم العثور على نتائج دقيقة." : "No accurate results found.");
    }

    const options: ProductOption[] = data.products.map((p: any) => {
      const validatedLink = getValidLink(p.name, p.store, p.link);
      let safeDomain = '';
      try {
        const u = new URL(validatedLink);
        if (!u.hostname.toLowerCase().includes('google.')) safeDomain = u.hostname;
      } catch (e) {}
      const safeImageUrl = p.imageUrl && p.imageUrl.length > 10 ? getImageProxyUrl(p.imageUrl) : '';
      const currency = p.price?.replace(/[0-9.,]/g, '').trim() || '';
      let finalUnitPrice = p.unit_price;
      if (finalUnitPrice === 'null' || !finalUnitPrice) finalUnitPrice = '';

      return {
        name: p.name || 'Unknown Product',
        store: p.store || 'Online Store',
        price: p.price || 'check site',
        currency: currency,
        unitPrice: finalUnitPrice,
        rating: Number(p.rating) || 0,
        reviewsCount: p.reviewsCount || '0',
        link: validatedLink,
        imageUrl: safeImageUrl,
        isBestValue: (p.score || 0) > 85,
        isLowestPrice: false,
        explanation: p.explanation || '',
        score: Number(p.score) || 80,
        pros: p.pros || [],
        cons: p.cons || [],
        features: p.features || [],
        shippingInfo: p.shipping || (isAr ? "غير محدد" : "N/A"),
        shippingCost: p.shipping_cost || (isAr ? "غير محدد" : "N/A"),
        deliveryTime: p.delivery_time || (isAr ? "غير محدد" : "N/A"),
        warrantyInfo: p.warranty || (isAr ? "غير محدد" : "N/A"),
        returnPolicy: p.returns || (isAr ? "غير محدد" : "N/A"),
        stockStatus: p.stock || (isAr ? "متوفر" : "In Stock"),
        customerSentiment: "Positive",
        storeDomain: safeDomain, 
        nabihVerdict: p.explanation 
      };
    });

    try {
      const validPrices = options.map((o, i) => ({ val: parsePriceValue(o.price), idx: i })).filter(x => x.val !== null);
      if (validPrices.length > 0) {
        const min = Math.min(...validPrices.map(x => x.val!));
        validPrices.forEach(x => { if (x.val === min) options[x.idx].isLowestPrice = true; });
      }
    } catch (e) {}

    const finalResult: ComparisonResult = {
      query: userQuery,
      summary: data.summary,
      options,
      sources: webSources.map(uri => ({ title: 'Source', uri })),
      disambiguationOptions: data.refinements || [], 
      smartFilterSuggestions: data.smart_filters || [], 
      sortingOptions: data.sorting_options || [] 
    };

    if (!isLoadMore) LocalCache.set(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    throw new Error(isAr ? "نواجه ضغطاً عالياً، يرجى المحاولة مرة أخرى." : "High traffic, please try again.");
  }
};
