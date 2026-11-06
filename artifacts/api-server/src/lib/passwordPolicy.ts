/** Password rules shared by signup, reset and change-password. */

export const MIN_PASSWORD_LENGTH = 10;
// bcrypt only uses the first 72 bytes, so refuse anything longer instead of silently truncating.
export const MAX_PASSWORD_BYTES = 72;

// Exact matches (case-insensitive) of very common passwords, including ones that
// pass a length-and-digit rule, e.g. "password123".
const COMMON = new Set([
  "password", "password1", "password12", "password123", "password1234", "password12345",
  "passw0rd", "passw0rd1", "passw0rd123", "p@ssw0rd", "p@ssword1", "p@ssw0rd123",
  "qwerty", "qwerty123", "qwerty1234", "qwertyuiop", "qwertyuiop1", "qwerty12345",
  "1234567890", "12345678910", "123456789012", "0123456789", "0987654321", "1q2w3e4r5t",
  "1qaz2wsx3e", "iloveyou1", "iloveyou12", "iloveyou123", "letmein123", "welcome123",
  "welcome1234", "admin12345", "abc1234567", "abcd123456", "abcd1234567", "football1",
  "football123", "pathwaypenguin", "pathwaypenguin1", "penguin123", "penguin1234",
  "utcportsmouth", "utcportsmouth1", "utcportsmouth123", "changeme123", "monkey1234",
  "dragon1234", "superman123", "princess123", "minecraft123", "fortnite123", "roblox1234",
]);

/** Returns a message for the first rule broken, or null if the password is acceptable. */
export function passwordError(password: unknown, context: { username?: string; email?: string } = {}): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) return "Password is too long (72 bytes at most).";
  if (/^(.)\1+$/.test(password)) return "Password is too easy to guess. Try something less predictable.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";

  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common. Please choose something less predictable.";

  const parts = [context.username, context.email?.split("@")[0]]
    .filter((p): p is string => !!p && p.length >= 3)
    .map((p) => p.toLowerCase());
  if (parts.some((p) => lower.includes(p))) return "Password can't contain your username or email name.";
  return null;
}
