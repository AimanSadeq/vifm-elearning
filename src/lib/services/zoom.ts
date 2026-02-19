// Stub service for Zoom API integration
// Replace with actual Zoom SDK calls in production

interface ZoomMeetingResult {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
}

interface ZoomRegistrationResult {
  registrantId: string;
  joinUrl: string;
}

export async function createZoomMeeting(params: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
}): Promise<ZoomMeetingResult> {
  console.log("[STUB] createZoomMeeting:", params);
  return {
    meetingId: `zoom_${Date.now()}`,
    joinUrl: `https://zoom.us/j/stub-${Date.now()}`,
    startUrl: `https://zoom.us/s/stub-${Date.now()}`,
  };
}

export async function registerZoomAttendee(params: {
  meetingId: string;
  email: string;
  name: string;
}): Promise<ZoomRegistrationResult> {
  console.log("[STUB] registerZoomAttendee:", params);
  return {
    registrantId: `reg_${Date.now()}`,
    joinUrl: `https://zoom.us/j/stub-${Date.now()}?tk=attendee`,
  };
}
