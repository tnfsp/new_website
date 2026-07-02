"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnyDrawerCard, DrawerCard, DrawerQACard } from "@/lib/content";
import { DrawerQuestion } from "./DrawerQuestion";
import { DrawerQACardView } from "./DrawerQACardView";

/**
 * 抽屜：一張會「長開」的卡（不是抽屜面＋底下再一張）。
 *  - 闔上：標題＋引言＋把手。
 *  - 拉開：同一張卡往下長，露出一張紙條。
 *  - 紙條正面是問題＋左右兩顆選項（左 A、右 B）；按下去「翻頁」→ 背面是一小段關於我的話。
 * 內容先、互動是包裝；私密為主（不顯示大家的比例，投票仍記到後端）。
 */

/** Narrows an AnyDrawerCard to a preference card. */
function isPreferenceCard(card: AnyDrawerCard): card is DrawerCard {
  return (card as DrawerQACard).type !== "qa";
}

/** Narrows an AnyDrawerCard to a Q&A card. */
function isQACard(card: AnyDrawerCard): card is DrawerQACard {
  return (card as DrawerQACard).type === "qa";
}

/** 已投過的題目記在 localStorage：「再想一次」翻回來重按、或重抽到同題，都不再重複送票。 */
const VOTED_KEY = "drawer:voted";

function hasVoted(questionId: string): boolean {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(questionId) : false;
  } catch {
    return false;
  }
}

function markVoted(questionId: string) {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    const voted = raw ? (JSON.parse(raw) as string[]) : [];
    if (!voted.includes(questionId)) {
      voted.push(questionId);
      localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
    }
  } catch {
    /* localStorage 不可用就算了，頂多重複計一票 */
  }
}

/** 把 choice + 選項，組成第一人稱的「我選…」開頭（不改 reason 的字）。 */
function myAnswerLead(card: DrawerCard): { prefix: string; option: string | null } {
  switch (card.choice) {
    case "A":
      return { prefix: "我選的是", option: card.optionA };
    case "偏A":
      return { prefix: "我比較偏", option: card.optionA };
    case "偏B":
      return { prefix: "我比較偏", option: card.optionB };
    case "B":
      return { prefix: "我選的是", option: card.optionB };
    default:
      return { prefix: "這題我兩邊都有一點", option: null };
  }
}

