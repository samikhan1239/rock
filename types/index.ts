export type UserRole = "TEACHER" | "CLIENT" | "ADMIN" | "SUPER_ADMIN";

export const ROLES = {
  TEACHER: "TEACHER",
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;