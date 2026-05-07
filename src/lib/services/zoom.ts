/**
 * Zoom service.
 *
 * Zoom SDK is not installed yet. Until it is, this file fails loudly in
 * production and no-ops in development. Previously a stub returned a fake
 * meeting + join URL so webinar registration `:appeared:` to succeed but
 * the learner got a non-functional URL.
 *
 * To enable real Zoom integration:
 *   1. Choose an SDK (`@zoom/sdk` for OAuth Server-to-Server, or use `fetch`
 *      against the Zoom REST API directly using the OAuth token).
 *   2. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in env.
 *   3. Replace the bodies below with token-fetch + meeting/registrant calls.
 */

interface ZoomMeetingResult {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
}

interface ZoomRegistrationResult {
  registrantId: string;
  joinUrl: string;
}

let warnedDev = false;

function devWarn(): void {
  if (!warnedDev) {
    warnedDev = true;
    console.warn(
      "[zoom] Zoom integration is not wired up — returning placeholder data in dev."
    );
  }
}

function refuseInProduction(method: string): never {
  throw new Error(
    `Zoom ${method} is not configured. Wire the Zoom SDK into src/lib/services/zoom.ts and set ZOOM_* env vars before calling this in production.`
  );
}

export async function createZoomMeeting(_params: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
}): Promise<ZoomMeetingResult> {
  if (process.env.NODE_ENV === "production") {
    refuseInProduction("createZoomMeeting");
  }
  devWarn();
  return {
    meetingId: `zoom_dev_${Date.now()}`,
    joinUrl: `https://zoom.us/j/dev-stub-${Date.now()}`,
    startUrl: `https://zoom.us/s/dev-stub-${Date.now()}`,
  };
}

export async function registerZoomAttendee(_params: {
  meetingId: string;
  email: string;
  name: string;
}): Promise<ZoomRegistrationResult> {
  if (process.env.NODE_ENV === "production") {
    refuseInProduction("registerZoomAttendee");
  }
  devWarn();
  return {
    registrantId: `reg_dev_${Date.now()}`,
    joinUrl: `https://zoom.us/j/dev-stub-${Date.now()}?tk=attendee`,
  };
}
