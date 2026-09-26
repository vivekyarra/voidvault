import { useEffect, useState } from "react";
import { requestJson } from "../api";
import type { NotificationItem, NotificationsResponse } from "./types";
import { formatRelativeTime } from "../utils/time";
import {
  BellIcon,
  CommentIcon,
  FollowIcon,
  HeartIcon,
  RefreshIcon,
  ReplyIcon,
} from "./icons";

function getNotificationStyle(item: NotificationItem) {
  const type = `${item.type} ${item.title}`.toLowerCase();

  if (type.includes("follow")) {
    return {
      label: "New follow",
      icon: <FollowIcon />,
    };
  }

  if (type.includes("reply")) {
    return {
      label: "New reply",
      icon: <ReplyIcon />,
    };
  }

  if (type.includes("comment")) {
    return {
      label: "New comment",
      icon: <CommentIcon />,
    };
  }

  return {
    label: "New like",
    icon: <HeartIcon />,
  };
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadNotifications() {
    setStatus("");
    setIsLoading(true);
    try {
      const response = await requestJson<NotificationsResponse>("/notifications", {
        method: "GET",
      });
      setNotifications(response.notifications);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  return (
    <section className="page-section notifications-page">
      <div className="page-toolbar">
        <button
          aria-label="Refresh notifications"
          className="icon-only-btn"
          type="button"
          onClick={() => void loadNotifications()}
        >
          <RefreshIcon />
        </button>
      </div>

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Loading notifications...</p> : null}

      {!isLoading && notifications.length === 0 ? (
        <div className="ui-empty notifications-empty-state">
          <BellIcon />
          <h2 className="ui-display">No notifications yet</h2>
          <p>Likes and follows will show up here.</p>
        </div>
      ) : null}

      <div className="notification-list">
        {notifications.map((item) => (
          <article
            className={`notification-card ${
              Date.now() - new Date(item.created_at).getTime() < 86_400_000 ? "is-unread" : ""
            }`}
            key={item.id}
          >
            <div className="notification-icon" aria-hidden="true">
              {getNotificationStyle(item).icon}
            </div>
            <div className="notification-copy">
              <header className="notification-card-header">
                <span className="notification-type">{getNotificationStyle(item).label}</span>
                <time className="notification-time" dateTime={item.created_at}>
                  {formatRelativeTime(item.created_at)}
                </time>
              </header>
              <p className="notification-body">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
