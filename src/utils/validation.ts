// Validation utilities for Turkish CRM forms

// Turkish phone number validation
// Accepts: 5XX XXX XX XX, 05XX XXX XX XX, +90 5XX XXX XX XX
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;

  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Remove leading +90 or 0
  let normalized = cleaned;
  if (normalized.startsWith('+90')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('90') && normalized.length === 12) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.slice(1);
  }

  // Check if it's a valid Turkish mobile number (5XX XXX XX XX format)
  // Or a valid landline (starting with 2, 3, 4)
  const mobileRegex = /^5[0-9]{9}$/;
  const landlineRegex = /^[234][0-9]{9}$/;

  return mobileRegex.test(normalized) || landlineRegex.test(normalized);
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Remove leading country code if present
  let normalized = cleaned;
  if (normalized.startsWith('90') && normalized.length >= 12) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length >= 11) {
    normalized = normalized.slice(1);
  }

  // Format as 5XX XXX XX XX
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`;
  }

  return phone; // Return original if can't format
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // Email is often optional

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Price validation
export const isValidPrice = (price: number | string): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

// Format price with Turkish locale
export const formatPrice = (price: number, currency: string = 'TL'): string => {
  if (!price && price !== 0) return '';

  const formatted = new Intl.NumberFormat('tr-TR').format(price);
  return `${formatted} ${currency}`;
};

// Parse price from formatted string
export const parsePrice = (formattedPrice: string): number => {
  // Remove all non-digit characters except comma and dot
  const cleaned = formattedPrice.replace(/[^\d,]/g, '');
  // Replace comma with dot for parsing
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
};

// Get validation error messages
export const getPhoneErrorMessage = (phone: string): string | null => {
  if (!phone) return 'Telefon numarasi zorunludur';
  if (!isValidPhoneNumber(phone)) return 'Gecerli bir telefon numarasi giriniz (5XX XXX XX XX)';
  return null;
};

export const getEmailErrorMessage = (email: string): string | null => {
  if (email && !isValidEmail(email)) return 'Gecerli bir e-posta adresi giriniz';
  return null;
};

export const getPriceErrorMessage = (price: number | string, fieldName: string = 'Fiyat'): string | null => {
  if (!isValidPrice(price)) return `${fieldName} gecerli bir sayi olmalidir`;
  return null;
};
