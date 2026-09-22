/**
 * Configurable business limit for maximum number of team users an Admin can create.
 * Can be updated here (e.g. 10 -> 20 -> 50) without redesigning the user-management system.
 */
export const MAX_ADMIN_CREATED_USERS = 10;

/**
 * Predefined dropdown options for User Creation
 */
export const PREDEFINED_COMPANIES = [
  "CIO Media World",
] as const;

export const PREDEFINED_DESIGNATIONS = [
  "CEO",
  "Editor-in-Chief",
  "Managing Editor",
  "Senior Editor",
  "Editor",
  "Content Writer",
  "Reporter",
  "Sales Executive",
  "Sales Manager",
  "Marketing Executive",
  "Business Development Executive",
  "Publisher",
  "Digital Marketing Manager",
  "Graphic Designer",
  "Developer",
] as const;

export const PREDEFINED_ROLES = [
  "Admin",
  "Editor",
  "Writer",
  "Publisher",
  "Sales",
  "Marketing",
] as const;

export type PredefinedCompany = typeof PREDEFINED_COMPANIES[number];
export type PredefinedDesignation = typeof PREDEFINED_DESIGNATIONS[number];
export type PredefinedRole = typeof PREDEFINED_ROLES[number];
