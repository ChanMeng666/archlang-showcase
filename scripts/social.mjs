#!/usr/bin/env node
/**
 * Social cards for a showcase plan.
 *
 *   node scripts/social.mjs <slug>                # cover.png  (1600x900)
 *   node scripts/social.mjs <slug> --mode code    # code.png   (1600x900)
 *
 * Both cards are one SVG string composed here and rasterized once, so they are
 * deterministic: no dates, no randomness, no system fonts, and the plan on a
 * card is the plan's own VECTOR output, cropped — never a re-scaled PNG.
 *
 * ── The design ────────────────────────────────────────────────────────────────
 * Both cards follow the family's LIGHT social grammar, set by
 * `archcanvas/public/brand/archcanvas-og.png`: a warm paper ground, the lockup
 * small in the top-left, a short two-line headline in near-black down the left,
 * a quiet middot line of facts under it, the url in plum at the bottom, and a
 * white rounded card on the right holding the artifact. The cover adds one
 * thing that reference does not have and this product needs — a small dark chip
 * of the actual SOURCE, tucked into the card's bottom-right the way the
 * reference tucks its 3D render there. That chip is the whole claim of the
 * repository in one frame: the drawing above it was compiled from the text
 * inside it.
 *
 * ── plans/<slug>/social.json ──────────────────────────────────────────────────
 * {
 *   "title":    "The West Wing",
 *   "hook":     "The most famous office in the world is an arc.",
 *   "headline": ["The most famous office", "in the world is an arc."],
 *   "features": "{rooms} · {area} · one arc clause · {lint}",
 *   "url":      "archlang.uk/showcase",
 *   "codeLines": [201, 203],      // 1-based inclusive; the chip's excerpt
 *   "planCrop": { "x": 0.45, "y": 0.55, "w": 0.5, "h": 0.42 },
 *   "code": { "full": true }      // presence enables `--mode code`
 * }
 *
 * `headline` controls the line break explicitly; without it the `hook` is
 * wrapped to two lines. Keep both SHORT — the headline is set at up to 72px in a
 * ~730px column, so a line is about twenty characters, not eight words.
 *
 * `features` interpolates `{rooms}` `{area}` `{doors}` `{windows}` `{lint}` from
 * `describe()` and `lint()`, so the editorial half of the line can be written by
 * hand while the numbers stay derived and can never go stale. Absent, it
 * defaults to `{rooms} · {area} · {lint}`.
 *
 * `planCrop` is fractional rather than in millimetres on purpose: a crop written
 * against the viewBox survives the plan being re-rendered at a different paper
 * size, which plan-space coordinates would not.
 *
 * ── Where the palette comes from ──────────────────────────────────────────────
 * The token values below are copied from the compiler repo's shared brand block
 * (`docs-site/.vitepress/theme/style.css`, ArchLang 1.27.0) — see COLORS. There
 * is no lockstep test between the two repos, so each value carries the token
 * name it was copied from and drift is at least traceable by grep.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { compile, describe, lint } from "@chanmeng666/archlang";

import { assertGlyphs, FONT_FAMILY, measureText } from "./fonts.mjs";
import { renderCard } from "./raster.mjs";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");
const BRAND = join(ROOT, "assets", "brand");

/* ══════════════════════════════════════════════════════════════════════════════
   PALETTE
   ══════════════════════════════════════════════════════════════════════════════

   The cards live in the SHEET world — the warm drafting film half of the
   compile-boundary system, which is also what the family's social cards use.
   The only dark surface is the code chip, and that is deliberate: it is the one
   element that is SOURCE rather than output, and the contrast is the point.
   ══════════════════════════════════════════════════════════════════════════ */
const COLORS = {
  // ── SHEET WORLD (warm drafting film) — the current shared block
  paper: "#f5f2ea", // --paper · the card ground
  cardWhite: "#ffffff", // the raised sheet the drawing sits on
  ink: "#1c2430", // --ink · headline and wordmark — 14.0:1 on paper
  inkMuted: "#5b6470", // --ink-muted · the features line — 5.4:1 on paper
  hairline: "#cfc9bb", // --hairline · card border, separator rule
  // The mark's plum is the LIGHT-SURFACE one the brand book names for an
  // ivory ground, not the #8052ff used on dark. It matters more here than it
  // would for a solid logo: this mark is linework, and at 62px the A-frame's
  // interior detail is thin strokes — the lighter plum reads as a smudge.
  plumMark: "#6a3df0", // brand/README.md "Plum, light-surface"
  plumDeep: "#6b3ae0", // --plum-deep · plum as TEXT on paper — 5.7:1

  // ── SOURCE WORLD (dark) — the code chip and the code card only.
  // From the shared block as it stood BEFORE ADR 0014 removed dark mode
  // (commit 0410094^), which is where this family's dark grounds came from.
  carbon: "#0f1115", // --carbon
  carbon2: "#171b23", // --carbon-2
  srcMuted: "#98a0ac", // --src-muted (dark)
};

