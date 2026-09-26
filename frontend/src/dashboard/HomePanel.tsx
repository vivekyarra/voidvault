import { useCallback, useEffect, useMemo, useState } from "react";
import { requestJson } from "../api";
import { RazorVLogo } from "../brand/RazorVLogo";
import type {
  CurrentUser,
  FeedPost,
  FeedResponse,
  PostComment,
  PostCommentsResponse,
  SearchResponse,
  SearchUser,
} from "./types";
import {
  AlertIcon,
  BookmarkIcon,
  CommentIcon,
  PaperPlaneIcon,
  ShareIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";
import { PostCard } from "./PostCard";
import { formatRelativeTime } from "../utils/time";

interface PostLookupResponse {
  post: FeedPost;
}

interface EngagementResponse {
  success: boolean;
  engagement: FeedPost["engagement"];
}

interface CommentCreateResponse {
  comment: PostComment;
}

interface StartChatResponse {
  conversation_id: string;
}

interface SendChatMessageResponse {
  message: {
    id: string;
  };
}

export function HomePanel({
  currentUser,
  focusedPostId,
  refreshNonce,
  onOpenFollow,
  onOpenProfile,
}: {
  currentUser: CurrentUser;
  focusedPostId: string | null;
  refreshNonce: number;
  onOpenFollow: () => void;
  onOpenProfile: (userId: string) => void;
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [highlightedPost, setHighlightedPost] = useState<FeedPost | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openCommentsFor, setOpenCommentsFor] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [shareTargetPost, setShareTargetPost] = useState<FeedPost | null>(null);
  const [shareUserQuery, setShareUserQuery] = useState("");
  const [shareUserResults, setShareUserResults] = useState<SearchUser[]>([]);
  const [isLoadingShareUsers, setIsLoadingShareUsers] = useState(false);
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const loadFeed = useCallback(
    async (cursor: string | null, append: boolean) => {
      const params = new URLSearchParams();
      if (followingOnly) {
        params.set("following_only", "true");
      }
      params.set("limit", "20");
      if (cursor) {
        params.set("cursor", cursor);
      }

      const query = params.toString();
      const path = query ? `/feed?${query}` : "/feed";
      const response = await requestJson<FeedResponse>(path, { method: "GET" });
      setPosts((previous) => (append ? [...previous, ...response.posts] : response.posts));
      setNextCursor(response.nextCursor);
    },
    [followingOnly],
  );

  const refreshFeed = useCallback(async () => {
    setStatus("");
    setIsLoading(true);
    try {
      await loadFeed(null, false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  }, [loadFeed]);

  const loadFocusedPost = useCallback(async (postId: string) => {
    try {
      const response = await requestJson<PostLookupResponse>(`/post/${postId}`, {
        method: "GET",
      });
      setHighlightedPost(response.post);
    } catch {
      setHighlightedPost(null);
    }
  }, []);

  useEffect(() => {
    void refreshFeed();
  }, [refreshFeed, refreshNonce]);

  useEffect(() => {
    if (!focusedPostId) {
      setHighlightedPost(null);
      return;
    }
    void loadFocusedPost(focusedPostId);
  }, [focusedPostId, loadFocusedPost, refreshNonce]);

  async function applyReaction(post: FeedPost, reaction: "like" | "dislike") {
    const isSameReaction = post.engagement?.myReaction === reaction;

    try {
      const response = isSameReaction
        ? await requestJson<EngagementResponse>(`/post/${post.id}/reaction`, {
            method: "DELETE",
          })
        : await requestJson<EngagementResponse>(`/post/${post.id}/reaction`, {
            method: "POST",
            body: {
              reaction,
            },
          });

      setPosts((previous) =>
        previous.map((row) =>
          row.id === post.id
            ? {
                ...row,
                engagement: response.engagement,
              }
            : row,
        ),
      );
      if (highlightedPost?.id === post.id) {
        setHighlightedPost((previous) =>
          previous
            ? {
                ...previous,
                engagement: response.engagement,
              }
            : previous,
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to react");
    }
  }

  async function toggleSave(post: FeedPost) {
    try {
      const response = await requestJson<EngagementResponse>(`/post/${post.id}/save`, {
        method: post.engagement?.isSaved ? "DELETE" : "POST",
      });

      setPosts((previous) =>
        previous.map((row) =>
          row.id === post.id
            ? {
                ...row,
                engagement: response.engagement,
              }
            : row,
        ),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save post");
    }
  }

  async function handleSubmitReport() {
    if (!reportTargetPostId) {
      return;
    }

    setIsSubmittingReport(true);
    try {
      await requestJson<{ success: boolean }>("/report", {
        method: "POST",
        body: {
          content_type: "post",
          content_id: reportTargetPostId,
          reason: reportReason,
        },
      });
      setStatus("Post reported.");
      setReportTargetPostId(null);
      setReportReason("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to report post");
    } finally {
      setIsSubmittingReport(false);
    }
  }

  async function handleDelete(postId: string) {
    try {
      await requestJson<{ success: boolean }>("/post", {
        method: "DELETE",
        body: { post_id: postId },
      });
      setPosts((previous) => previous.filter((post) => post.id !== postId));
      setStatus("Post deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete post");
    }
  }

  async function loadComments(postId: string) {
    try {
      const response = await requestJson<PostCommentsResponse>(`/post/${postId}/comments`, {
        method: "GET",
      });
      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: response.comments,
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load comments");
    }
  }

  async function addComment(postId: string) {
    const draft = commentDraftByPost[postId]?.trim() ?? "";
    if (!draft) {
      return;
    }

    try {
      const response = await requestJson<CommentCreateResponse>(`/post/${postId}/comments`, {
        method: "POST",
        body: { content: draft },
      });

      setCommentDraftByPost((previous) => ({
        ...previous,
        [postId]: "",
      }));
      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: [response.comment, ...(previous[postId] ?? [])],
      }));
      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                engagement: post.engagement
                  ? {
                      ...post.engagement,
                      commentCount: post.engagement.commentCount + 1,
                    }
                  : post.engagement,
              }
            : post,
        ),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to add comment");
    }
  }

  async function handleShare(post: FeedPost) {
    const shareUrl = `${window.location.origin}/?post=${post.id}`;

    if ("share" in navigator && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "VoidVault post",
          text: post.content.slice(0, 120),
          url: shareUrl,
        });
        setStatus("Shared.");
        return;
      } catch {
        // Ignore cancellation and fall back to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Share link copied.");
    } catch {
      setStatus(shareUrl);
    }
  }

  const loadShareUsers = useCallback(async (query: string) => {
    setIsLoadingShareUsers(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (query.trim()) {
        params.set("q", query.trim());
      }
      const response = await requestJson<SearchResponse>(`/search?${params.toString()}`, {
        method: "GET",
      });
      setShareUserResults(response.users);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to search users");
    } finally {
      setIsLoadingShareUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!shareTargetPost) {
      return;
    }

    const timeout = setTimeout(() => {
      void loadShareUsers(shareUserQuery);
    }, 220);

    return () => clearTimeout(timeout);
  }, [shareTargetPost, shareUserQuery, loadShareUsers]);

  async function handleShareToUser(userId: string) {
    if (!shareTargetPost) {
      return;
    }

    setIsSendingShare(true);
    try {
      const start = await requestJson<StartChatResponse>("/chat/start", {
        method: "POST",
        body: { user_id: userId },
      });
      const shareUrl = `${window.location.origin}/?post=${shareTargetPost.id}`;
      await requestJson<SendChatMessageResponse>(`/chat/${start.conversation_id}/message`, {
        method: "POST",
        body: {
          content: `Check this post on VoidVault: ${shareUrl}`,
        },
      });
      setStatus("Post shared in chat.");
      setShareTargetPost(null);
      setShareUserQuery("");
      setShareUserResults([]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to share in chat");
    } finally {
      setIsSendingShare(false);
    }
  }

  function openShareToUsers(post: FeedPost) {
    setShareTargetPost(post);
    setShareUserQuery("");
    setShareUserResults([]);
  }

  function openReportModal(postId: string) {
    setReportTargetPostId(postId);
    setReportReason("");
  }

  function closeReportModal() {
    setReportTargetPostId(null);
    setReportReason("");
  }

  function closeShareModal() {
    setShareTargetPost(null);
    setShareUserQuery("");
    setShareUserResults([]);
  }

  async function handleReport(postId: string) {
    openReportModal(postId);
  }

  const combinedPosts = useMemo(() => {
    if (!highlightedPost) {
      return posts;
    }
    const withoutDuplicate = posts.filter((post) => post.id !== highlightedPost.id);
    return [highlightedPost, ...withoutDuplicate];
  }, [posts, highlightedPost]);

  return (
    <section className="page-section feed-page">
      <div className="feed-tab-toggle" role="tablist" aria-label="Feed filter">
          <button
            className={`feed-tab ${!followingOnly ? "active" : ""}`}
            type="button"
            onClick={() => setFollowingOnly(false)}
          >
            Trending
          </button>
          <button
            className={`feed-tab ${followingOnly ? "active" : ""}`}
            type="button"
            onClick={() => setFollowingOnly(true)}
          >
            Following
          </button>
      </div>

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state feed-empty-state">Loading feed...</p> : null}

      {!isLoading && combinedPosts.length === 0 ? (
        followingOnly ? (
          <div className="ui-empty">
            <RazorVLogo aria-hidden="true" className="ui-empty-brand" />
            <h2 className="ui-display">Nothing here yet</h2>
            <p>Follow people to see their posts here.</p>
            <button className="btn-secondary" type="button" onClick={onOpenFollow}>
              Find people to follow
            </button>
          </div>
        ) : (
          <div className="ui-empty">
            <RazorVLogo aria-hidden="true" className="ui-empty-brand" />
            <h2 className="ui-display">NO POSTS YET.</h2>
            <p>Your feed will populate once people start posting.</p>
          </div>
        )
      ) : null}

      <div className="card-list">
        {combinedPosts.map((post) => (
          <PostCard
            key={post.id}
            channel={post.channel}
            className={focusedPostId === post.id ? "focused-post" : ""}
            content={post.content}
            createdAt={post.created_at}
            imageUrl={post.image_url}
            onOpenProfile={() => onOpenProfile(post.user_id)}
            username={post.username}
            videoUrl={post.video_url}
            actions={
              <>
              <button
                aria-label="Like"
                className={`post-action ${post.engagement?.myReaction === "like" ? "is-active" : ""}`}
                type="button"
                onClick={() => void applyReaction(post, "like")}
              >
                <ThumbUpIcon />
                <span>{post.engagement?.likeCount ?? 0}</span>
              </button>
              <button
                aria-label="Dislike"
                className={`post-action ${post.engagement?.myReaction === "dislike" ? "is-active" : ""}`}
                type="button"
                onClick={() => void applyReaction(post, "dislike")}
              >
                <ThumbDownIcon />
                <span>{post.engagement?.dislikeCount ?? 0}</span>
              </button>
              <button
                aria-label="Save post"
                className={`post-action ${post.engagement?.isSaved ? "is-active" : ""}`}
                type="button"
                onClick={() => void toggleSave(post)}
              >
                <BookmarkIcon />
                <span>{post.engagement?.saveCount ?? 0}</span>
              </button>
              <button
                aria-label="Share post externally"
                className="post-action"
                type="button"
                onClick={() => void handleShare(post)}
              >
                <ShareIcon />
              </button>
              <button
                aria-label="Share post to VoidVault user"
                className="post-action"
                type="button"
                onClick={() => openShareToUsers(post)}
              >
                <PaperPlaneIcon />
              </button>
              <button
                aria-label="Comments"
                className="post-action"
                type="button"
                onClick={() => {
                  setOpenCommentsFor((previous) => ({
                    ...previous,
                    [post.id]: !previous[post.id],
                  }));
                  if (!openCommentsFor[post.id]) {
                    void loadComments(post.id);
                  }
                }}
              >
                <CommentIcon />
                <span>{post.engagement?.commentCount ?? 0}</span>
              </button>
              <button
                aria-label="Report post"
                className="post-action post-action-report"
                type="button"
                onClick={() => void handleReport(post.id)}
              >
                <AlertIcon />
              </button>
              {post.user_id === currentUser.id ? (
                <button
                  className="post-action post-action-delete"
                  type="button"
                  onClick={() => void handleDelete(post.id)}
                >
                  Delete
                </button>
              ) : null}
              </>
            }
          >

            {openCommentsFor[post.id] ? (
              <div className="comment-block">
                <div className="comment-composer">
                  <textarea
                    className="field-input comment-input"
                    maxLength={500}
                    placeholder="Write a comment"
                    rows={2}
                    value={commentDraftByPost[post.id] ?? ""}
                    onChange={(event) =>
                      setCommentDraftByPost((previous) => ({
                        ...previous,
                        [post.id]: event.target.value,
                      }))
                    }
                  />
                  <button className="btn-secondary comment-submit" type="button" onClick={() => void addComment(post.id)}>
                    Comment
                  </button>
                </div>

                <div className="comment-list">
                  {(commentsByPost[post.id] ?? []).length === 0 ? (
                    <p className="empty-state">No comments yet.</p>
                  ) : (
                    (commentsByPost[post.id] ?? []).map((comment) => (
                      <article className="post-comment-card" key={comment.id}>
                        <header className="post-comment-header">
                          <strong>@{comment.username}</strong>
                          <time dateTime={comment.created_at}>
                            {formatRelativeTime(comment.created_at)}
                          </time>
                        </header>
                        <p>{comment.content}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </PostCard>
        ))}
      </div>

      {nextCursor ? (
        <button
          className="btn-secondary feed-load-more"
          disabled={isLoadingMore}
          type="button"
          onClick={() => {
            setIsLoadingMore(true);
            void loadFeed(nextCursor, true)
              .catch((error: unknown) => {
                setStatus(error instanceof Error ? error.message : "Failed to load more posts");
              })
              .finally(() => setIsLoadingMore(false));
          }}
        >
          {isLoadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}

      {shareTargetPost ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-card share-user-modal">
            <header className="modal-header">
              <div className="modal-copy">
                <p className="ui-kicker">Share</p>
                <h3 className="ui-display">SEND TO CHAT.</h3>
              </div>
              <button className="btn-ghost" type="button" onClick={closeShareModal}>
                Close
              </button>
            </header>
            <div className="search-form">
              <input
                autoFocus
                className="field-input"
                placeholder="Search username"
                value={shareUserQuery}
                onChange={(event) => setShareUserQuery(event.target.value)}
              />
            </div>
            {isLoadingShareUsers ? <p className="empty-state">Searching users...</p> : null}
            {!isLoadingShareUsers && shareUserResults.length === 0 ? (
              <p className="empty-state">No users found.</p>
            ) : null}
            <div className="card-list">
              {shareUserResults.map((user) => (
                <article className="content-card share-user-row" key={user.id}>
                  <div>
                    <strong>@{user.username}</strong>
                  </div>
                  <button
                    className="btn-secondary"
                    disabled={isSendingShare}
                    type="button"
                    onClick={() => void handleShareToUser(user.id)}
                  >
                    {isSendingShare ? "Sharing..." : "Share"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {reportTargetPostId ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-card report-modal">
            <header className="modal-header">
              <div className="modal-copy">
                <p className="ui-kicker">Safety</p>
                <h3 className="ui-display">REPORT POST.</h3>
              </div>
              <button className="btn-ghost" type="button" onClick={closeReportModal}>
                Close
              </button>
            </header>
            <label className="composer">
              <span>Reason (optional)</span>
              <textarea
                className="field-input modal-textarea"
                maxLength={500}
                placeholder="Add reason for report (optional)"
                rows={4}
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
              />
            </label>
            <button
              className="btn-secondary"
              disabled={isSubmittingReport}
              type="button"
              onClick={() => void handleSubmitReport()}
            >
              {isSubmittingReport ? "Submitting..." : "Submit report"}
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
