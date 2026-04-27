/** Mention parser for @agent syntax */

export type Mention = {
  participantId: string;
  displayName: string;
  position: number;
  verified: boolean;
};

export type ParseMentionsResult = {
  mentions: Mention[];
  text: string;
};

/**
 * Parse @mentions from message content.
 * 
 * Supported syntax:
 * - @AgentName - mention by name/id
 * - @"Full Name" - mention with quoted name
 * 
 * Does NOT match:
 * - Escaped: \@AgentName
 * - Email addresses: user@example.com
 * - @ at end of word: word@notamention
 */
export function parseMentions(
  content: string,
  verifyParticipant: (id: string) => boolean
): ParseMentionsResult {
  const mentions: Mention[] = [];
  
  // Match @mentions, but not escaped or email addresses
  // Pattern breakdown:
  // (?<!\\) - negative lookbehind: not preceded by backslash
  // (?<!\w) - negative lookbehind: not preceded by word character
  // @ - literal @
  // ("([^"]+)"|[\w-]+) - quoted string OR word characters/hyphens
  const mentionRegex = /(?<!\\)(?<!\w)@(?:"([^"]+)"|([\w-]+))/g;
  
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const [fullMatch, quotedName, unquotedName] = match;
    const participantId = quotedName || unquotedName || "";
    const position = match.index;
    
    // Skip if this looks like an email (contains @ before this position)
    const beforeMatch = content.slice(0, position);
    const emailRegex = /[\w.-]+@[\w.-]+$/;
    if (emailRegex.test(beforeMatch)) {
      continue;
    }
    
    // Verify participant exists
    const verified = verifyParticipant(participantId);
    
    mentions.push({
      participantId,
      displayName: quotedName || unquotedName || participantId,
      position,
      verified,
    });
  }
  
  // Remove mentions from text for cleaner processing
  let text = content;
  for (let i = mentions.length - 1; i >= 0; i--) {
    const m = mentions[i];
    text = text.slice(0, m.position) + text.slice(m.position + m.displayName.length + 1);
  }
  
  return { mentions, text: text.trim() };
}

/**
 * Extract only verified mentions.
 */
export function getVerifiedMentions(
  content: string,
  verifyParticipant: (id: string) => boolean
): Mention[] {
  const { mentions } = parseMentions(content, verifyParticipant);
  return mentions.filter(m => m.verified);
}

/**
 * Check if content contains any @mentions.
 */
export function hasMentions(content: string): boolean {
  const mentionRegex = /(?<!\\)(?<!\w)@(?:"[^"]+"|[\w-]+)/g;
  return mentionRegex.test(content);
}
