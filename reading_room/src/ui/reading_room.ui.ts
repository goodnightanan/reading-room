// 仅用于类型检查，编译后会被完全擦除（import type）。
import type { ComposeDslContext, ComposeNode } from "../../types/compose-dsl";

const READING_PKG = "reading_ritual";
const LIB_HINT = "/sdcard/Download/Operit/reading/library";

const ACCENT = "#8B7AC8";
const SOFT = "#EFEAFB";
const MUTED = "#7C7690";
const WARM = "#C2703A";

// ComposeShape 是对象不是字符串
const ROUND = { type: "rounded" as const, cornerRadius: 14 };
const PILL = { type: "pill" as const };

interface AtomView {
  id: string;
  title: string;
  author: string;
  shelf: string;
  status: string;
  preference: string;
  read_count: number;
  last_read_at: string;
  words: number;
  tags: string[];
}

interface NoteView {
  note_id: string;
  date: string;
  at: string;
  excerpt: string;
  reaction: string;
  disagreement: string;
  question: string;
}

interface ThoughtView {
  ts: string;
  who: string;
  text: string;
  edited_at?: string;
}

interface Payload {
  shelves: string[];
  progress: { total: number; read: number; pending: number; abandoned: number; missing?: number };
  atoms: AtomView[];
  notes: Record<string, NoteView[]>;
  threads: Record<string, ThoughtView[]>;
  portrait: string;
  requests: string;
  books?: Array<{ name: string; total: number; read: number; pending: number; next_id: string; next_title: string }>;
}

// 这是给用户看的界面标签，伴侣看不到，所以用最直白的词
const PREF_LABEL: Record<string, string> = {
  love: "很爱", like: "喜欢", neutral: "无感", dislike: "不喜欢", abandoned: "弃读",
};
const PREF_COLOR: Record<string, string> = {
  love: ACCENT, like: ACCENT, neutral: MUTED, dislike: WARM, abandoned: MUTED,
};
const STATUS_LABEL: Record<string, string> = {
  pending: "未读", done: "已读", abandoned: "弃读", missing: "文件已移除",
};
// 书架按钮用短标签，不然英文目录名会把这一行挤出屏幕；没登记的原名显示
const SHELF_LABEL: Record<string, string> = {
  poetry: "诗", prose: "短篇", essay: "其他",
};

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

// last_read_at 是 ISO 串，转成本地时间给人看
function fmtIso(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (isNaN(t)) return iso;
  const d = new Date(t);
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
    " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

// useState 返回 [值, 设置函数]
function usePair<T>(ctx: ComposeDslContext, key: string, initial: T) {
  const pair = ctx.useState<T>(key, initial);
  return { get: pair[0], set: pair[1] };
}

// callTool 有时给对象，有时给一个装着 JSON 的字符串
function toObject(value: any): any {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }
  return value;
}

function extractPayload(result: any): Payload | null {
  const base = toObject(result);
  const candidates = [
    base,
    toObject(base && base.data),
    toObject(base && base.result),
    toObject(base && base.payload),
  ];
  for (const item of candidates) {
    if (item && item.atoms && item.progress) {
      return item as Payload;
    }
  }
  return null;
}

