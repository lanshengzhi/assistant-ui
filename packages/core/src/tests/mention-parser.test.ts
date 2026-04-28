import { describe, it, expect } from "vitest";
import {
  parseMentions,
  getVerifiedMentions,
  hasMentions,
} from "../runtime/agent/mention-parser";

describe("parseMentions", () => {
  const verifyParticipant = (id: string) =>
    ["CodeReviewAgent", "Agent1", "Agent2", "alice", "bob"].includes(id);

  describe("happy path", () => {
    it("should parse single @mention at start", () => {
      const result = parseMentions(
        "@CodeReviewAgent please review",
        verifyParticipant,
      );
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0]).toEqual({
        participantId: "CodeReviewAgent",
        displayName: "CodeReviewAgent",
        position: 0,
        verified: true,
      });
      expect(result.text).toBe("please review");
    });

    it("should parse @mention in middle of text", () => {
      const result = parseMentions("hi @alice there", verifyParticipant);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].participantId).toBe("alice");
      expect(result.mentions[0].position).toBe(3);
      expect(result.text).toBe("hi  there");
    });

    it("should parse @mention at end of text", () => {
      const result = parseMentions("hi @bob", verifyParticipant);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].participantId).toBe("bob");
      expect(result.text).toBe("hi");
    });

    it("should parse multiple @mentions", () => {
      const result = parseMentions(
        "@Agent1 and @Agent2 help",
        verifyParticipant,
      );
      expect(result.mentions).toHaveLength(2);
      expect(result.mentions[0].participantId).toBe("Agent1");
      expect(result.mentions[1].participantId).toBe("Agent2");
      expect(result.mentions[0].position).toBe(0);
      expect(result.mentions[1].position).toBe(12);
    });

    it("should parse quoted @mention", () => {
      const result = parseMentions('@"Full Name" hello', verifyParticipant);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].participantId).toBe("Full Name");
      expect(result.mentions[0].displayName).toBe("Full Name");
    });
  });

  describe("edge cases", () => {
    it("should not parse escaped @mention", () => {
      const result = parseMentions("\\@AgentName hello", verifyParticipant);
      expect(result.mentions).toHaveLength(0);
      expect(result.text).toBe("\\@AgentName hello");
    });

    it("should not parse email addresses", () => {
      const result = parseMentions("user@example.com", verifyParticipant);
      expect(result.mentions).toHaveLength(0);
    });

    it("should handle empty message", () => {
      const result = parseMentions("", verifyParticipant);
      expect(result.mentions).toHaveLength(0);
      expect(result.text).toBe("");
    });

    it("should not parse @ after word character", () => {
      const result = parseMentions("word@notamention", verifyParticipant);
      expect(result.mentions).toHaveLength(0);
    });

    it("should handle mention with hyphens", () => {
      const result = parseMentions("@my-agent help", verifyParticipant);
      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].participantId).toBe("my-agent");
    });
  });

  describe("verification", () => {
    it("should mark verified for existing participant", () => {
      const result = parseMentions("@alice hello", verifyParticipant);
      expect(result.mentions[0].verified).toBe(true);
    });

    it("should mark unverified for non-existent participant", () => {
      const result = parseMentions("@unknown hello", verifyParticipant);
      expect(result.mentions[0].verified).toBe(false);
    });
  });
});

describe("getVerifiedMentions", () => {
  const verifyParticipant = (id: string) => id === "known";

  it("should return only verified mentions", () => {
    const result = getVerifiedMentions(
      "@known and @unknown",
      verifyParticipant,
    );
    expect(result).toHaveLength(1);
    expect(result[0].participantId).toBe("known");
  });
});

describe("hasMentions", () => {
  it("should return true for messages with mentions", () => {
    expect(hasMentions("@agent hello")).toBe(true);
  });

  it("should return false for messages without mentions", () => {
    expect(hasMentions("hello world")).toBe(false);
  });

  it("should return false for escaped mentions", () => {
    expect(hasMentions("\\@agent hello")).toBe(false);
  });
});
