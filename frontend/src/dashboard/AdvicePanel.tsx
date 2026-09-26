import { type FormEvent, useCallback, useEffect, useState } from "react";
import { requestJson } from "../api";
import type {
  AdvicePost,
  AdviceRepliesResponse,
  AdviceResponse,
  CurrentUser,
} from "./types";
import { formatRelativeTime } from "../utils/time";
import { ChevronRightIcon } from "./icons";

interface ReplyDraftMap {
  [adviceId: string]: string;
}

interface ReplyMap {
  [adviceId: string]: AdviceRepliesResponse["replies"];
}

export function AdvicePanel({ currentUser }: { currentUser: CurrentUser }) {
  const [mode, setMode] = useState<"need" | "give">("need");
  const [adviceItems, setAdviceItems] = useState<AdvicePost[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<ReplyDraftMap>({});
  const [repliesByAdvice, setRepliesByAdvice] = useState<ReplyMap>({});
  const [openRepliesByAdvice, setOpenRepliesByAdvice] = useState<Record<string, boolean>>({});

  const loadAdvice = useCallback(
    async (cursor: string | null, append: boolean) => {
      const params = new URLSearchParams();
      params.set("mode", mode);
      if (cursor) {
        params.set("cursor", cursor);
      }

      const response = await requestJson<AdviceResponse>(`/advice?${params.toString()}`, {
        method: "GET",
      });

      setAdviceItems((previous) =>
        append ? [...previous, ...response.advice] : response.advice,
      );
      setNextCursor(response.nextCursor);
    },
    [mode],
  );

  const refreshAdvice = useCallback(async () => {
    setStatus("");
    setIsLoading(true);
    try {
      await loadAdvice(null, false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load advice");
    } finally {
      setIsLoading(false);
    }
  }, [loadAdvice]);

  useEffect(() => {
    void refreshAdvice();
  }, [refreshAdvice]);

  async function handleAskAdvice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questionDraft.trim()) {
      return;
    }

    try {
      await requestJson<{ advice: AdvicePost }>("/advice", {
        method: "POST",
        body: {
          content: questionDraft.trim(),
        },
      });
      setQuestionDraft("");
      setStatus("Advice request posted anonymously.");
      await refreshAdvice();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to post advice");
    }
  }

  async function loadReplies(adviceId: string) {
    try {
      const response = await requestJson<AdviceRepliesResponse>(`/advice/${adviceId}/replies`, {
        method: "GET",
      });
      setRepliesByAdvice((previous) => ({
        ...previous,
        [adviceId]: response.replies,
      }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load replies");
    }
  }

  async function handleReply(adviceId: string) {
    const draft = replyDrafts[adviceId]?.trim() ?? "";
    if (!draft) {
      return;
    }

    try {
      await requestJson<{ reply: { id: string } }>(`/advice/${adviceId}/replies`, {
        method: "POST",
        body: { content: draft },
      });
      setReplyDrafts((previous) => ({
        ...previous,
        [adviceId]: "",
      }));
      await Promise.all([loadReplies(adviceId), refreshAdvice()]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reply");
    }
  }

  function toggleReplies(adviceId: string) {
    const currentlyOpen = Boolean(openRepliesByAdvice[adviceId]);
    if (currentlyOpen) {
      setOpenRepliesByAdvice((previous) => ({
        ...previous,
        [adviceId]: false,
      }));
      return;
    }

    setOpenRepliesByAdvice((previous) => ({
      ...previous,
      [adviceId]: true,
    }));

    if (!repliesByAdvice[adviceId]) {
      void loadReplies(adviceId);
    }
  }

  return (
    <section className="page-section advice-page">
      <div className="advice-toolbar">
        <div className="advice-toolbar-actions">
          <button
            className={mode === "need" ? "btn-primary" : "btn-secondary"}
            type="button"
            onClick={() => setMode("need")}
          >
            Ask
          </button>
          <button
            className={mode === "give" ? "btn-primary" : "btn-secondary"}
            type="button"
            onClick={() => setMode("give")}
          >
            Answer
          </button>
        </div>
      </div>

      {mode === "need" ? (
        <form className="advice-compose" onSubmit={handleAskAdvice}>
          <textarea
            className="field-input advice-textarea"
            maxLength={800}
            placeholder="Ask anonymously. No one knows it's you."
            required
            rows={4}
            value={questionDraft}
            onChange={(event) => setQuestionDraft(event.target.value)}
          />
          <button className="btn-primary advice-submit" type="submit">
            Post anonymously
          </button>
        </form>
      ) : null}

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Loading advice...</p> : null}

      {!isLoading && adviceItems.length === 0 ? (
        <div className="ui-empty">
          <h2 className="ui-display">NO ADVICE YET.</h2>
          <p>Anonymous questions will show up here once they are posted.</p>
        </div>
      ) : null}

      <div className="advice-list">
        {adviceItems.map((advice) => (
          <article className="advice-card" key={advice.id}>
            <header className="advice-card-header">
              <span className="advice-anon-pill">Anonymous</span>
              <span className="advice-reply-count">{advice.reply_count} replies</span>
              <time className="advice-time" dateTime={advice.created_at}>
                {formatRelativeTime(advice.created_at)}
              </time>
            </header>
            <p className="advice-content">{advice.content}</p>

            {mode === "give" ? (
              <div className="advice-reply-composer">
                <textarea
                  className="field-input advice-reply-textarea"
                  maxLength={800}
                  placeholder="Share helpful advice..."
                  rows={3}
                  value={replyDrafts[advice.id] ?? ""}
                  onChange={(event) =>
                    setReplyDrafts((previous) => ({
                      ...previous,
                      [advice.id]: event.target.value,
                    }))
                  }
                />
                <button className="btn-secondary advice-reply-submit" type="button" onClick={() => void handleReply(advice.id)}>
                  Reply
                </button>
              </div>
            ) : null}

            <footer className="advice-card-footer">
              <button className="btn-ghost advice-replies-toggle" type="button" onClick={() => toggleReplies(advice.id)}>
                {openRepliesByAdvice[advice.id] ? "Hide replies" : "View replies"}
                <ChevronRightIcon />
              </button>
            </footer>

            {openRepliesByAdvice[advice.id] && (repliesByAdvice[advice.id] ?? []).length > 0 ? (
              <div className="advice-reply-list">
                {(repliesByAdvice[advice.id] ?? []).map((reply) => (
                  <article className="advice-reply-card" key={reply.id}>
                    <header className="advice-reply-header">
                      <strong>
                        {reply.user_id === currentUser.id ? "You" : `@${reply.username}`}
                      </strong>
                      <time className="advice-time" dateTime={reply.created_at}>
                        {formatRelativeTime(reply.created_at)}
                      </time>
                    </header>
                    <p>{reply.content}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {openRepliesByAdvice[advice.id] && (repliesByAdvice[advice.id] ?? []).length === 0 ? (
              <p className="empty-state">No replies yet.</p>
            ) : null}
          </article>
        ))}
      </div>

      {nextCursor ? (
        <button className="btn-secondary advice-load-more" type="button" onClick={() => void loadAdvice(nextCursor, true)}>
          Load more
        </button>
      ) : null}
    </section>
  );
}
