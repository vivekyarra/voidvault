import { type FormEvent, useEffect, useState } from "react";
import { requestJson } from "../api";
import type { SearchResponse } from "./types";
import { formatMonthDay } from "../utils/time";
import { PostCard } from "./PostCard";
import { sendFollow, sendUnfollow } from "./shared";

export function SearchPanel({
  onOpenProfile,
  onOpenChat,
}: {
  onOpenProfile: (userId: string) => void;
  onOpenChat: (userId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runSearch(searchText: string) {
    setStatus("");
    setIsLoading(true);
    try {
      const encoded = encodeURIComponent(searchText);
      const response = await requestJson<SearchResponse>(`/search?q=${encoded}`, {
        method: "GET",
      });
      setResult(response);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void runSearch("");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(query);
  }

  async function handleFollowAction(userId: string, isFollowing: boolean) {
    try {
      if (isFollowing) {
        await sendUnfollow(userId);
      } else {
        await sendFollow(userId);
      }
      await runSearch(query);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Follow action failed");
    }
  }

  return (
    <section className="page-section search-page">
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          className="field-input"
          placeholder="Search users and posts..."
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn-primary search-submit" type="submit">
          Search
        </button>
      </form>

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Searching...</p> : null}

      {!isLoading && result ? (
        <>
          <div className="results-section">
            <h2 className="results-title">Users</h2>
          {result.users.length === 0 ? (
            <div className="ui-empty search-empty-state">
              <h2 className="ui-display">No results</h2>
              <p>Try a different username.</p>
            </div>
          ) : null}
          <div className="user-card-list">
            {result.users.map((user) => (
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
                    <time className="user-card-meta" dateTime={user.created_at}>
                      Joined {formatMonthDay(user.created_at)}
                    </time>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button
                    className="btn-secondary user-card-follow"
                    type="button"
                    onClick={() => void handleFollowAction(user.id, user.is_following)}
                  >
                    {user.is_following ? "Following" : "Follow"}
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
            <h2 className="results-title">Posts</h2>
          {result.posts.length === 0 ? <p className="empty-state">No matching posts.</p> : null}
          <div className="card-list">
            {result.posts.map((post) => (
              <PostCard
                key={post.id}
                channel={post.channel}
                content={post.content}
                createdAt={post.created_at}
                imageUrl={post.image_url}
                onOpenProfile={() => onOpenProfile(post.user_id)}
                username={post.username}
                videoUrl={post.video_url}
              />
            ))}
          </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
