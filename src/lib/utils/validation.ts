/**
 * Validation utilities for Vipto CRM
 */

export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  // Matches 10 digits or 12 digits starting with 91
  return clean.length === 10 || (clean.length === 12 && clean.startsWith('91'));
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}

/**
 * Generate comprehensive search keywords for a seller
 * Enables high-performance prefix and token searching in Cloud Firestore
 */
export function generateSearchKeywords(seller: {
  name?: string;
  shopName?: string;
  phone?: string;
  city?: string;
  category?: string;
}): string[] {
  const tokens = new Set<string>();

  const addStrings = (text?: string) => {
    if (!text) return;
    const clean = text.toLowerCase().trim();
    if (!clean) return;

    // Add full string
    tokens.add(clean);

    // Split words
    const words = clean.split(/[\s,.-]+/);
    words.forEach(word => {
      if (word.length >= 2) {
        tokens.add(word);
        // Prefix generator up to 15 characters
        for (let i = 2; i <= Math.min(word.length, 15); i++) {
          tokens.add(word.slice(0, i));
        }
      }
    });
  };

  addStrings(seller.name);
  addStrings(seller.shopName);
  addStrings(seller.city);
  addStrings(seller.category);

  if (seller.phone) {
    const cleanPhone = cleanPhoneNumber(seller.phone);
    if (cleanPhone) {
      tokens.add(cleanPhone);
      // Suffixes and prefixes of phone
      if (cleanPhone.length >= 4) {
        tokens.add(cleanPhone.slice(-4)); // last 4 digits
        tokens.add(cleanPhone.slice(-6)); // last 6 digits
        for (let i = 3; i <= cleanPhone.length; i++) {
          tokens.add(cleanPhone.slice(0, i));
        }
      }
    }
  }

  return Array.from(tokens).slice(0, 80); // Cap at 80 tokens to respect Firestore document size limits
}