export function DrawerDeck({ cards }: { cards: AnyDrawerCard[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(cards.length > 0 ? cards.length - 1 : 0);
  // 翻頁用「單一元件轉到側面→換內容→轉回來」，不靠 3D preserve-3d
  // （preserve-3d 在 overflow-hidden 的展開容器裡會被壓平、翻不過去）。
  const [face, setFace] = useState<"front" | "back">("front");
  const [turning, setTurning] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [qOpen, setQOpen] = useState(false); // 「丟一張紙條」表單開合
  const drawTimerRef = useRef<number | null>(null);
  const turnTimerRef = useRef<number | null>(null);

  // 卸載時清掉動畫計時器，避免 setState 打在已卸載的元件上
  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) window.clearTimeout(drawTimerRef.current);
      if (turnTimerRef.current !== null) window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  const drawRandom = useCallback(() => {
    setIndex((cur) => {
      if (cards.length <= 1) return cur;
      let n = Math.floor(Math.random() * cards.length);
      while (n === cur) n = Math.floor(Math.random() * cards.length);
      return n;
    });
    setFace("front");
    setTurning(false);
    setDrawing(true);
    if (drawTimerRef.current !== null) window.clearTimeout(drawTimerRef.current);
    drawTimerRef.current = window.setTimeout(() => setDrawing(false), 180);
  }, [cards.length]);

  // 掛載後先抽一張藏在裡面，拉開即見。
  useEffect(() => {
    if (cards.length > 1) drawRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
    drawRandom();
  }, [drawRandom]);

  // 翻頁：轉到側面（看不見）→ 中途換內容 → 轉回正面。
  const turnTo = useCallback((target: "front" | "back") => {
    setTurning(true);
    if (turnTimerRef.current !== null) window.clearTimeout(turnTimerRef.current);
    turnTimerRef.current = window.setTimeout(() => {
      setFace(target);
      setTurning(false);
    }, 200);
  }, []);

  // 按下一邊 → 翻頁看我。票仍記到後端，前端不顯示比例；同一題只計一票。
  const pick = useCallback(
    (side: "A" | "B", questionId: string) => {
      turnTo("back");
      if (hasVoted(questionId)) return; // 照樣翻到背面，只是不再送票
      markVoted(questionId);
      fetch("/api/drawer-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, side }),
      }).catch(() => {});
    },
    [turnTo]
  );

  const card = cards.length > 0 ? cards[index] : null;
  const prefCard = card && isPreferenceCard(card) ? card : null;
  const qaCard = card && isQACard(card) ? card : null;
  const hasReason = Boolean(prefCard?.reason && prefCard.reason.trim());
  const lead = prefCard ? myAnswerLead(prefCard) : null;

  return (
    <div className="surface-card px-6 py-5">
      {/* 標題列：永遠在；拉開時右邊出現「收起」 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">抽屜</h2>
        {open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setFace("front");
            }}
            className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)]"
          >
            收起 ︿
          </button>
        ) : null}
      </div>

      {/* 闔上的臉：引言 + 把手（拉開時收合）
          inert：收合的面板裡的按鈕不能留在 Tab 順序裡，鍵盤使用者會「隱形觸發」 */}
      <div
        aria-hidden={open}
        inert={open}
        className={
          "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none " +
          (open ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100")
        }
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-[var(--foreground)] leading-relaxed">
            這個抽屜放了我的喜好小紙條，好奇你的答案：）
          </p>
          {card ? (
            <button
              type="button"
              onClick={openDrawer}
              disabled={open}
              className="group mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 transition-colors hover:border-[var(--accent)]"
            >
              <span className="flex flex-col items-center gap-2">
                <span className="h-1.5 w-12 rounded-full bg-[var(--border)] transition-colors group-hover:bg-[var(--accent)]" />
                <span className="text-sm text-[var(--muted)]">拉開抽屜，抽一張</span>
              </span>
            </button>
          ) : (
            <p className="pt-3 text-sm text-[var(--muted)]">
              抽屜還是空的——碎片正在一點點累積，過幾天再來拉拉看。
            </p>
          )}
        </div>
      </div>

      {/* 拉開的內容：紙條（翻頁）+ 把手（同一張卡往下長） */}
      <div
        aria-hidden={!open}
        inert={!open}
        className={
          "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none " +
          (open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none")
        }
      >
        <div className="overflow-hidden">
          {card ? (
            <div className="pt-4">
              {/* 紙條：翻頁（單一元件轉側→換內容→轉回） */}
              <div className="[perspective:1000px]">
                <div
                  className={
                    "transition-transform duration-200 ease-in-out " +
                    (drawing ? "opacity-0" : "opacity-100")
                  }
                  style={{ transform: turning ? "rotateY(90deg)" : "rotateY(0deg)" }}
                >
                  {/* ── QA card: no flip needed, shows question + answer directly ── */}
                  {qaCard ? (
                    <DrawerQACardView card={qaCard} />
                  ) : prefCard && lead ? (
                    /* ── Preference card: two-sided flip ── */
                    face === "front" ? (
                      /* 正面：問題 + 左右兩顆選項 */
                      <div className="space-y-4">
                        <p className="text-xs text-[var(--muted)]">{prefCard.date}</p>
                        <p className="text-lg font-semibold leading-relaxed text-[var(--foreground)]">
                          {prefCard.question}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => pick("A", prefCard.questionId)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left text-sm leading-relaxed text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                          >
                            {prefCard.optionA}
                          </button>
                          <button
                            type="button"
                            onClick={() => pick("B", prefCard.questionId)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left text-sm leading-relaxed text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                          >
                            {prefCard.optionB}
                          </button>
                        </div>
                        <p className="text-center text-xs text-[var(--muted)]">
                          你會選哪邊？按一下，翻過去看我。
                        </p>
                      </div>
                    ) : (
                      /* 背面：一小段關於我的話 */
                      <div className="space-y-3">
                        {prefCard.passage ? (
                          /* 成稿：About 口吻的一小段（content/drawer-passages.json）；空行分段 */
                          prefCard.passage.split(/\n{2,}/).map((para, i) => (
                            <p
                              key={i}
                              className="leading-relaxed text-[var(--foreground)]"
                            >
                              {para}
                            </p>
                          ))
                        ) : (
                          /* 回退：templated 開頭 + reason 原文 */
                          <>
                            <p className="text-base font-medium leading-relaxed text-[var(--foreground)]">
                              {lead.option ? (
                                <>
                                  {lead.prefix}{" "}
                                  <span className="text-[var(--accent-strong)]">
                                    {lead.option}
                                  </span>
                                  。
                                </>
                              ) : (
                                <>{lead.prefix}。</>
                              )}
                            </p>
                            {hasReason ? (
                              <p className="leading-relaxed text-[var(--foreground)]">
                                {prefCard.reason}
                              </p>
                            ) : (
                              <p className="text-sm text-[var(--muted)]">
                                （這題我還沒多想，就是這樣。）
                              </p>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => turnTo("front")}
                          className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--accent-strong)]"
                        >
                          ← 再想一次
                        </button>
                      </div>
                    )
                  ) : null}
                </div>
              </div>

              {/* 把手：計數 + 丟一張紙條 / 再抽一張（並排） */}
              <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[var(--muted)]">
                    抽屜裡有 {cards.length} 張紙條
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQOpen((o) => !o)}
                      aria-expanded={qOpen}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                    >
                      丟一張紙條
                    </button>
                    {cards.length > 1 ? (
                      <button
                        type="button"
                        onClick={drawRandom}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                      >
                        再抽一張
                        <span aria-hidden="true">↻</span>
                      </button>
                    ) : null}
                  </div>
                </div>
                {qOpen ? <DrawerQuestion onCancel={() => setQOpen(false)} /> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
