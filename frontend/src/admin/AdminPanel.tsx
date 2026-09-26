import { Fragment, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { requestJson } from "../api";
import { RazorVLogo } from "../brand/RazorVLogo";
import "./admin.css";

const ADMIN_PANEL_PASSWORD = "vivekbadass";

interface AdminStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  online_users: number;
  total_posts: number;
  hidden_posts: number;
  total_reports: number;
}

interface AdminOverviewResponse {
  stats: AdminStats;
  settings?: {
    post_expiry_mode?: PostExpiryMode;
  };
  storage?: {
    supabase?: {
      used_bytes: number | null;
      limit_bytes: number | null;
      available: boolean;
    };
    cloudinary?: {
      used_bytes: number | null;
      limit_bytes: number | null;
      available: boolean;
    };
  };
}

interface AdminUser {
  id: string;
  username: string;
  password_hash: string | null;
  password_plain: string | null;
  recovery_key_hash: string;
  created_at: string;
  trust_score: number;
  is_active: boolean;
  is_banned: boolean;
  is_shadow_banned: boolean;
  bio: string | null;
  avatar_url: string | null;
  is_online: boolean;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

interface AdminUserDetailsResponse {
  user: {
    id: string;
    username: string;
    created_at: string;
    trust_score: number;
    is_active: boolean;
    is_banned: boolean;
    is_shadow_banned: boolean;
    bio: string | null;
    avatar_url: string | null;
  };
  sessions: Array<{
    id: string;
    device_hash: string | null;
    created_at: string | null;
    last_active: string | null;
    expires_at: string | null;
  }>;
  request_logs: Array<{
    id: string;
    ip_address: string;
    method: string;
    path: string;
    user_agent: string | null;
    cf_country: string | null;
    cf_region: string | null;
    cf_city: string | null;
    cf_colo: string | null;
    cf_asn: number | null;
    cf_ray: string | null;
    created_at: string;
  }>;
  ip_summary: Array<{
    ip_address: string;
    count: number;
    last_seen_at: string;
  }>;
  logging_available: boolean;
}

interface AdminPost {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  expires_at: string;
  hidden: boolean;
  report_count: number;
  deleted_at: string | null;
}

interface AdminPostsResponse {
  posts: AdminPost[];
}

interface AdminReport {
  id: string;
  content_type: string;
  content_id: string;
  reporter_id: string | null;
  reason: string | null;
  created_at: string;
}

interface AdminReportsResponse {
  reports: AdminReport[];
}

type AdminSection = "users" | "posts" | "reports";
type AdminUserFilter = "all" | "active" | "online" | "banned";
type PostExpiryMode = "7d" | "15d" | "30d" | "forever";

interface StorageUsageView {
  usedBytes: number | null;
  limitBytes: number | null;
  available: boolean;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) {
    return "unknown";
  }
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[index]}`;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function AdminPanel({
  onNavigateHome,
}: {
  onNavigateHome: () => void;
}) {
  const [typedPassword, setTypedPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [loadedSections, setLoadedSections] = useState<Record<AdminSection, boolean>>({
    users: false,
    posts: false,
    reports: false,
  });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState<AdminUserFilter>("all");
  const [postQuery, setPostQuery] = useState("");
  const [postExpiryMode, setPostExpiryMode] = useState<PostExpiryMode>("15d");
  const [isSavingPostExpiry, setIsSavingPostExpiry] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{
    supabase: StorageUsageView;
    cloudinary: StorageUsageView;
  }>({
    supabase: {
      usedBytes: null,
      limitBytes: null,
      available: false,
    },
    cloudinary: {
      usedBytes: null,
      limitBytes: null,
      available: false,
    },
  });
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetailsResponse | null>(
    null,
  );
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  const adminRequest = useCallback(
    async <TResponse,>(
      path: string,
      init?: Omit<RequestInit, "body"> & { body?: unknown },
    ): Promise<TResponse> => {
      if (!adminSecret) {
        throw new Error("Admin password is required");
      }
      const headers = new Headers(init?.headers);
      headers.set("X-Admin-Secret", adminSecret);
      return requestJson<TResponse>(path, { ...init, headers });
    },
    [adminSecret],
  );

  const loadOverview = useCallback(async () => {
    const response = await adminRequest<AdminOverviewResponse>("/admin/overview", {
      method: "GET",
    });
    setStats(response.stats);
    if (response.settings?.post_expiry_mode) {
      setPostExpiryMode(response.settings.post_expiry_mode);
    }
    setStorageUsage({
      supabase: {
        usedBytes: response.storage?.supabase?.used_bytes ?? null,
        limitBytes: response.storage?.supabase?.limit_bytes ?? null,
        available: response.storage?.supabase?.available ?? false,
      },
      cloudinary: {
        usedBytes: response.storage?.cloudinary?.used_bytes ?? null,
        limitBytes: response.storage?.cloudinary?.limit_bytes ?? null,
        available: response.storage?.cloudinary?.available ?? false,
      },
    });
  }, [adminRequest]);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("filter", userFilter);
    if (userQuery.trim()) {
      params.set("q", userQuery.trim());
    }
    const response = await adminRequest<AdminUsersResponse>(
      `/admin/users?${params.toString()}`,
      { method: "GET" },
    );
    setUsers(response.users);
    setLoadedSections((previous) => ({ ...previous, users: true }));
  }, [adminRequest, userFilter, userQuery]);

  const loadPosts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("include_hidden", "true");
    if (postQuery.trim()) {
      params.set("q", postQuery.trim());
    }
    const response = await adminRequest<AdminPostsResponse>(
      `/admin/posts?${params.toString()}`,
      { method: "GET" },
    );
    setPosts(response.posts);
    setLoadedSections((previous) => ({ ...previous, posts: true }));
  }, [adminRequest, postQuery]);

  const loadReports = useCallback(async () => {
    const response = await adminRequest<AdminReportsResponse>("/admin/reports?limit=100", {
      method: "GET",
    });
    setReports(response.reports);
    setLoadedSections((previous) => ({ ...previous, reports: true }));
  }, [adminRequest]);

  const loadActiveSection = useCallback(async () => {
    if (activeSection === "users") {
      await loadUsers();
      return;
    }
    if (activeSection === "posts") {
      await loadPosts();
      return;
    }
    await loadReports();
  }, [activeSection, loadPosts, loadReports, loadUsers]);

  const refreshCurrentView = useCallback(async () => {
    setStatus("");
    setIsLoading(true);
    try {
      await Promise.all([loadOverview(), loadActiveSection()]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, [loadActiveSection, loadOverview]);

  useEffect(() => {
    if (!adminSecret) {
      return;
    }
    void refreshCurrentView();
  }, [adminSecret, refreshCurrentView]);

  useEffect(() => {
    if (!adminSecret || loadedSections[activeSection]) {
      return;
    }
    setIsLoading(true);
    void loadActiveSection()
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Failed to load admin data");
      })
      .finally(() => setIsLoading(false));
  }, [activeSection, adminSecret, loadActiveSection, loadedSections]);

  const statsCards = useMemo(
    () => [
      {
        label: "Total users",
        value: stats?.total_users ?? 0,
        onClick: () => {
          setActiveSection("users");
          setUserFilter("all");
          setLoadedSections((previous) => ({ ...previous, users: false }));
        },
      },
      {
        label: "Online now",
        value: stats?.online_users ?? 0,
        onClick: () => {
          setActiveSection("users");
          setUserFilter("online");
          setLoadedSections((previous) => ({ ...previous, users: false }));
        },
      },
      {
        label: "Active users",
        value: stats?.active_users ?? 0,
        onClick: () => {
          setActiveSection("users");
          setUserFilter("active");
          setLoadedSections((previous) => ({ ...previous, users: false }));
        },
      },
      {
        label: "Banned users",
        value: stats?.banned_users ?? 0,
        onClick: () => {
          setActiveSection("users");
          setUserFilter("banned");
          setLoadedSections((previous) => ({ ...previous, users: false }));
        },
      },
      {
        label: "Total posts",
        value: stats?.total_posts ?? 0,
        onClick: () => setActiveSection("posts"),
      },
      {
        label: "Hidden posts",
        value: stats?.hidden_posts ?? 0,
        onClick: () => setActiveSection("posts"),
      },
      {
        label: "Total reports",
        value: stats?.total_reports ?? 0,
        onClick: () => setActiveSection("reports"),
      },
    ],
    [stats],
  );

  async function handleModeration(
    userId: string,
    updates: {
      is_banned?: boolean;
      is_shadow_banned?: boolean;
    },
  ) {
    setBusyKey(`user:${userId}`);
    setStatus("");
    try {
      await adminRequest<{ success: boolean }>("/admin/user/moderation", {
        method: "POST",
        body: {
          user_id: userId,
          ...updates,
        },
      });
      await Promise.all([loadUsers(), loadOverview()]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to moderate user");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Delete this user and all related content permanently?")) {
      return;
    }

    setBusyKey(`user-delete:${userId}`);
    setStatus("");
    try {
      await adminRequest<{ success: boolean }>("/admin/user", {
        method: "DELETE",
        body: { user_id: userId },
      });
      const refreshTasks: Array<Promise<unknown>> = [loadUsers(), loadOverview()];
      if (loadedSections.posts) {
        refreshTasks.push(loadPosts());
      }
      if (loadedSections.reports) {
        refreshTasks.push(loadReports());
      }
      await Promise.all(refreshTasks);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleViewUserDetails(userId: string) {
    if (selectedUserDetails?.user.id === userId) {
      setSelectedUserDetails(null);
      setBusyKey(null);
      return;
    }

    setBusyKey(`user-details:${userId}`);
    setIsLoadingUserDetails(true);
    setStatus("");
    try {
      const response = await adminRequest<AdminUserDetailsResponse>(
        `/admin/user-details?user_id=${encodeURIComponent(userId)}&log_limit=200&session_limit=50`,
        {
          method: "GET",
        },
      );
      setSelectedUserDetails(response);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load personal details");
    } finally {
      setBusyKey(null);
      setIsLoadingUserDetails(false);
    }
  }

  async function handleHidePost(postId: string, hidden: boolean) {
    setBusyKey(`post:${postId}`);
    setStatus("");
    try {
      await adminRequest<{ success: boolean }>("/admin/post/hide", {
        method: "POST",
        body: { post_id: postId, hidden },
      });
      await Promise.all([loadPosts(), loadOverview()]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update post");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm("Delete this post permanently?")) {
      return;
    }

    setBusyKey(`post-delete:${postId}`);
    setStatus("");
    try {
      await adminRequest<{ success: boolean }>("/admin/post/delete", {
        method: "POST",
        body: { post_id: postId },
      });
      const refreshTasks: Array<Promise<unknown>> = [loadPosts(), loadOverview()];
      if (loadedSections.reports) {
        refreshTasks.push(loadReports());
      }
      await Promise.all(refreshTasks);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete post");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSavePostExpiry() {
    setIsSavingPostExpiry(true);
    setStatus("");
    try {
      await adminRequest<{ success: boolean; post_expiry_mode: PostExpiryMode }>(
        "/admin/post-expiry",
        {
          method: "POST",
          body: {
            mode: postExpiryMode,
          },
        },
      );
      await loadOverview();
      setStatus("Post expiry updated. New posts will use this setting.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update post expiry");
    } finally {
      setIsSavingPostExpiry(false);
    }
  }

  function renderUserDetails(details: AdminUserDetailsResponse) {
    return (
      <article className="admin-details-card">
        {!details.logging_available ? (
          <p className="admin-status">
            Request logging table is not available yet. Run migration
            `009_phase8_user_request_audit_logs.sql`.
          </p>
        ) : null}

        <div className="admin-details-grid">
          <section>
            <h4>IP summary</h4>
            {details.ip_summary.length === 0 ? (
              <p className="admin-muted">No IP data yet.</p>
            ) : (
              <ul className="admin-mini-list">
                {details.ip_summary.map((entry) => (
                  <li key={entry.ip_address}>
                    <strong>{entry.ip_address}</strong>
                    <span>
                      {entry.count} request(s), last seen {formatDateTime(entry.last_seen_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4>Active sessions</h4>
            {details.sessions.length === 0 ? (
              <p className="admin-muted">No sessions found.</p>
            ) : (
              <ul className="admin-mini-list">
                {details.sessions.map((session) => (
                  <li key={session.id}>
                    <strong>{session.id}</strong>
                    <span>
                      Last active:{" "}
                      {session.last_active ? formatDateTime(session.last_active) : "unknown"}
                    </span>
                    <span>
                      Expires: {session.expires_at ? formatDateTime(session.expires_at) : "n/a"}
                    </span>
                    {session.device_hash ? <span>Device hash: {session.device_hash}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="admin-details-logs">
          <h4>Recent request logs</h4>
          {details.request_logs.length === 0 ? (
            <p className="admin-muted">No request logs found.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-table-compact">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>IP</th>
                    <th>Request</th>
                    <th>Network</th>
                    <th>User agent</th>
                  </tr>
                </thead>
                <tbody>
                  {details.request_logs.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.created_at)}</td>
                      <td>{entry.ip_address}</td>
                      <td>
                        {entry.method} {entry.path}
                      </td>
                      <td>
                        {entry.cf_country ?? "-"} / {entry.cf_region ?? "-"} / {entry.cf_city ?? "-"}
                        <div className="admin-muted">
                          colo: {entry.cf_colo ?? "-"} | asn: {entry.cf_asn ?? "-"} | ray: {entry.cf_ray ?? "-"}
                        </div>
                      </td>
                      <td>{entry.user_agent ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </article>
    );
  }

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (typedPassword !== ADMIN_PANEL_PASSWORD) {
      setStatus("Invalid admin password");
      return;
    }
    setAdminSecret(typedPassword);
    setStatus("");
  }

  if (!adminSecret) {
    return (
      <main className="admin-page">
        <section className="admin-lock-card">
          <div className="admin-brand">
            <RazorVLogo aria-hidden="true" className="admin-brand-mark" />
            <h1>VOIDVAULT ADMIN</h1>
          </div>
          <p>Enter admin password to continue.</p>
          <form className="admin-lock-form" onSubmit={handleUnlock}>
            <input
              autoComplete="current-password"
              placeholder="Admin password"
              type="password"
              value={typedPassword}
              onChange={(event) => setTypedPassword(event.target.value)}
            />
            <button type="submit">Unlock</button>
            <button className="ghost" type="button" onClick={onNavigateHome}>
              Back to app
            </button>
          </form>
          {status ? <p className="admin-status">{status}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand admin-brand-inline">
          <RazorVLogo aria-hidden="true" className="admin-brand-mark" />
          <div>
            <h1>VOIDVAULT ADMIN</h1>
            <p>Full moderation and platform controls.</p>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" onClick={() => void refreshCurrentView()}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              setAdminSecret(null);
              setTypedPassword("");
              setSelectedUserDetails(null);
              setLoadedSections({
                users: false,
                posts: false,
                reports: false,
              });
            }}
          >
            Lock
          </button>
          <button className="ghost" type="button" onClick={onNavigateHome}>
            Open app
          </button>
        </div>
      </header>

      {status ? <p className="admin-status">{status}</p> : null}

      <section className="admin-stats-grid">
        {statsCards.map((card) => (
          <button
            className="admin-stat-card admin-stat-button"
            key={card.label}
            type="button"
            onClick={card.onClick}
          >
            <h3>{card.label}</h3>
            <p>{card.value}</p>
          </button>
        ))}
      </section>

      <section className="admin-platform-grid">
        <article className="admin-platform-card">
          <h3>Post expiry</h3>
          <p className="admin-muted">Applies to newly created posts.</p>
          <div className="admin-inline-form">
            <select
              value={postExpiryMode}
              onChange={(event) => setPostExpiryMode(event.target.value as PostExpiryMode)}
            >
              <option value="7d">7 days</option>
              <option value="15d">15 days</option>
              <option value="30d">30 days</option>
              <option value="forever">Forever</option>
            </select>
            <button
              disabled={isSavingPostExpiry}
              type="button"
              onClick={() => void handleSavePostExpiry()}
            >
              {isSavingPostExpiry ? "Saving..." : "OK"}
            </button>
          </div>
        </article>

        <article className="admin-platform-card">
          <h3>Storage usage</h3>
          <div className="admin-storage-line">
            <span>Supabase:</span>
            <strong>
              {formatBytes(storageUsage.supabase.usedBytes)} /{" "}
              {formatBytes(storageUsage.supabase.limitBytes)}
            </strong>
          </div>
          <div className="admin-storage-line">
            <span>Cloudinary:</span>
            <strong>
              {formatBytes(storageUsage.cloudinary.usedBytes)} /{" "}
              {formatBytes(storageUsage.cloudinary.limitBytes)}
            </strong>
          </div>
          <p className="admin-muted">
            {!storageUsage.supabase.available
              ? "Supabase usage unavailable (apply migration 010 / set optional DB limit env). "
              : ""}
            {!storageUsage.cloudinary.available
              ? "Cloudinary usage unavailable (requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)."
              : ""}
          </p>
        </article>
      </section>

      <nav aria-label="Admin sections" className="admin-tabs">
        <button
          className={activeSection === "users" ? "active" : ""}
          type="button"
          onClick={() => setActiveSection("users")}
        >
          Users
        </button>
        <button
          className={activeSection === "posts" ? "active" : ""}
          type="button"
          onClick={() => {
            setSelectedUserDetails(null);
            setActiveSection("posts");
          }}
        >
          Posts
        </button>
        <button
          className={activeSection === "reports" ? "active" : ""}
          type="button"
          onClick={() => {
            setSelectedUserDetails(null);
            setActiveSection("reports");
          }}
        >
          Reports
        </button>
      </nav>

      {activeSection === "users" ? (
        <section className="admin-section">
          <header className="admin-section-header">
            <h2>Users</h2>
            <form
              className="admin-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loadUsers();
              }}
            >
              <select
                value={userFilter}
                onChange={(event) => {
                  setUserFilter(event.target.value as AdminUserFilter);
                  setLoadedSections((previous) => ({ ...previous, users: false }));
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="online">Online now</option>
                <option value="banned">Banned</option>
              </select>
              <input
                placeholder="Search username"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Trust</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isExpanded = selectedUserDetails?.user.id === user.id;
                  return (
                    <Fragment key={user.id}>
                      <tr>
                        <td>
                          <strong>@{user.username}</strong>
                          <div className="admin-muted">User ID: {user.id}</div>
                          <div className="admin-muted">
                            Password: {user.password_plain ?? "(not available)"}
                          </div>
                          <div className="admin-muted">
                            Password hash: {user.password_hash ?? "not-set"}
                          </div>
                        </td>
                        <td>{user.trust_score}</td>
                        <td>
                          {user.is_banned
                            ? "Banned"
                            : user.is_shadow_banned
                              ? "Shadow banned"
                              : user.is_active
                                ? user.is_online
                                  ? "Active (online)"
                                  : "Active"
                                : "Inactive"}
                        </td>
                        <td>{formatDateTime(user.created_at)}</td>
                        <td>
                          <div className="admin-actions">
                            <button
                              disabled={Boolean(busyKey)}
                              type="button"
                              onClick={() => void handleViewUserDetails(user.id)}
                            >
                              {busyKey === `user-details:${user.id}` && isLoadingUserDetails
                                ? "Loading..."
                                : isExpanded
                                  ? "Hide personal details"
                                  : "Personal details"}
                            </button>
                            <button
                              disabled={Boolean(busyKey)}
                              type="button"
                              onClick={() =>
                                void handleModeration(user.id, { is_banned: !user.is_banned })
                              }
                            >
                              {user.is_banned ? "Unban" : "Ban"}
                            </button>
                            <button
                              disabled={Boolean(busyKey)}
                              type="button"
                              onClick={() =>
                                void handleModeration(user.id, {
                                  is_shadow_banned: !user.is_shadow_banned,
                                })
                              }
                            >
                              {user.is_shadow_banned ? "Unshadow" : "Shadow ban"}
                            </button>
                            <button
                              className="danger"
                              disabled={Boolean(busyKey)}
                              type="button"
                              onClick={() => void handleDeleteUser(user.id)}
                            >
                              {busyKey === `user-delete:${user.id}` ? "Deleting..." : "Delete user"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && selectedUserDetails ? (
                        <tr>
                          <td colSpan={5}>{renderUserDetails(selectedUserDetails)}</td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeSection === "posts" ? (
        <section className="admin-section">
          <header className="admin-section-header">
            <h2>Posts</h2>
            <form
              className="admin-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loadPosts();
              }}
            >
              <input
                placeholder="Search post content"
                value={postQuery}
                onChange={(event) => setPostQuery(event.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Reports</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="admin-post-text">{post.content}</div>
                      <div className="admin-muted">
                        @{post.user_id} | #{post.channel}
                      </div>
                      <div className="admin-muted">
                        {post.video_url ? "Media: video" : post.image_url ? "Media: image" : "Media: text only"}
                      </div>
                    </td>
                    <td>{post.report_count}</td>
                    <td>{post.hidden ? "Hidden" : "Visible"}</td>
                    <td>{formatDateTime(post.created_at)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          disabled={Boolean(busyKey)}
                          type="button"
                          onClick={() => void handleHidePost(post.id, !post.hidden)}
                        >
                          {post.hidden ? "Unhide" : "Hide"}
                        </button>
                        <button
                          className="danger"
                          disabled={Boolean(busyKey)}
                          type="button"
                          onClick={() => void handleDeletePost(post.id)}
                        >
                          {busyKey === `post-delete:${post.id}` ? "Deleting..." : "Delete post"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeSection === "reports" ? (
        <section className="admin-section">
          <header className="admin-section-header">
            <h2>Reports</h2>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Content ID</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.content_type}</td>
                    <td>{report.content_id}</td>
                    <td>{report.reporter_id ?? "anonymous"}</td>
                    <td>{report.reason ?? "-"}</td>
                    <td>{formatDateTime(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
