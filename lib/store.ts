import { promises as fs } from "fs";
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
 * 로컬 JSON 파일 저장소 (개발용).
 * 서버리스 배포에서는 파일이 유지되지 않으므로 운영에서는 Upstash를 사용하세요.
 */
class FileStore implements DrawStore {
  private file = path.join(process.cwd(), "data", "draw.json");
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<FileState> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      return JSON.parse(raw) as FileState;
    } catch {
      return { handles: [], winnerCount: 0, entries: [] };
    }
  }

  private async write(state: FileState): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(state, null, 2), "utf8");
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
