/** Accounts seeded into a throwaway database for the end-to-end suite. */
export const E2E_SUPER_USER = {
  username: "e2e-chief",
  password: "e2e-chief-pw",
  role: "super_user",
  personnelNumber: "101",
} as const;

export const E2E_PLAIN_USER = {
  username: "e2e-member",
  password: "e2e-member-pw",
  role: "user",
  personnelNumber: "204",
} as const;

/** A plain account that has not been given a personnel number yet. */
export const E2E_UNNUMBERED_USER = {
  username: "e2e-recruit",
  password: "e2e-recruit-pw",
  role: "user",
  personnelNumber: null,
} as const;

export const E2E_ACCOUNTS = [
  E2E_SUPER_USER,
  E2E_PLAIN_USER,
  E2E_UNNUMBERED_USER,
] as const;
