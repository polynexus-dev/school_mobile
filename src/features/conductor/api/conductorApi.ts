import httpClient from "@services/api/httpClient";

/**
 * Real transport endpoints (school_app/views/transport.py + transport_guards.py):
 *   GET  /api/transport/routes/{id}/
 *   GET  /api/transport/stops/?route={id}
 *   GET  /api/students/?bus_route={id}          — expected roster for the route
 *   GET  /api/transport/trips/?route={id}&ended=false
 *   POST /api/transport/trips/                   {route, trip_type}
 *   POST /api/transport/trips/{id}/end_trip/      {distance_km}
 *   GET  /api/transport/trips/{id}/summary/
 *   GET  /api/transport/boarding-scans/?trip={id}
 *   POST /api/transport/boarding-scans/           {student, trip, stop} — wrong-route/
 *        not-subscribed/already-scanned guardrails enforced server-side (transport_guards.py)
 *   POST /api/transport/alighting-confirmations/  {student, trip, received_by_name} — the
 *        "no_receiving_adult" guardrail requires a name (or received_by_guardian) on every call
 *
 * A scanned QR code encodes the student's numeric id directly (BusBoardingScan.student is a
 * plain FK — there's no separate "resolve QR to student" endpoint in the contract).
 */

export interface RouteStop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  sequence: number;
  expected_time: string | null;
  expected_count: number;
}

export interface BusRouteInfo {
  id: number;
  name: string;
  vehicle_number: string | null;
}

export interface RosterStudent {
  id: number;
  full_name?: string;
  name?: string;
  admission_number?: string;
  class_section_name?: string;
  bus_stop?: number | null;
}

export interface BusTrip {
  id: number;
  route: number | null;
  driver: number | null;
  trip_type: "morning" | "evening";
  started_at: string;
  ended_at: string | null;
  distance_km: number;
}

export interface BoardingScan {
  id: number;
  student: number;
  trip: number;
  stop: number | null;
  scanned_at: string;
}

export interface AlightingConfirmation {
  id: number;
  student: number;
  trip: number;
  received_by_name: string | null;
  confirmed_at: string;
}

export interface ScannedStudent {
  id: number;
  name: string;
  initials: string;
  classSection: string;
  stopName: string;
}

export type ScanErrorKind =
  | "wrong_route"
  | "not_subscribed"
  | "already_scanned"
  | "not_boarded"
  | "already_alighted"
  | "no_receiving_adult"
  | "unreadable";

interface GuardErrorResponse {
  error: string;
  code: ScanErrorKind;
}

async function fetchAllPages<T>(url: string, params: Record<string, any> = {}): Promise<T[]> {
  let all: T[] = [];
  let page = 1;
  // Every list endpoint is paginated (DRF PageNumberPagination, PAGE_SIZE=25) — walk every
  // page rather than trusting the first one, since a route's roster/stop list can exceed it.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await httpClient.get(url, { params: { ...params, page } });
    const data = res.data;
    if (Array.isArray(data)) return data;
    all = all.concat(data?.results ?? []);
    if (!data?.next) break;
    page += 1;
  }
  return all;
}

export const conductorApi = {
  getRoute: async (routeId: number): Promise<BusRouteInfo> => {
    const res = await httpClient.get(`/api/transport/routes/${routeId}/`);
    return res.data;
  },

  getStops: async (routeId: number): Promise<RouteStop[]> =>
    fetchAllPages<RouteStop>("/api/transport/stops/", { route: routeId }),

  getRoster: async (routeId: number): Promise<RosterStudent[]> =>
    fetchAllPages<RosterStudent>("/api/students/", { bus_route: routeId }),

  /** The conductor's currently open (un-ended) trip for this route, if one exists. */
  getActiveTrip: async (routeId: number): Promise<BusTrip | null> => {
    const trips = await fetchAllPages<BusTrip>("/api/transport/trips/", { route: routeId, ended: "false" });
    return trips[0] ?? null;
  },

  startTrip: async (routeId: number, tripType: "morning" | "evening"): Promise<BusTrip> => {
    const res = await httpClient.post("/api/transport/trips/", { route: routeId, trip_type: tripType });
    return res.data;
  },

  endTrip: async (tripId: number, distanceKm?: number): Promise<BusTrip> => {
    const res = await httpClient.post(
      `/api/transport/trips/${tripId}/end_trip/`,
      distanceKm != null ? { distance_km: distanceKm } : {}
    );
    return res.data;
  },

  getTripSummary: async (tripId: number) => {
    const res = await httpClient.get(`/api/transport/trips/${tripId}/summary/`);
    return res.data as { trip_id: number; route: string | null; boarded_count: number; alighted_count: number };
  },

  getBoardingScans: async (tripId: number): Promise<BoardingScan[]> =>
    fetchAllPages<BoardingScan>("/api/transport/boarding-scans/", { trip: tripId }),

  getAlightingConfirmations: async (tripId: number): Promise<AlightingConfirmation[]> =>
    fetchAllPages<AlightingConfirmation>("/api/transport/alighting-confirmations/", { trip: tripId }),

  scanBoarding: async (
    studentId: number,
    tripId: number,
    stopId?: number
  ): Promise<{ scan: BoardingScan } | { error: GuardErrorResponse }> => {
    try {
      const res = await httpClient.post("/api/transport/boarding-scans/", {
        student: studentId,
        trip: tripId,
        stop: stopId ?? null,
      });
      return { scan: res.data };
    } catch (err: any) {
      const data = err?.data ?? err?.response?.data;
      return { error: { error: data?.error || "Could not record boarding scan.", code: data?.code || "unreadable" } };
    }
  },

  confirmAlighting: async (
    studentId: number,
    tripId: number,
    receivedByName: string
  ): Promise<{ confirmation: AlightingConfirmation } | { error: GuardErrorResponse }> => {
    try {
      const res = await httpClient.post("/api/transport/alighting-confirmations/", {
        student: studentId,
        trip: tripId,
        received_by_name: receivedByName,
      });
      return { confirmation: res.data };
    } catch (err: any) {
      const data = err?.data ?? err?.response?.data;
      return { error: { error: data?.error || "Could not record alighting confirmation.", code: data?.code || "unreadable" } };
    }
  },
};
