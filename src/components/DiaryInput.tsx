"use client";

import { useState } from "react";

interface DiaryInputProps {
  onSubmit: (content: string) => void;
  loading: boolean;
}

export default function DiaryInput({ onSubmit, loading }: DiaryInputProps) {
  const [content, setContent] = useState("");

  function handleSubmit() {
    if (!content.trim() || content.trim().length < 10 || loading) return;
    onSubmit(content.trim());
    setContent("");
  }

  return (
    <div className="w-full space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="What's on your mind? Write whatever's there. No filter, no structure. Just let it out..."
        rows={6}
        maxLength={5000}
        disabled={loading}
        className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none disabled:opacity-50"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {content.length > 0 ? `${content.length}/5000` : "⌘+Enter to submit"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || content.trim().length < 10 || loading}
          className="px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] font-semibold text-sm rounded-lg hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "Reading..." : "Show me the mirror"}
        </button>
      </div>
    </div>
  );
}
