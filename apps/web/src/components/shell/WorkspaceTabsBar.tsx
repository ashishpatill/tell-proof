"use client";

import { Settings, Maximize2, Minimize2 } from "lucide-react";

export type WorkspaceTab = {
  id: string;
  title: string;
  pinned?: boolean;
};

export function WorkspaceTabsBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onHome,
  onSettings,
  focusCanvas,
  onToggleFocus,
}: {
  tabs: WorkspaceTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onHome: () => void;
  onSettings: () => void;
  focusCanvas?: boolean;
  onToggleFocus?: () => void;
}) {
  return (
    <div className="tell-tabs" role="tablist" aria-label="Workspace">
      <button
        type="button"
        role="tab"
        className="tell-tabs__tab"
        data-active={activeId === "home" ? "true" : "false"}
        aria-selected={activeId === "home"}
        onClick={onHome}
      >
        Home
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tell-tabs__tab"
          data-active={activeId === tab.id ? "true" : "false"}
          aria-selected={activeId === tab.id}
          onClick={() => onSelect(tab.id)}
          title={tab.title}
        >
          <span className="truncate">{tab.title}</span>
          {!tab.pinned ? (
            <span
              role="button"
              tabIndex={0}
              className="tell-tabs__close"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose(tab.id);
                }
              }}
            >
              ×
            </span>
          ) : null}
        </button>
      ))}
      <div className="tell-tabs__actions">
        {onToggleFocus ? (
          <button
            type="button"
            className="tell-rail__btn"
            aria-label={focusCanvas ? "Show critic pane" : "Focus canvas"}
            onClick={onToggleFocus}
          >
            {focusCanvas ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        ) : null}
        <button type="button" className="tell-rail__btn" aria-label="Settings" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
