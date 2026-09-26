import { useEffect, useState } from "react";
import { requestJson } from "../api";
import type { FollowDataResponse } from "./types";
import { formatMonthDay } from "../utils/time";
import { RefreshIcon } from "./icons";
import { sendFollow, sendUnfollow } from "./shared";

export function FollowPanel({
  onOpenChat,
  onOpenProfile,
}: {
  onOpenChat: (userId: string) => void;
  onOpenProfile: (userId: string) => void;
}) {
  const [data, setData] = useState<FollowDataResponse | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadData() {
    setStatus("");
    setIsLoading(true);
    try {
      const response = await requestJson<FollowDataResponse>("/follow", {
        method: "GET",
      });
      setData(response);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load follow data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleFollow(userId: string, shouldUnfollow: boolean) {
    try {
      if (shouldUnfollow) {
        await sendUnfollow(userId);
      } else {
        await sendFollow(userId);
      }
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Follow action failed");
    }
  }

  return (
    <section className="page-section follow-page">
      <div className="page-toolbar">
        <button
          aria-label="Refresh people"
          className="icon-only-btn"
          type="button"
          onClick={() => void loadData()}
        >
          <RefreshIcon />
        </button>
      </div>

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Loading follow data...</p> : null}

      {!isLoading && data ? (
        <>
          <div className="results-section">
          <h2 className="results-title">Suggestions</h2>
          {data.suggestions.length === 0 ? (
            <div className="ui-empty">
              <h2 className="ui-display">All caught up</h2>
              <p>You&apos;re following everyone here.</p>
            </div>
          ) : null}
          <div className="user-card-list">
            {data.suggestions.map((user) => (
              <article className="user-card" key={user.id}>
                <div className="user-card-main">
                  <div className="user-card-avatar" aria-hidden="true">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="user-card-copy">
                    <button
                      className="user-card-username"
                      type="button"
                      onClick={() => onOpenProfile(user.id)}
                    >
                      @{user.username}
                    </button>
                    <span className="user-card-meta">People you might want to follow</span>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button className="btn-secondary user-card-follow" type="button" onClick={() => void handleFollow(user.id, false)}>
                    Follow
                  </button>
                  <button className="btn-ghost user-card-chat" type="button" onClick={() => onOpenChat(user.id)}>
                    Chat
                  </button>
                </div>
              </article>
            ))}
          </div>
          </div>

          <div className="results-section">
          <h2 className="results-title">Following</h2>
          {data.following.length === 0 ? (
            <p className="empty-state">You are not following anyone yet.</p>
          ) : null}
          <div className="user-card-list">
            {data.following.map((user) => (
              <article className="user-card" key={user.id}>
                <div className="user-card-main">
                  <div className="user-card-avatar" aria-hidden="true">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="user-card-copy">
                    <button
                      className="user-card-username"
                      type="button"
                      onClick={() => onOpenProfile(user.id)}
                    >
                      @{user.username}
                    </button>
                    <time className="user-card-meta" dateTime={user.followed_at}>
                      Following since {formatMonthDay(user.followed_at)}
                    </time>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button className="btn-secondary user-card-follow" type="button" onClick={() => void handleFollow(user.id, true)}>
                    Unfollow
                  </button>
                  <button className="btn-ghost user-card-chat" type="button" onClick={() => onOpenChat(user.id)}>
                    Chat
                  </button>
                </div>
              </article>
            ))}
          </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
