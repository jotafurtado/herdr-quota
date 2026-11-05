// Agent Quota in the status bar: one slim bar per limit window, from `quota-axi --json`.
// Click it for details and options. The same mod draws the popup (props().menu).
import { View, div, svg, image } from "gpui-kit";
import { runQuotaCommand } from "./quota-command.js";
import { visibleWindows } from "./quota-windows.js";
import { h_flex, v_flex } from "gpui-base";
import { exec, theme, settings, shared, setShared, props, openOverlay, knownAgents, nextCommand } from "herdr";

const EVERY = 120000, STALE = 10 * 60000;
const TYPE = { strip: 12, body: 12, caption: 11, title: 14 };
const DEFAULTS = { kinds: { session: true, weekly: true, monthly: true, model: false }, hidden: [], signedOut: false, names: false, percentageOnly: false, agyClaudeGpt: false };
const ICONS = { agy: "antigravity", claude: "claude", codex: "codex", grok: "grok", kimi: "kimi", copilot: "copilot", cursor: "cursor", commandcode: "command-code", muse: "muse" };
const NAMES = { claude: "Claude", codex: "Codex", agy: "Antigravity", cursor: "Cursor", copilot: "GitHub Copilot", grok: "Grok", kimi: "Kimi", zai: "Z.ai", alibaba: "Alibaba Cloud", "opencode-go": "OpenCode Go", commandcode: "Command Code", minimax: "MiniMax", mimo: "MiMo", deepseek: "DeepSeek", openrouter: "OpenRouter", elevenlabs: "ElevenLabs", devin: "Devin", muse: "Muse", higgsfield: "Higgsfield" };
const EXTRA_ICONS = { openrouter: "openrouter", zai: "zai", alibaba: "alibabacloud", minimax: "minimax", deepseek: "deepseek", elevenlabs: "elevenlabs", devin: "devin", "opencode-go": "opencode" };
const TINT = { claude: "#d97757", kimi: "#1783ff" };
const KINDS = [["session", "5-hour limit"], ["weekly", "Weekly limit"], ["monthly", "Monthly limit"], ["model", "Model limits"]];

// Layout props set the starting options (`{"mod": "quota", "props": {"hidden": ["cursor"]}}`); the popup's choices win.
function options() {
  const start = props()?.menu ? props().start ?? {} : props() ?? {}, saved = shared("quota.options") ?? {};
  return { ...DEFAULTS, ...start, ...saved, kinds: { ...DEFAULTS.kinds, ...(start.kinds ?? {}), ...(saved.kinds ?? {}) } };
}
const setOptions = change => setShared("quota.options", { ...options(), ...change });
const signedIn = p => p.windows.length > 0;

// Calm until it matters: green, amber from 60%, orange from 80%, red from 92%.
function level(pct) {
  const dark = settings().dark !== false;
  const scale = dark ? ["#5ed49a", "#f2c14e", "#f59152", "#f2665c"] : ["#1f9d63", "#c98a0b", "#dd6b20", "#d64545"];
  return scale[pct >= 92 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0];
}

// Two windows of one kind (Cursor's monthly ones) are told apart by their own label.
function short(w, twin) {
  let period;
  if (w.kind === "session") period = w.windowSeconds ? `${Math.round(w.windowSeconds / 3600)}h` : "5h";
  else if (w.kind === "weekly") period = "7d";
  else if (w.kind === "monthly") period = w.windowSeconds === 30 * 86400 ? "30d" : "mês";
  else return (w.label ?? "model").split(" ")[0].slice(0, 6);
  return twin ? `${(w.label ?? w.kind).split(" ")[0]} ${period}` : period;
}

// Share of the window already gone, 0..1; null without a reset time.
function elapsed(w, now) {
  if (!w.resetsAt || !w.windowSeconds) return null;
  const left = (Date.parse(w.resetsAt) - now) / 1000;
  return Math.min(1, Math.max(0, 1 - left / w.windowSeconds));
}

