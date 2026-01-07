/**
 * Nabih Smart Value Search Engine - Backend Logic
 * 
 * This Cloud Function handles the complex logic of searching and ranking products
 * based on a calculated "True Value Score".
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Callable HTTPS Function: searchBestValue
 * 
 * @param {Object} data - Input parameters
 * @param {string} data.searchTerm - The product name to search for (prefix match)
 * @param {string} data.userRegion - The region code to filter by (e.g., "SA", "AE")
 * @param {string} data.sortPreference - 'price' (ascending) or 'value' (score descending)
 */
exports.searchBestValue = functions.https.onCall(async (data, context) => {
  // 1. Parameter Validation
  const { searchTerm, userRegion, sortPreference } = data;

  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'The function must be called with a valid "searchTerm".'
    );
  }

  if (!userRegion || typeof userRegion !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'The function must be called with a valid "userRegion".'
    );
  }

  const validSorts = ['price', 'value'];
  if (!sortPreference || !validSorts.includes(sortPreference)) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Sort preference must be either "price" or "value".'
    );
  }

  try {
    // 2. Querying Firestore (Case Insensitive Logic)
    // To support case-insensitivity in Firestore without third-party services (Algolia/Elastic),
    // we assume the existence of a normalized field `productNameLower` in the database documents.
    // The query converts the user input to lowercase before searching.
    const normalizedTerm = searchTerm.toLowerCase();

    const productsRef = db.collection('products');
    const query = productsRef
      .where('region', '==', userRegion)
      .where('productNameLower', '>=', normalizedTerm)
      .where('productNameLower', '<=', normalizedTerm + '\uf8ff');

    const snapshot = await query.get();

    // Handle empty results gracefully
    if (snapshot.empty) {
      return { 
        results: [], 
        meta: { count: 0, message: "No products found." } 
      };
    }

    // 3. Data Transformation & Value Calculation
    let products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const price = Number(data.price) || 0;
      const rating = Number(data.rating) || 0;
      const safePrice = Math.max(price, 0.01);

      /**
       * New True Value Algorithm:
       * The old formula (1000/Price) excessively punished expensive, high-quality items.
       * 
       * Revised Logic: Weighted Score (0-100)
       * 1. Rating Contribution (60% weight): Standard 0-5 scale mapped to 0-100.
       * 2. Price Contribution (40% weight): Logarithmic decay.
       *    This allows expensive items to still have a "value" score if their rating is high,
       *    while still favoring cheaper options but not exponentially.
       */
      
      // Part A: Rating Score (0 to 100)
      const ratingScore = (rating / 5) * 100;

      // Part B: Price Score (0 to 100) using Logarithmic Scale
      // We assume a 'baseline' expensive item is around 10,000 units.
      // Math.log10(1) = 0, Math.log10(10000) = 4.
      // Formula: 100 - (25 * log10(price)). Caps at 0.
      const logPrice = Math.log10(safePrice + 1); // +1 to avoid log(0)
      const priceScore = Math.max(0, 100 - (20 * logPrice));

      // Final Weighted Score: 60% Quality, 40% Price Efficiency
      const trueValueScore = (ratingScore * 0.6) + (priceScore * 0.4);

      products.push({
        id: doc.id,
        ...data,
        price,
        rating,
        trueValueScore: parseFloat(trueValueScore.toFixed(2)) // Normalize decimal points
      });
    });

    // 4. Sorting Logic
    if (sortPreference === 'price') {
      // Sort by Price Ascending (Cheapest first)
      products.sort((a, b) => a.price - b.price);
    } else {
      // Sort by True Value Score Descending (Highest value first)
      products.sort((a, b) => b.trueValueScore - a.trueValueScore);
    }

    // 5. Output
    return {
      results: products,
      meta: {
        count: products.length,
        timestamp: Date.now(),
        region: userRegion
      }
    };

  } catch (error) {
    console.error('Error in searchBestValue:', error);
    
    // Return appropriate error codes
    if (error.code === 'deadline-exceeded') {
      throw new functions.https.HttpsError('deadline-exceeded', 'The search operation timed out.');
    }
    
    throw new functions.https.HttpsError(
      'internal', 
      'An unexpected error occurred while processing the search request.'
    );
  }
});