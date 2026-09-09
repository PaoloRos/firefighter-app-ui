/** Accounts seeded into a throwaway database for the end-to-end suite. */
export const E2E_SUPER_USER = {
  username: "e2e-chief",
  password: "e2e-chief-pw",
  role: "super_user",
} as const;

export const E2E_PLAIN_USER = {
  username: "e2e-member",
  password: "e2e-member-pw",
  role: "user",
} as const;

export const E2E_ACCOUNTS = [E2E_SUPER_USER, E2E_PLAIN_USER] as const;