/**
 * SYNTAX — the eight `--syn-*` roles, lifted onto the carbon ground.
 *
 * The shipped `--syn-*` values are tuned for a LIGHT surface (each is >=4.5:1 on
 * `--src-bg`), so using them verbatim on the code chip would put `#14602a` green
 * on a near-black tile. These keep each role's HUE and raise its lightness, so
 * the palette still reads as the ArchLang palette. `assertSyntaxContrast()`
 * below re-derives the contrast on every run, so this deviation cannot silently
 * rot into an unreadable one.
 */
const SYNTAX = {
  keyword: { light: "#6b3ae0", dark: "#a78bff", weight: 600 },
  typename: { light: "#9a4a06", dark: "#f0a45f", weight: 600 },
  propertyname: { light: "#14602a", dark: "#72cf90", weight: 400 },
  atom: { light: "#0b57d0", dark: "#7fb0ff", weight: 400 },
  number: { light: "#0f6f7a", dark: "#5fcbd8", weight: 400 },
  string: { light: "#8a5a00", dark: "#e2b95e", weight: 400 },
  comment: { light: "#5a616e", dark: "#7f8896", weight: 400 },
  operator: { light: "#464d59", dark: "#aab2be", weight: 400 },
  bracket: { light: "#464d59", dark: "#aab2be", weight: 400 },
  text: { light: "#1a1d23", dark: "#dfe3ea", weight: 400 },
};

