import { requestJson } from "../api";

interface SignedUploadResponse {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  resource_type?: string;
}

type UploadAssetType = "image" | "video";

export interface UploadedPostMedia {
  secureUrl: string;
  mediaType: UploadAssetType;
}

async function uploadAsset(
  file: File,
  purpose: "post" | "profile",
  endpointResource: "image" | "auto",
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResponse> {
  const signed = await requestJson<SignedUploadResponse>("/media/sign-upload", {
    method: "POST",
    body: { purpose },
  });

  return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      signed.cloud_name,
    )}/${endpointResource}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.api_key);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("folder", signed.folder);
    formData.append("signature", signed.signature);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress(percent);
    };

    xhr.onerror = () => {
      reject(new Error("Media upload failed"));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Media upload failed"));
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
        if (!payload.secure_url) {
          reject(new Error("Media upload failed"));
          return;
        }
        resolve(payload);
      } catch {
        reject(new Error("Media upload failed"));
      }
    };

    xhr.send(formData);
  });
}

export async function uploadPostMedia(
  file: File,
  mediaType: UploadAssetType,
  onProgress?: (percent: number) => void,
): Promise<UploadedPostMedia> {
  const payload = await uploadAsset(file, "post", "auto", onProgress);
  const normalizedType = payload.resource_type?.toLowerCase() === "video" ? "video" : "image";
  if (normalizedType !== mediaType) {
    throw new Error("Uploaded media type mismatch. Please try again.");
  }

  return {
    secureUrl: payload.secure_url,
    mediaType: normalizedType,
  };
}

export async function uploadProfileImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const payload = await uploadAsset(file, "profile", "image", onProgress);
  return payload.secure_url;
}
