/**
 * Name of the admin session cookie. In production the "__Host-" prefix makes
 * the browser refuse it unless it is Secure, has path "/" and no Domain, so it
 * can never be shared with or set by the shop or another subdomain.
 */
export const ADMIN_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-hdf_admin" : "hdf_admin";
