import { type FormEvent, useEffect, useRef, useState } from "react";
import { requestJson } from "../api";
import { ImageIcon, XIcon } from "./icons";
import { uploadPostMedia } from "./mediaUpload";

type PostMediaType = "image" | "video";

const MAX_POST_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_POST_VIDEO_BYTES = 75 * 1024 * 1024;

interface UploadedMediaState {
  url: string;
  type: PostMediaType;
}

export function ComposePostModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [channel, setChannel] = useState("general");
  const [content, setContent] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaPreviewType, setMediaPreviewType] = useState<PostMediaType | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    };
  }, [mediaPreviewUrl]);

  function resetState() {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setChannel("general");
    setContent("");
    setUploadStatus("");
    setUploadProgress(0);
    setMediaPreviewUrl(null);
    setMediaPreviewType(null);
    setUploadedMedia(null);
    setIsUploading(false);
    setIsPosting(false);
    setStatus("");
  }

  function detectMediaType(file: File): PostMediaType | null {
    if (file.type.startsWith("image/")) {
      return "image";
    }
    if (file.type.startsWith("video/")) {
      return "video";
    }
    return null;
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const mediaType = detectMediaType(file);
    if (!mediaType) {
      setUploadStatus("Only image and video files are supported.");
      event.target.value = "";
      return;
    }

    const maxBytes = mediaType === "video" ? MAX_POST_VIDEO_BYTES : MAX_POST_IMAGE_BYTES;
    if (file.size > maxBytes) {
      setUploadStatus(
        mediaType === "video"
          ? "Video must be 75MB or smaller."
          : "Image must be 12MB or smaller.",
      );
      event.target.value = "";
      return;
    }

    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }

    const localPreview = URL.createObjectURL(file);
    setMediaPreviewUrl(localPreview);
    setMediaPreviewType(mediaType);
    setUploadedMedia(null);
    setUploadStatus(mediaType === "video" ? "Uploading video..." : "Uploading image...");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await uploadPostMedia(file, mediaType, setUploadProgress);
      setUploadedMedia({
        url: uploaded.secureUrl,
        type: uploaded.mediaType,
      });
      setUploadStatus(
        uploaded.mediaType === "video"
          ? "Video upload completed."
          : "Image upload completed.",
      );
      setUploadProgress(100);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Media upload failed");
      setUploadedMedia(null);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) {
      setStatus("Please wait for media upload to finish.");
      return;
    }

    setIsPosting(true);
    setStatus("");

    try {
      const payload: Record<string, unknown> = {
        channel,
        content,
      };

      if (uploadedMedia?.type === "image") {
        payload.image_url = uploadedMedia.url;
      } else if (uploadedMedia?.type === "video") {
        payload.video_url = uploadedMedia.url;
      }

      await requestJson<{ post: { id: string } }>("/post", {
        method: "POST",
        body: payload,
      });

      await onCreated();
      resetState();
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to publish post");
    } finally {
      setIsPosting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-label="Create post"
        className="modal-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="panel-header">
          <h2>Create Post</h2>
          <button aria-label="Close" className="modal-close-btn" type="button" onClick={onClose}>
            <XIcon />
          </button>
        </header>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            maxLength={32}
            placeholder="channel"
            required
            type="text"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          />
          <textarea
            maxLength={500}
            placeholder="What's happening?"
            required
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <div className="composer-toolbar">
            <button
              aria-label="Attach media"
              className="icon-only-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon />
            </button>
            <input
              accept="image/*,video/*"
              hidden
              ref={fileInputRef}
              type="file"
              onChange={(event) => void handleFileSelected(event)}
            />
            <button className="primary-btn" disabled={isPosting || isUploading} type="submit">
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        {mediaPreviewUrl && mediaPreviewType === "image" ? (
          <img alt="Selected preview" className="content-image" src={mediaPreviewUrl} />
        ) : null}
        {mediaPreviewUrl && mediaPreviewType === "video" ? (
          <video
            className="content-video"
            controls
            preload="metadata"
            src={mediaPreviewUrl}
          />
        ) : null}

        {isUploading ? <p className="panel-status">Uploading media: {uploadProgress}%</p> : null}
        {uploadStatus ? <p className="panel-status">{uploadStatus}</p> : null}
        {status ? <p className="panel-status">{status}</p> : null}
      </section>
    </div>
  );
}
