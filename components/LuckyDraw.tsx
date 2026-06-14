"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { site } from "@/lib/config";
import SlotMachine from "./SlotMachine";
import Confetti from "./Confetti";

type Step = "form" | "spinning" | "result" | "already";
type Outcome = "win" | "lose";

interface EnteredRecord {
  handle: string;
  result: Outcome;
}

const HANDLE_RE = /^[a-z0-9._]{2,30}$/;
const STORAGE_KEY = "ullim:draw:entry";

export default function LuckyDraw() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [handle, setHandle] = useState("");
  const [followed, setFollowed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 이 브라우저에서 이미 응모했는지 (localStorage에 저장 → 새로고침/재방문에도 유지)
  const [entered, setEntered] = useState<EnteredRecord | null>(null);

  const spinning = step === "spinning";

  // 마운트 시 이전 응모 기록을 복원 (클라이언트 전용)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const rec = JSON.parse(raw) as EnteredRecord;
        if (rec?.handle && (rec.result === "win" || rec.result === "lose")) {
          setEntered(rec);
        }
      }
    } catch {
      /* localStorage 비활성 환경은 무시 */
    }
  }, []);

  const close = useCallback(() => {
    if (spinning) return; // 추첨 중에는 닫기 방지
    setOpen(false);
  }, [spinning]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const openDraw = () => {
    setError(null);
    // 이미 응모했다면 폼 대신 안내 화면으로
    setStep(entered ? "already" : "form");
    setOpen(true);
  };

  const persistEntry = (rec: EnteredRecord) => {
    setEntered(rec);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    } catch {
      /* 무시 */
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = handle.trim().replace(/^@+/, "").toLowerCase();
    if (!HANDLE_RE.test(normalized)) {
      setError("올바른 인스타그램 아이디를 입력해 주세요. (영문/숫자/마침표/밑줄)");
      return;
    }
    if (!followed) {
      setError("3개 계정을 모두 팔로우한 뒤 체크해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: normalized }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        result?: Outcome;
        error?: string;
      };

      if (res.status === 409) {
        // 같은 아이디로 이미 응모됨 (다른 기기 등) — 오타일 수 있으니 폼에서 안내
        setError("이미 응모한 아이디예요. 응모는 아이디당 1회만 가능해요.");
        return;
      }
      if (!res.ok || (data.result !== "win" && data.result !== "lose")) {
        setError("일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setHandle(normalized);
      setOutcome(data.result);
      persistEntry({ handle: normalized, result: data.result });
      setStep("spinning"); // 결과는 슬롯머신이 멈춘 뒤 공개
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpinDone = useCallback(() => setStep("result"), []);

  return (
    <section className="draw" aria-label="럭키드로우">
      <div className="draw-card">
        <div className="draw-card-inner">
          <p className="draw-eyebrow">FOLLOW &amp; WIN</p>
          <h2 className="draw-title">LUCKY DRAW</h2>
          {entered ? (
            <>
              <p className="draw-desc">
                이미 응모를 완료했어요.
                <br />
                응모는 아이디당 <strong>1회</strong>만 가능해요.
              </p>
              <button type="button" className="draw-open" onClick={openDraw}>
                내 응모 결과 보기
              </button>
            </>
          ) : (
            <>
              <p className="draw-desc">
                팔로우 후 응모하면 즉석에서 추첨!
                <br />단 <strong>3분</strong>께 행운의 선물을 드려요
              </p>
              <button type="button" className="draw-open" onClick={openDraw}>
                럭키드로우 응모하기
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="럭키드로우 응모">
            <button
              type="button"
              className="modal-close"
              onClick={close}
              disabled={spinning}
              aria-label="닫기"
            >
              ✕
            </button>

            {step === "form" && (
              <form className="draw-form" onSubmit={submit}>
                <h3 className="modal-title">럭키드로우 응모</h3>
                <p className="modal-desc">
                  인스타그램 아이디당 <strong>1회</strong>만 응모할 수 있어요.
                  <br />
                  당첨되면 <strong>{site.prize}</strong>을 드려요.
                </p>

                <label className="field">
                  <span className="field-label">인스타그램 아이디</span>
                  <span className="handle-input">
                    <span className="handle-at">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="your_instagram_id"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={31}
                    />
                  </span>
                </label>

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={followed}
                    onChange={(e) => setFollowed(e.target.checked)}
                  />
                  <span>{site.brandName} 계정 3개를 모두 팔로우했어요</span>
                </label>

                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "응모 중..." : "응모하고 돌리기"}
                </button>
                <p className="form-fineprint">
                  응모 시 당첨 안내를 위해 인스타그램 아이디가 저장됩니다.
                </p>
              </form>
            )}

            {step === "already" && entered && (
              <div className={`result already ${entered.result}`}>
                <p className="result-title">이미 응모하셨어요</p>
                <p className="result-desc">
                  <strong>@{entered.handle}</strong> 님은 이미 참여하셨어요.
                  <br />
                  응모는 인스타그램 아이디당 <strong>1회</strong>만 가능해요.
                </p>
                <p className={`already-badge ${entered.result}`}>
                  {entered.result === "win"
                    ? `지난 결과 · 당첨 🎉 ${site.prize} 증정`
                    : "지난 결과 · 아쉽게도 꽝"}
                </p>
                {entered.result === "win" && (
                  <p className="form-fineprint">
                    이 화면을 캡처해 매장 방문 시 보여주시면 경품을 드려요.
                  </p>
                )}
                <button type="button" className="btn-secondary" onClick={close}>
                  닫기
                </button>
              </div>
            )}

            {(step === "spinning" || step === "result") && outcome && (
              <div className="draw-stage">
                <SlotMachine outcome={outcome} onDone={handleSpinDone} />

                {step === "spinning" && (
                  <p className="spin-hint">두구두구두구...</p>
                )}

                {step === "result" && outcome === "win" && (
                  <div className="result win">
                    <Confetti />
                    <p className="result-title">축하합니다, 당첨!</p>
                    <p className="prize-line">{site.prize} 증정</p>
                    <p className="result-desc">
                      <strong>@{handle}</strong> 님, 행운의 주인공이 되셨어요!
                      <br />이 당첨 화면을 캡처해 매장 방문 시 보여주세요.
                    </p>
                    <button type="button" className="btn-primary" onClick={close}>
                      확인
                    </button>
                  </div>
                )}

                {step === "result" && outcome === "lose" && (
                  <div className="result lose">
                    <span className="stamp">꽝</span>
                    <p className="result-desc">
                      아쉽지만 다음 기회에 만나요.
                      <br />
                      팔로우를 유지하시면 다음 이벤트 소식을
                      <br />
                      가장 먼저 받아보실 수 있어요.
                    </p>
                    <button type="button" className="btn-secondary" onClick={close}>
                      닫기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
