import httpClient from "@services/api/httpClient";

/**
 * No bus/conductor endpoint exists in this pass's REST contract yet (see
 * backend plan's BusRoute/BusStop/BusBoardingScan/BusTrip models — flagged
 * as a follow-up-pass stub there too). Every call below points at the
 * endpoint shape that backend is expected to land, but screens catch
 * failures and fall back to mock data so the conductor flow stays fully
 * click-through-able in the meantime.
 */

export interface RouteStop {
  name: string;
  eta: string;
  expected: number;
  boarded: number;
}

export interface TodayRoute {
  conductorName: string;
  busLabel: string;
  routeName: string;
  pickupLabel: string;
  stops: RouteStop[];
  expectedTotal: number;
  boardedTotal: number;
}

export interface ScannedStudent {
  id: number;
  name: string;
  initials: string;
  classSection: string;
  stopName: string;
}

export type ScanErrorKind = "wrong_route" | "not_subscribed" | "already_scanned" | "unreadable";

export const conductorApi = {
  getTodayRoute: async (): Promise<TodayRoute> => {
    const res = await httpClient.get("/api/bus/conductor/today-route/");
    return res.data;
  },

  startTrip: async () => {
    const res = await httpClient.post("/api/bus/conductor/trip/start/");
    return res.data;
  },

  endTrip: async () => {
    const res = await httpClient.post("/api/bus/conductor/trip/end/");
    return res.data;
  },

  scanBoardingQr: async (qrToken: string) => {
    const res = await httpClient.post("/api/bus/conductor/scan/", { qr_token: qrToken });
    return res.data as { student: ScannedStudent } | { error: ScanErrorKind };
  },

  confirmAlighting: async (studentId: number) => {
    const res = await httpClient.post("/api/bus/conductor/alight/", { student_id: studentId });
    return res.data;
  },
};
