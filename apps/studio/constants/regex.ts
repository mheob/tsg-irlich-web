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

/**
 * Regular expression for validating time strings in 24-hour format "HH:MM"
 *
 * Pattern explanation:
 * - Starts with either:
 *   - [01] followed by any digit (00-19), or
 *   - 2 followed by [0-3] (20-23)
 * - Followed by a colon
 * - Ends with [0-5] followed by any digit (00-59 minutes)
 *
 * @example
 * Valid: "09:30"
 * Valid: "23:59"
 * Invalid: "24:00" (hours must be 00-23)
 * Invalid: "12:60" (minutes must be 00-59)
 */
export const timeFieldRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
