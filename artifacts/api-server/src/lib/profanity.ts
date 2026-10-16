// Words that are rude anywhere inside a name, and short words that are only
// rude as a whole word (split on digits and underscores) (so "class",
// "assist" and "Dickinson" are not blocked, but "ass" and "big_ass" are).
const PROFANITY_ANYWHERE = ["fuck","shit","cunt","bitch","pussy","nigger","nigga","faggot","slut","whore","bastard"];
const PROFANITY_WHOLE_WORD = ["ass","arse","dick","cock","fag","retard","damn","piss","twat"];
export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  if (PROFANITY_ANYWHERE.some((w) => lower.replace(/[^a-z0-9]/g, "").includes(w))) return true;
  const parts = lower.split(/[^a-z]+/).filter(Boolean);
  return parts.some((p) => PROFANITY_WHOLE_WORD.includes(p));
}