function Screen(ctx: ComposeDslContext): ComposeNode {
  const payload = usePair<Payload | null>(ctx, "payload", null);
  const view = usePair<string>(ctx, "view", "list");
  const selected = usePair<string>(ctx, "selected", "");
  const filter = usePair<string>(ctx, "filter", "all");
  const shelfFilter = usePair<string>(ctx, "shelfFilter", "all");
  // 在读的书默认收起：书会越加越多，摊开会把筛选挤到屏幕外
  const booksOpen = usePair<boolean>(ctx, "booksOpen", false);
  const draft = usePair<string>(ctx, "draft", "");
  const busy = usePair<boolean>(ctx, "busy", false);
  const errText = usePair<string>(ctx, "errText", "");
  // 原文按需取：bodyFor 记住当前这段正文属于哪一篇；triedFor 防重入
  const bodyText = usePair<string>(ctx, "bodyText", "");
  const bodyFor = usePair<string>(ctx, "bodyFor", "");
  const bodyErr = usePair<string>(ctx, "bodyErr", "");
  const bodyLoading = usePair<boolean>(ctx, "bodyLoading", false);
  const triedFor = usePair<string>(ctx, "triedFor", "");

  // 设置存在插件配置里（ctx.getEnv/setEnv，是 shared_prefs），卸载重装不会丢
  const partnerName = usePair<string>(ctx, "partnerName", ctx.getEnv("READING_PARTNER_NAME") || "他");
  const userName = usePair<string>(ctx, "userName", ctx.getEnv("READING_USER_NAME") || "你");
  const cardId = usePair<string>(ctx, "cardId", ctx.getEnv("READING_CARD_ID") || "");
  const autoText = usePair<boolean>(ctx, "autoText", ctx.getEnv("READING_AUTO_TEXT") !== "0");
  const cards = usePair<any[]>(ctx, "cards", []);
  const cardsTried = usePair<boolean>(ctx, "cardsTried", false);
  const cardsErr = usePair<string>(ctx, "cardsErr", "");
  // 重温的改 / 删
  const editKey = usePair<string>(ctx, "editKey", "");
  const editDraft = usePair<string>(ctx, "editDraft", "");
  const confirmKey = usePair<string>(ctx, "confirmKey", "");

  // ---------- 基础件 ----------
  // Surface 不排列子节点（会叠在一起），里面必须套 Column
  function block(
    options: { color?: string; padding?: number; spacing?: number; onClick?: () => void | Promise<void> },
    children: ComposeNode[]
  ): ComposeNode {
    const surfaceProps: any = { shape: ROUND, fillMaxWidth: true };
    if (options.color) surfaceProps.containerColor = options.color;
    if (options.onClick) surfaceProps.onClick = options.onClick;
    return ctx.UI.Surface(surfaceProps, [
      ctx.UI.Column(
        {
          padding: options.padding === undefined ? 14 : options.padding,
          spacing: options.spacing === undefined ? 6 : options.spacing,
        },
        children
      ),
    ]);
  }

  // onClick 允许返回 Promise —— 别把异步函数的返回值丢掉
  function chip(label: string, active: boolean, onClick: () => void | Promise<void>, tone?: string): ComposeNode {
    const color = tone || ACCENT;
    return ctx.UI.Surface(
      {
        shape: PILL,
        containerColor: active ? color : SOFT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        onClick: onClick,
      },
      [ctx.UI.Text({ text: label, fontSize: 12, color: active ? "#FFFFFF" : color })]
    );
  }

  function backChip(label: string, onClick: () => void): ComposeNode {
    return navButton("arrow_back", label.replace("← ", ""), onClick);
  }

  // 导航入口：无背景、无边框，和可切换的筛选胶囊区分开
  function navButton(icon: string, label: string, onClick: () => void | Promise<void>): ComposeNode {
    return ctx.UI.Row(
      { spacing: 5, verticalAlignment: "center", onClick: onClick, paddingHorizontal: 6, paddingVertical: 6 },
      [
        ctx.UI.Icon({ name: icon, size: 16, tint: ACCENT }),
        ctx.UI.Text({ text: label, fontSize: 13, color: ACCENT }),
      ]
    );
  }

  // 一条细分割线
  function divider(): ComposeNode {
    return ctx.UI.Surface({ height: 1, fillMaxWidth: true, containerColor: "#E9E4F5" });
  }

  // 筛选胶囊：比操作按钮更紧凑，一行能放下六个
  function filterChip(label: string, active: boolean, onClick: () => void): ComposeNode {
    return ctx.UI.Surface(
      {
        shape: PILL,
        containerColor: active ? ACCENT : SOFT,
        paddingHorizontal: 10,
        paddingVertical: 5,
        onClick: onClick,
      },
      [ctx.UI.Text({ text: label, fontSize: 12, color: active ? "#FFFFFF" : ACCENT })]
    );
  }

  async function loadCards(): Promise<void> {
    if (cardsTried.get) return;
    cardsTried.set(true);
    cardsErr.set("");
    try {
      const result = await ctx.callTool(READING_PKG + ":list_cards", {});
      const data = toObject(result);
      const inner = data && data.data ? toObject(data.data) : data;
      if (inner && Array.isArray(inner.cards)) {
        cards.set(inner.cards);
        if (!inner.success && inner.message) {
          cardsErr.set(inner.message);
        }
      } else {
        cardsErr.set("没读到角色卡列表，手动填名字就行。");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      cardsErr.set("读角色卡出错：" + msg + "　手动填名字也完全可以。");
    }
  }

  async function loadCardsForce(): Promise<void> {
    cardsTried.set(false);
    return loadCards();
  }

  async function saveSettings(): Promise<void> {
    try {
      await ctx.setEnv("READING_PARTNER_NAME", (partnerName.get || "").trim() || "他");
      await ctx.setEnv("READING_USER_NAME", (userName.get || "").trim() || "你");
      await ctx.setEnv("READING_CARD_ID", cardId.get || "");
      await ctx.setEnv("READING_AUTO_TEXT", autoText.get ? "1" : "0");
      await ctx.showToast("设置已保存");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await ctx.showToast("保存失败：" + msg);
    }
  }

  function sectionTitle(text: string, tail?: string): ComposeNode {
    return ctx.UI.Row({ spacing: 8, verticalAlignment: "center" }, [
      ctx.UI.Text({ text: text, fontSize: 13, fontWeight: "bold" }),
      ctx.UI.Text({ text: tail || "", fontSize: 11, color: MUTED }),
    ]);
  }

  // ---------- 取数 ----------
  async function refresh(): Promise<void> {
    busy.set(true);
    errText.set("");
    try {
      const result = await ctx.callTool(READING_PKG + ":export_view", {});
      const data = extractPayload(result);
      if (data) {
        payload.set(data);
      } else {
        let raw = "";
        try {
          raw = JSON.stringify(result);
        } catch (e) {
          raw = String(result);
        }
        errText.set("export_view 的返回认不出来：" + ((raw || "(空)").slice(0, 300)));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errText.set("调 export_view 出错：" + msg);
    } finally {
      busy.set(false);
    }
  }

  // 取某一篇的正文。三个入口都调它：点开、详情页 onLoad、手动点。
  // 用同步设置的 triedFor 防重入——onLoad 会在每次挂载时触发，不挡住会无限发请求。
  async function loadBody(id: string, force?: boolean): Promise<void> {
    if (!id) return;
    if (bodyFor.get === id && bodyText.get) return;
    if (!force && triedFor.get === id) return;

    triedFor.set(id);            // 同步标记，在第一个 await 之前
    bodyErr.set("");
    bodyLoading.set(true);
    try {
      const result = await ctx.callTool(READING_PKG + ":load_reading", { id: id });
      const data = toObject(result);
      const inner = data && data.data ? toObject(data.data) : data;
      if (inner && typeof inner.text === "string" && inner.text) {
        bodyFor.set(id);
        bodyText.set(inner.text);
      } else {
        bodyErr.set("这一篇取不到正文（多半是 reading_ritual 版本旧了）");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      bodyErr.set("取正文出错：" + msg);
    } finally {
      bodyLoading.set(false);
    }
  }

  // 点开一篇：同步切页（立刻有反应），并把取正文的 Promise 还回去
  function openDetail(id: string): Promise<void> {
    selected.set(id);
    view.set("detail");
    bodyErr.set("");
    if (!autoText.get) return Promise.resolve();
    return loadBody(id);
  }

  function reloadBody(): Promise<void> {
    return loadBody(selected.get, true);
  }

  // 清掉失效条目的索引：文件已经不在了的那些行。
  // 只删索引，不动书库文件、笔记和想法——所以这一步不会弄丢任何读过的东西。
  async function pruneMissing(): Promise<void> {
    try {
      const result = await ctx.callTool(READING_PKG + ":sync_library", { prune: true });
      const data = toObject(result);
      const inner = data && data.data ? toObject(data.data) : data;
      if (inner && inner.success === false) {
        await ctx.showToast("清理没成功：" + (inner.message || "工具没说是为什么"));
        return;
      }
      const n = inner && Array.isArray(inner.pruned) ? inner.pruned.length : 0;
      await ctx.showToast(n > 0 ? "清掉了 " + n + " 条失效索引" : "没有可清的");
      filter.set("all");
      await refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await ctx.showToast("清理失败：" + msg);
    }
  }

  async function submitThought(): Promise<void> {
    const text = (draft.get || "").trim();
    if (!text || !selected.get) {
      return;
    }

    // 先同步改本地状态，让它立刻出现在屏幕上；
    // 异步那一步只负责落盘，万一失败再回滚。
    const atomId = selected.get;
    const snapshot = payload.get;
    if (snapshot) {
      const next: any = JSON.parse(JSON.stringify(snapshot));
      if (!next.threads) next.threads = {};
      if (!next.threads[atomId]) next.threads[atomId] = [];
      next.threads[atomId].push({ ts: localStamp(), who: "user", text: text });
      payload.set(next);
    }
    draft.set("");

    try {
      await ctx.callTool(READING_PKG + ":add_thought", {
        atom_id: atomId,
        text: text,
        who: "user",
      });
      await ctx.showToast("已记下，标注了记录人和时间");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (snapshot) {
        payload.set(snapshot);   // 回滚
      }
      draft.set(text);
      await ctx.showToast("写入失败：" + msg);
    }
  }

  // 改一条重温：先同步改本地，再落盘；失败回滚
  async function saveThought(index: number): Promise<void> {
    const atomId = selected.get;
    const text = (editDraft.get || "").trim();
    if (!text) {
      await ctx.showToast("内容是空的，要删的话用「删」。");
      return;
    }
    const snapshot = payload.get;
    if (snapshot) {
      const next: any = JSON.parse(JSON.stringify(snapshot));
      const list: any[] = (next.threads && next.threads[atomId]) || [];
      if (list[index]) {
        list[index].text = text;
        list[index].edited_at = localStamp();
      }
      next.threads[atomId] = list;
      payload.set(next);
    }
    editKey.set("");
    editDraft.set("");
    try {
      await ctx.callTool(READING_PKG + ":edit_thought", { atom_id: atomId, index: index, text: text });
      await ctx.showToast("改好了");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (snapshot) payload.set(snapshot);
      await ctx.showToast("改失败：" + msg);
    }
  }

  // 删一条重温：同样先同步再落盘
  async function removeThought(index: number): Promise<void> {
    const atomId = selected.get;
    const snapshot = payload.get;
    if (snapshot) {
      const next: any = JSON.parse(JSON.stringify(snapshot));
      const list: any[] = (next.threads && next.threads[atomId]) || [];
      list.splice(index, 1);
      next.threads[atomId] = list;
      payload.set(next);
    }
    confirmKey.set("");
    try {
      await ctx.callTool(READING_PKG + ":remove_thought", { atom_id: atomId, index: index });
      await ctx.showToast("已删掉");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (snapshot) payload.set(snapshot);
      await ctx.showToast("删除失败：" + msg);
    }
  }

  function matches(atom: AtomView): boolean {
    const f = filter.get;
    if (shelfFilter.get !== "all" && atom.shelf !== shelfFilter.get) return false;
    if (f === "all") return true;
    if (f === "pending") return atom.status === "pending";
    if (f === "done") return atom.status === "done";
    if (f === "love") return atom.preference === "love" || atom.preference === "like";
    // 无感 = 明确标了无感，或者读完但根本没表态——两种都是"就这样"
    if (f === "neutral") return atom.preference === "neutral" || (!atom.preference && atom.status !== "pending");
    if (f === "dislike") return atom.preference === "dislike" || atom.status === "abandoned";
    if (f === "missing") return atom.status === "missing";
    return true;
  }

  // ---------- 详情页 ----------
  function detailPage(): ComposeNode {
    const data = payload.get;
    const atom = data ? data.atoms.filter((a) => a.id === selected.get)[0] : undefined;
    const rows: ComposeNode[] = [];

    rows.push(backChip("← 回书架", () => { view.set("list"); selected.set(""); }));
    rows.push(ctx.UI.Spacer({ height: 10 }));

    if (!data || !atom) {
      rows.push(ctx.UI.Text({ text: "选中的篇目找不到了。", color: MUTED }));
      return ctx.UI.LazyColumn({ spacing: 8, padding: 16 }, rows);
    }

    const history = data.notes[atom.id] || [];
    const threads = data.threads[atom.id] || [];
    const prefLabel = atom.preference ? (PREF_LABEL[atom.preference] || atom.preference) : "";
    const metaBits = [atom.author, atom.shelf, atom.words ? atom.words + " 词" : "",
      atom.read_count > 1 ? "第 " + atom.read_count + " 次阅读" : (atom.read_count === 1 ? "读过 1 次" : "")];
    const lastRead = fmtIso(atom.last_read_at);

    rows.push(ctx.UI.Text({ text: atom.id + " · " + atom.title, fontSize: 19, fontWeight: "bold" }));
    rows.push(ctx.UI.Text({
      text: metaBits.filter((s) => s).join(" · ") + (lastRead ? "　最近 " + lastRead : ""),
      fontSize: 12,
      color: MUTED,
    }));
    if (prefLabel) {
      rows.push(ctx.UI.Text({ text: "偏好：" + prefLabel, fontSize: 12, color: PREF_COLOR[atom.preference] || MUTED }));
    }
    if (atom.tags && atom.tags.length > 0) {
      const chips: ComposeNode[] = [];
      for (const tag of atom.tags) {
        chips.push(
          ctx.UI.Surface(
            { shape: PILL, containerColor: SOFT, paddingHorizontal: 10, paddingVertical: 4 },
            [ctx.UI.Text({ text: "#" + tag, fontSize: 11, color: ACCENT })]
          )
        );
      }
      rows.push(ctx.UI.Row({ spacing: 6 }, chips));
    }

    rows.push(ctx.UI.Spacer({ height: 6 }));

    const hasBody = bodyFor.get === atom.id && !!bodyText.get;
    rows.push(sectionTitle("原文"));
    if (hasBody) {
      rows.push(block({ color: SOFT, spacing: 0 }, [ctx.UI.Text({ text: bodyText.get, fontSize: 14 })]));
    } else if (bodyLoading.get) {
      rows.push(block({ color: SOFT, padding: 12, spacing: 0 }, [
        ctx.UI.Text({ text: "正在取原文…", fontSize: 13, color: MUTED }),
      ]));
    } else if (bodyErr.get) {
      rows.push(block({ color: "#FDECEC", padding: 12, spacing: 8 }, [
        ctx.UI.Text({ text: bodyErr.get, fontSize: 12 }),
        chip("再试一次", false, reloadBody),
      ]));
    } else {
      rows.push(block({ color: SOFT, padding: 12, spacing: 8 }, [
        ctx.UI.Text({ text: "正文不预加载，点开才取回来。", fontSize: 12, color: MUTED }),
        chip("取这一篇的原文", false, reloadBody),
      ]));
    }

    rows.push(ctx.UI.Spacer({ height: 6 }));
    rows.push(sectionTitle((partnerName.get || "他") + "的笔记", history.length > 1 ? history.length + " 次" : ""));
    if (history.length === 0) {
      rows.push(ctx.UI.Text({ text: "还没有写笔记。", fontSize: 13, color: MUTED }));
    }
    for (let i = history.length - 1; i >= 0; i--) {
      const note = history[i];
      const inner: ComposeNode[] = [
        ctx.UI.Text({ text: "第 " + (i + 1) + " 次 · " + (note.at || note.date), fontSize: 11, color: MUTED }),
      ];
      if (note.excerpt) {
        inner.push(ctx.UI.Text({ text: note.excerpt, fontSize: 12, color: ACCENT }));
      }
      if (note.reaction) {
        inner.push(ctx.UI.Spacer({ height: 2 }));
        inner.push(ctx.UI.Text({ text: note.reaction, fontSize: 14 }));
      }
      if (note.disagreement) {
        inner.push(ctx.UI.Text({ text: "不同意 / 没懂：" + note.disagreement, fontSize: 13, color: MUTED }));
      }
      if (note.question) {
        inner.push(ctx.UI.Text({ text: "想问：" + note.question, fontSize: 13, color: ACCENT }));
      }
      rows.push(block({ color: SOFT, spacing: 5 }, inner));
    }

    rows.push(ctx.UI.Spacer({ height: 6 }));
    rows.push(sectionTitle("重温", threads.length > 0 ? String(threads.length) : ""));
    for (let i = 0; i < threads.length; i++) {
      const t = threads[i];
      const mine = t.who === "user";
      const key = atom.id + "#" + i;
      const editing = editKey.get === key;
      const confirming = confirmKey.get === key;

      const head: ComposeNode[] = [
        ctx.UI.Text({
          text: (mine ? (userName.get || "你") : (partnerName.get || "他")) + " · " + t.ts +
            (t.edited_at ? "　改过" : ""),
          fontSize: 11,
          color: mine ? MUTED : ACCENT,
        }),
      ];
      if (!editing) {
        head.push(chip("改", false, () => {
          editKey.set(key);
          editDraft.set(t.text);
          confirmKey.set("");
        }));
        head.push(chip(confirming ? "确认删" : "删", confirming, () => {
          if (confirming) {
            removeThought(i);
          } else {
            confirmKey.set(key);
            editKey.set("");
          }
        }));
      }

      const inner: ComposeNode[] = [
        ctx.UI.Row({ spacing: 6, verticalAlignment: "center" }, head),
      ];
      if (editing) {
        inner.push(ctx.UI.TextField({
          value: editDraft.get,
          onValueChange: editDraft.set,
          placeholder: "改成什么",
          minLines: 2,
          maxLines: 6,
        }));
        inner.push(
          ctx.UI.Row({ spacing: 8 }, [
            chip("保存", true, () => saveThought(i)),
            chip("取消", false, () => { editKey.set(""); editDraft.set(""); }),
          ])
        );
      } else {
        inner.push(ctx.UI.Text({ text: t.text, fontSize: 14 }));
      }

      rows.push(
        block({ color: mine ? "#FFFFFF" : SOFT, padding: 12, spacing: 6 }, inner)
      );
    }
    if (threads.length === 0) {
      rows.push(ctx.UI.Text({ text: "还没有人写过。你可以开个头。", fontSize: 13, color: MUTED }));
    }

    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(
      block({ color: SOFT, padding: 12, spacing: 8 }, [
        ctx.UI.Text({ text: "写一条重温", fontSize: 12, color: MUTED }),
        ctx.UI.TextField({
          value: draft.get,
          onValueChange: draft.set,
          placeholder: "想说什么…",
          minLines: 2,
          maxLines: 6,
          style: { fontSize: 14 },
          fillMaxWidth: true,
        }),
        ctx.UI.Row({ spacing: 8 }, [
          chip(busy.get ? "写入中…" : "记下", true, submitThought),
          ctx.UI.Text({ text: "会记下是你写的和时间", fontSize: 11, color: MUTED }),
        ]),
      ])
    );

    // onLoad 兜一次：即使点击那条路没成，进详情页时也能把正文取回来
    return ctx.UI.LazyColumn({ spacing: 8, padding: 16, onLoad: () => loadBody(selected.get) }, rows);
  }

  // ---------- 沉淀页 ----------
  function portraitPage(): ComposeNode {
    const rows: ComposeNode[] = [];
    rows.push(backChip("← 回书架", () => view.set("list")));
    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(ctx.UI.Text({ text: "沉淀", fontSize: 19, fontWeight: "bold" }));
    rows.push(ctx.UI.Text({
      text: "它每隔一段时间写下的自我回顾。文件在 reading/self/portrait.md。",
      fontSize: 12,
      color: MUTED,
    }));
    rows.push(ctx.UI.Spacer({ height: 8 }));

    const text = payload.get ? payload.get.portrait || "" : "";
    if (!text.trim()) {
      rows.push(
        block({ color: SOFT, padding: 12 }, [
          ctx.UI.Text({
            text: "还没有写过沉淀。约每 15~20 篇、或每两周写一条。这是它第一次回头看自己的地方。",
            fontSize: 13,
            color: MUTED,
          }),
        ])
      );
    } else {
      // 文件按 ## 小标题分条，逐条显示
      const parts = text.split(/\n##\s+/);
      for (let i = 0; i < parts.length; i++) {
        const chunk = parts[i].trim();
        if (!chunk) continue;
        if (i === 0) {
          rows.push(block({ color: SOFT, padding: 12 }, [ctx.UI.Text({ text: chunk, fontSize: 14 })]));
          continue;
        }
        const nl = chunk.indexOf("\n");
        const head = nl >= 0 ? chunk.slice(0, nl).trim() : chunk;
        const rest = nl >= 0 ? chunk.slice(nl + 1).trim() : "";
        const inner: ComposeNode[] = [ctx.UI.Text({ text: head, fontSize: 12, color: ACCENT })];
        if (rest) {
          inner.push(ctx.UI.Spacer({ height: 2 }));
          inner.push(ctx.UI.Text({ text: rest, fontSize: 14 }));
        }
        rows.push(block({ color: SOFT, padding: 12, spacing: 4 }, inner));
      }
    }

    const req = payload.get ? payload.get.requests || "" : "";
    if (req.trim()) {
      rows.push(ctx.UI.Spacer({ height: 10 }));
      rows.push(sectionTitle("它提的书单申请"));
      rows.push(block({ color: "#FFFFFF", padding: 12 }, [ctx.UI.Text({ text: req, fontSize: 13 })]));
    }

    return ctx.UI.LazyColumn({ spacing: 8, padding: 16 }, rows);
  }

  // ---------- 设置页 ----------
  function settingsPage(): ComposeNode {
    const rows: ComposeNode[] = [];

    rows.push(backChip("← 回书架", () => view.set("list")));
    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(ctx.UI.Text({ text: "设置", fontSize: 19, fontWeight: "bold" }));
    rows.push(ctx.UI.Text({
      text: "这些设置存在插件配置里，卸载重装不会丢。改完点最下面的保存。",
      fontSize: 12,
      color: MUTED,
    }));

    rows.push(ctx.UI.Spacer({ height: 8 }));
    rows.push(ctx.UI.TextField({
      value: partnerName.get,
      onValueChange: partnerName.set,
      label: "伴侣名称",
      placeholder: "对话里显示成这个名字",
    }));
    rows.push(ctx.UI.Spacer({ height: 6 }));
    rows.push(ctx.UI.TextField({
      value: userName.get,
      onValueChange: userName.set,
      label: "你的名称",
      placeholder: "你自己在条目里显示成什么",
    }));

    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(sectionTitle("角色卡", cardId.get ? "已绑定" : "未绑定"));
    if (cardsErr.get) {
      rows.push(ctx.UI.Text({ text: cardsErr.get, fontSize: 11, color: MUTED }));
    }
    if (cards.get.length === 0) {
      rows.push(
        block({ color: SOFT, padding: 12, spacing: 8 }, [
          ctx.UI.Text({ text: "点下面的按钮取一次角色卡列表。取不到也没关系，直接手填上面的名字。", fontSize: 12, color: MUTED }),
          chip("读取角色卡列表", false, loadCardsForce),
        ])
      );
    } else {
      for (const c of cards.get) {
        const on = cardId.get === c.id;
        const sub = (c.description || "").slice(0, 60) + (c.is_default ? (c.description ? "　" : "") + "（默认）" : "");
        rows.push(
          block(
            {
              color: on ? SOFT : "#FFFFFF",
              padding: 12,
              spacing: 3,
              onClick: () => {
                cardId.set(c.id);
                if (c.name) partnerName.set(c.name);
              },
            },
            [
              ctx.UI.Text({ text: c.name + (on ? "　✓ 已绑定" : ""), fontSize: 14 }),
              ctx.UI.Text({ text: sub, fontSize: 11, color: MUTED }),
            ]
          )
        );
      }
      rows.push(ctx.UI.Text({ text: "点一张角色卡，伴侣名称会自动填成这张卡的名字。", fontSize: 11, color: MUTED }));
    }

    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(sectionTitle("原文"));
    rows.push(
      ctx.UI.Row({ spacing: 8, verticalAlignment: "center" }, [
        chip(
          autoText.get ? "打开时自动取原文" : "打开时手动取原文",
          autoText.get,
          () => { autoText.set(!autoText.get); }
        ),
      ])
    );
    rows.push(ctx.UI.Text({
      text: "自动：点开一篇就把正文取回来。手动：只显示一个按钮，点了才取。正文按需取，不会一次把全部取回来。",
      fontSize: 11,
      color: MUTED,
    }));

    rows.push(ctx.UI.Spacer({ height: 14 }));
    rows.push(ctx.UI.Button({ text: "保存", onClick: saveSettings }));

    return ctx.UI.LazyColumn({ spacing: 8, padding: 16, onLoad: loadCards }, rows);
  }

  // ---------- 列表页 ----------
  function listPage(): ComposeNode {
    const data = payload.get;
    const rows: ComposeNode[] = [];

    if (errText.get) {
      rows.push(block({ color: "#FDECEC", padding: 12 }, [ctx.UI.Text({ text: errText.get, fontSize: 13 })]));
      rows.push(ctx.UI.Spacer({ height: 6 }));
    }

    if (!data) {
      rows.push(ctx.UI.Text({ text: busy.get ? "正在读书库…" : "还没有数据。点下面的刷新。", color: MUTED }));
      rows.push(ctx.UI.Spacer({ height: 10 }));
      rows.push(ctx.UI.Button({ text: "刷新", enabled: !busy.get, onClick: refresh }));
      return ctx.UI.LazyColumn({ spacing: 8, padding: 16 }, rows);
    }

    const p = data.progress;

    // 工具入口放最上面：底下可能几百条，刷新不该要滚到底
    rows.push(
      ctx.UI.Row({ spacing: 6, verticalAlignment: "center" }, [
        navButton("auto_stories", "沉淀", () => view.set("portrait")),
        navButton("settings", "设置", () => view.set("settings")),
        navButton("refresh", busy.get ? "刷新中…" : "刷新", () => refresh()),
      ])
    );
    rows.push(ctx.UI.Spacer({ height: 2 }));

    // 在读的书：一整块，收起时只占一行。书是"某一部作品"，不是分类，所以不跟分类挤一行。
    const books = data.books || [];
    const bookNames: Record<string, boolean> = {};
    for (const b of books) {
      bookNames[b.name] = true;
    }
    if (books.length > 0) {
      const open = booksOpen.get;
      const reading = books.filter((b) => b.pending > 0).length;
      const inner: ComposeNode[] = [
        ctx.UI.Row(
          { spacing: 8, verticalAlignment: "center", onClick: () => booksOpen.set(!open) },
          [
            ctx.UI.Text({ text: "在读的书", fontSize: 13, fontWeight: "bold" }),
            ctx.UI.Text({ text: reading + " 本未读完 / 共 " + books.length + " 本", fontSize: 11, color: MUTED }),
            ctx.UI.Text({ text: open ? "收起 ▴" : "展开 ▾", fontSize: 12, color: ACCENT }),
          ]
        ),
      ];
      if (open) {
        for (const b of books) {
          const finished = b.total > 0 && b.pending === 0;
          const on = shelfFilter.get === b.name;
          const piece: ComposeNode[] = [
            ctx.UI.Row({ spacing: 8, verticalAlignment: "center" }, [
              ctx.UI.Text({ text: (finished ? "✓ " : "") + b.name, fontSize: 14, color: on ? ACCENT : "#2F2B3A" }),
              ctx.UI.Text({ text: b.read + " / " + b.total + " 章", fontSize: 11, color: MUTED }),
            ]),
          ];
          if (!finished && b.next_title) {
            piece.push(ctx.UI.Text({ text: "接着读：" + b.next_title, fontSize: 11, color: ACCENT }));
          }
          if (b.total > 0) {
            piece.push(ctx.UI.LinearProgressIndicator({ progress: b.read / b.total, fillMaxWidth: true }));
          }
          inner.push(
            ctx.UI.Surface(
              {
                shape: ROUND,
                fillMaxWidth: true,
                containerColor: on ? SOFT : "#FFFFFF",
                onClick: () => {
                  shelfFilter.set(on ? "all" : b.name);
                  filter.set("all");
                },
              },
              [ctx.UI.Column({ padding: 10, spacing: 4 }, piece)]
            )
          );
        }
        inner.push(ctx.UI.Text({ text: "点一本书，下面只看它的章；再点一下取消。", fontSize: 11, color: MUTED }));
      }
      rows.push(block({ color: SOFT, padding: 12, spacing: 8 }, inner));
    }

    if (p.missing && p.missing > 0) {
      const onlyMissing = filter.get === "missing";
      rows.push(
        block(
          { color: "#FDF3EA", padding: 12, spacing: 8 },
          [
            ctx.UI.Text({
              text: "⚠ 有 " + p.missing + " 篇的文件已经不在了（编号换过或被删）",
              fontSize: 12,
              color: WARM,
            }),
            ctx.UI.Text({
              text: "它们是手机索引里剩下的空条目，不会进抽签池。清掉只是删掉这几行索引，不动书库和笔记。",
              fontSize: 11,
              color: MUTED,
            }),
            ctx.UI.Row({ spacing: 6 }, [
              filterChip("只看这几篇", onlyMissing, () => {
                filter.set(onlyMissing ? "all" : "missing");
                shelfFilter.set("all");
              }),
              filterChip("清掉这几条", false, pruneMissing),
            ]),
          ]
        )
      );
    }

    // 分类筛选：只放题材（诗 / 短篇 / 哲思），书不进来——书在「在读的书」里点
    const shelves: string[] = (data.shelves && data.shelves.length > 0) ? data.shelves : [];
    const cats = shelves.filter((s) => !bookNames[s]);
    const order = ["poetry", "prose", "essay"];
    cats.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const catChips: ComposeNode[] = [
      filterChip("全部", shelfFilter.get === "all", () => shelfFilter.set("all")),
    ];
    for (const s of cats) {
      catChips.push(filterChip(SHELF_LABEL[s] || s, shelfFilter.get === s, () => shelfFilter.set(s)));
    }
    if (bookNames[shelfFilter.get]) {
      catChips.push(filterChip("书：" + shelfFilter.get + " ✕", true, () => shelfFilter.set("all")));
    }
    rows.push(ctx.UI.Row({ spacing: 6 }, catChips));
    rows.push(ctx.UI.Spacer({ height: 6 }));

    const statusChips: ComposeNode[] = [
      filterChip("全部", filter.get === "all", () => filter.set("all")),
      filterChip("未读", filter.get === "pending", () => filter.set("pending")),
      filterChip("已读", filter.get === "done", () => filter.set("done")),
      filterChip("喜欢", filter.get === "love", () => filter.set("love")),
      filterChip("无感", filter.get === "neutral", () => filter.set("neutral")),
      filterChip("不喜欢", filter.get === "dislike", () => filter.set("dislike")),
    ];
    // 这一档平时不出现，免得七个胶囊挤出一屏；只有正在看失效文件时补上
    if (filter.get === "missing") {
      statusChips.push(filterChip("文件已移除", true, () => filter.set("all")));
    }
    rows.push(ctx.UI.Row({ spacing: 6 }, statusChips));
    rows.push(ctx.UI.Spacer({ height: 10 }));

    const shown = data.atoms.filter(matches);
    rows.push(ctx.UI.Text({ text: "共 " + shown.length + " 篇", fontSize: 11, color: MUTED }));
    if (shown.length === 0) {
      rows.push(ctx.UI.Text({ text: "这个筛选下没有篇目。", fontSize: 13, color: MUTED }));
    }
    for (const atom of shown) {
      const bits = [STATUS_LABEL[atom.status] || atom.status];
      if (atom.preference) bits.push(PREF_LABEL[atom.preference] || atom.preference);
      if (atom.read_count > 1) bits.push("第 " + atom.read_count + " 次");
      const tagLine = (atom.tags && atom.tags.length > 0)
        ? atom.tags.map((t) => "#" + t).join(" ")
        : "";
      const inner: ComposeNode[] = [
        ctx.UI.Text({ text: atom.id + "　" + atom.title, fontSize: 15 }),
        ctx.UI.Text({
          text: bits.join(" · ") + (data.threads[atom.id] ? " · 💬" + data.threads[atom.id].length : ""),
          fontSize: 12,
          color: MUTED,
        }),
      ];
      if (tagLine) {
        inner.push(ctx.UI.Text({ text: tagLine, fontSize: 11, color: ACCENT }));
      }
      rows.push(
        block({ padding: 12, spacing: 3, onClick: () => openDetail(atom.id) }, inner)
      );
    }

    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(
      block({ color: SOFT, spacing: 5 }, [
        ctx.UI.Text({ text: "加新篇", fontSize: 13, fontWeight: "bold", color: ACCENT }),
        ctx.UI.Text({
          text: "把做好的 .md 放进下面这个目录，然后让伴侣说一句「同步书库」。新建一个分类，就在这个目录下新建一个子文件夹，文件名前缀用任意 1~3 个大写字母加四位数字（如 PH-0001）。",
          fontSize: 12,
          color: MUTED,
        }),
        ctx.UI.Text({ text: LIB_HINT, fontSize: 12, color: ACCENT }),
      ])
    );
    rows.push(ctx.UI.Spacer({ height: 10 }));
    rows.push(ctx.UI.Button({ text: busy.get ? "刷新中…" : "刷新", enabled: !busy.get, onClick: refresh }));

    return ctx.UI.LazyColumn({ spacing: 8, padding: 16 }, rows);
  }

  return ctx.UI.Column({ fillMaxSize: true, onLoad: refresh }, [
    view.get === "detail"
      ? detailPage()
      : (view.get === "settings"
          ? settingsPage()
          : (view.get === "portrait" ? portraitPage() : listPage())),
  ]);
}

export default Screen;
  // 本地时间戳，和工具那边格式一致
  function localStamp(): string {
    const d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
      " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

