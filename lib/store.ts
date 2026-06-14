import { promises as fs } from "fs";
import os from "os";
import path from "path";

export type DrawResult = "win" | "lose";

export interface Entry {
  handle: string;
  result: DrawResult;
  at: string;
}

export interface DrawStore {
  /** 응모자 등록. 이미 응모한 아이디면 false (원자적 중복 방지). */
  addEntry(handle: string): Promise<boolean>;
  /** 남은 당첨 슬롯 1개를 원자적으로 차지. 소진이면 false. */
  tryClaimWin(maxWinners: number): Promise<boolean>;
  recordResult(entry: Entry): Promise<void>;
  getWinners(): Promise<Entry[]>;
  getEntryCount(): Promise<number>;
}

const KEY_HANDLES = "draw:handles";
const KEY_WINNER_COUNT = "draw:winner-count";
const KEY_ENTRIES = "draw:entries";
const KEY_WINNERS = "draw:winners";

/** Upstash Redis REST 기반 저장소 (운영용 — 서버리스에서 안전). */
class UpstashStore implements DrawStore {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`redis request failed: ${res.status}`);
    }
    const data = (await res.json()) as { result: T };
    return data.result;
  }

  async addEntry(handle: string): Promise<boolean> {
    return (await this.cmd<number>("SADD", KEY_HANDLES, handle)) === 1;
  }

  async tryClaimWin(maxWinners: number): Promise<boolean> {
    const claimed = await this.cmd<number>("INCR", KEY_WINNER_COUNT);
    if (claimed > maxWinners) {
      await this.cmd("DECR", KEY_WINNER_COUNT);
      return false;
    }
    return true;
  }

  async recordResult(entry: Entry): Promise<void> {
    const json = JSON.stringify(entry);
    await this.cmd("LPUSH", KEY_ENTRIES, json);
    if (entry.result === "win") {
      await this.cmd("LPUSH", KEY_WINNERS, json);
    }
  }

  async getWinners(): Promise<Entry[]> {
    const raw = await this.cmd<string[]>("LRANGE", KEY_WINNERS, 0, -1);
    return raw.map((s) => JSON.parse(s) as Entry);
  }

  async getEntryCount(): Promise<number> {
    return this.cmd<number>("LLEN", KEY_ENTRIES);
  }
}

interface FileState {
  handles: string[];
  winnerCount: number;
  entries: Entry[];
}

/**
 * 로컬 JSON 파일 저장소 (개발/미리보기용).
 * 서버리스 배포에서는 인스턴스 간 파일이 공유되지 않으므로(=당첨 상한·중복응모
 * 보장이 깨짐) 운영에서는 반드시 Upstash를 사용하세요.
 */
class FileStore implements DrawStore {
  private queue: Promise<unknown> = Promise.resolve();
  private filePromise?: Promise<string>;

  /**
   * 쓰기 가능한 저장 경로를 한 번만 결정해 캐시한다.
   * 프로젝트 폴더가 읽기 전용(Vercel 등)이면 OS 임시폴더로 폴백.
   */
  private resolveFile(): Promise<string> {
    if (!this.filePromise) {
      this.filePromise = (async () => {
        const primaryDir = path.join(process.cwd(), "data");
        try {
          await fs.mkdir(primaryDir, { recursive: true });
          return path.join(primaryDir, "draw.json");
        } catch {
          const fallbackDir = path.join(os.tmpdir(), "ullim-draw");
          await fs.mkdir(fallbackDir, { recursive: true });
          console.warn(
            "[draw] 프로젝트 폴더에 쓸 수 없어 임시폴더(%s)를 사용합니다. " +
              "미리보기는 동작하지만 인스턴스 간 공유가 안 되므로, 실제 이벤트 " +
              "운영에는 UPSTASH_REDIS_REST_URL/TOKEN 을 설정하세요.",
            fallbackDir,
          );
          return path.join(fallbackDir, "draw.json");
        }
      })();
    }
    return this.filePromise;
  }

  private async read(): Promise<FileState> {
    try {
      const file = await this.resolveFile();
      const raw = await fs.readFile(file, "utf8");
      return JSON.parse(raw) as FileState;
    } catch {
      return { handles: [], winnerCount: 0, entries: [] };
    }
  }

  private async write(state: FileState): Promise<void> {
    const file = await this.resolveFile();
    await fs.writeFile(file, JSON.stringify(state, null, 2), "utf8");
  }

  /** 읽기-수정-쓰기를 직렬화하는 단순 뮤텍스. */
  private locked<T>(fn: (state: FileState) => [FileState, T]): Promise<T> {
    const run = this.queue.then(async () => {
      const state = await this.read();
      const [next, out] = fn(state);
      await this.write(next);
      return out;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  addEntry(handle: string): Promise<boolean> {
    return this.locked((state) => {
      if (state.handles.includes(handle)) return [state, false];
      state.handles.push(handle);
      return [state, true];
    });
  }

  tryClaimWin(maxWinners: number): Promise<boolean> {
    return this.locked((state) => {
      if (state.winnerCount >= maxWinners) return [state, false];
      state.winnerCount += 1;
      return [state, true];
    });
  }

  recordResult(entry: Entry): Promise<void> {
    return this.locked((state) => {
      state.entries.unshift(entry);
      return [state, undefined];
    });
  }

  async getWinners(): Promise<Entry[]> {
    const state = await this.read();
    return state.entries.filter((e) => e.result === "win");
  }

  async getEntryCount(): Promise<number> {
    const state = await this.read();
    return state.entries.length;
  }
}

const globalStore = globalThis as unknown as { __drawStore?: DrawStore };

export function getStore(): DrawStore {
  if (!globalStore.__drawStore) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    globalStore.__drawStore =
      url && token ? new UpstashStore(url, token) : new FileStore();
  }
  return globalStore.__drawStore;
}
