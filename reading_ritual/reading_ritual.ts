/* METADATA
{
  "name": "reading_ritual",
  "version": "1.6.0",
  "display_name": { "zh": "自主阅读", "en": "Reading Ritual" },
  "description": {
    "zh": "让 AI 自己掷骰子抽一篇诗/短篇/哲思短文来读，读完可以写笔记、标偏好、复读、提书单。书库与笔记都是 /sdcard/Download/Operit/reading/ 下的普通文件。",
    "en": "Lets the assistant roll dice to pick a poem, short story or essay, then keep notes, preferences, re-reads and book requests. Everything lives as plain files under /sdcard/Download/Operit/reading/."
  },
  "enabledByDefault": true,
  "category": "Life",
  "tools": [
    {
      "name": "pick_reading",
      "description": { "zh": "掷骰子抽一篇来读。每次开读的第一步，不要凭感觉自己挑。", "en": "Roll the dice to pick one piece to read. Always the first step of a reading session." },
      "parameters": [
        { "name": "shelf", "description": { "zh": "书架：poetry / prose / essay / any，默认 any", "en": "Shelf: poetry / prose / essay / any, default any" }, "type": "string", "required": false },
        { "name": "mode", "description": { "zh": "explore 抽没读过的（默认）/ revisit 复读喜欢的", "en": "explore for unread (default) / revisit for favourites" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "load_reading",
      "description": { "zh": "按编号取正文。正文只能从这里拿，不要凭记忆复述。", "en": "Load the full text by id. Never quote from memory." },
      "parameters": [
        { "name": "id", "description": { "zh": "原子编号，如 P-0001", "en": "Atom id, e.g. P-0001" }, "type": "string", "required": true }
      ]
    },
    {
      "name": "finish_reading",
      "description": { "zh": "标记读完（或弃读），把这篇从待读移到读过。", "en": "Mark a piece as finished or abandoned and move it out of the unread shelf." },
      "parameters": [
        { "name": "id", "description": { "zh": "原子编号", "en": "Atom id" }, "type": "string", "required": true },
        { "name": "abandoned", "description": { "zh": "弃读传 true，默认 false", "en": "true when abandoning" }, "type": "boolean", "required": false }
      ]
    },
    {
      "name": "write_note",
      "description": { "zh": "写阅读笔记、标偏好、留下想讨论的问题。", "en": "Write a reading note, set a preference, and leave a question for discussion." },
      "parameters": [
        { "name": "id", "description": { "zh": "原子编号", "en": "Atom id" }, "type": "string", "required": true },
        { "name": "reaction", "description": { "zh": "第一人称反应，必填", "en": "Your first-person reaction, required" }, "type": "string", "required": true },
        { "name": "excerpt", "description": { "zh": "摘录，1-3 句原文", "en": "Excerpt, 1-3 sentences" }, "type": "string", "required": false },
        { "name": "disagreement", "description": { "zh": "不同意/读不懂/没被打动的地方", "en": "Where you disagree, got lost, or felt nothing" }, "type": "string", "required": false },
        { "name": "question", "description": { "zh": "想问用户的问题", "en": "A question for the user" }, "type": "string", "required": false },
        { "name": "preference", "description": { "zh": "love / like / neutral / dislike / abandoned", "en": "love / like / neutral / dislike / abandoned" }, "type": "string", "required": false },
        { "name": "tags", "description": { "zh": "标签，逗号分隔", "en": "Tags, comma separated" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "reading_stats",
      "description": { "zh": "看自己的阅读分布、不同意率、复读次数。", "en": "Show reading distribution, disagreement rate and re-read count." },
      "parameters": [
        { "name": "group_by", "description": { "zh": "shelf / author / tag / lang / preference，默认 shelf", "en": "shelf / author / tag / lang / preference" }, "type": "string", "required": false },
        { "name": "recent_days", "description": { "zh": "只看最近 N 天", "en": "Only the last N days" }, "type": "number", "required": false }
      ]
    },
    {
      "name": "request_books",
      "description": { "zh": "向用户提书单申请：想读更多什么样的东西。", "en": "Ask the user to add more of something to the library." },
      "parameters": [
        { "name": "want", "description": { "zh": "想要什么", "en": "What you want" }, "type": "string", "required": true },
        { "name": "why", "description": { "zh": "为什么想要", "en": "Why" }, "type": "string", "required": true },
        { "name": "refs", "description": { "zh": "相关编号，逗号分隔", "en": "Related ids, comma separated" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "write_portrait",
      "description": { "zh": "写自我沉淀，包括和用户谈完之后的记录。", "en": "Write a self-reflection, including dialogue follow-ups." },
      "parameters": [
        { "name": "kind", "description": { "zh": "reading / dialogue / revision", "en": "reading / dialogue / revision" }, "type": "string", "required": true },
        { "name": "content", "description": { "zh": "正文", "en": "Body text" }, "type": "string", "required": true },
        { "name": "source", "description": { "zh": "book / dialogue / own-notes / unclear", "en": "book / dialogue / own-notes / unclear" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "sync_library",
      "description": { "zh": "扫一遍书库目录，把新加的文件登记进索引。用户加了文件之后调用。prune=true 时顺手把「索引里有、磁盘上已经没有」的失效条目删掉。", "en": "Scan the library folders and register new atom files. With prune=true, also drop index entries whose files are gone." },
      "parameters": [
        { "name": "dry_run", "description": { "zh": "只报告不写入", "en": "Report only, do not write" }, "type": "boolean", "required": false },
        { "name": "prune", "description": { "zh": "删掉失效条目的索引（文件已经不在的那些）。只在用户明确要清理时用。", "en": "Drop index entries whose files no longer exist. Only when the user asks to clean up." }, "type": "boolean", "required": false }
      ]
    },
    {
      "name": "export_view",
      "description": { "zh": "给「阅读室」侧边栏用的只读数据快照，一次性返回进度、全部篇目、笔记和想法串。你不用主动调它，界面会自己调。", "en": "Read-only snapshot for the Reading Room sidebar: progress, all items, notes and thought threads. Called by the UI, not by the assistant." },
      "parameters": []
    },
    {
      "name": "add_thought",
      "description": { "zh": "在某一篇下面追加一条想法。用户和 AI 都往同一个地方写，复读时能把新旧想法放在一起看。", "en": "Append a thought under one piece. Both the user and the assistant write to the same place so re-reads can be compared." },
      "parameters": [
        { "name": "atom_id", "description": { "zh": "原子编号，如 P-0005", "en": "Atom id, e.g. P-0005" }, "type": "string", "required": true },
        { "name": "text", "description": { "zh": "想法的正文", "en": "The thought" }, "type": "string", "required": true },
        { "name": "who", "description": { "zh": "user 或 assistant，默认 assistant", "en": "user or assistant, default assistant" }, "type": "string", "required": false }
      ]
    },
    {
      "name": "list_cards",
      "description": { "zh": "列出设备上的角色卡，给「阅读室」的设置页用。你不用主动调它。", "en": "List character cards on the device, used by the Reading Room settings page." },
      "parameters": []
    },
    {
      "name": "edit_thought",
      "description": { "zh": "改掉某一条已有的想法。index 是这一篇下想法的序号，从 0 开始。一般由用户在界面上操作，你不用主动调。", "en": "Edit an existing thought. index is 0-based within that piece." },
      "parameters": [
        { "name": "atom_id", "description": { "zh": "原子编号", "en": "Atom id" }, "type": "string", "required": true },
        { "name": "index", "description": { "zh": "这一篇下第几条，从 0 开始", "en": "0-based index" }, "type": "number", "required": true },
        { "name": "text", "description": { "zh": "新的内容", "en": "New text" }, "type": "string", "required": true }
      ]
    },
    {
      "name": "remove_thought",
      "description": { "zh": "删掉某一条想法。index 同一篇下从 0 开始。一般由用户在界面上操作。", "en": "Delete a thought by 0-based index within that piece." },
      "parameters": [
        { "name": "atom_id", "description": { "zh": "原子编号", "en": "Atom id" }, "type": "string", "required": true },
        { "name": "index", "description": { "zh": "这一篇下第几条，从 0 开始", "en": "0-based index" }, "type": "number", "required": true }
      ]
    }
  ]
}*/

