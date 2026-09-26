import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { requestJson } from "../api";
import { RazorVLogo } from "../brand/RazorVLogo";
import type {
  ChatConversation,
  ChatListResponse,
  ChatMessage,
  ChatMessagesResponse,
  CurrentUser,
  SearchResponse,
  SearchUser,
} from "./types";
import { ArrowLeftIcon, PaperPlaneIcon } from "./icons";
import { formatRelativeTime } from "../utils/time";

export function ChatPanel({
  currentUser,
  chatTargetUserId,
  onChatTargetHandled,
  onOpenProfile,
}: {
  currentUser: CurrentUser;
  chatTargetUserId: string | null;
  onChatTargetHandled: () => void;
  onOpenProfile: (userId: string) => void;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesNextCursor, setMessagesNextCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchResults, setChatSearchResults] = useState<SearchUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const loadConversations = useCallback(async () => {
    setStatus("");
    setIsLoading(true);
    try {
      const response = await requestJson<ChatListResponse>("/chat/list", {
        method: "GET",
      });
      setConversations(response.conversations);
      setActiveConversationId((previous) =>
        previous ?? response.conversations[0]?.conversation_id ?? null,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, before: string | null, append: boolean) => {
      const query = before ? `?before=${encodeURIComponent(before)}` : "";
      const response = await requestJson<ChatMessagesResponse>(
        `/chat/${conversationId}/messages${query}`,
        { method: "GET" },
      );
      const fetched = [...response.messages].reverse();
      setMessages((previous) => (append ? [...fetched, ...previous] : fetched));
      setMessagesNextCursor(response.nextCursor);
    },
    [],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobileView(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setMessagesNextCursor(null);
      return;
    }
    void loadMessages(activeConversationId, null, false).catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to load messages");
    });
  }, [activeConversationId, loadMessages]);

  const searchUsersForChat = useCallback(async (query: string) => {
    if (!query.trim()) {
      setChatSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const params = new URLSearchParams();
      params.set("q", query.trim());
      params.set("limit", "20");
      const response = await requestJson<SearchResponse>(`/search?${params.toString()}`, {
        method: "GET",
      });
      setChatSearchResults(response.users);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to search users");
    } finally {
      setIsSearchingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!chatSearchQuery.trim()) {
      setChatSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void searchUsersForChat(chatSearchQuery);
    }, 220);

    return () => clearTimeout(timeout);
  }, [chatSearchQuery, searchUsersForChat]);

  const startChat = useCallback(
    async (userId: string) => {
      const response = await requestJson<{ conversation_id: string }>("/chat/start", {
        method: "POST",
        body: { user_id: userId },
      });
      await loadConversations();
      setActiveConversationId(response.conversation_id);
      setMobileThreadOpen(true);
      setChatSearchQuery("");
      setChatSearchResults([]);
    },
    [loadConversations],
  );

  useEffect(() => {
    async function handleTarget() {
      if (!chatTargetUserId) {
        return;
      }
      try {
        await startChat(chatTargetUserId);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to open chat");
      } finally {
        onChatTargetHandled();
      }
    }
    void handleTarget();
  }, [chatTargetUserId, onChatTargetHandled, startChat]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    try {
      await requestJson<{ message: ChatMessage }>(`/chat/${activeConversationId}/message`, {
        method: "POST",
        body: { content: draft },
      });
      setDraft("");
      await loadMessages(activeConversationId, null, false);
      await loadConversations();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send message");
    }
  }

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversation_id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const showConversationList = !isMobileView || !mobileThreadOpen;
  const showConversationThread = !isMobileView || mobileThreadOpen;

  return (
    <section className="page-section chat-layout">
      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Loading chats...</p> : null}

      <div className="chat-grid">
        {showConversationList ? (
          <aside className="chat-sidebar">
            <div className="chat-sidebar-search">
              <input
                className="field-input"
                placeholder="Search conversations..."
                value={chatSearchQuery}
                onChange={(event) => setChatSearchQuery(event.target.value)}
              />
            </div>

            <div className="chat-sidebar-scroll">
              {isSearchingUsers ? <p className="empty-state">Searching users...</p> : null}

              {chatSearchResults.map((user) => (
                <button
                  key={`search-${user.id}`}
                  className="chat-list-item"
                  type="button"
                  onClick={() => void startChat(user.id)}
                >
                  <div className="chat-avatar" aria-hidden="true">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="chat-list-copy">
                    <div className="chat-list-top">
                      <strong>@{user.username}</strong>
                    </div>
                    <span className="chat-list-preview">Start conversation</span>
                  </div>
                </button>
              ))}

              {conversations.length === 0 ? <p className="empty-state">No chats yet.</p> : null}
              {conversations.map((conversation) => (
                <button
                  key={conversation.conversation_id}
                  className={`chat-list-item ${
                    activeConversationId === conversation.conversation_id ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conversation.conversation_id);
                    if (isMobileView) {
                      setMobileThreadOpen(true);
                    }
                  }}
                >
                  <div className="chat-avatar" aria-hidden="true">
                    {(conversation.other_user?.username ?? "u").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="chat-list-copy">
                    <div className="chat-list-top">
                      <strong>@{conversation.other_user?.username ?? "unknown"}</strong>
                      <time dateTime={conversation.updated_at}>
                        {formatRelativeTime(conversation.updated_at)}
                      </time>
                    </div>
                    <span className="chat-list-preview">
                      {conversation.last_message?.content ?? "No messages yet."}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        {showConversationThread ? (
          <section className="chat-thread">
            {!activeConversation ? (
              <div className="chat-empty-state">
                <RazorVLogo aria-hidden="true" />
                <h2 className="ui-display">SELECT A CONVERSATION</h2>
                <p>Or search for someone to message.</p>
              </div>
            ) : (
              <>
                <header className="chat-thread-header">
                  {isMobileView ? (
                    <button
                      aria-label="Back to chats"
                      className="chat-back-btn"
                      type="button"
                      onClick={() => setMobileThreadOpen(false)}
                    >
                      <ArrowLeftIcon />
                    </button>
                  ) : null}
                  <button
                    className="chat-thread-user"
                    type="button"
                    onClick={() =>
                      activeConversation.other_user
                        ? onOpenProfile(activeConversation.other_user.id)
                        : null
                    }
                  >
                    @{activeConversation.other_user?.username ?? "unknown"}
                  </button>
                </header>

                <div className="chat-thread-body">
                  {messagesNextCursor ? (
                    <button
                      className="chat-load-more"
                      type="button"
                      onClick={() =>
                        void loadMessages(
                          activeConversation.conversation_id,
                          messagesNextCursor,
                          true,
                        )
                      }
                    >
                      Load older messages
                    </button>
                  ) : null}

                  <div className="message-list">
                    {messages.length === 0 ? (
                      <p className="empty-state">No messages yet.</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`message-row ${
                            message.sender_id === currentUser.id ? "mine" : "theirs"
                          }`}
                        >
                          <article className="message-bubble">
                            <p>{message.content}</p>
                          </article>
                          <time className="message-time" dateTime={message.created_at}>
                            {formatRelativeTime(message.created_at)}
                          </time>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    className="field-input chat-message-input"
                    maxLength={2000}
                    placeholder={`Message @${
                      activeConversation.other_user?.username ?? "user"
                    }...`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <button className="chat-send-btn" type="submit">
                    <PaperPlaneIcon />
                  </button>
                </form>
              </>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
