import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { requestJson } from "../api";
import type { CurrentUser, ProfileResponse } from "./types";
import { LogoutIcon, PencilIcon, RefreshIcon } from "./icons";
import { uploadProfileImage } from "./mediaUpload";
import { formatLongDate } from "../utils/time";
import { PostCard } from "./PostCard";
import { sendFollow, sendUnfollow } from "./shared";

interface ProfileUpdateResponse {
  user: {
    id: string;
    username: string;
    created_at: string;
    trust_score: number;
    bio: string | null;
    avatar_url: string | null;
  };
}

interface ChangePasswordResponse {
  success: boolean;
}

export function ProfilePanel({
  currentUser,
  profileUserId,
  onLogout,
  onOpenChat,
  onCurrentUserUpdated,
}: {
  currentUser: CurrentUser;
  profileUserId: string | null;
  onLogout: () => Promise<void>;
  onOpenChat: (userId: string) => void;
  onCurrentUserUpdated: (user: CurrentUser) => void;
}) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [draftUsername, setDraftUsername] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = useCallback(async () => {
    setStatus("");
    setIsLoading(true);
    try {
      const query = profileUserId ? `?user_id=${encodeURIComponent(profileUserId)}` : "";
      const response = await requestJson<ProfileResponse>(`/profile${query}`, {
        method: "GET",
      });
      setProfile(response);
      setDraftUsername(response.user.username);
      setDraftBio(response.user.bio ?? "");
      setShowDeleteConfirmation(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    void loadProfile();
  }, [currentUser.id, loadProfile]);

  async function handleFollowToggle() {
    if (!profile || profile.stats.is_self) {
      return;
    }
    try {
      if (profile.stats.is_following) {
        await sendUnfollow(profile.user.id);
      } else {
        await sendFollow(profile.user.id);
      }
      await loadProfile();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update follow");
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile?.stats.is_self) {
      return;
    }

    setIsSaving(true);
    setStatus("");
    try {
      const response = await requestJson<ProfileUpdateResponse>("/profile", {
        method: "PATCH",
        body: {
          username: draftUsername,
          bio: draftBio,
        },
      });
      onCurrentUserUpdated({
        id: response.user.id,
        username: response.user.username,
        created_at: response.user.created_at,
      });
      setStatus("Profile updated.");
      await loadProfile();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile?.stats.is_self) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      event.target.value = "";
      return;
    }

    setStatus("");
    setIsUploadingAvatar(true);
    setAvatarUploadProgress(0);

    try {
      const uploadedUrl = await uploadProfileImage(file, setAvatarUploadProgress);
      await requestJson<ProfileUpdateResponse>("/profile", {
        method: "PATCH",
        body: {
          avatar_url: uploadedUrl,
        },
      });
      setStatus("Profile photo updated.");
      await loadProfile();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to upload profile photo");
    } finally {
      event.target.value = "";
      setIsUploadingAvatar(false);
    }
  }

  async function handleDeactivateAccount() {
    if (!profile?.stats.is_self) {
      return;
    }

    setIsDeactivatingAccount(true);
    try {
      await requestJson<{ success: boolean }>("/account/deactivate", {
        method: "POST",
      });
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to deactivate account");
    } finally {
      setIsDeactivatingAccount(false);
    }
  }

  async function handleDeleteAccount() {
    if (!profile?.stats.is_self) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      await requestJson<{ success: boolean }>("/account", {
        method: "DELETE",
      });
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile?.stats.is_self) {
      return;
    }

    setIsChangingPassword(true);
    setStatus("");
    try {
      await requestJson<ChangePasswordResponse>("/account/password/change", {
        method: "POST",
        body: {
          old_password: oldPassword,
          new_password: newPassword,
        },
      });
      setOldPassword("");
      setNewPassword("");
      setStatus("Password changed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLogoutNow() {
    setIsLoggingOut(true);
    setStatus("");
    try {
      await onLogout();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <section className="page-section profile-page">
      <div className="page-toolbar">
        <button
          aria-label="Refresh profile"
          className="icon-only-btn"
          type="button"
          onClick={() => void loadProfile()}
        >
          <RefreshIcon />
        </button>
      </div>

      {status ? <p className="ui-status">{status}</p> : null}
      {isLoading ? <p className="empty-state">Loading profile...</p> : null}

      {!isLoading && profile ? (
        <>
          <article className="profile-card">
            <div className="profile-card-top">
              <div className="profile-avatar-section">
                {profile.user.avatar_url ? (
                  <img
                    alt={`${profile.user.username} profile`}
                    className="profile-avatar-image"
                    src={profile.user.avatar_url}
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    {profile.user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {profile.stats.is_self ? (
                  <>
                    <button
                      aria-label="Change profile photo"
                      className="profile-avatar-action"
                      disabled={isUploadingAvatar}
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <PencilIcon />
                    </button>
                    <input
                      accept="image/*"
                      hidden
                      ref={avatarInputRef}
                      type="file"
                      onChange={(event) => void handleAvatarSelected(event)}
                    />
                  </>
                ) : null}
              </div>

              <div className="profile-identity">
                <div className="profile-identity-row">
                  <h2>@{profile.user.username}</h2>
                  <span className="profile-trust-pill">Trust: {profile.user.trust_score}</span>
                </div>
                <p className="profile-joined">Joined {formatLongDate(profile.user.created_at)}</p>
                {profile.user.bio ? <p className="profile-bio">{profile.user.bio}</p> : null}

                <div className="profile-stats-row">
                  <div className="profile-stat">
                    <strong>{profile.stats.posts}</strong>
                    <span>Posts</span>
                  </div>
                  <div className="profile-stat">
                    <strong>{profile.stats.followers}</strong>
                    <span>Followers</span>
                  </div>
                  <div className="profile-stat">
                    <strong>{profile.stats.following}</strong>
                    <span>Following</span>
                  </div>
                </div>
              </div>
            </div>

            {!profile.stats.is_self ? (
              <div className="profile-external-actions">
                <button className="btn-secondary" type="button" onClick={() => void handleFollowToggle()}>
                  {profile.stats.is_following ? "Unfollow" : "Follow"}
                </button>
                <button className="btn-ghost" type="button" onClick={() => onOpenChat(profile.user.id)}>
                  Chat
                </button>
              </div>
            ) : null}
          </article>

          {profile.stats.is_self ? (
            <>
              <section className="profile-section-card">
                <p className="profile-section-kicker">Edit Profile</p>
                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                  <input
                    className="field-input"
                    maxLength={20}
                    minLength={3}
                    placeholder="Display name"
                    required
                    type="text"
                    value={draftUsername}
                    onChange={(event) => setDraftUsername(event.target.value)}
                  />
                  <textarea
                    className="field-input profile-bio-input"
                    maxLength={200}
                    placeholder="Bio"
                    rows={3}
                    value={draftBio}
                    onChange={(event) => setDraftBio(event.target.value)}
                  />
                  <button className="btn-primary" disabled={isSaving} type="submit">
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </section>
              {isUploadingAvatar ? (
                <p className="ui-status">Uploading profile photo: {avatarUploadProgress}%</p>
              ) : null}

              <section className="profile-section-card">
                <p className="profile-section-kicker">Security</p>
                <form className="profile-password-form" onSubmit={handleChangePassword}>
                  <div className="profile-password-grid">
                    <input
                      autoComplete="current-password"
                      className="field-input"
                      maxLength={128}
                      minLength={8}
                      placeholder="Current password"
                      required
                      type="password"
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                    />
                    <input
                      autoComplete="new-password"
                      className="field-input"
                      maxLength={128}
                      minLength={8}
                      placeholder="New password"
                      required
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <button className="btn-secondary" disabled={isChangingPassword} type="submit">
                    {isChangingPassword ? "Updating..." : "Update password"}
                  </button>
                </form>

                <div className="profile-danger-zone">
                  <p className="profile-danger-label">Danger Zone</p>
                  <div className="profile-controls-row">
                    <button
                      className="btn-secondary logout-pill"
                      disabled={isLoggingOut}
                      type="button"
                      onClick={() => void handleLogoutNow()}
                    >
                      <LogoutIcon />
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={isDeactivatingAccount}
                      type="button"
                      onClick={() => void handleDeactivateAccount()}
                    >
                      {isDeactivatingAccount ? "Deactivating..." : "Deactivate"}
                    </button>
                    <button
                      className="btn-danger"
                      type="button"
                      onClick={() => setShowDeleteConfirmation(true)}
                    >
                      Delete account
                    </button>
                  </div>

                  {showDeleteConfirmation ? (
                    <div className="profile-delete-confirmation">
                      <p>Are you sure? This cannot be undone.</p>
                      <div className="profile-delete-actions">
                        <button className="btn-ghost" type="button" onClick={() => setShowDeleteConfirmation(false)}>
                          Cancel
                        </button>
                        <button
                          className="btn-danger"
                          disabled={isDeletingAccount}
                          type="button"
                          onClick={() => void handleDeleteAccount()}
                        >
                          {isDeletingAccount ? "Deleting..." : "Yes, delete everything"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}

          <section className="profile-posts-section">
            <h2 className="results-title">
              {profile.stats.is_self ? "YOUR POSTS" : "POSTS"}
            </h2>
            {profile.posts.length === 0 ? (
              <p className="empty-state">No content uploaded yet.</p>
            ) : null}
            <div className="card-list">
              {profile.posts.map((post) => (
                <PostCard
                  key={post.id}
                  channel={post.channel}
                  content={post.content}
                  createdAt={post.created_at}
                  imageUrl={post.image_url}
                  username={profile.user.username}
                  videoUrl={post.video_url}
                />
              ))}
            </div>
          </section>

          {profile.stats.is_self ? (
            <section className="profile-posts-section">
              <h2 className="results-title">Saved</h2>
              {profile.saved_posts.length === 0 ? (
                <p className="empty-state">No saved posts yet.</p>
              ) : null}
              <div className="card-list">
                {profile.saved_posts.map((post) => (
                  <PostCard
                    key={`saved-${post.id}`}
                    channel={post.channel}
                    content={post.content}
                    createdAt={post.created_at}
                    imageAlt="Saved post attachment"
                    imageUrl={post.image_url}
                    username={profile.user.username}
                    videoUrl={post.video_url}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
