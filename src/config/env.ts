// Hostnames/IPs only ever reachable on a local dev machine or emulator —
// safe to default to http:// since there's no real network path for a MITM.
// Anything else (a real domain/IP a release build points at) must default
// to https:// so a bare EXPO_PUBLIC_API_HOST never silently ships cleartext.
const LOCAL_DEV_HOST_PATTERN = /^(localhost|127\.0\.0\.1|10\.0\.2\.2|10\.0\.3\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

// Support dynamic URL construction with local multi-tenancy helper
const getApiHost = (): string => {
  // Read from the .env file if available, fallback to Android Emulator default loopback
  const host = process.env.EXPO_PUBLIC_API_HOST || "10.0.2.2:8000";
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    const scheme = LOCAL_DEV_HOST_PATTERN.test(host) ? "http://" : "https://";
    return `${scheme}${host}`;
  }
  return host;
};

export const ENV = {
  getApiUrl: (schoolDomain?: string) => {
    // Always use the base API host. Tenant schema switching is handled
    // dynamically on the backend via the 'X-Tenant' schema header.
    return getApiHost();
  },
  get DEFAULT_PUBLIC_API() {
    return getApiHost();
  },
};