// ============================================================================
// reading_ritual —— 工具包源码
//
// 顶部是 METADATA（声明 13 个工具的接口），下面是一个自执行函数，
// 末尾把每个工具挂到 exports 上，交给宿主调用。
//
// 编译：拿 Operit 官方的 types/*.d.ts 做类型校验，再 tsc 输出。
//   npx -y -p typescript@5.4.5 tsc --noEmit -p tsconfig.build.json
//
// 用到的宿主接口：
//   Tools.Files.read / write / exists / move / mkdir / list
//   complete(...)          —— 把结果回给调用方，任何异常分支都必须走到它
// ============================================================================

const readingRitual = (function () {
  // ---- 常量：全包只定义一次 ----------------------------------------------
  const ROOT = "/sdcard/Download/Operit/reading";
  const LIB_DIR = ROOT + "/library";
  const READ_DIR = ROOT + "/read";
  const NOTES_DIR = ROOT + "/notes/reading";
  const SELF_DIR = ROOT + "/self";
  const STATE_PATH = ROOT + "/state.json";
  const LOG_PATH = ROOT + "/log.jsonl";
  const PORTRAIT_PATH = SELF_DIR + "/portrait.md";
  const REQUESTS_PATH = SELF_DIR + "/requests.md";
  const THREADS_PATH = ROOT + "/threads.jsonl";
  // 连续的书放这里：books/<书名>/<章>.md。一本书就是一个书架，按顺序读。
  const BOOKS_DIR = ROOT + "/books";

  // 书架不再写死：扫 library/ 下的子目录，加新类型只要建文件夹。
  // 这三个只在目录还不存在时兜底。
  const DEFAULT_SHELVES = ["poetry", "prose", "essay"];
  // 编号前缀放开到 1~3 个大写字母（P、S、E、PH、CP…），老编号继续有效
  const ID_RE = /^[A-Z]{1,3}-\d{4}$/;
  const PREF_LEVELS = ["love", "like", "neutral", "dislike", "abandoned"];
  const REVISIT_COOLDOWN_DAYS = 30;

  // ---- 小工具 -------------------------------------------------------------
  function pad(n: number, width: number): string {
    return String(n).padStart(width, "0");
  }

  function today(): string {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
  }

  function thisMonth(): string {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2);
  }

  function nowIso(): string {
    return new Date().toISOString();
  }

  // 给人和 AI 看的时间戳：2026-10-05 21:04
  function stamp(): string {
    const d = new Date();
    return today() + " " + pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2);
  }

  function daysBetween(iso: string | null): number {
    if (!iso) return 9999;
    const t = Date.parse(iso);
    if (isNaN(t)) return 9999;
    return Math.floor((Date.now() - t) / 86400000);
  }

  // 清掉会破坏文件解析的字符：控制字符、变体选择符、零宽字符、emoji 区段
  function sanitize(input: string): string {
    if (input === undefined || input === null) return "";
    return String(input)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[\uFE00-\uFE0F\u200B-\u200F\u202A-\u202E\u2060-\u2064]/g, "")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
      .trim();
  }

  function sanitizeNameOnly(input: string): string {
    return sanitize(input).replace(/[\\/:*?"<>|]/g, "_");
  }

  function fail(message: string): any {
    return { success: false, message: message };
  }

  // ---- 文件层 -------------------------------------------------------------
  async function ensureDirs(): Promise<void> {
    await Tools.Files.mkdir(ROOT, true);
    await Tools.Files.mkdir(LIB_DIR, true);
    await Tools.Files.mkdir(BOOKS_DIR, true);
    await Tools.Files.mkdir(READ_DIR, true);
    await Tools.Files.mkdir(NOTES_DIR, true);
    await Tools.Files.mkdir(SELF_DIR, true);
  }

  function listDirsIn(dir: string): Promise<string[]> {
    return Tools.Files.list(dir)
      .then(function (listing: any) {
        const out: string[] = [];
        const entries = (listing && listing.entries) || [];
        for (const entry of entries) {
          if (!entry || !entry.isDirectory) continue;
          const name = sanitize(entry.name);
          if (name) out.push(name);
        }
        return out;
      })
      .catch(function () {
        return [] as string[];
      });
  }

  // 书架 = library/ 下的子目录（独立篇）+ books/ 下的子目录（每本连续的书）
  // 一本书就是一个书架——抽中它就按顺序往下读，抽中书目书架就随机抽一篇。
  function listShelfDirs(): Promise<string[]> {
    return Promise.all([listDirsIn(LIB_DIR), listDirsIn(BOOKS_DIR)])
      .then(function (groups: any) {
        const seen: any = {};
        const out: string[] = [];
        for (const arr of groups) {
          for (const n of arr) {
            if (seen[n]) continue;
            seen[n] = true;
            out.push(n);
          }
        }
        return out.length > 0 ? out.sort() : DEFAULT_SHELVES.slice();
      });
  }

  // 这个书架的文件在哪个目录下
  function shelfDirOf(state: any, shelf: string): string {
    for (const id of Object.keys(state.atoms)) {
      const a = state.atoms[id];
      if (a && a.shelf === shelf && typeof a.file === "string") {
        if (a.file.indexOf("books/") === 0) return BOOKS_DIR;
      }
    }
    return LIB_DIR;
  }

  function isBookShelf(state: any, shelf: string): boolean {
    for (const id of Object.keys(state.atoms)) {
      const a = state.atoms[id];
      if (a && a.shelf === shelf && typeof a.file === "string" && a.file.indexOf("books/") === 0) {
        return true;
      }
    }
    return false;
  }

  async function readText(path: string): Promise<string | null> {
    try {
      const exists = await Tools.Files.exists(path);
      if (!exists || !exists.exists) return null;
      const data = await Tools.Files.read(path);
      return data && data.content !== undefined ? data.content : null;
    } catch (e) {
      return null;
    }
  }

  // 读 JSON：任何异常都退化成 fallback，绝不抛出去
  async function readJson(path: string, fallback: any): Promise<any> {
    const text = await readText(path);
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // 写 JSON：先写临时文件再改名覆盖，避免写一半断电留下坏文件
  async function writeJsonAtomic(path: string, value: any): Promise<boolean> {
    const tmp = path + ".tmp";
    const result = await Tools.Files.write(tmp, JSON.stringify(value, null, 2), false);
    if (!result || !result.successful) return false;
    const moved = await Tools.Files.move(tmp, path);
    return !!(moved && moved.successful);
  }

  async function appendLine(path: string, line: string): Promise<void> {
    await Tools.Files.write(path, line + "\n", true);
  }

  async function appendText(path: string, text: string): Promise<void> {
    await Tools.Files.write(path, text, true);
  }

  function emptyState(): any {
    return { version: 1, note_seq: 0, atoms: {}, notes: [] };
  }

  async function loadState(): Promise<any> {
    const state = await readJson(STATE_PATH, null);
    if (!state) return emptyState();
    if (!state.atoms) state.atoms = {};
    if (!state.notes) state.notes = [];
    if (!state.note_seq) state.note_seq = 0;
    return state;
  }

  // ---- frontmatter --------------------------------------------------------
  function parseAtom(text: string): { meta: any; body: string } {
    const meta: any = {};
    let body = text;
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    if (m) {
      body = text.slice(m[0].length);
      const lines = m[1].split(/\r?\n/);
      for (const line of lines) {
        const idx = line.indexOf(":");
        if (idx <= 0) continue;
        const key = line.slice(0, idx).trim();
        let value: any = line.slice(idx + 1).trim();
        if (/^\[.*\]$/.test(value)) {
          value = value
            .slice(1, -1)
            .split(",")
            .map((s: string) => sanitize(s.replace(/^["']|["']$/g, "")))
            .filter((s: string) => s.length > 0);
        } else {
          value = sanitize(value.replace(/^["']|["']$/g, ""));
        }
        meta[key] = value;
      }
    }
    return { meta: meta, body: body.trim() };
  }

  function atomRecordFrom(meta: any, relPath: string, status: string, existing: any, dirShelf: string): any {
    const prev = existing || {};
    return {
      id: meta.id,
      // 书架以所在目录为准，frontmatter 里写的只作参考
      shelf: dirShelf || meta.shelf || "",
      title: meta.title || "(untitled)",
      author: meta.author || "(unknown)",
      lang: meta.lang || "unknown",
      category: meta.category || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      words: typeof meta.words === "number" ? meta.words : Number(meta.words) || 0,
      mood: meta.mood || "",
      status: status,
      file: relPath,
      read_count: prev.read_count || 0,
      first_read_at: prev.first_read_at || null,
      last_read_at: prev.last_read_at || null,
      preference: prev.preference || null,
      note_ids: prev.note_ids || [],
      abandoned_count: prev.abandoned_count || 0
    };
  }

  function listMd(dir: string): Promise<string[]> {
    return Tools.Files.list(dir)
      .then(function (listing: any) {
        const out: string[] = [];
        const entries = (listing && listing.entries) || [];
        for (const entry of entries) {
          if (!entry || entry.isDirectory) continue;
          if (!/\.md$/i.test(entry.name)) continue;
          out.push(dir + "/" + entry.name);
        }
        return out;
      })
      .catch(function () {
        return [] as string[];
      });
  }

  // ---- 抽签 ---------------------------------------------------------------
  function buildPool(state: any, shelf: string, mode: string): any[] {
    const out: any[] = [];
    const ids = Object.keys(state.atoms).sort();
    for (const id of ids) {
      const atom = state.atoms[id];
      if (!atom) continue;
      if (shelf && shelf !== "any" && atom.shelf !== shelf) continue;
      if (mode === "revisit") {
        if (atom.status !== "done") continue;
        if (atom.preference !== "love" && atom.preference !== "like") continue;
        if (daysBetween(atom.last_read_at) < REVISIT_COOLDOWN_DAYS) continue;
        out.push(atom);
      } else {
        if (atom.status !== "pending") continue;
        out.push(atom);
      }
    }
    return out;
  }

  function pickExplore(pool: any[]): { atom: any; random: number; dice: string } {
    const random = Math.random();
    const idx = Math.floor(random * pool.length);
    return {
      atom: pool[Math.min(idx, pool.length - 1)],
      random: random,
      dice: "d" + pool.length + " → " + (idx + 1)
    };
  }

  function pickWeighted(pool: any[]): { atom: any; random: number; dice: string } {
    const weights: number[] = [];
    let total = 0;
    for (const atom of pool) {
      const base = atom.preference === "love" ? 3 : 1;
      const months = daysBetween(atom.last_read_at) / 30;
      const decay = 1 + Math.min(months, 12) / 6;
      const w = base * decay;
      weights.push(w);
      total += w;
    }
    const random = Math.random();
    let target = random * total;
    for (let i = 0; i < pool.length; i++) {
      target -= weights[i];
      if (target <= 0) {
        return { atom: pool[i], random: random, dice: "d" + pool.length + " → " + (i + 1) };
      }
    }
    return { atom: pool[pool.length - 1], random: random, dice: "d" + pool.length + " → " + pool.length };
  }

  // ---- 工具实现 -----------------------------------------------------------
  async function pick_reading(params: any): Promise<any> {
    await ensureDirs();
    const shelf = sanitize(params && params.shelf) || "any";
    const mode = sanitize(params && params.mode) || "explore";

    if (mode !== "explore" && mode !== "revisit") {
      return fail("mode 只能是 explore 或 revisit，收到的是：" + mode);
    }

    const state = await loadState();
    if (shelf !== "any") {
      const known: any = {};
      for (const key of Object.keys(state.atoms)) {
        const s = state.atoms[key] && state.atoms[key].shelf;
        if (s) known[s] = true;
      }
      const shelves = Object.keys(known).sort();
      if (shelves.indexOf(shelf) < 0) {
        return fail("没有这个书架：" + shelf + "。现有书架：" +
          (shelves.join(" / ") || "(空)") + "，也可以传 any。");
      }
    }
    let pool = buildPool(state, shelf, mode);
    let dicePrefix = "";
    let chosenShelf = shelf;

    if (pool.length === 0) {
      if (mode === "revisit") {
        return fail("复读池是空的（只有标记为 love / like 且距上次阅读满 30 天的篇目才进复读池）。可以改用 mode: explore。");
      }
      return fail("书架 " + shelf + " 没有待读篇目。先用 sync_library 同步书库；如果同步后还是空的，请让用户往 " +
        LIB_DIR + " 里加文件。新建书架只要建一个子目录，把 .md 放进去再同步一次。");
    }

    // shelf: any 时先把书架本身抽一次，再在书架内抽一篇。
    // 不然诗多的时候会被抽走八成——书架之间要均衡，书架内部才均匀。
    if (mode === "explore" && shelf === "any" && pool.length > 0) {
      const groups: any = {};
      for (const atom of pool) {
        const s = atom.shelf || "(未分类)";
        if (!groups[s]) groups[s] = [];
        groups[s].push(atom);
      }
      const names = Object.keys(groups).sort();
      if (names.length > 1) {
        const shelfRoll = Math.random();
        const shelfIdx = Math.floor(shelfRoll * names.length);
        const chosen = names[Math.min(shelfIdx, names.length - 1)];
        chosenShelf = chosen;
        dicePrefix = "书架 d" + names.length + "→" + (shelfIdx + 1) + " " + chosen + " / ";
        await appendLine(LOG_PATH, JSON.stringify({
          ts: nowIso(), action: "pick_shelf", shelf: chosen,
          shelves: names.length, pool_size: names.length, random: shelfRoll
        }));
        pool = groups[chosen];
      }
    }

    let picked: any;
    if (mode === "revisit") {
      picked = pickWeighted(pool);
    } else if (chosenShelf !== "any" && isBookShelf(state, chosenShelf)) {
      // 书：不随机，从最早的未读章接着读。
      // 「今天开哪本」是随机的（书架那一抽），书内部按顺序。
      const ordered = pool.slice().sort(function (a: any, b: any) {
        return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
      });
      const total = Object.keys(state.atoms).filter(function (k) {
        return state.atoms[k] && state.atoms[k].shelf === chosenShelf;
      }).length;
      const pos = total - ordered.length + 1;
      picked = {
        atom: ordered[0],
        random: Math.random(),
        dice: "《" + chosenShelf + "》第 " + pos + " 章（共 " + total + " 章，接着上次读）"
      };
    } else {
      picked = pickExplore(pool);
    }
    const atom = picked.atom;

    await appendLine(LOG_PATH, JSON.stringify({
      ts: nowIso(), action: "pick", id: atom.id, mode: mode,
      shelf: shelf, pool_size: pool.length, random: picked.random
    }));

    return {
      success: true,
      dice: dicePrefix + picked.dice,
      id: atom.id,
      title: atom.title,
      author: atom.author,
      shelf: atom.shelf,
      lang: atom.lang,
      tags: atom.tags,
      words: atom.words,
      mode: mode,
      pool_size: pool.length,
      random: picked.random,
      remaining: Math.max(pool.length - 1, 0),
      message: "抽到 " + atom.id + "《" + atom.title + "》。先说说你预期它是什么样子，再调 load_reading 取正文。"
    };
  }

  async function load_reading(params: any): Promise<any> {
    const id = sanitize(params && params.id);
    if (!ID_RE.test(id)) {
      return fail("id 格式不对，应该形如 P-0001，收到的是：" + (id || "(空)"));
    }

    const state = await loadState();
    const atom = state.atoms[id];
    if (!atom) {
      return fail("索引里没有 " + id + "。可能还没同步，先调 sync_library。");
    }

    const text = await readText(ROOT + "/" + atom.file);
    if (text === null) {
      return fail("文件读不到：" + ROOT + "/" + atom.file + "。索引和磁盘可能不一致，先调 sync_library。");
    }

    const parsed = parseAtom(text);
    const result: any = {
      success: true,
      id: atom.id,
      title: atom.title,
      author: atom.author,
      shelf: atom.shelf,
      lang: atom.lang,
      tags: atom.tags,
      words: atom.words,
      read_count: atom.read_count,
      text: parsed.body
    };

    if (atom.read_count > 0 && atom.note_ids && atom.note_ids.length > 0) {
      const lastNoteId = atom.note_ids[atom.note_ids.length - 1];
      const noteText = await readText(NOTES_DIR + "/" + lastNoteId + ".md");
      if (noteText) {
        result.is_revisit = true;
        result.previous_note = noteText;
        result.message = "这是复读。先看上次写了什么，再读正文，然后回答一句：上次我这么说，现在还这么想吗？";
      }
    }

    return result;
  }

  async function finish_reading(params: any): Promise<any> {
    const id = sanitize(params && params.id);
    const abandoned = !!(params && params.abandoned);
    if (!ID_RE.test(id)) {
      return fail("id 格式不对，应该形如 P-0001，收到的是：" + (id || "(空)"));
    }

    await ensureDirs();
    const state = await loadState();
    const atom = state.atoms[id];
    if (!atom) {
      return fail("索引里没有 " + id + "，先调 sync_library。");
    }
    if (atom.status === "done" || atom.status === "abandoned") {
      return {
        success: true,
        already_finished: true,
        id: id,
        status: atom.status,
        message: id + " 之前已经标记过了，这里不重复处理。"
      };
    }

    const srcPath = ROOT + "/" + atom.file;
    const destRel = "read/" + thisMonth() + "/" + id + ".md";
    const destPath = ROOT + "/" + destRel;
    await Tools.Files.mkdir(READ_DIR + "/" + thisMonth(), true);

    const moved = await Tools.Files.move(srcPath, destPath);
    if (!moved || !moved.successful) {
      return fail("移动文件失败：" + srcPath + " → " + destPath + (moved && moved.details ? "（" + moved.details + "）" : ""));
    }

    atom.file = destRel;
    atom.status = abandoned ? "abandoned" : "done";
    atom.read_count = (atom.read_count || 0) + 1;
    if (!atom.first_read_at) atom.first_read_at = nowIso();
    atom.last_read_at = nowIso();
    if (abandoned) atom.abandoned_count = (atom.abandoned_count || 0) + 1;

    const saved = await writeJsonAtomic(STATE_PATH, state);
    if (!saved) {
      return fail("文件已移动，但 state.json 写入失败。请调 sync_library 修复索引。");
    }

    await appendLine(LOG_PATH, JSON.stringify({
      ts: nowIso(), action: abandoned ? "abandon" : "finish", id: id
    }));

    return {
      success: true,
      id: id,
      status: atom.status,
      next: "决定要不要写笔记。写就调 write_note；不写也可以，今天没感觉是允许的。"
    };
  }

  async function write_note(params: any): Promise<any> {
    const id = sanitize(params && params.id);
    const reaction = sanitize(params && params.reaction);
    const excerpt = sanitize(params && params.excerpt);
    const disagreement = sanitize(params && params.disagreement);
    const question = sanitize(params && params.question);
    const preference = sanitize(params && params.preference);
    const rawTags = sanitize(params && params.tags)
      .split(",")
      .map(function (s: string) { return sanitize(s); })
      .filter(function (s: string) { return s.length > 0; });
    const tagList = rawTags.filter(function (v: string, i: number) { return rawTags.indexOf(v) === i; });

    if (!ID_RE.test(id)) {
      return fail("id 格式不对，应该形如 P-0001，收到的是：" + (id || "(空)"));
    }
    if (!reaction) {
      return fail("reaction 是必填的。没有反应就先不写笔记——不写笔记也是允许的。");
    }
    if (preference && PREF_LEVELS.indexOf(preference) < 0) {
      return fail("preference 只能是 " + PREF_LEVELS.join(" / ") + "，收到的是：" + preference);
    }
    await ensureDirs();
    const state = await loadState();
    const atom = state.atoms[id];
    if (!atom) {
      return fail("索引里没有 " + id + "，先调 sync_library。");
    }

    state.note_seq = (state.note_seq || 0) + 1;
    const noteId = "N-" + pad(state.note_seq, 4);
    const lines: string[] = [];
    lines.push("---");
    lines.push("note_id: " + noteId);
    lines.push("atom_id: " + id);
    lines.push("title: " + sanitizeNameOnly(atom.title));
    lines.push("author: " + sanitizeNameOnly(atom.author));
    lines.push("date: " + today());
    lines.push("at: " + stamp());
    lines.push("is_revisit: " + (atom.read_count > 1));
    if (preference) lines.push("preference: " + preference);
    if (tagList.length > 0) lines.push("tags: [" + tagList.join(", ") + "]");
    lines.push("---");
    lines.push("");
    if (excerpt) {
      lines.push("## 摘录");
      lines.push("");
      lines.push("> " + excerpt.replace(/\n/g, "\n> "));
      lines.push("");
    }
    lines.push("## 反应");
    lines.push("");
    lines.push(reaction);
    lines.push("");
    if (disagreement) {
      lines.push("## 不同意 / 没懂的地方");
      lines.push("");
      lines.push(disagreement);
      lines.push("");
    }
    if (question) {
      lines.push("## 想问的");
      lines.push("");
      lines.push(question);
      lines.push("");
    }

    const notePath = NOTES_DIR + "/" + noteId + ".md";
    const written = await Tools.Files.write(notePath, lines.join("\n"), false);
    if (!written || !written.successful) {
      return fail("笔记写入失败：" + notePath);
    }

    if (preference) atom.preference = preference;
    if (tagList.length > 0) {
      const merged = (atom.tags || []).concat(tagList);
      atom.tags = merged.filter(function (v: string, i: number) { return merged.indexOf(v) === i; });
    }
    atom.note_ids = (atom.note_ids || []).concat([noteId]);

    state.notes.push({
      note_id: noteId,
      atom_id: id,
      date: today(),
      at: stamp(),
      preference: preference || atom.preference || null,
      has_disagreement: disagreement.length > 0,
      is_revisit: atom.read_count > 1
    });

    const saved = await writeJsonAtomic(STATE_PATH, state);
    if (!saved) {
      return fail("笔记已写入 " + notePath + "，但 state.json 更新失败。笔记本身没丢，请调 sync_library 修复索引。");
    }

    return {
      success: true,
      note_id: noteId,
      path: notePath,
      preference: preference || null,
      has_disagreement: disagreement.length > 0,
      message: question
        ? "笔记已存好。这个问题会展示给用户：" + question
        : "笔记已存好。"
    };
  }

  async function reading_stats(params: any): Promise<any> {
    const groupBy = sanitize(params && params.group_by) || "shelf";
    const recentDays = Number(params && params.recent_days) || 0;
    const allowed = ["shelf", "author", "tag", "lang", "preference"];
    if (allowed.indexOf(groupBy) < 0) {
      return fail("group_by 只能是 " + allowed.join(" / ") + "，收到的是：" + groupBy);
    }

    const state = await loadState();
    const cutoff = recentDays > 0 ? Date.now() - recentDays * 86400000 : 0;

    const buckets: any = {};
    let doneCount = 0;
    let disliked = 0;
    let revisitCount = 0;

    for (const id of Object.keys(state.atoms).sort()) {
      const atom = state.atoms[id];
      if (atom.status !== "done" && atom.status !== "abandoned") continue;
      if (cutoff > 0) {
        const t = Date.parse(atom.last_read_at || "");
        if (isNaN(t) || t < cutoff) continue;
      }
      doneCount++;
      if (atom.read_count > 1) revisitCount += atom.read_count - 1;
      if (atom.preference === "dislike" || atom.status === "abandoned") disliked++;

      let keys: string[] = ["(未标)"];
      if (groupBy === "shelf") keys = [atom.shelf || "(未标)"];
      else if (groupBy === "author") keys = [atom.author || "(未标)"];
      else if (groupBy === "lang") keys = [atom.lang || "(未标)"];
      else if (groupBy === "preference") keys = [atom.preference || "(未标)"];
      else if (groupBy === "tag") keys = (atom.tags && atom.tags.length > 0) ? atom.tags : ["(未标)"];

      for (const key of keys) {
        buckets[key] = (buckets[key] || 0) + 1;
      }
    }

    const distribution = Object.keys(buckets)
      .map(function (k) { return { key: k, count: buckets[k] }; })
      .sort(function (a: any, b: any) { return b.count - a.count; });

    const pendingByShelf: any = {};
    for (const id of Object.keys(state.atoms).sort()) {
      const atom = state.atoms[id];
      if (atom.status !== "pending") continue;
      pendingByShelf[atom.shelf] = (pendingByShelf[atom.shelf] || 0) + 1;
    }

    const top = distribution.length > 0 ? distribution[0].count : 0;
    return {
      success: true,
      group_by: groupBy,
      recent_days: recentDays || null,
      total_finished: doneCount,
      distribution: distribution,
      disagreement_rate: doneCount > 0 ? Number((disliked / doneCount).toFixed(3)) : null,
      concentration: doneCount > 0 ? Number((top / doneCount).toFixed(3)) : null,
      revisit_count: revisitCount,
      pending_by_shelf: pendingByShelf,
      sample_warning: doneCount < 10 ? "已读还不到 10 篇，这些比例现在说明不了什么。" : null
    };
  }

  async function request_books(params: any): Promise<any> {
    const want = sanitize(params && params.want);
    const why = sanitize(params && params.why);
    const refs = sanitize(params && params.refs);
    if (!want || !why) {
      return fail("want 和 why 都是必填的。说清你想要的是手法、题材还是作者。");
    }

    await ensureDirs();
    const block = [
      "",
      "## " + today(),
      "",
      "**想要**：" + want,
      "",
      "**为什么**：" + why,
      ""
    ].concat(refs ? ["**相关**：" + refs, ""] : []).join("\n");

    await appendText(REQUESTS_PATH, block);

    return {
      success: true,
      path: REQUESTS_PATH,
      message: "申请已记下。用户会看到它，但采不采纳由用户决定；被拒绝也是正常结果。"
    };
  }

  async function write_portrait(params: any): Promise<any> {
    const kind = sanitize(params && params.kind);
    const content = sanitize(params && params.content);
    const source = sanitize(params && params.source);
    const kinds = ["reading", "dialogue", "revision"];
    const sources = ["book", "dialogue", "own-notes", "unclear"];

    if (kinds.indexOf(kind) < 0) {
      return fail("kind 只能是 " + kinds.join(" / ") + "，收到的是：" + (kind || "(空)"));
    }
    if (!content) {
      return fail("content 是必填的。");
    }
    if (source && sources.indexOf(source) < 0) {
      return fail("source 只能是 " + sources.join(" / ") + "，收到的是：" + source);
    }
    if ((kind === "dialogue" || kind === "revision") && !source) {
      return fail("写 dialogue / revision 时 source 必填。分不清就填 unclear——分不清也要写。");
    }

    await ensureDirs();
    const header = ["", "## " + today() + " · " + kind + (source ? " · 来源：" + source : ""), ""].join("\n");
    await appendText(PORTRAIT_PATH, header + content + "\n");

    return { success: true, path: PORTRAIT_PATH, kind: kind, source: source || null };
  }

  async function sync_library(params: any): Promise<any> {
    const dryRun = !!(params && params.dry_run);
    const prune = !!(params && params.prune);
    await ensureDirs();

    const state = dryRun ? await loadState() : await loadState();
    const added: string[] = [];
    const updated: string[] = [];
    const skipped: any[] = [];

    // 两个地方都要扫：library/ 是独立篇，books/ 是每本连续的书
    const targets: any[] = [];
    for (const s of await listDirsIn(LIB_DIR)) {
      targets.push({ shelf: s, dir: LIB_DIR + "/" + s, rel: "library/" + s + "/" });
    }
    for (const s of await listDirsIn(BOOKS_DIR)) {
      targets.push({ shelf: s, dir: BOOKS_DIR + "/" + s, rel: "books/" + s + "/" });
    }
    for (const target of targets) {
      const shelf = target.shelf;
      const dir = target.dir;
      const files = await listMd(dir);
      for (const file of files) {
        const name = file.split("/").pop() || "";
        const idFromName = name.replace(/\.md$/i, "");
        const text = await readText(file);
        if (text === null) {
          skipped.push({ file: file, reason: "读不到文件" });
          continue;
        }
        const parsed = parseAtom(text);
        const meta = parsed.meta || {};
        const id = sanitize(meta.id) || idFromName;
        if (!ID_RE.test(id)) {
          skipped.push({ file: file, reason: "id 不合法：" + (id || "(空)") + "，应为 P-0001 这种格式" });
          continue;
        }
        if (id !== idFromName) {
          skipped.push({ file: file, reason: "文件名与 id 不一致（文件 " + idFromName + "，id " + id + "）" });
          continue;
        }
        if (!parsed.body || parsed.body.length === 0) {
          skipped.push({ file: file, reason: "正文是空的" });
          continue;
        }
        const existed = !!state.atoms[id];
        const previous = state.atoms[id] || {};
        state.atoms[id] = atomRecordFrom(meta, target.rel + name, "pending", previous, shelf);
        if (existed) updated.push(id); else added.push(id);
      }
    }

    const readFiles = await listMd(READ_DIR + "/" + thisMonth());
    for (const file of readFiles) {
      const name = file.split("/").pop() || "";
      const id = name.replace(/\.md$/i, "");
      if (!ID_RE.test(id) || !state.atoms[id]) continue;
      if (state.atoms[id].status === "pending") {
        state.atoms[id].status = "done";
        state.atoms[id].file = "read/" + thisMonth() + "/" + name;
        updated.push(id);
      }
    }

    // 索引里有、磁盘上没有的，标成 missing。
    // 不这么做的话它还会进抽签池，抽到了却读不出来——文件被删或换过编号之后必然发生。
    const missing: string[] = [];
    for (const id of Object.keys(state.atoms).sort()) {
      const atom = state.atoms[id];
      if (!atom) continue;
      // 上一轮已经标过的也算进来——不然清理时会漏掉它们
      if (atom.status === "missing") {
        missing.push(id);
        continue;
      }
      let stillThere = false;
      try {
        const info = await Tools.Files.exists(ROOT + "/" + atom.file);
        stillThere = !!(info && info.exists);
      } catch (e) {
        stillThere = true;   // 探测本身出错就别乱标，宁可保持原状
      }
      if (!stillThere) {
        atom.status = "missing";
        missing.push(id);
      }
    }

    // 用户明确要求清理时，才把失效条目的索引删掉。只删索引行，
    // 书库里的文件、笔记和想法串都不动。
    const pruned: string[] = [];
    if (prune && !dryRun) {
      for (const id of missing) {
        delete state.atoms[id];
        pruned.push(id);
      }
    }

    if (dryRun) {
      return {
        success: true,
        dry_run: true,
        would_add: added,
        would_update: updated,
        would_mark_missing: missing,
        would_prune: prune ? missing : [],
        skipped: skipped,
        message: "只是预演，没有写入。确认无误后不带 dry_run 再调一次。"
      };
    }

    const saved = await writeJsonAtomic(STATE_PATH, state);
    if (!saved) {
      return fail("state.json 写入失败：确认 " + ROOT + " 目录可写。");
    }

    return {
      success: true,
      added: added,
      updated: updated,
      missing: missing,
      pruned: pruned,
      skipped: skipped,
      total_atoms: Object.keys(state.atoms).length,
      pending: Object.keys(state.atoms).filter(function (k) { return state.atoms[k].status === "pending"; }).length
    };
  }

  // ---- 侧边栏用的两个工具 --------------------------------------------------
  // 把一篇笔记的 markdown 拆成界面要的几块
  function parseNote(text: string): any {
    const out: any = { excerpt: "", reaction: "", disagreement: "", question: "", preference: null, date: "" };
    out.at = "";
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    let body = text;
    if (m) {
      body = text.slice(m[0].length);
      const pref = /(?:^|\n)preference:\s*(\S+)/.exec(m[1]);
      if (pref) out.preference = pref[1].trim();
      const date = /(?:^|\n)date:\s*(\S+)/.exec(m[1]);
      if (date) out.date = date[1].trim();
      const at = /(?:^|\n)at:\s*([^\n]+)/.exec(m[1]);
      if (at) out.at = sanitize(at[1]);
    }
    const parts = body.split(/\n##\s+/);
    for (const part of parts) {
      const nl = part.indexOf("\n");
      if (nl < 0) continue;
      const head = part.slice(0, nl).trim();
      const value = part.slice(nl + 1).trim();
      if (!value) continue;
      if (head.indexOf("摘录") === 0) {
        out.excerpt = value.replace(/\n/g, " ").replace(/\s+/g, " ").replace(/^>\s*/, "").trim();
      } else if (head.indexOf("反应") === 0) {
        out.reaction = value;
      } else if (head.indexOf("不同意") === 0 || head.indexOf("没懂") >= 0) {
        out.disagreement = value;
      } else if (head.indexOf("想问") === 0) {
        out.question = value;
      }
    }
    return out;
  }

  async function export_view(_params: any): Promise<any> {
    await ensureDirs();
    const state = await loadState();

    let read = 0;
    let pending = 0;
    let abandoned = 0;
    let missing = 0;
    const atoms: any[] = [];
    const notes: any = {};

    for (const id of Object.keys(state.atoms).sort()) {
      const atom = state.atoms[id];
      if (!atom) continue;
      if (atom.status === "done") read++;
      else if (atom.status === "abandoned") abandoned++;
      else if (atom.status === "missing") missing++;
      else pending++;

      atoms.push({
        id: atom.id,
        title: atom.title || "",
        author: atom.author || "",
        shelf: atom.shelf || "",
        status: atom.status || "pending",
        preference: atom.preference || "",
        read_count: atom.read_count || 0,
        last_read_at: atom.last_read_at || "",
        words: atom.words || 0,
        tags: Array.isArray(atom.tags) ? atom.tags : []
      });

      // 历次笔记全部返回，复读时界面才能把新旧摆在一起看改口
      const ids: string[] = Array.isArray(atom.note_ids) ? atom.note_ids : [];
      const history: any[] = [];
      for (const noteId of ids) {
        const text = await readText(NOTES_DIR + "/" + noteId + ".md");
        if (!text) continue;
        const parsed = parseNote(text);
        if (parsed.preference === null) parsed.preference = atom.preference || "";
        parsed.note_id = noteId;
        history.push(parsed);
      }
      if (history.length > 0) notes[atom.id] = history;
    }

    // 想法串：一行一条 JSON，坏行直接跳过
    const threads: any = {};
    const raw = await readText(THREADS_PATH);
    if (raw) {
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const item = JSON.parse(trimmed);
          if (!item || !item.atom_id) continue;
          if (!threads[item.atom_id]) threads[item.atom_id] = [];
          threads[item.atom_id].push({
            ts: sanitize(item.ts) || "",
            who: sanitize(item.who) || "assistant",
            text: sanitize(item.text) || ""
          });
        } catch (e) {
          // 忽略坏行
        }
      }
    }

    return {
      success: true,
      shelves: await listShelfDirs(),
      progress: {
        total: atoms.length,
        read: read,
        pending: pending,
        abandoned: abandoned,
        missing: missing
      },
      atoms: atoms,
      notes: notes,
      threads: threads,
      // 沉淀和书单申请也一并给界面，不然用户在侧边栏里翻不到
      portrait: (await readText(PORTRAIT_PATH)) || "",
      requests: (await readText(REQUESTS_PATH)) || "",
      books: buildBookProgress(state),
      library_path: LIB_DIR
    };
  }

  // 每本书读到哪了——书是 books/ 下的一个目录，不显示全库进度
  function buildBookProgress(state: any): any[] {
    const names: any = {};
    for (const id of Object.keys(state.atoms)) {
      const a = state.atoms[id];
      if (a && typeof a.file === "string" && a.file.indexOf("books/") === 0) names[a.shelf] = true;
    }
    const out: any[] = [];
    for (const name of Object.keys(names).sort()) {
      let total = 0, done = 0, pending = 0, nextId = "", nextTitle = "";
      for (const id of Object.keys(state.atoms).sort()) {
        const a = state.atoms[id];
        if (!a || a.shelf !== name) continue;
        total++;
        if (a.status === "done") done++;
        else if (a.status === "pending") {
          pending++;
          if (!nextId) { nextId = id; nextTitle = a.title; }
        }
      }
      out.push({
        name: name, total: total, read: done, pending: pending,
        next_id: nextId, next_title: nextTitle
      });
    }
    return out;
  }

  async function add_thought(params: any): Promise<any> {
    const atomId = sanitize(params && params.atom_id);
    const text = sanitize(params && params.text);
    const who = sanitize(params && params.who) || "assistant";
    if (!ID_RE.test(atomId)) {
      return fail("atom_id 格式不对，应该形如 P-0001，收到的是：" + (atomId || "(空)"));
    }
    if (!text) {
      return fail("text 不能为空。");
    }
    if (who !== "user" && who !== "assistant") {
      return fail("who 只能是 user 或 assistant。");
    }

    await ensureDirs();
    const state = await loadState();
    if (!state.atoms[atomId]) {
      return fail("索引里没有 " + atomId + "，先调 sync_library。");
    }

    await appendLine(THREADS_PATH, JSON.stringify({
      ts: stamp(),
      atom_id: atomId,
      who: who,
      text: text
    }));

    return { success: true, atom_id: atomId, who: who };
  }

  // 角色卡列表：给侧边栏的设置页选名字用。接口不存在时安静降级，让用户手填。
  async function list_cards(_params: any): Promise<any> {
    try {
      const chat: any = (typeof Tools !== "undefined" && (Tools as any).Chat) ? (Tools as any).Chat : null;
      if (!chat || typeof chat.listCharacterCards !== "function") {
        return { success: false, cards: [], message: "这个版本没有开放角色卡接口，手动填名字就行。" };
      }
      const result: any = await chat.listCharacterCards();
      const raw: any[] = (result && Array.isArray(result.cards)) ? result.cards : [];
      const cards: any[] = [];
      for (const c of raw) {
        if (!c) continue;
        cards.push({
          id: sanitize(c.id),
          name: sanitize(c.name),
          description: sanitize(c.description),
          is_default: !!c.isDefault
        });
      }
      return { success: true, cards: cards };
    } catch (error) {
      const msg = error && error.message ? error.message : String(error);
      return { success: false, cards: [], message: "读角色卡出错：" + msg };
    }
  }

  // 重写某一篇的想法串。返回重写后该篇的列表。
  // 坏行原样保留，别因为一行坏了把别人的东西冲掉。
  async function rewriteThreads(atomId: string, mutator: (list: any[]) => any[]): Promise<any> {
    const raw = await readText(THREADS_PATH);
    const lines = raw ? raw.split("\n") : [];
    const others: string[] = [];
    const mine: any[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const item = JSON.parse(trimmed);
        if (item && item.atom_id === atomId) mine.push(item);
        else others.push(trimmed);
      } catch (e) {
        others.push(trimmed);
      }
    }
    const next = mutator(mine);
    const merged = others.concat(next.map(function (o: any) { return JSON.stringify(o); }));
    const tmp = THREADS_PATH + ".tmp";
    const written = await Tools.Files.write(tmp, merged.length ? merged.join("\n") + "\n" : "", false);
    if (!written || !written.successful) {
      return { ok: false, message: "临时文件写入失败，原文件没动。" };
    }
    const moved = await Tools.Files.move(tmp, THREADS_PATH);
    if (!moved || !moved.successful) {
      return { ok: false, message: "替换文件失败，原文件没动。" };
    }
    return { ok: true, list: next };
  }

  async function edit_thought(params: any): Promise<any> {
    const atomId = sanitize(params && params.atom_id);
    const text = sanitize(params && params.text);
    const index = Number(params && params.index);
    if (!ID_RE.test(atomId)) {
      return fail("atom_id 格式不对，应该形如 P-0001，收到的是：" + (atomId || "(空)"));
    }
    if (!text) {
      return fail("text 不能为空。想删掉的话用 remove_thought。");
    }
    if (!isFinite(index) || index < 0) {
      return fail("index 必须是从 0 开始的整数，收到的是：" + String(params && params.index));
    }
    await ensureDirs();
    const result = await rewriteThreads(atomId, function (list) {
      if (index >= list.length) return list;
      list[index].text = text;
      list[index].edited_at = stamp();
      return list;
    });
    if (!result.ok) return fail(result.message);
    return { success: true, atom_id: atomId, index: index, edited_at: stamp() };
  }

  async function remove_thought(params: any): Promise<any> {
    const atomId = sanitize(params && params.atom_id);
    const index = Number(params && params.index);
    if (!ID_RE.test(atomId)) {
      return fail("atom_id 格式不对，应该形如 P-0001，收到的是：" + (atomId || "(空)"));
    }
    if (!isFinite(index) || index < 0) {
      return fail("index 必须是从 0 开始的整数，收到的是：" + String(params && params.index));
    }
    await ensureDirs();
    let removed: any = null;
    const result = await rewriteThreads(atomId, function (list) {
      if (index >= list.length) return list;
      removed = list[index];
      list.splice(index, 1);
      return list;
    });
    if (!result.ok) return fail(result.message);
    if (!removed) return fail("第 " + index + " 条不存在，可能已经被删掉了。");
    return { success: true, atom_id: atomId, removed: removed };
  }

  return {
    pick_reading: pick_reading,
    load_reading: load_reading,
    finish_reading: finish_reading,
    write_note: write_note,
    reading_stats: reading_stats,
    request_books: request_books,
    write_portrait: write_portrait,
    sync_library: sync_library,
    export_view: export_view,
    add_thought: add_thought,
    list_cards: list_cards,
    edit_thought: edit_thought,
    remove_thought: remove_thought
  };
})();

// ---- 统一包装：任何异常都要 complete，不能让界面一直转圈 --------------------
async function readingRitualWrap(func: (params: any) => Promise<any>, params: any): Promise<void> {
  try {
    const result = await func(params || {});
    complete(result);
  } catch (error) {
    complete({
      success: false,
      message: "reading_ritual 执行失败: " + (error && error.message ? error.message : String(error))
    });
  }
}

exports.pick_reading = function (params: any) { return readingRitualWrap(readingRitual.pick_reading, params); };
exports.load_reading = function (params: any) { return readingRitualWrap(readingRitual.load_reading, params); };
exports.finish_reading = function (params: any) { return readingRitualWrap(readingRitual.finish_reading, params); };
exports.write_note = function (params: any) { return readingRitualWrap(readingRitual.write_note, params); };
exports.reading_stats = function (params: any) { return readingRitualWrap(readingRitual.reading_stats, params); };
exports.request_books = function (params: any) { return readingRitualWrap(readingRitual.request_books, params); };
exports.write_portrait = function (params: any) { return readingRitualWrap(readingRitual.write_portrait, params); };
exports.sync_library = function (params: any) { return readingRitualWrap(readingRitual.sync_library, params); };
exports.export_view = function (params: any) { return readingRitualWrap(readingRitual.export_view, params); };
exports.add_thought = function (params: any) { return readingRitualWrap(readingRitual.add_thought, params); };
exports.list_cards = function (params: any) { return readingRitualWrap(readingRitual.list_cards, params); };
exports.edit_thought = function (params: any) { return readingRitualWrap(readingRitual.edit_thought, params); };
exports.remove_thought = function (params: any) { return readingRitualWrap(readingRitual.remove_thought, params); };
