"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { site } from "@/lib/config";

const STORAGE_KEY = "ullim:followed";
const HANDLES = site.instagram.map((a) => a.handle);

interface FollowGateValue {
  /** 해당 계정 팔로우 링크를 눌렀는지 */
  isClicked: (handle: string) => boolean;
  /** 팔로우 링크 클릭 기록 (localStorage 영구 저장) */
  markClicked: (handle: string) => void;
  /** 클릭한 계정 수 */
  count: number;
  /** 전체 계정 수 */
  total: number;
  /** 3개 모두 클릭했는지 */
  allClicked: boolean;
}

const Ctx = createContext<FollowGateValue | null>(null);

/**
 * 인스타그램 팔로우 링크 클릭 상태를 InstagramLinks ↔ LuckyDraw 사이에서 공유한다.
 * 모바일에서 링크를 누르면 인스타그램으로 빠져나갔다 돌아오므로, 클릭 기록을
 * localStorage에 저장해 재방문/복귀에도 진행 상태가 유지되게 한다.
 */
export function FollowGateProvider({ children }: { children: ReactNode }) {
  const [clicked, setClicked] = useState<string[]>([]);

  // 마운트 시 이전 클릭 기록 복원 (클라이언트 전용 → SSR과 초기 렌더 일치)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) {
          setClicked(arr.filter((h): h is string => typeof h === "string"));
        }
      }
    } catch {
      /* localStorage 비활성 환경은 무시 */
    }
  }, []);

  const markClicked = useCallback((handle: string) => {
    setClicked((prev) => {
      if (prev.includes(handle)) return prev;
      const next = [...prev, handle];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* 무시 */
      }
      return next;
    });
  }, []);

  const value = useMemo<FollowGateValue>(() => {
    const clickedSet = new Set(clicked);
    // 현재 설정된 3개 핸들만 카운트 (config 변경/오래된 기록에 안전)
    const count = HANDLES.filter((h) => clickedSet.has(h)).length;
    return {
      isClicked: (h) => clickedSet.has(h),
      markClicked,
      count,
      total: HANDLES.length,
      allClicked: count >= HANDLES.length,
    };
  }, [clicked, markClicked]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFollowGate(): FollowGateValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useFollowGate must be used within FollowGateProvider");
  }
  return ctx;
}
