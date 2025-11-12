/**
 * Generate a unique SKU for a product
 * Format: GENDER-CATEGORY-TIMESTAMP-RANDOM
 * Example: MEN-CLO-20250112-AB3X
 */
export function generateSKU(genderName: string, categoryName: string): string {
  // Get first 3 letters of gender (uppercase)
  const genderCode = genderName.substring(0, 3).toUpperCase();

  // Get first 3 letters of category (uppercase)
  const categoryCode = categoryName.substring(0, 3).toUpperCase();

  // Get timestamp (YYYYMMDD format)
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Generate random alphanumeric string (4 characters)
  const randomString = generateRandomString(4);

  return `${genderCode}-${categoryCode}-${timestamp}-${randomString}`;
}

/**
 * Generate random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate SKU format
 */
export function isValidSKUFormat(sku: string): boolean {
  // Format: XXX-XXX-YYYYMMDD-XXXX
  const skuRegex = /^[A-Z0-9]{3}-[A-Z0-9]{3}-\d{8}-[A-Z0-9]{4}$/;
  return skuRegex.test(sku);
}
