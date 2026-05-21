import { describe, it, expect } from "vitest";
import { computeScore, KARMA_CATEGORY, type EmployabilityData } from "@/lib/employability";

describe("employability utilities", () => {
  describe("computeScore", () => {
    it("calculates score with zero inputs", () => {
      const data: EmployabilityData = {
        karma_total: 0,
        current_streak: 0,
        longest_streak: 0,
        total_completed: 0,
        interview_posts: 0,
        posts_count: 0,
        mentorships: 0,
      };
      const result = computeScore(data);
      
      expect(result.total).toBe(0);
      expect(result.consistency).toBe(0);
      expect(result.peer).toBe(0);
      expect(result.technical).toBe(0);
      expect(result.community).toBe(0);
    });

    it("calculates score with moderate inputs", () => {
      const data: EmployabilityData = {
        karma_total: 100,
        current_streak: 5,
        longest_streak: 10,
        total_completed: 20,
        interview_posts: 2,
        posts_count: 5,
        mentorships: 3,
      };
      const result = computeScore(data);
      
      // consistency: (5*1.5)+(10*0.5)=12.5 → round → 13
      expect(result.consistency).toBe(13);
      // peer: min(100, 100/5) = min(100, 20) = 20
      expect(result.peer).toBe(20);
      // technical: min(100, 20*1.2) = 24
      expect(result.technical).toBe(24);
      // community: min(100, 5*4 + 2*8) = min(100, 36) = 36
      expect(result.community).toBe(36);
      // total: min(100, 12*0.25 + 20*0.30 + 24*0.25 + 36*0.20) = min(100, 22.8) = 22
      expect(result.total).toBe(22);
    });

    it("caps individual scores at 100", () => {
      const data: EmployabilityData = {
        karma_total: 1000,  // would be 200, caps at 100
        current_streak: 200,   // would be 300, caps at 100
        longest_streak: 200,   // adds to consistency
        total_completed: 200, // would be 240, caps at 100
        interview_posts: 50,   // would be 440+, caps at 100
        posts_count: 50,      // would be 240+, caps at 100
        mentorships: 100,    // unused in calculation
      };
      const result = computeScore(data);
      
      expect(result.consistency).toBe(100);
      expect(result.peer).toBe(100);
      expect(result.technical).toBe(100);
      expect(result.community).toBe(100);
    });

    it("caps total score at 100", () => {
      const data: EmployabilityData = {
        karma_total: 1000,
        current_streak: 100,
        longest_streak: 100,
        total_completed: 100,
        interview_posts: 100,
        posts_count: 100,
        mentorships: 100,
      };
      const result = computeScore(data);
      
      // Raw sum exceeds 100 but gets capped
      expect(result.total).toBe(100);
    });
  });

  describe("KARMA_CATEGORY", () => {
    it("maps interview_post to interview_experience", () => {
      expect(KARMA_CATEGORY("interview_post")).toBe("interview_experience");
    });

    it("maps advice_upvoted to community_help", () => {
      expect(KARMA_CATEGORY("advice_upvoted")).toBe("community_help");
    });

    it("maps mentorship_completed to mentorship", () => {
      expect(KARMA_CATEGORY("mentorship_completed")).toBe("mentorship");
    });

    it("maps resume_review to mentorship", () => {
      expect(KARMA_CATEGORY("resume_review")).toBe("mentorship");
    });

    it("maps aspire_engage to dsa_completion", () => {
      expect(KARMA_CATEGORY("aspire_engage")).toBe("dsa_completion");
    });

    it("maps daily_streak to dsa_completion", () => {
      expect(KARMA_CATEGORY("daily_streak")).toBe("dsa_completion");
    });

    it("maps mock_interview to mock_interview", () => {
      expect(KARMA_CATEGORY("mock_interview")).toBe("mock_interview");
    });

    it("returns community_help for unknown actions", () => {
      expect(KARMA_CATEGORY("unknown_action")).toBe("community_help");
      expect(KARMA_CATEGORY("random")).toBe("community_help");
      expect(KARMA_CATEGORY("")).toBe("community_help");
    });
  });
});