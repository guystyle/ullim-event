"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { site } from "@/lib/config";
import SlotMachine from "./SlotMachine";
import Confetti from "./Confetti";

type Step = "form" | "spinning" | "result";
type Outcome = "win" | "lose";

const HANDLE_RE = /^[a-z0-9._]{2,30}$/;

export default function LuckyDraw() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [handle, setHandle] = useState("");
  const [followed, setFollowed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spinning = step === "spinning";

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
        setError("이미 응모한 아이디예요. 응모는 아이디당 1회만 가능해요.");
        return;
      }
      if (!res.ok || (data.result !== "win" && data.result !== "lose")) {
        setError("일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setHandle(normalized);
      setOutcome(data.result);
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
          <p className="draw-desc">
            팔로우 후 응모하면 즉석에서 추첨!
            <br />단 <strong>3분</strong>께 행운의 선물을 드려요
          </p>
          <button
            type="button"
            className="draw-open"
            onClick={() => setOpen(true)}
          >
            🎰 럭키드로우 응모하기
          </button>
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
                  당첨 시 해당 아이디로 DM을 드려요.
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
                  <span>
                    {site.brandName} 계정 3개를 모두 팔로우했어요
                  </span>
                </label>

                {error && <p className="form-error">{error}</p>}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "응모 중..." : "응모하고 돌리기 🎰"}
                </button>
                <p className="form-fineprint">
                  응모 시 당첨 안내를 위해 인스타그램 아이디가 저장됩니다.
                </p>
              </form>
            )}

            {step !== "form" && outcome && (
              <div className="draw-stage">
                {/* 결과 확인 후 다시 열면 회전 없이 결과 화면으로 */}
                <SlotMachine
                  outcome={outcome}
                  onDone={handleSpinDone}
                  instant={step === "result"}
                />

                {step === "spinning" && (
                  <p className="spin-hint">두구두구두구...</p>
                )}

                {step === "result" && outcome === "win" && (
                  <div className="result win">
                    <Confetti />
                    <p className="result-title">🎉 축하합니다, 당첨!</p>
                    <p className="result-desc">
                      <strong>@{handle}</strong> 님, 행운의 주인공이 되셨어요!
                      <br />
                      {site.brandName} 공식 계정에서 DM으로 경품을 안내드릴게요.
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
                      아쉽지만 다음 기회에 만나요 🥲
                      <br />
                      팔로우를 유지하시면 다음 이벤트 소식을
                      <br />
                      가장 먼저 받아보실 수 있어요!
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
