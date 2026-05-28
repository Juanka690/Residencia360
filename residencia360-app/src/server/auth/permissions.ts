import { Role } from "@prisma/client";

export const routePermissions: Record<string, Role[]> = {
  "/dashboard": [Role.RESIDENT, Role.GUARD, Role.ADMIN, Role.BOARD, Role.CONTRACTOR],
  "/dashboard/resident": [Role.RESIDENT],
  "/dashboard/guard": [Role.GUARD],
  "/dashboard/admin": [Role.ADMIN],
  "/dashboard/board": [Role.BOARD],
  "/visitors": [Role.RESIDENT, Role.GUARD, Role.ADMIN, Role.BOARD],
  "/gate": [Role.GUARD, Role.ADMIN],
  "/announcements": [Role.RESIDENT, Role.GUARD, Role.ADMIN, Role.BOARD],
  "/pqrs": [Role.RESIDENT, Role.ADMIN, Role.BOARD],
  "/reservations": [Role.RESIDENT, Role.ADMIN, Role.BOARD],
  "/accounting": [Role.RESIDENT, Role.ADMIN, Role.BOARD],
  "/reports": [Role.ADMIN, Role.BOARD],
  "/audit": [Role.ADMIN, Role.BOARD],
  "/providers": [Role.GUARD, Role.ADMIN, Role.BOARD],
  "/parking": [Role.GUARD, Role.ADMIN],
  "/admin": [Role.ADMIN],
};

export function canAccessPath(role: Role, pathname: string) {
  const match = Object.entries(routePermissions)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path));

  if (!match) {
    return true;
  }

  return match[1].includes(role);
}

export function defaultDashboardByRole(role: Role) {
  switch (role) {
    case Role.RESIDENT:
      return "/dashboard/resident";
    case Role.GUARD:
      return "/dashboard/guard";
    case Role.ADMIN:
      return "/dashboard/admin";
    case Role.BOARD:
      return "/dashboard/board";
    case Role.CONTRACTOR:
      return "/providers";
    default:
      return "/dashboard";
  }
}
