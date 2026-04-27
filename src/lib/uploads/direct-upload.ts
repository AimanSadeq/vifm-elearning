/**
 * Direct-to-Supabase upload helpers.
 *
 * Files are uploaded straight from the browser to Supabase Storage using
 * short-lived signed upload URLs. The Next.js server only signs the URL —
 * it never buffers file bytes — which avoids OOM on memory-capped hosts.
 */

export interface UploadTicket {
  bucket: string
  path: string
  signedUrl: string
  token: string
  documentType?: 'pdf' | 'zip' | 'word' | 'excel'
}

export type UploadKind = 'video' | 'document'

/**
 * Ask the server for a signed upload URL for this course + file.
 * Throws on validation / auth failure.
 */
export async function requestUploadUrl(
  courseId: string,
  kind: UploadKind,
  file: File
): Promise<UploadTicket> {
  const res = await fetch(`/api/admin/courses/${courseId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Failed to prepare upload (${res.status})`)
  }
  return res.json()
}

/**
 * PUT the file bytes directly to Supabase's signed upload URL.
 * Emits real upload progress via XHR.
 */
export function putToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream'
    )
    // Supabase signed upload URLs accept these headers; x-upsert is optional.
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        let message = `Upload failed (${xhr.status})`
        try {
          const parsed = JSON.parse(xhr.responseText)
          if (parsed?.message) message = parsed.message
          else if (parsed?.error) message = parsed.error
        } catch {
          // Non-JSON body; keep the status-based message.
        }
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error('Network error while uploading'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    xhr.send(file)
  })
}

/**
 * Convenience: request a signed URL and upload, returning the final storage path.
 */
export async function directUpload(
  courseId: string,
  kind: UploadKind,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadTicket> {
  const ticket = await requestUploadUrl(courseId, kind, file)
  await putToSignedUrl(ticket.signedUrl, file, onProgress)
  return ticket
}

function isUploadTicket(value: unknown): value is UploadTicket {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.bucket === 'string' &&
    typeof v.path === 'string' &&
    typeof v.signedUrl === 'string' &&
    typeof v.token === 'string'
  )
}

/**
 * Same direct-upload pattern, but for webinar recordings.
 * Hits /api/admin/webinars/[id]/upload-url and uploads a single video file.
 * Returns the storage path that should be saved into webinar_recordings.url.
 */
export async function uploadWebinarRecording(
  webinarId: string,
  file: File,
  authToken: string,
  onProgress?: (percent: number) => void
): Promise<UploadTicket> {
  const res = await fetch(`/api/admin/webinars/${webinarId}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Failed to prepare upload (${res.status})`)
  }
  const ticket = await res.json()
  // Runtime validation — guards against an endpoint contract drift where the
  // shape changes but TypeScript can't see it (server/client decoupling).
  if (!isUploadTicket(ticket)) {
    throw new Error('Upload endpoint returned an unexpected response shape')
  }
  await putToSignedUrl(ticket.signedUrl, file, onProgress)
  return ticket
}
