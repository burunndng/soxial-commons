import { describe, it, expect } from "vitest";

describe("Supabase Configuration", () => {
  it("should have required environment variables set", () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  it("should have valid Supabase URL format", () => {
    const url = process.env.SUPABASE_URL;
    expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
  });

  it("should have valid API keys", () => {
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Supabase keys are typically JWT tokens
    expect(anonKey).toBeTruthy();
    expect(anonKey?.length).toBeGreaterThan(10);
    expect(serviceKey).toBeTruthy();
    expect(serviceKey?.length).toBeGreaterThan(10);
  });
});
