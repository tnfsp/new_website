"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};

type CommentSectionProps = {
  slug: string;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // slug 切換或卸載時取消請求，避免慢回應覆蓋新頁面的留言
    const controller = new AbortController();
    setLoading(true);
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setComments(data.comments || []);
        setLoading(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Failed to fetch comments:", err);
        setLoading(false);
      }
    };
    fetchComments();
    return () => controller.abort();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, content, honeypot }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
        }
        setName("");
        setEmail("");
        setContent("");
        setMessage({ type: "success", text: "留言已送出！" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to post comment" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to post comment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-2">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="暱稱 *"
            aria-label="暱稱（必填）"
            required
            maxLength={50}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email（選填，不公開）"
            aria-label="Email（選填，不公開）"
            maxLength={100}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] opacity-0"
          aria-hidden="true"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="寫下你的想法..."
          aria-label="留言內容（必填）"
          required
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">{content.length}/2000</span>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-contrast)] disabled:opacity-50"
          >
            {submitting ? "送出中..." : "送出留言"}
          </button>
        </div>
        {message && (
          <p
            aria-live="polite"
            className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
          >
            {message.text}
          </p>
        )}
      </form>

      {/* Comments List */}
      {loading ? (
        <p className="text-sm text-[var(--muted)]">載入留言中...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">還沒有留言，成為第一個留言的人吧！</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-[var(--foreground)]">{comment.name}</span>
                <span className="text-xs text-[var(--muted)]">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
