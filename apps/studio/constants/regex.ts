/**
 * Regular expression for validating phone numbers in the format "+49 123 456789"
 *
 * Pattern explanation:
 * - Starts with "+" followed by exactly 2 digits (country code)
 * - Followed by a space
 * - Then 2-5 digits (area code)
 * - Another space
 * - Ends with 1 or more digits (local number)
 *
 * @example
 * Valid: "+49 123 456789"
 * Valid: "+49 1234 56789"
 * Invalid: "+490 123 456789" (country code must be 2 digits)
 * Invalid: "+49 123456789" (missing space)
 */
export const phoneFieldRegex = /^\+\d{2}\s\d{2,5}\s\d+$/;
