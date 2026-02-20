"use client";

import { useState } from "react";
import {
  Bookmark,
  BookmarkPlus,
  Clock,
  Trash2,
  Edit2,
  Check,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Highlighter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { VIDEO_BOOKMARK_COLORS } from "@/lib/utils/constants";
import type {
  Bookmark as BookmarkItem,
  BookmarkType,
  BookmarkColor,
} from "@/types";

interface BookmarksPanelProps {
  bookmarks: BookmarkItem[];
  loading: boolean;
  currentTime: number;
  onAdd: (params: {
    timestampSeconds: number;
    note: string;
    bookmarkType: BookmarkType;
    color: BookmarkColor;
  }) => void;
  onUpdate: (
    id: string,
    updates: { note?: string; bookmarkType?: BookmarkType; color?: BookmarkColor }
  ) => void;
  onDelete: (id: string) => void;
  onSeekTo: (seconds: number) => void;
}

const bookmarkTypeConfig = {
  note: { icon: MessageSquare, label: "noteLabel" },
  highlight: { icon: Highlighter, label: "highlightLabel" },
  question: { icon: HelpCircle, label: "questionLabel" },
  important: { icon: AlertCircle, label: "importantLabel" },
} as const;

const colorBorderMap: Record<BookmarkColor, string> = {
  yellow: "border-l-yellow-400",
  blue: "border-l-blue-400",
  green: "border-l-green-400",
  pink: "border-l-pink-400",
  orange: "border-l-orange-400",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BookmarksPanel({
  bookmarks,
  loading,
  currentTime,
  onAdd,
  onUpdate,
  onDelete,
  onSeekTo,
}: BookmarksPanelProps) {
  const t = useTranslations("player");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState("");
  const [newType, setNewType] = useState<BookmarkType>("note");
  const [newColor, setNewColor] = useState<BookmarkColor>("yellow");

  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState<BookmarkType>("note");
  const [editColor, setEditColor] = useState<BookmarkColor>("yellow");

  const handleAdd = () => {
    if (!newNote.trim()) return;
    onAdd({
      timestampSeconds: Math.floor(currentTime),
      note: newNote,
      bookmarkType: newType,
      color: newColor,
    });
    setNewNote("");
    setNewType("note");
    setNewColor("yellow");
    setIsAddingNew(false);
  };

  const startEditing = (bookmark: BookmarkItem) => {
    setEditingId(bookmark.id);
    setEditNote(bookmark.note ?? "");
    setEditType(bookmark.bookmark_type);
    setEditColor(bookmark.color);
  };

  const handleUpdate = (id: string) => {
    onUpdate(id, { note: editNote, bookmarkType: editType, color: editColor });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            {t("bookmarks")}
          </span>
          {bookmarks.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {bookmarks.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {/* Add Bookmark */}
          <div className="p-3 border-b border-border">
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <BookmarkPlus className="h-4 w-4" />
                {t("addNoteAt", { time: formatTime(Math.floor(currentTime)) })}
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={t("writeNote")}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                  autoFocus
                />

                {/* Type selector */}
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(bookmarkTypeConfig) as BookmarkType[]
                  ).map((type) => {
                    const config = bookmarkTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setNewType(type)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                          newType === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {t(config.label)}
                      </button>
                    );
                  })}
                </div>

                {/* Color selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("colorLabel")}:
                  </span>
                  {(Object.keys(VIDEO_BOOKMARK_COLORS) as BookmarkColor[]).map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition-all",
                          newColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        )}
                        style={{
                          backgroundColor: VIDEO_BOOKMARK_COLORS[color],
                        }}
                      />
                    )
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newNote.trim()}
                    className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("saveNote")}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewNote("");
                    }}
                    className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bookmarks List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="py-8 text-center">
                <Bookmark className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("noBookmarks")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {bookmarks.map((bookmark) => {
                  const typeConfig =
                    bookmarkTypeConfig[bookmark.bookmark_type];
                  const Icon = typeConfig.icon;
                  const isEditing = editingId === bookmark.id;

                  return (
                    <div
                      key={bookmark.id}
                      className={cn(
                        "border-l-4",
                        colorBorderMap[bookmark.color]
                      )}
                    >
                      {isEditing ? (
                        <div className="p-3 space-y-2">
                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(bookmark.id)}
                              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                            >
                              <Check className="h-3 w-3" />
                              {t("saveNote")}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="group cursor-pointer p-3 transition-colors hover:bg-muted/50"
                          onClick={() => onSeekTo(bookmark.timestamp_seconds)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(bookmark.timestamp_seconds)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground line-clamp-2">
                                {bookmark.note}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(bookmark);
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={t("editNote")}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(bookmark.id);
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                aria-label={t("deleteNote")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