/** WCAG relative luminance of a `#rrggbb` string. */
function luminance(hex) {
  const channel = (i) => {
    const v = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Refuse to draw code the reader cannot read.
 *
 * The syntax colours are the one place this repo departs from a shipped token
 * value, so they are also the one place a "looks about right" hex could quietly
 * fail. Comments run at 4.5:1 like everything else — a dimmed comment on a
 * social card is a comment nobody reads.
 */
function assertSyntaxContrast() {
  const failures = [];
  for (const [role, { dark }] of Object.entries(SYNTAX)) {
    const ratio = contrast(dark, COLORS.carbon2);
    if (ratio < 4.5) failures.push(`${role} ${dark} is ${ratio.toFixed(2)}:1 on ${COLORS.carbon2}`);
  }
  if (failures.length > 0) {
    throw new Error(`Syntax palette below 4.5:1 on the code surface:\n  ${failures.join("\n  ")}`);
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE LANGUAGE'S OWN VOCABULARY
   ══════════════════════════════════════════════════════════════════════════════

   The highlighter here is cosmetic — it colours a card, it does not parse — but
   the word lists it colours by are not something to retype. `KEYWORDS` is the
   compiler's single source for them (`src/grammar/tokens.ts`), and tsup ships it
   into the package's own bundle verbatim, comments and all, so we read it out of
   the INSTALLED package: bump the dependency and the card learns the new
   keywords with no edit here. If the shape ever changes, extraction throws
   rather than silently colouring nothing.
   ══════════════════════════════════════════════════════════════════════════ */

/** Pull `var KEYWORDS = { control: [...], … }` out of the installed bundle. */
function readKeywords() {
  const entry = fileURLToPath(import.meta.resolve("@chanmeng666/archlang"));
  const dist = dirname(entry);
  const files = readFileSync(entry, "utf8").matchAll(/from ?"\.\/(chunk-[\w-]+\.js)"/g);
  const candidates = [entry, ...[...files].map((m) => join(dist, m[1]))];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const source = readFileSync(file, "utf8");
    const at = source.indexOf("var KEYWORDS = {");
    if (at === -1) continue;
    const groups = {};
    for (const group of ["control", "element", "attribute", "enum"]) {
      // Each group is a plain array of quoted words; the interleaved `//`
      // comments are why this is a string scan and not a JSON parse.
      const m = source.slice(at).match(new RegExp(`${group}: \\[([^\\]]*)\\]`));
      if (!m) throw new Error(`KEYWORDS in ${file} has no "${group}" group.`);
      groups[group] = new Set([...m[1].matchAll(/"([^"]+)"/g)].map((q) => q[1]));
      if (groups[group].size === 0) throw new Error(`KEYWORDS.${group} in ${file} is empty.`);
    }
    return groups;
  }
  throw new Error(
    "Could not find KEYWORDS in the installed @chanmeng666/archlang bundle — " +
      "the package layout changed; update readKeywords() in scripts/social.mjs.",
  );
}

const KEYWORDS = readKeywords();

/**
 * Tokenize one line of ArchLang for colour.
 *
 * A transcription of the rule ORDER in the compiler's generated CodeMirror mode
 * (`playground/src/arch-language.js`): comment, string, dimension-then-number
 * with the metric unit suffixes, multi-char operators before single, brackets,
 * then an identifier looked up in the four keyword sets. It recognizes no
 * structure beyond that and is never asked to — the compiler is what decides
 * whether a plan is valid.
 *
 * @param {string} line
 * @returns {{ col: number, text: string, role: keyof SYNTAX }[]}
 */
function tokenize(line) {
  const out = [];
  let i = 0;
  const push = (text, role) => {
    out.push({ col: i, text, role });
    i += text.length;
  };
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest[0] === " " || rest[0] === "\t") {
      i += 1;
      continue;
    }
    if (rest[0] === "#") {
      push(rest, "comment");
      continue;
    }
    if (rest[0] === '"') {
      let j = 1;
      let escaped = false;
      while (j < rest.length) {
        const ch = rest[j];
        j += 1;
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') break;
      }
      push(rest.slice(0, j), "string");
      continue;
    }
    let m =
      rest.match(/^[0-9]+(?:\.[0-9]+)?(?:mm|cm|m)?x[0-9]+(?:\.[0-9]+)?(?:mm|cm|m)?/) ??
      rest.match(/^[0-9]+(?:\.[0-9]+)?(?:mm|cm|m)?/) ??
      rest.match(/^\.[0-9]+/);
    if (m) {
      push(m[0], "number");
      continue;
    }
    m = rest.match(/^(->|==|!=|<=|>=|&&|\|\||\.\.)/) ?? rest.match(/^[+\-*/%=:,<>![\]]/);
    if (m) {
      push(m[0], "operator");
      continue;
    }
    if (/^[(){}]/.test(rest)) {
      push(rest[0], "bracket");
      continue;
    }
    m = rest.match(/^[A-Za-z_][A-Za-z0-9_-]*/);
    if (m) {
      const word = m[0];
      const role = KEYWORDS.control.has(word)
        ? "keyword"
        : KEYWORDS.element.has(word)
          ? "typename"
          : KEYWORDS.attribute.has(word)
            ? "propertyname"
            : KEYWORDS.enum.has(word)
              ? "atom"
              : "text";
      push(word, role);
      continue;
    }
    push(rest[0], "text");
  }
  return out;
}

/**
 * Wrap one tokenized line to a character budget, breaking BETWEEN tokens.
 *
 * A real ArchLang statement is ninety characters wide, and the chip is a small
 * tile in the corner of a card, so the two only meet if the line can wrap. It
 * wraps here rather than in the text because a break inside a string literal or
 * a number would hand the highlighter half a token and colour it wrongly — the
 * line is tokenized once, and the rows are filled with whole tokens.
 *
 * Original spacing is preserved WITHIN a row (`base`/`off` carry the mapping
 * from source column to output column), so an aligned statement stays aligned;
 * continuation rows start at a hanging indent instead.
 *
 * @param {string} line
 * @param {number} budget characters per row
 * @param {number} [indent] hanging indent on continuation rows
 * @returns {{ col: number, text: string, role: string }[][]}
 */
function wrapTokens(line, budget, indent = 2) {
  const tokens = tokenize(line);
  if (tokens.length === 0) return [[]];

  const rows = [];
  let row = [];
  // The first row starts at the source's own column 0, so a line's leading
  // indent survives — inside `plan { … }` that indent is what makes a block read
  // as a block. Only continuation rows are re-based, onto the hanging indent.
  let base = 0;
  let off = 0;

  for (const token of tokens) {
    let col = token.col - base + off;
    if (col + token.text.length > budget && row.length > 0) {
      rows.push(row);
      row = [];
      base = token.col;
      off = indent;
      col = indent;
    }
    if (col + token.text.length > budget) {
      // One token wider than the whole budget — an id or a coordinate list with
      // nowhere to break. Split it rather than let it run off the tile.
      let rest = token.text;
      let c = col;
      while (rest.length > 0) {
        const take = Math.max(1, budget - c);
        const chunk = rest.slice(0, take);
        row.push({ col: c, text: chunk, role: token.role });
        rest = rest.slice(take);
        if (rest.length > 0) {
          rows.push(row);
          row = [];
          c = indent;
        } else {
          c += chunk.length;
        }
      }
      base = token.col + token.text.length;
      off = c;
      continue;
    }
    row.push({ col, text: token.text, role: token.role });
    base = token.col + token.text.length;
    off = col + token.text.length;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/* ── SVG helpers ─────────────────────────────────────────────────────────── */

const xml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};

/**
 * One run of text, with its glyphs checked against the face that will draw it.
 *
 * Every string on a card goes through here, which is what makes "no tofu" a
 * property of the script rather than of whoever last looked at the PNG: these
 * are latin subsets, and a right arrow or a curly quote is missing from IBM
 * Plex Mono without any error being raised at render time.
 */
function text(content, x, y, { family, size, weight = 400, fill, anchor = "start", spacing = 0, where }) {
  assertGlyphs(content, family, where ?? `text "${content.slice(0, 30)}"`);
  return (
    `<text x="${n(x)}" y="${n(y)}" font-family="${family}" font-size="${n(size)}" font-weight="${weight}"` +
    ` fill="${fill}" text-anchor="${anchor}"` +
    (spacing ? ` letter-spacing="${n(spacing)}"` : "") +
    `>${xml(content)}</text>`
  );
}

/** Width of a run as {@link text} will set it, letter-spacing included. */
function width(content, { family, size, weight = 400, spacing = 0 }) {
  return measureText(content, family, size, weight) + spacing * Math.max(0, content.length - 1);
}

/** Greedy word wrap to a pixel width, using the real face metrics. */
function wrapToWidth(content, max, style) {
  const lines = [];
  let line = "";
  for (const word of String(content).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && width(candidate, style) > max) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Nest another SVG document inside this one.
 *
 * Returns an `<svg>` element carrying the source's inner markup, which gives it
 * its own viewport: the rasterizer clips to `x/y/width/height` and maps
 * `viewBox` into it, so a crop needs no clip-path and no coordinate arithmetic.
 */
function nest(source, { x, y, w, h, viewBox, preserve }) {
  const open = source.match(/<svg\b[^>]*>/);
  if (!open) throw new Error("Nested document has no <svg> element.");
  const close = source.lastIndexOf("</svg>");
  const inner = source.slice(open.index + open[0].length, close);
  // Namespace declarations are the one root attribute that must travel with the
  // markup: an ArchLang drawing labels its layers with `inkscape:label`, and a
  // prefix whose xmlns was left behind on the discarded root is a hard parse
  // error, not a missing attribute.
  const namespaces = [...open[0].matchAll(/\sxmlns:[\w-]+="[^"]*"/g)].map((m) => m[0]).join("");
  return (
    `<svg x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"` +
    ` viewBox="${viewBox}" preserveAspectRatio="${preserve}" fill="none" overflow="hidden"${namespaces}>${inner}</svg>`
  );
}

/**
 * The ArchLang lockup on a light ground: plum mark, near-black wordmark.
 *
 * `assets/brand/archlang-wordmark-black.svg` is a byte copy of the compiler
 * repo's asset and is never edited. The recolour is the one operation the brand
 * kit's geometry law permits — a FILL-SWAP, and nothing else. The lockup's two
 * groups each carry their own `fill="#111111"`, the first being the mark and the
 * second the letters, so the first becomes the light-surface plum and the second
 * becomes `--ink`, the near-black every other word on the card is set in. No
 * path byte moves.
 */
function lockup(x, y, height) {
  const file = join(BRAND, "archlang-wordmark-black.svg");
  if (!existsSync(file)) {
    throw new Error(`Missing ${file} — copy it verbatim from the compiler repo's brand/ directory.`);
  }
  const source = readFileSync(file, "utf8");
  const box = source.match(/viewBox="([-\d.\s]+)"/);
  if (!box) throw new Error("archlang-wordmark-black.svg has no viewBox.");
  const [, , vw, vh] = box[1].trim().split(/\s+/).map(Number);

  const fills = source.match(/fill="#111111"/g) ?? [];
  if (fills.length !== 2) {
    throw new Error(
      `archlang-wordmark-black.svg should carry exactly two #111111 fills (mark, then letters); found ${fills.length}.`,
    );
  }
  let swapped = source.replace(`fill="#111111"`, `fill="${COLORS.plumMark}"`);
  swapped = swapped.replace(`fill="#111111"`, `fill="${COLORS.ink}"`);

  return nest(swapped, {
    x,
    y,
    w: (height * vw) / vh,
    h: height,
    viewBox: box[1].trim(),
    preserve: "xMinYMid meet",
  });
}

/* ── Card geometry ───────────────────────────────────────────────────────────
   Proportions are lifted from the reference card and scaled from 1200x630 to
   1600x900, so the two sit side by side as one family. ─────────────────────── */

const W = 1600;
const H = 900;
const MARGIN = 96; // left text margin — 0.06 of the width, as in the reference
const COLUMN = 734; // the text column: 96 → 830, where the white card's air begins

/** The white sheet on the right, holding the drawing. */
const CARD = { x: 872, y: 101, w: 636, h: 696, r: 26 };

/** Baselines down the left column, at the reference's own proportions. */
const HEADLINE_MID = 467; // vertical centre of the headline block
const RULE_Y = 592;
const FEATURES_Y = 660;
const URL_Y = 771;

/** Soft shadow, shared by the white card and the dark chip. */
const SHADOWS =
  `<defs>` +
  `<filter id="cardShadow" x="-12%" y="-12%" width="124%" height="130%">` +
  `<feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#1c2430" flood-opacity="0.10"/></filter>` +
  `<filter id="chipShadow" x="-25%" y="-25%" width="150%" height="160%">` +
  `<feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#1c2430" flood-opacity="0.22"/></filter>` +
  `</defs>`;

/* ── Facts ───────────────────────────────────────────────────────────────── */

/**
 * The numbers on a card, measured by the compiler rather than written by hand —
 * which is the whole claim these cards make, so it would be a poor place to type
 * a figure. The features line interpolates them, so its editorial half can be
 * authored while its arithmetic half can never go stale.
 */
function factsFor(source, world) {
  const summary = describe(source, { world });
  const warnings = lint(source, { world }).filter((d) => d.severity === "warning").length;
  const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
  return {
    rooms: plural(summary.totals.rooms, "room"),
    doors: plural(summary.totals.doors, "door"),
    windows: plural(summary.totals.windows, "window"),
    area: `${summary.totals.floor_area_m2.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} m²`,
    lint: warnings === 0 ? "lint-clean" : plural(warnings, "warning"),
  };
}

/** Replace `{rooms}`-style placeholders, refusing any name we cannot fill. */
function renderFeatures(template, facts) {
  const unknown = [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((key) => !(key in facts));
  if (unknown.length > 0) {
    throw new Error(
      `"features" uses unknown placeholder${unknown.length === 1 ? "" : "s"} ${unknown.map((u) => `{${u}}`).join(", ")}. ` +
        `Available: ${Object.keys(facts).map((k) => `{${k}}`).join(", ")}.`,
    );
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => facts[key]);
}

/* ── Shared pieces ───────────────────────────────────────────────────────── */

/**
 * The left column: headline, a drafting rule, the facts, the url.
 *
 * The headline size is SOLVED, not chosen. At 72px in a 734px column a line is
 * about twenty characters, so a hook written for prose overflows silently unless
 * something measures it; this shrinks to 48px and then refuses, naming the line
 * that did not fit.
 */
function leftColumn({ headline, features, url }) {
  const style = { family: FONT_FAMILY.display, size: 72, weight: 700 };
  while (headline.some((line) => width(line, style) > COLUMN) && style.size > 48) style.size -= 1;
  const tooWide = headline.filter((line) => width(line, style) > COLUMN);
  if (tooWide.length > 0) {
    throw new Error(
      `headline line "${tooWide[0]}" needs ${Math.ceil(width(tooWide[0], style))}px at the 48px floor, ` +
        `but the column is ${COLUMN}px. Shorten it — a line is about 20 characters at this size.`,
    );
  }

  const leading = style.size * 1.32;
  const parts = [];
  // Centre the block on the ink: cap of the first line to baseline of the last.
  const cap = style.size * 0.73;
  let y = HEADLINE_MID - ((headline.length - 1) * leading + cap) / 2 + cap;
  for (const line of headline) {
    parts.push(text(line, MARGIN, y, { ...style, fill: COLORS.ink, where: "headline" }));
    y += leading;
  }

  const featureStyle = { family: FONT_FAMILY.body, size: 26 };
  if (width(features, featureStyle) > COLUMN) {
    throw new Error(
      `the features line needs ${Math.ceil(width(features, featureStyle))}px but the column is ${COLUMN}px — ` +
        `drop a term:\n  ${features}`,
    );
  }

  // A short drafting tick rather than a full divider: on a card this airy, a
  // rule across the column reads as a box edge and closes the space up.
  parts.push(
    `<rect x="${MARGIN}" y="${RULE_Y}" width="96" height="1.5" fill="${COLORS.hairline}"/>`,
    text(features, MARGIN, FEATURES_Y, {
      ...featureStyle,
      fill: COLORS.inkMuted,
      where: "features line",
    }),
    text(url, MARGIN, URL_Y, {
      family: FONT_FAMILY.body,
      size: 26,
      fill: COLORS.plumDeep,
      where: "url",
    }),
  );
  return parts.join("\n");
}

/**
 * The dark source chip.
 *
 * Its width is derived from the excerpt rather than fixed, because a fixed tile
 * would either crop real code or sit half empty: the chip is exactly as wide as
 * its widest ROW needs and no wider, capped at the white card's inner width. A
 * source line longer than that cap wraps ({@link wrapTokens}) rather than being
 * refused, so the chip can carry the statement a plan is actually about — a
 * `wall … arc … radius … cw` clause is ninety characters and no shorter form of
 * it exists.
 *
 * What it will not do is grow without bound: past a dozen rows this stops being
 * a chip in the corner of a card and becomes the card, which is what the code
 * mode is for.
 */
function sourceChip({ right, bottom, maxWidth, lines }) {
  const pad = 18;
  const size = 15;
  const advance = size * 0.6;
  const budget = Math.floor((maxWidth - pad * 2) / advance);

  const rows = lines.flatMap((line) => wrapTokens(line, budget));
  if (rows.length > 12) {
    throw new Error(
      `The chip excerpt comes to ${rows.length} rows once wrapped to ${budget} characters; twelve is the ` +
        `most it holds. Pick a shorter range — the chip is a teaser, not the whole source.`,
    );
  }

  const widest = Math.max(
    ...rows.map((row) => (row.length === 0 ? 0 : row[row.length - 1].col + row[row.length - 1].text.length)),
    1,
  );

  const leading = size * 1.62;
  const w = Math.max(280, pad * 2 + advance * widest);
  const h = pad * 2 + (rows.length - 1) * leading + size;
  const x = right - w;
  const y = bottom - h;

  const parts = [
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="14" fill="${COLORS.carbon2}"` +
      ` filter="url(#chipShadow)"/>`,
  ];
  rows.forEach((row, i) => {
    const baseline = y + pad + size * 0.78 + leading * i;
    for (const token of row) {
      const { dark, weight } = SYNTAX[token.role];
      parts.push(
        text(token.text, x + pad + advance * token.col, baseline, {
          family: FONT_FAMILY.mono,
          size,
          weight,
          fill: dark,
          where: "chip code",
        }),
      );
    }
  });
  return { markup: parts.join("\n"), box: { x, y, w, h } };
}

/**
 * A dark code surface holding the source at full size — the whole hero of the
 * code card. Type size is solved from the widest line and the line count, then
 * spare vertical room goes into the leading rather than into empty tile.
 */
function codeSurface({ x, y, w, h, lines, firstLine }) {
  const pad = 40;
  const digits = String(firstLine + lines.length - 1).length;
  const gutterEms = digits + 1.8;
  const longest = Math.max(...lines.map((l) => l.length), 1);

  const size = Math.min(30, (w - pad * 2) / (0.6 * (longest + gutterEms)), (h - pad * 2) / (lines.length * 1.55));
  if (size < 13) {
    throw new Error(
      `The source does not fit legibly: ${lines.length} lines, longest ${longest} chars, ` +
        `would need ${size.toFixed(1)}px type (the floor is 13px). Show fewer lines, or shorten them.`,
    );
  }

  const advance = size * 0.6;
  const leading = size * 1.55;
  const slack = Math.max(0, h - pad * 2 - ((lines.length - 1) * leading + size));
  const finalLeading = leading + Math.min(slack / Math.max(1, lines.length - 1), size * 0.55);
  const inkH = (lines.length - 1) * finalLeading + size;

  const gutterX = x + pad + advance * digits;
  const codeX = x + pad + advance * gutterEms;
  const top = y + (h - inkH) / 2;

  const parts = [
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="22" fill="${COLORS.carbon2}"` +
      ` filter="url(#chipShadow)"/>`,
  ];
  lines.forEach((line, i) => {
    const baseline = top + size * 0.78 + finalLeading * i;
    parts.push(
      text(String(firstLine + i), gutterX, baseline, {
        family: FONT_FAMILY.mono,
        size: size * 0.82,
        fill: "#4b5361",
        anchor: "end",
        where: "line number",
      }),
    );
    for (const token of tokenize(line)) {
      const { dark, weight } = SYNTAX[token.role];
      parts.push(
        text(token.text, codeX + advance * token.col, baseline, {
          family: FONT_FAMILY.mono,
          size,
          weight,
          fill: dark,
          where: `code line ${firstLine + i}`,
        }),
      );
    }
  });
  return parts.join("\n");
}

/* ── Config ──────────────────────────────────────────────────────────────── */

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadConfig(dir, slug) {
  const file = join(dir, "social.json");
  if (!existsSync(file)) {
    fail(
      `Missing ${file}.\n` +
        `Every social card is configured per plan. Create it with at least:\n` +
        `  { "title": "…", "hook": "…", "url": "archlang.uk/showcase" }\n` +
        `See the "Social kit" section of README.md for the whole schema.`,
    );
  }
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
  }

  const problems = [];
  for (const key of ["title", "hook", "url"]) {
    if (typeof config[key] !== "string" || config[key].trim() === "") {
      problems.push(`"${key}" must be a non-empty string`);
    }
  }
  if (config.headline !== undefined) {
    const h = config.headline;
    if (!Array.isArray(h) || h.length < 1 || h.length > 2 || h.some((l) => typeof l !== "string" || !l.trim())) {
      problems.push(`"headline" must be one or two non-empty strings — the card allows two lines`);
    }
  }
  if (config.features !== undefined && typeof config.features !== "string") {
    problems.push(`"features" must be a string, e.g. "{rooms} · {area} · one arc clause · {lint}"`);
  }
  if (config.codeLines !== undefined) {
    const r = config.codeLines;
    if (!Array.isArray(r) || r.length !== 2 || !r.every((v) => Number.isInteger(v) && v >= 1)) {
      problems.push(`"codeLines" must be [firstLine, lastLine], 1-based and inclusive`);
    } else if (r[0] > r[1]) {
      problems.push(`"codeLines" is [${r[0]}, ${r[1]}] — the first line comes after the last`);
    }
  }
  if (config.planCrop != null) {
    const c = config.planCrop;
    const keys = ["x", "y", "w", "h"];
    if (typeof c !== "object" || keys.some((k) => typeof c[k] !== "number")) {
      problems.push(`"planCrop" must be null or { x, y, w, h } as fractions of the plan's viewBox`);
    } else if (c.w <= 0 || c.h <= 0 || c.x < 0 || c.y < 0 || c.x + c.w > 1.0001 || c.y + c.h > 1.0001) {
      problems.push(`"planCrop" must stay inside the unit square (got x+w=${c.x + c.w}, y+h=${c.y + c.h})`);
    }
  }
  if (config.code !== undefined) {
    const c = config.code;
    if (typeof c !== "object" || c === null) problems.push(`"code" must be an object`);
    else if (c.full !== true && !Array.isArray(c.lines)) {
      problems.push(`"code" needs either "full": true or "lines": [firstLine, lastLine]`);
    }
  }
  if (problems.length > 0) {
    fail(`${file} is invalid:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  return config;
}

/**
 * Slice a 1-based inclusive line range, with an error naming the real extent.
 *
 * The excerpt is DEDENTED by its own common indent. Almost every statement in a
 * plan sits two spaces inside `plan { … }`, and on a card that indent is two
 * characters of nothing bought at the price of the type size — the panel's width
 * is what decides how large the code can be set.
 */
function sliceLines(source, [from, to], slug, what) {
  const all = source.replace(/\n$/, "").split("\n");
  if (to > all.length) {
    fail(`${slug}/social.json ${what} ends at line ${to}, but plans/${slug}/plan.arch has ${all.length} lines.`);
  }
  const lines = all.slice(from - 1, to);
  const indent = Math.min(
    ...lines.filter((l) => l.trim() !== "").map((l) => l.match(/^ */)[0].length),
    Number.POSITIVE_INFINITY,
  );
  return {
    lines: Number.isFinite(indent) && indent > 0 ? lines.map((l) => l.slice(indent)) : lines,
    firstLine: from,
  };
}

/** The headline, either authored line by line or wrapped from the hook. */
function headlineFor(config) {
  if (config.headline) return config.headline;
  const style = { family: FONT_FAMILY.display, size: 64, weight: 700 };
  const lines = wrapToWidth(config.hook, COLUMN, style);
  if (lines.length > 2) {
    throw new Error(
      `"hook" wraps to ${lines.length} headline lines; the card allows two. Shorten it, or set ` +
        `"headline": ["…", "…"] to choose the break yourself:\n  ${lines.join("\n  ")}`,
    );
  }
  return lines;
}

/* ── Modes ───────────────────────────────────────────────────────────────── */

function coverCard({ config, slug, source, planSvg, world }) {
  const facts = factsFor(source, world);
  const range = config.codeLines ?? [1, Math.min(4, source.split("\n").length)];
  const { lines } = sliceLines(source, range, slug, `"codeLines"`);

  // The chip is placed first: it decides how much of the card is left for the
  // drawing, so the plan can never be laid out under it.
  const chip = sourceChip({
    right: CARD.x + CARD.w - 26,
    bottom: CARD.y + CARD.h - 26,
    maxWidth: CARD.w - 52,
    lines,
  });

  const pad = 56;
  const view = {
    x: CARD.x + pad,
    y: CARD.y + pad,
    w: CARD.w - pad * 2,
    // The drawing stops just under the chip's top edge, so the two overlap by a
    // few pixels and read as layered rather than as two tiles in a column.
    h: chip.box.y + 16 - (CARD.y + pad),
  };

  const box = planSvg.match(/viewBox="([-\d.eE\s]+)"/);
  if (!box) throw new Error("plan.svg has no viewBox — cannot place it on the card.");
  const [vx, vy, vw, vh] = box[1].trim().split(/\s+/).map(Number);
  const crop = config.planCrop ?? null;
  const region = crop ? [vx + vw * crop.x, vy + vh * crop.y, vw * crop.w, vh * crop.h] : [vx, vy, vw, vh];

  return [
    SHADOWS,
    `<rect width="${W}" height="${H}" fill="${COLORS.paper}"/>`,
    lockup(MARGIN, 158, 62),
    leftColumn({
      headline: headlineFor(config),
      features: renderFeatures(config.features ?? "{rooms} · {area} · {lint}", facts),
      url: config.url,
    }),
    `<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="${CARD.r}"` +
      ` fill="${COLORS.cardWhite}" filter="url(#cardShadow)"/>`,
    `<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" rx="${CARD.r}" fill="none"` +
      ` stroke="${COLORS.hairline}" stroke-width="1" stroke-opacity="0.6"/>`,
    // `meet`, never `slice`, even for a crop: the drawing should sit on the
    // white sheet the way the reference's does, with air around it, and `slice`
    // would silently re-crop whatever the region's aspect does not match. The
    // letterboxing lands on white and is invisible; what it buys is that the
    // region in social.json is exactly the region you get.
    nest(planSvg, { ...view, viewBox: region.map(n).join(" "), preserve: "xMidYMid meet" }),
    chip.markup,
  ].join("\n");
}

/**
 * The code card: the same light family, but the source is the artifact, so the
 * dark surface grows from a chip in the corner to the hero of the frame.
 */
function codeCard({ config, slug, source, world }) {
  if (!config.code) {
    fail(
      `plans/${slug}/social.json has no "code" block, so there is no code card for this plan.\n` +
        `Add "code": { "full": true } to render the whole source, or ` +
        `"code": { "lines": [from, to] } for a range.`,
    );
  }
  const facts = factsFor(source, world);
  const total = source.replace(/\n$/, "").split("\n").length;
  const range = config.code.full ? [1, total] : config.code.lines;
  const { lines, firstLine } = sliceLines(source, range, slug, `"code.lines"`);

  const surface = { x: MARGIN, y: 286, w: W - MARGIN * 2, h: 484 };
  const titleStyle = { family: FONT_FAMILY.display, size: 46, weight: 700 };
  const quiet = { family: FONT_FAMILY.body, size: 26 };

  return [
    SHADOWS,
    `<rect width="${W}" height="${H}" fill="${COLORS.paper}"/>`,
    lockup(MARGIN, 118, 62),
    text(config.url, W - MARGIN, 160, { ...quiet, fill: COLORS.plumDeep, anchor: "end", where: "url" }),
    text(config.title, MARGIN, 248, { ...titleStyle, fill: COLORS.ink, where: "title" }),
    codeSurface({ ...surface, lines, firstLine }),
    text(renderFeatures(config.features ?? "{rooms} · {area} · {lint}", facts), MARGIN, 838, {
      ...quiet,
      fill: COLORS.inkMuted,
      where: "features line",
    }),
    text(`plans/${slug}/plan.arch`, W - MARGIN, 838, {
      family: FONT_FAMILY.mono,
      size: 22,
      fill: COLORS.inkMuted,
      anchor: "end",
      where: "source path",
    }),
  ].join("\n");
}

/* ── Entry point ─────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith("--"));
const modeIndex = argv.indexOf("--mode");
const mode = modeIndex === -1 ? "cover" : argv[modeIndex + 1];

if (!slug) fail("usage: node scripts/social.mjs <slug> [--mode cover|code]");
if (mode !== "cover" && mode !== "code") fail(`Unknown --mode "${mode}". Use "cover" or "code".`);

const dir = join(PLANS, slug);
if (!existsSync(dir)) fail(`No such plan: plans/${slug}/`);

const archPath = join(dir, "plan.arch");
const svgPath = join(dir, "plan.svg");
if (!existsSync(archPath)) fail(`Missing ${archPath}.`);
if (mode === "cover" && !existsSync(svgPath)) {
  fail(`Missing ${svgPath} — run \`npm run render ${slug}\` first.`);
}

assertSyntaxContrast();

const config = loadConfig(dir, slug);
const source = readFileSync(archPath, "utf8");
const world = {
  read(path) {
    try {
      return readFileSync(resolvePath(dir, path), "utf8");
    } catch {
      return null;
    }
  },
};

// A card must never show a drawing the compiler would refuse.
const compiled = compile(source, { world });
if (compiled.errors.length > 0) {
  fail(`plans/${slug}/plan.arch does not compile (${compiled.errors.length} error(s)) — fix it before publishing.`);
}

// Layout and glyph problems are the author's to fix — a headline line that will
// not fit, a chip excerpt wider than the chip, a character the face cannot draw.
// They are reported like any other bad input, not as a crash: a stack trace here
// says nothing that the message does not.
let body;
try {
  body =
    mode === "cover"
      ? coverCard({ config, slug, source, planSvg: readFileSync(svgPath, "utf8"), world })
      : codeCard({ config, slug, source, world });
} catch (error) {
  fail(`plans/${slug}/${mode}.png cannot be laid out:\n  ${error.message.split("\n").join("\n  ")}`);
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${body}\n</svg>`;

const stem = mode === "cover" ? "cover" : "code";
writeFileSync(join(dir, `${stem}.svg`), svg, "utf8");
writeFileSync(join(dir, `${stem}.png`), await renderCard(svg, { width: W }));

console.log(`ok ${slug} — ${stem}.svg + ${stem}.png (${W}x${H})`);
