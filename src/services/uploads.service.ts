import apiClient from './api';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

/**
 * Image upload pipeline (TASKS P2-06).
 *
 * Why two-step "request signed URL → PUT to storage":
 *  • Avoids streaming images through our own backend.
 *  • S3 / R2 / GCS handle the bytes → CDN edge handles delivery.
 *  • Mobile client never holds storage credentials.
 *
 * Flow:
 *   1. POST /vendor/uploads/sign  → { uploadUrl, fileUrl, fields? }
 *   2. PUT uploadUrl with the image bytes (or POST + form fields for S3 presigned POST)
 *   3. Submit fileUrl with the product create/update payload.
 *
 * The mock path returns the local URI as if it were already a CDN URL — fine
 * for screenshot demos but a Real Image Backend™ is required for any tester.
 */

export interface SignedUpload {
  uploadUrl: string;
  fileUrl: string;
  /** Present when the storage requires a presigned-POST form (vs a PUT). */
  fields?: Record<string, string>;
  /** Server tells us how it wants the bytes delivered. */
  method: 'PUT' | 'POST';
  /** Max bytes the backend will accept — enforce client-side too. */
  maxBytes: number;
  /** Content-Type the backend signed for; the client must send the same. */
  contentType: string;
}

export interface UploadOptions {
  contentType?: string; // default 'image/jpeg'
  /** Client-side compression hint — Expo ImagePicker handles real compression at pick time. */
  intent?: 'product' | 'avatar' | 'evidence';
}

const MAX_BYTES_DEFAULT = 5 * 1024 * 1024; // 5 MB per image

export const uploadsService = {
  async signImageUpload(options: UploadOptions = {}): Promise<SignedUpload> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      // In mock mode we pretend we got a signed URL but never use it; the
      // caller will short-circuit and store the local URI as if it were public.
      return {
        uploadUrl: 'https://example.invalid/mock-upload',
        fileUrl: `https://cdn.ekopicker.com/mock/${Date.now()}.jpg`,
        method: 'PUT',
        maxBytes: MAX_BYTES_DEFAULT,
        contentType: options.contentType ?? 'image/jpeg',
      };
    }
    const { data } = await apiClient.post<SignedUpload>('/vendor/uploads/sign', {
      contentType: options.contentType ?? 'image/jpeg',
      intent: options.intent ?? 'product',
    });
    return data;
  },

  /**
   * Convenience: sign + upload a local file URI in one step. Returns the
   * permanent CDN URL the backend can resolve.
   */
  async uploadImage(localUri: string, options: UploadOptions = {}): Promise<string> {
    if (USE_MOCK) {
      // Don't actually upload — just hand back the local URI. Real backend
      // wouldn't accept this; the mobile app already enforces real uploads
      // when EXPO_PUBLIC_USE_MOCK=false.
      await new Promise((r) => setTimeout(r, 400));
      return localUri;
    }

    const signed = await this.signImageUpload(options);

    // Fetch the file as a Blob (works for both file:// and content:// on RN).
    const fileResponse = await fetch(localUri);
    const blob = await fileResponse.blob();
    if (blob.size > signed.maxBytes) {
      throw new Error(`Image exceeds ${Math.round(signed.maxBytes / 1024 / 1024)} MB limit`);
    }

    if (signed.method === 'PUT') {
      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': signed.contentType },
        body: blob,
      });
      if (!put.ok) {
        throw new Error(`Upload failed: ${put.status} ${put.statusText}`);
      }
    } else {
      // S3-style presigned POST
      const form = new FormData();
      Object.entries(signed.fields ?? {}).forEach(([k, v]) => form.append(k, v));
      // RN FormData accepts this shape for files
      form.append('file', {
        uri: localUri,
        name: `upload.jpg`,
        type: signed.contentType,
      } as unknown as Blob);
      const post = await fetch(signed.uploadUrl, { method: 'POST', body: form });
      if (!post.ok) {
        throw new Error(`Upload failed: ${post.status} ${post.statusText}`);
      }
    }

    return signed.fileUrl;
  },
};