function until(iso, now) {
  const min = Math.max(0, Math.round((Date.parse(iso) - now) / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h}h ${min % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

function ago(at, now) {
  const min = Math.round((now - at) / 60000);
  return min < 1 ? "just now" : `${min}m ago`;
}

function pace(w, now) {
  const e = elapsed(w, now);
  if (e === null || e < 0.03) return null;
  const diff = Math.round(w.percentUsed - e * 100);
  return { diff, ahead: diff >= 10 && w.percentUsed >= 20 };
}

function bar(w, width, height, now, t) {
  const e = elapsed(w, now), pct = Math.min(100, Math.max(0, w.percentUsed));
  return div().relative().w(width).h(height).flex_none().rounded(height / 2).bg(t.border)
    .child(div().absolute().left(0).top(0).h(height).w(Math.max(pct > 0 ? height : 0, width * pct / 100)).rounded(height / 2).bg(level(pct)))
    .when(e !== null, el => el.child(div().absolute().top(-2).h(height + 4).w(1).left(Math.round(width * e)).bg(t.foreground).opacity(0.45)));
}

async function load() {
  let r = await runQuotaCommand(exec).catch(e => ({ code: -1, stderr: String(e) }));
  // Apps started from the Dock miss PATH entries set in the shell's rc file (npm, nvm, mise): ask the person's own shell.
  if (r.code !== 0) r = await exec("sh", ["-c", 'exec "${SHELL:-/bin/sh}" -lic "quota-axi --json --allow-keychain-prompt" </dev/null']).catch(e => ({ code: -1, stderr: String(e) }));
  if (r.code !== 0) throw new Error(`quota-axi failed: ${(r.stderr || "").trim().split("\n").pop() || `exit ${r.code}`}`);
  // An interactive shell can print a banner first; the report starts at the first brace.
  const data = JSON.parse(r.stdout.slice(r.stdout.indexOf("{")));
  return {
    at: Date.now(),
    providers: (data.providers ?? []).map(p => ({
      id: p.provider, label: NAMES[p.provider] ?? p.label ?? p.provider, plan: p.plan ?? null, status: p.state?.status ?? null,
      windows: (p.windows ?? []).map(w => ({ ...w, percentUsed: Number.isFinite(w.percentUsed) ? w.percentUsed : Number.isFinite(w.percentRemaining) ? 100 - w.percentRemaining : null })).filter(w => Number.isFinite(w.percentUsed))
        .map(w => ({ id: w.id, label: w.label, kind: w.kind, percentUsed: w.percentUsed, resetsAt: w.resetsAt ?? null, windowSeconds: w.windowSeconds ?? null })),
    })),
  };
}

export default class Quota extends View {
  init(_props, cx) {
    // The app's program table knows each agent's icon and whether it is a one-color glyph.
    this.programs = {};
    cx.spawn(async cx => {
      const list = await knownAgents().catch(() => []);
      for (const a of list) this.programs[a.key] = a;
      cx.notify();
    });
    if (props()?.menu) return;
    this.asked = shared("quota.refresh") ?? 0;
    this.refresh(cx);
    cx.timer.every(EVERY, cx => this.refresh(cx));
    // Key commands: "quota:menu" opens the popup, "quota:refresh" reads the quota now.
    cx.spawn(async cx => {
      for (;;) {
        const c = await nextCommand();
        if (c === "menu") this.openMenu();
        if (c === "refresh") this.refresh(cx);
      }
    });
  }

  glyph(p, size, t) {
    const program = this.programs[p.id === "agy" ? "antigravity" : p.id], icon = program?.icon ?? (ICONS[p.id] ? `icons/${ICONS[p.id]}.svg` : EXTRA_ICONS[p.id] ? `mods/quota/icons/${EXTRA_ICONS[p.id]}.svg` : null);
    if (!icon) return div().size(size).rounded(3).flex_none().bg(t.raised).text_color(t.muted).text_size(8).flex().items_center().justify_center().child(p.label.slice(0, 2).toUpperCase());
    const el = TINT[p.id] || (!program && p.id !== "agy") || program?.tint
      ? svg(icon).size(size).flex_none().text_color(p.id === "copilot" ? t.foreground : TINT[p.id] ?? program?.color ?? t.foreground)
      : image(icon).size(size).flex_none().rounded(3);
    return signedIn(p) ? el : el.opacity(0.35);
  }

  refresh(cx) {
    if (this.loading) return;
    this.loading = true;
    cx.spawn(async cx => {
      try { setShared("quota.data", await load()); setShared("quota.error", null); }
      catch (e) { setShared("quota.error", String(e.message ?? e)); }
      finally { this.loading = false; cx.notify(); }
    });
  }

  openMenu() {
    openOverlay({ mod: "quota", kind: "popup", width: 380, height: 640, props: { menu: true, start: props() ?? {} } });
  }

  render(cx) {
    const t = theme();
    if (props()?.menu) return this.menu(t);
    const ask = shared("quota.refresh") ?? 0;
    if (ask !== this.asked) { this.asked = ask; this.refresh(cx); }
    const data = shared("quota.data"), error = shared("quota.error"), o = options(), now = Date.now();
    const stale = !data || now - data.at > STALE;
    const list = (data?.providers ?? []).filter(p => !o.hidden.includes(p.id) && (signedIn(p)
      ? visibleWindows(p, o).some(w => o.kinds[w.kind] ?? false)
      : o.signedOut));
    const parts = [];
    list.forEach((p, i) => {
      if (i > 0) parts.push(div().w(1).h(12).flex_none().bg(t.border));
      const windows = visibleWindows(p, o).filter(w => o.kinds[w.kind] ?? false);
      parts.push(h_flex().id(`q-${p.id}`).gap(9).items_center().flex_none()
        .tooltip(windows.map(w => `${p.label} ${w.label}: ${w.percentUsed}% used${w.resetsAt && Date.parse(w.resetsAt) > now ? `, resets in ${until(w.resetsAt, now)}` : ""}`).join("\n") || `${p.label}: no quota limits available`)
        .child(h_flex().gap(5).items_center()
          .child(this.glyph(p, 12, t))
          .when(o.names || !ICONS[p.id], el => el.child(div().max_w(110).truncate().tooltip(p.label).text_color(signedIn(p) ? t.muted : t.dim).child(p.label))))
        .when(!signedIn(p), el => el.child(div().size(6).rounded(3).border_1().border_color(t.dim)))
        .children(windows.map(w => {
          const pc = pace(w, now);
          return h_flex().gap(5).items_center()
            .child(div().max_w(110).truncate().tooltip(w.label ?? w.kind).text_size(TYPE.strip).text_color(t.muted).child(short(w, windows.filter(x => x.kind === w.kind).length > 1)))
            .when(!o.percentageOnly, el => el.child(bar(w, 34, 4, now, t)))
            .child(div().w(36).flex_none().text_right().text_size(TYPE.strip).text_color(w.percentUsed >= 60 ? level(w.percentUsed) : t.foreground).child(`${Math.round(w.percentUsed)}%`))
            .when(Boolean(pc?.ahead), el => el.child(div().ml(-3).text_size(8).text_color(level(Math.max(60, w.percentUsed))).child("▲")));
        })));
    });
    return h_flex().id("quota").size_full().px(12).gap(11).items_center().justify_end().overflow_hidden()
      .bg(t.chrome).border_t(1).border_color(t.border).text_size(TYPE.strip).text_color(t.muted).cursor_pointer()
      .when(stale && Boolean(data), el => el.opacity(0.6))
      .on_click(() => this.openMenu())
      .on_mouse_down("right", () => this.openMenu())
      .when(parts.length === 0, el => el.child(div().text_color(t.muted).child(error ? "Quota unavailable" : data ? "No limits selected or available" : "Loading quotas…")))
      .children(parts);
  }

  menu(t) {
    const data = shared("quota.data"), error = shared("quota.error"), o = options(), now = Date.now();
    const all = data?.providers ?? [], available = all.filter(signedIn), unavailable = all.filter(p => !signedIn(p));
    const changeView = (key, value, cx) => { this[key] = value; cx.notify(); };
    const heading = (text, first = false) => div().when(!first, el => el.mt(8).border_t(1).border_color(t.border)).pt(first ? 6 : 12).pb(6).px(8).text_size(TYPE.caption).font_semibold().text_color(t.muted).child(text);
    const toggle = (label, on, act, id, disabled = false, icon = null) => h_flex().id(id).min_h(32).px(8).gap(9).items_center().rounded(5)
      .text_color(disabled ? t.dim : t.foreground).when(!disabled, el => el.cursor_pointer().hover(s => s.bg(t.hover)).on_click(act))
      .child(div().size(14).flex_none().flex().items_center().justify_center().rounded(3).border_1().border_color(disabled ? t.border : on ? t.accent : t.input).bg(on ? t.accent : t.popover)
        .when(disabled, el => el.opacity(0.45))
        .when(on, el => el.child(svg("mods/quota/icons/check.svg").size(10).flex_none().text_color(t.accent_foreground))))
      .when(Boolean(icon), el => el.child(icon))
      .child(div().flex_1().min_w(0).truncate().tooltip(label).child(label));
    const providerControl = p => v_flex().flex_none().child(toggle(p.label, !o.hidden.includes(p.id),
      () => setOptions({ hidden: o.hidden.includes(p.id) ? o.hidden.filter(id => id !== p.id) : [...o.hidden, p.id] }), "prov-" + p.id, false, this.glyph(p, 13, t)))
      .when(p.id === "agy", el => el.child(div().ml(15).pl(9).border_l(1).border_color(t.border).child(toggle("Claude/GPT limits", o.agyClaudeGpt,
        () => setOptions({ agyClaudeGpt: !o.agyClaudeGpt }), "agy-claude-gpt", o.hidden.includes(p.id)))))
      .when(!signedIn(p), el => el.child(div().pl(54).pb(6).text_size(TYPE.caption).text_color(t.muted).child(({ auth_required: "Sign-in required", error: "Unable to fetch quota", unavailable: "Quota unavailable", stale: "Outdated quota data" })[p.status] ?? "No quota available")));
    const details = p => v_flex().flex_none().px(8).py(12).gap(6).border_b(1).border_color(t.border)
      .child(h_flex().gap(8).items_center().child(this.glyph(p, 14, t)).child(div().flex_1().min_w(0).truncate().font_semibold().tooltip(p.label).child(p.label))
        .child(div().max_w(120).truncate().text_size(TYPE.caption).text_color(t.muted).tooltip(p.plan ?? "").child(p.plan ?? "")))
      .children(visibleWindows(p, o).map(w => v_flex().gap(4).pb(8)
        .child(h_flex().gap(8).items_center().child(div().flex_1().min_w(0).truncate().text_size(TYPE.body).tooltip(w.label ?? w.kind).child(w.label ?? w.kind))
          .when(!o.percentageOnly, el => el.child(bar(w, 100, 4, now, t))).child(div().w(40).flex_none().text_right().text_size(TYPE.body).text_color(w.percentUsed >= 60 ? level(w.percentUsed) : t.foreground).child(Math.round(w.percentUsed) + "%")))
        .when(Boolean(w.resetsAt && Date.parse(w.resetsAt) > now), el => el.child(div().text_size(TYPE.caption).text_color(t.muted).child("Resets in " + until(w.resetsAt, now))))));
    const disclosure = (label, key, children) => v_flex().flex_none()
      .child(h_flex().id(key).h(32).flex_none().px(8).gap(9).items_center()
        .when(key === "unavailableProviders", el => el.mt(4).border_t(1).border_color(t.border))
        .cursor_pointer().text_color(t.muted).hover(el => el.bg(t.hover))
        .on_click((_e, cx) => changeView(key, !this[key], cx))
        .child(div().w(14).flex_none().text_center().text_size(10).child(this[key] ? "▾" : "▸"))
        .child(div().flex_1().min_w(0).truncate().child(label)))
      .when(Boolean(this[key]), el => el.children(children));
    const usage = v_flex().flex_none().w_full().pr(12).children(available.filter(p => !o.hidden.includes(p.id)).map(details))
      .when(available.some(p => o.hidden.includes(p.id)), el => el.child(disclosure("Other providers", "otherProviders", available.filter(p => o.hidden.includes(p.id)).map(details))))
      .when(!available.length, el => el.child(div().p(8).text_color(t.muted).child(error ? "Unable to load quotas. Try Refresh." : data ? "No quotas available from your providers." : "Loading quotas…")));
    const display = v_flex().flex_none().w_full().pr(12).child(heading("Providers", true)).children(available.map(providerControl))
      .when(Boolean(unavailable.length), el => el.child(disclosure("Unavailable providers", "unavailableProviders", unavailable.map(providerControl))))
      .child(heading("Limit types"))
      .children(KINDS.map(([kind, label]) => toggle(kind === "session" ? "Session" : kind === "model" ? "Model-specific" : kind === "weekly" ? "Weekly" : "Monthly", o.kinds[kind], () => setOptions({ kinds: { ...o.kinds, [kind]: !o.kinds[kind] } }), "kind-" + kind)))
      .child(heading("Appearance"))
      .child(toggle("Percentages only (no bars)", o.percentageOnly, () => setOptions({ percentageOnly: !o.percentageOnly }), "percentage-only"))
      .child(toggle("Provider names", o.names, () => setOptions({ names: !o.names }), "names"))
      .child(toggle("Show signed-out providers", o.signedOut, () => setOptions({ signedOut: !o.signedOut }), "signed-out"));
    return v_flex().id("quota-menu").w_full().h(640).p(8).bg(t.popover).text_size(TYPE.body).text_color(t.foreground)
      .child(h_flex().px(8).py(6).items_center().child(div().flex_1().text_size(TYPE.title).font_semibold().child("Agent Quota"))
        .child(div().id("quota-refresh").px(8).py(4).rounded(4).cursor_pointer().text_color(t.accent).hover(el => el.bg(t.hover)).on_click(() => setShared("quota.refresh", Date.now())).child("Refresh")))
      .child(div().px(8).pb(8).text_size(TYPE.caption).text_color(t.muted).child(data ? "Updated " + ago(data.at, now) : "Waiting for quota data"))
      .child(div().pb(10).mb(4).border_b(1).border_color(t.border).child(h_flex().p(3).gap(2).rounded(7).bg(t.raised).border_1().border_color(t.border)
        .children(["Usage", "Display"].map(tab => div().id("tab-" + tab).flex_1().h(30).flex().items_center().justify_center().rounded(4)
          .bg((this.menuTab ?? "Usage") === tab ? t.selected : t.raised)
          .text_color((this.menuTab ?? "Usage") === tab ? t.foreground : t.muted)
          .when((this.menuTab ?? "Usage") === tab, el => el.font_semibold())
          .cursor_pointer().hover(el => el.bg(t.hover))
          .on_click((_e, cx) => changeView("menuTab", tab, cx)).child(tab)))))
      .when(Boolean(error), el => el.child(div().px(8).py(6).text_color(level(95)).child(error)))
      .child(v_flex().id("quota-menu-content").flex_1().min_h(0).overflow_y_scroll().overflow_y_scrollbar().mode("always").child(this.menuTab === "Display" ? display : usage));
  }
}
