import type { ReactNode } from "react";
import { formatRelativeTime } from "../utils/time";

interface PostCardProps {
  channel: string;
  content: string;
  createdAt: string;
  imageAlt?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  username?: string;
  onOpenProfile?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PostCard({
  channel,
  content,
  createdAt,
  imageAlt = "Post attachment",
  imageUrl,
  videoUrl,
  username,
  onOpenProfile,
  actions,
  children,
  className,
}: PostCardProps) {
  const rootClassName = ["post-card", className].filter(Boolean).join(" ");

  return (
    <article className={rootClassName}>
      <header className="post-card-header">
        {username ? (
          onOpenProfile ? (
            <button className="post-card-username" type="button" onClick={onOpenProfile}>
              @{username}
            </button>
          ) : (
            <span className="post-card-username post-card-username-label">@{username}</span>
          )
        ) : null}
        <span className="post-card-channel">#{channel}</span>
        <time className="post-card-time" dateTime={createdAt}>
          {formatRelativeTime(createdAt)}
        </time>
      </header>

      <p className="post-card-content">{content}</p>

      {imageUrl ? (
        <a className="post-card-media" href={imageUrl} rel="noreferrer" target="_blank">
          <img alt={imageAlt} className="content-image" src={imageUrl} />
        </a>
      ) : null}

      {videoUrl ? (
        <video className="content-video post-card-media" controls preload="metadata" src={videoUrl} />
      ) : null}

      {actions ? <footer className="post-actions">{actions}</footer> : null}
      {children}
    </article>
  );
}
