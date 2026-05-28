import { withAuth } from "next-auth/middleware";

export default withAuth();

export const config = {
  matcher: ["/dashboard/:path*", "/visitors/:path*", "/gate/:path*", "/announcements/:path*", "/pqrs/:path*", "/reservations/:path*", "/accounting/:path*", "/reports/:path*", "/audit/:path*", "/providers/:path*", "/parking/:path*"],
};
