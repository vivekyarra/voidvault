import { useState, type ReactNode } from "react";
import { RazorVLogo } from "../brand/RazorVLogo";
import type { DashboardTab } from "./types";
import {
  AdviceIcon,
  BellIcon,
  ChatIcon,
  FollowIcon,
  HomeIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ProfileIcon,
  SearchIcon,
} from "./icons";

const DESKTOP_NAV_ITEMS: Array<{
  id: DashboardTab;
  label: string;
  icon: ReactNode;
}> = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "advice", label: "Advice", icon: <AdviceIcon /> },
  { id: "chat", label: "Chat", icon: <ChatIcon /> },
  { id: "follow", label: "Follow", icon: <FollowIcon /> },
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
];

const MOBILE_MORE_ITEMS: Array<{
  id: DashboardTab;
  label: string;
  icon: ReactNode;
}> = [
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "advice", label: "Advice", icon: <AdviceIcon /> },
  { id: "follow", label: "Follow", icon: <FollowIcon /> },
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
];

export function SideNav({
  activeTab,
  onSelectTab,
  onOpenComposer,
  showNotificationDot = false,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenComposer: () => void;
  showNotificationDot?: boolean;
}) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const isMoreTabActive =
    isMoreSheetOpen ||
    activeTab === "notifications" ||
    activeTab === "advice" ||
    activeTab === "follow" ||
    activeTab === "profile";

  return (
    <>
      <aside className="dashboard-sidebar">
        <button
          className="dashboard-brand"
          type="button"
          onClick={() => onSelectTab("home")}
        >
          <RazorVLogo aria-hidden="true" className="dashboard-brand-mark" />
          <span className="dashboard-brand-wordmark">VOIDVAULT</span>
        </button>
        <nav className="dashboard-nav">
          {DESKTOP_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`dashboard-nav-item ${activeTab === item.id ? "active" : ""}`.trim()}
              type="button"
              onClick={() => onSelectTab(item.id)}
            >
              <span
                className={`dashboard-nav-icon ${
                  item.id === "notifications" && showNotificationDot
                    ? "has-notification-dot"
                    : ""
                }`}
                aria-hidden="true"
              >
                {item.icon}
                {item.id === "notifications" && showNotificationDot ? (
                  <span className="dashboard-nav-dot" />
                ) : null}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="btn-primary dashboard-post-btn" type="button" onClick={onOpenComposer}>
          + Post
        </button>
      </aside>

      <nav aria-label="Primary" className="dashboard-mobile-tabbar">
        <button
          className={`dashboard-mobile-tab ${activeTab === "home" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            onSelectTab("home");
          }}
        >
          <HomeIcon />
          <span>Home</span>
        </button>
        <button
          className={`dashboard-mobile-tab ${activeTab === "search" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            onSelectTab("search");
          }}
        >
          <SearchIcon />
          <span>Search</span>
        </button>
        <button
          aria-label="Create post"
          className="dashboard-mobile-post"
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            onOpenComposer();
          }}
        >
          <span className="dashboard-mobile-post-icon" aria-hidden="true">
            <PlusIcon />
          </span>
          <span>Post</span>
        </button>
        <button
          className={`dashboard-mobile-tab ${activeTab === "chat" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            onSelectTab("chat");
          }}
        >
          <ChatIcon />
          <span>Chat</span>
        </button>
        <button
          aria-expanded={isMoreSheetOpen}
          aria-haspopup="dialog"
          className={`dashboard-mobile-tab ${isMoreTabActive ? "active" : ""}`}
          type="button"
          onClick={() => setIsMoreSheetOpen((previous) => !previous)}
        >
          <span className="dashboard-mobile-tab-icon">
            <MoreHorizontalIcon />
            {showNotificationDot ? <span className="dashboard-nav-dot" /> : null}
          </span>
          <span>More</span>
        </button>
      </nav>

      {isMoreSheetOpen ? (
        <>
          <button
            aria-label="Close more navigation"
            className="dashboard-mobile-sheet-backdrop"
            type="button"
            onClick={() => setIsMoreSheetOpen(false)}
          />
          <section aria-label="More navigation" className="dashboard-mobile-sheet" role="dialog">
            <div className="dashboard-mobile-sheet-handle" aria-hidden="true" />
            <div className="dashboard-mobile-sheet-list">
              {MOBILE_MORE_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`dashboard-mobile-sheet-item ${
                    activeTab === item.id ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onSelectTab(item.id);
                  }}
                >
                  <span className="dashboard-mobile-sheet-icon" aria-hidden="true">
                    {item.icon}
                    {item.id === "notifications" && showNotificationDot ? (
                      <span className="dashboard-nav-dot" />
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
