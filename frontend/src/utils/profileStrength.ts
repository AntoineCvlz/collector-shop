import type { UserInfo } from "../services/auth.service";

export interface ProfileStrength {
  /** Completion score between 0 and 100. */
  score: number;
  /** Identifiers of the checks that are not yet satisfied. */
  missing: string[];
}

interface Check {
  key: string;
  passed: (user: UserInfo) => boolean;
}

const CHECKS: Check[] = [
  { key: "name", passed: (user) => user.name.trim().length > 0 },
  { key: "email", passed: (user) => user.email.trim().length > 0 },
  { key: "roles", passed: (user) => user.roles.length > 0 },
];

/**
 * Computes how complete a user profile is, purely from the data already
 * available on the client. Returns a rounded percentage and the list of
 * checks still missing.
 */
export function profileStrength(user: UserInfo | null): ProfileStrength {
  if (!user) {
    return { score: 0, missing: CHECKS.map((check) => check.key) };
  }

  const missing = CHECKS.filter((check) => !check.passed(user)).map(
    (check) => check.key,
  );
  const passedCount = CHECKS.length - missing.length;
  const score = Math.round((passedCount / CHECKS.length) * 100);

  return { score, missing };
}
