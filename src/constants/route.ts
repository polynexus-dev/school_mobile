export const ROUTES = {
  AUTH: {
    LOGIN: "/(auth)/login" as const,
    OTP_REQUEST: "/(auth)/otp-request" as const,
    OTP_VERIFY: "/(auth)/otp-verify" as const,
    LINK_CHILDREN: "/(auth)/link-children" as const,
  },
  CONSENT: {
    CONSENT: "/(consent)/consent" as const,
  },
  TEACHER: {
    DASHBOARD: "/(teacher)/(tabs)/dashboard" as const,
    ATTENDANCE_TAB: "/(teacher)/(tabs)/attendance" as const,
    POST_TAB: "/(teacher)/(tabs)/post" as const,
    MORE_TAB: "/(teacher)/(tabs)/more" as const,
    MARK_ATTENDANCE: "/(teacher)/mark-attendance" as const,
    CORRECTIONS: "/(teacher)/corrections" as const,
    QUICK_CREATE: "/(teacher)/quick-create" as const,
    MARKS_ENTRY: "/(teacher)/marks-entry" as const,
  },
  PARENT: {
    DASHBOARD: "/(parent)/(tabs)/dashboard" as const,
    BUS_TAB: "/(parent)/(tabs)/bus" as const,
    ACADEMICS_TAB: "/(parent)/(tabs)/academics" as const,
    MORE_TAB: "/(parent)/(tabs)/more" as const,
    BUS_TRACKING: "/(parent)/bus-tracking" as const,
    BUS_ALERTS: "/(parent)/bus-alerts" as const,
    ATTENDANCE: "/(parent)/attendance" as const,
    FEES: "/(parent)/fees" as const,
    FEES_PAY: "/(parent)/fees/pay" as const,
    FEES_RECEIPT: "/(parent)/fees/receipt" as const,
    RESULTS: "/(parent)/results" as const,
    HOMEWORK: "/(parent)/homework" as const,
    ANNOUNCEMENTS: "/(parent)/announcements" as const,
    PRIVACY_CONSENT: "/(parent)/privacy-consent" as const,
    LANGUAGE: "/(parent)/settings/language" as const,
  },
  CONDUCTOR: {
    ROUTE: "/(conductor)/route" as const,
    SCAN: "/(conductor)/scan" as const,
    TRIP_SUMMARY: "/(conductor)/trip-summary" as const,
    EVENING_DROP: "/(conductor)/evening-drop" as const,
  },
} as const;

export type RouteType = typeof ROUTES;
