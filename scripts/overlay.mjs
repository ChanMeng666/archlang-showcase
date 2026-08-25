#!/usr/bin/env node
/**
 * Annotate a rendered plan — routes, numbered beats, a caption.
 *
 *   node scripts/overlay.mjs <slug>
 *
 * Reads `plans/<slug>/plan.svg` + `plans/<slug>/overlay.json` and writes
 * `plans/<slug>/plan-annotated.svg` and `plan-annotated.png`. The plan itself is
 * never touched: the annotation is a single `<g id="overlay">` injected before
 * the closing `</svg>`, so re-rendering the plan and re-running this script is
 * always safe, and the overlay can be thrown away by deleting one element.
 *
 * ── overlay.json schema ───────────────────────────────────────────────────────
 * {
 *   "paths": [
 *     {
 *       "points": [[x, y], [x, y], …],   // 2+ points, SVG user units (millimetres)
 *       "color":  "#c1121f",             // optional; defaults to the accent
 *       "dash":   true,                  // optional; dashed line (default true)
 *       "arrow":  true,                  // optional; arrowhead on the last segment
 *       "label":  "breach here"          // optional; drawn at the path midpoint
 *     }
 *   ],
 *   "markers": [
 *     { "at": [x, y], "n": 1, "text": "01:00 helicopters insert", "color": "#8052ff" }
 *   ],
 *   "highlights": [
 *     {
 *       "rect":  [x, y, w, h],           // SVG user units, same as everything else
 *       "label": "windowless at the centre",  // optional
 *       "n":     3,                      // optional numbered tag on the corner
 *       "color": "#8052ff",              // optional; defaults to the accent
 *       "side":  "right"                 // optional; right | left | above | below
 *     }
 *   ],
 *   "note": "text drawn in a caption box at the bottom"
 * }
 *
 * Every key is optional — an empty `{}` produces an untouched copy.
 *
 * TWO ACCENTS, and they mean different things. Red is the architect's markup
 * red and reads as *what happened here* — a route, a breach, a movement. Plum is
 * the brand accent and reads as *look at this* — a point of interest the drawing
 * itself is making. A tour that uses one colour for both is a tour where the
 * reader cannot tell a path from a place. Pass `color` per path, marker or
 * highlight; both are named in ACCENT / ACCENT_ALT below.
 *
 * COORDINATES are the SVG's own user units, which for an ArchLang drawing are
 * millimetres in plan space: the same numbers you wrote in the `.arch` source.
 * The generated SVG's `viewBox` tells you the visible extent — read it off the
 * top of `plan.svg` and pick coordinates inside it. Every size in the overlay
 * (stroke weight, type size, marker radius) is derived from that viewBox, so an
 * annotation reads the same on a 6-metre studio and a 60-metre aquarium.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { inkBox, svgToPng } from "./raster.mjs";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");

/** Routes and events — the architect's markup red. The default for everything. */
const ACCENT = "#c1121f";
/** Points of interest — the ArchLang brand plum (`--plum` in the shared block). */
const ACCENT_ALT = "#8052ff";
const INK = "#1b1b1f";
const HALO = "#ffffff";

const xml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Trim floats so the output is stable and small. */
const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};

function readViewBox(svg) {
  const m = svg.match(/viewBox="([-\d.eE\s]+)"/);
  if (!m) throw new Error("plan.svg has no viewBox — cannot scale the overlay to it.");
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) throw new Error(`Unusable viewBox: "${m[1]}"`);
  return { x, y, w, h };
}

/**
 * A text run with a white halo behind it, so it stays readable over poché,
 * furniture and dimension lines alike. `paint-order` puts the stroke under the
 * fill, which is what turns a stroke into a halo rather than an outline.
 */
function haloText(text, x, y, size, { anchor = "start", color = INK, weight = "600" } = {}) {
  return (
    `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" font-weight="${weight}" fill="${color}"` +
    ` text-anchor="${anchor}" dominant-baseline="central"` +
    ` stroke="${HALO}" stroke-width="${n(size * 0.28)}" stroke-linejoin="round" paint-order="stroke fill">` +
    `${xml(text)}</text>`
  );
}

/** Arrowhead polygon for the final segment of a polyline. */
function arrowHead(points, size, color) {
  const [px, py] = points[points.length - 2];
  const [qx, qy] = points[points.length - 1];
  const dx = qx - px;
  const dy = qy - py;
  const len = Math.hypot(dx, dy);
  if (len === 0) return "";
  const ux = dx / len;
  const uy = dy / len;
  // Back off along the shaft, then step out to each side.
  const bx = qx - ux * size;
  const by = qy - uy * size;
  const half = size * 0.42;
  const pts = [
    [qx, qy],
    [bx - uy * half, by + ux * half],
    [bx + uy * half, by - ux * half],
  ];
  return `<polygon points="${pts.map(([a, b]) => `${n(a)},${n(b)}`).join(" ")}" fill="${color}"/>`;
}

/** Break `text` into lines of at most `max` characters, on word boundaries. */
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The top-level `<g>` elements of an SVG, sliced with their tags.
 *
 * Depth-counted rather than regex-matched: a layer can contain nested groups,
 * and a non-greedy match to the first `</g>` would silently return half of one.
 */
function topLevelGroups(svg) {
  const groups = [];
  const open = /<g\b[^>]*>/g;
  let m;
  while ((m = open.exec(svg))) {
    let depth = 1;
    let i = open.lastIndex;
    while (depth > 0) {
      const nextOpen = svg.indexOf("<g", i);
      const nextClose = svg.indexOf("</g>", i);
      if (nextClose === -1) return groups; // malformed; take what we have
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 2;
      } else {
        depth -= 1;
        i = nextClose + 4;
      }
    }
    groups.push(svg.slice(m.index, i));
    open.lastIndex = i;
  }
  return groups;
}

/**
 * What the DRAWING occupies, as distinct from what the sheet does.
 *
 * ArchLang puts the building on named layers — `A-WALL`, `A-FLOR`,
 * `A-ANNO-DIMS` and the rest — and emits the page's own furniture (the north
 * arrow, the scale bar, the title block) as UNNAMED top-level groups beside
 * them. On `examples/west-wing` the layers stop at y=36134 while the title block
 * sits at 45009, nine thousand units further down the A1 sheet's bottom margin,
 * so measuring the page reports a box with a band of nothing through it and a
 * caption composed under that box floats.
 *
 * So the crop is measured against the `A-*` layers alone. Note that this only
 * moves the viewBox — nothing is deleted — so page furniture that happens to sit
 * INSIDE the drawing's extent still draws (the north arrow does), and only what
 * lies out in the margin is cropped away. The full sheet, title block included,
 * is what `plan.png` is for.
 */
async function drawingBox(svg) {
  const groups = topLevelGroups(svg);
  const layers = groups.filter((g) => /^<g id="A-/.test(g));
  const measured = layers.length > 0 ? layers : groups;
  if (measured.length === 0) return inkBox(svg);
  const open = svg.match(/<svg\b[^>]*>/)[0];
  const defs = (svg.match(/<defs>[\s\S]*?<\/defs>/) ?? [""])[0];
  return inkBox(`${open}${defs}${measured.join("\n")}</svg>`);
}

/** The smallest box containing both. */
function unionBox(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/**
 * The tour's dominant accent — whichever colour most of its elements carry.
 *
 * The caption is the tour's own voice, so it has to be in the tour's own colour:
 * a plum set of highlights under a red caption box reads as two annotations by
 * two people. Ties fall back to the markup red, which is what an unstated colour
 * means everywhere else here.
 */
function dominantAccent(spec) {
  const tally = new Map();
  for (const element of [...(spec.paths ?? []), ...(spec.markers ?? []), ...(spec.highlights ?? [])]) {
    const color = element.color ?? ACCENT;
    tally.set(color, (tally.get(color) ?? 0) + 1);
  }
  let best = ACCENT;
  let bestCount = 0;
  for (const [color, count] of tally) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Draw the annotations. `frame` is the box everything is SIZED against — the
 * drawing's ink, not the sheet — so a 50-metre plan issued on an A1 gets
 * annotations scaled to the building rather than to a page that is mostly
 * margin.
 */
function buildAnnotations(spec, frame) {
  const span = Math.max(frame.w, frame.h);

  const stroke = span * 0.0035;
  const size = span * 0.018; // body type
  const radius = size * 1.05; // numbered marker circle

  const out = [];

  for (const path of spec.paths ?? []) {
    const points = path.points ?? [];
    if (points.length < 2) continue;
    const color = path.color ?? ACCENT;
    const dashed = path.dash !== false;
    const d = points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
    out.push(
      `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="${n(stroke)}"` +
        ` stroke-linecap="round" stroke-linejoin="round" opacity="0.9"` +
        (dashed ? ` stroke-dasharray="${n(stroke * 4)} ${n(stroke * 3)}"` : "") +
        `/>`,
    );
    if (path.arrow !== false) out.push(arrowHead(points, stroke * 5, color));
    if (path.label) {
      const mid = points[Math.floor(points.length / 2)];
      out.push(haloText(path.label, mid[0], mid[1] - size * 0.9, size, { anchor: "middle", color }));
    }
  }

  /** A numbered disc — the tag on a route beat or on a highlighted place. */
  const numberTag = (x, y, label, color) => [
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${color}" stroke="${HALO}" stroke-width="${n(stroke * 0.9)}"/>`,
    `<text x="${n(x)}" y="${n(y)}" font-size="${n(size * 0.95)}" font-weight="700" fill="${HALO}"` +
      ` text-anchor="middle" dominant-baseline="central">${xml(label ?? "")}</text>`,
  ];

  for (const marker of spec.markers ?? []) {
    const [x, y] = marker.at ?? [0, 0];
    out.push(...numberTag(x, y, marker.n, marker.color ?? ACCENT));
    if (marker.text) out.push(haloText(marker.text, x + radius * 1.5, y, size));
  }

  // A highlight is a PLACE rather than a movement: a dashed box round something
  // already drawn, tinted just enough to separate it from the poché without
  // hiding the walls, fixtures or dimensions inside it. The number tag sits on
  // the top-left corner so it never lands on top of what is being pointed at.
  for (const highlight of spec.highlights ?? []) {
    const rect = highlight.rect ?? [];
    if (rect.length !== 4) continue;
    const [rx, ry, rw, rh] = rect;
    const color = highlight.color ?? ACCENT;
    const round = Math.min(rw, rh) * 0.06;
    out.push(
      `<rect x="${n(rx)}" y="${n(ry)}" width="${n(rw)}" height="${n(rh)}" rx="${n(round)}"` +
        ` fill="${color}" fill-opacity="0.07" stroke="${color}" stroke-width="${n(stroke)}"` +
        ` stroke-dasharray="${n(stroke * 4)} ${n(stroke * 3)}" stroke-linejoin="round"/>`,
    );
    if (highlight.n != null) out.push(...numberTag(rx, ry, highlight.n, color));
    if (highlight.label) {
      const gap = size * 0.85;
      // A label ABOVE has to clear the number tag, which sits on the top-left
      // corner: at the plain gap the two overlap every time.
      const above = gap + (highlight.n != null ? radius : 0);
      const side = highlight.side ?? "right";
      const place = {
        right: [rx + rw + gap, ry + rh / 2, "start"],
        left: [rx - gap, ry + rh / 2, "end"],
        above: [rx + rw / 2, ry - above, "middle"],
        below: [rx + rw / 2, ry + rh + gap, "middle"],
      }[side];
      if (!place) throw new Error(`highlight "side" must be right, left, above or below — got "${side}".`);
      out.push(haloText(highlight.label, place[0], place[1], size, { anchor: place[2], color }));
    }
  }

  return { markup: out.join("\n"), span, stroke, size };
}

/**
 * The caption, in a strip directly BELOW the composed drawing rather than a box
 * on top of it: an ArchLang sheet already uses its bottom edge for the scale bar
 * and title block, and a caption laid over those hides real information.
 *
 * `content` is the box the drawing and its annotations actually occupy, so the
 * caption sits against the ink and not against the bottom of a sheet whose last
 * third is empty paper.
 */
function buildNote(note, content, { span, stroke, size, accent }) {
  const pad = size * 0.7;
  const lines = wrap(note, 96);
  const lineHeight = size * 1.45;
  const boxH = lines.length * lineHeight + pad * 2;
  const gap = size * 0.9;
  const stripH = boxH + gap * 2;

  // The box is inset from the composed edge; the white ground under it is not,
  // so anything the crop left hanging in this band is painted over.
  const inset = content.w * 0.012;
  const boxW = content.w - inset * 2;
  const boxX = content.x + inset;
  const boxY = content.y + content.h + gap;

  const out = [
    // Opaque ground for the new strip — the sheet's own background rect stops at
    // the page edge, so without this the strip is transparent.
    `<rect x="${n(content.x)}" y="${n(content.y + content.h)}" width="${n(content.w)}" height="${n(stripH)}"` +
      ` fill="${HALO}"/>`,
    `<rect x="${n(boxX)}" y="${n(boxY)}" width="${n(boxW)}" height="${n(boxH)}" rx="${n(size * 0.35)}"` +
      ` fill="${HALO}" stroke="${accent}" stroke-width="${n(stroke * 0.7)}"/>`,
  ];
  lines.forEach((line, i) => {
    out.push(
      `<text x="${n(boxX + pad)}" y="${n(boxY + pad + lineHeight * (i + 0.5))}" font-size="${n(size * 0.8)}"` +
        ` fill="${INK}" dominant-baseline="central">${xml(line)}</text>`,
    );
  });
  return { markup: out.join("\n"), stripH };
}

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/overlay.mjs <slug>");
  process.exit(1);
}

const dir = join(PLANS, slug);
const svgPath = join(dir, "plan.svg");
const specPath = join(dir, "overlay.json");

for (const p of [svgPath, specPath]) {
  if (!existsSync(p)) {
    console.error(`Missing ${p}${p === svgPath ? " — run `npm run render " + slug + "` first." : ""}`);
    process.exit(1);
  }
}

const svg = readFileSync(svgPath, "utf8");
const spec = JSON.parse(readFileSync(specPath, "utf8"));

if (svg.lastIndexOf("</svg>") === -1) {
  console.error(`${svgPath} has no closing </svg> tag.`);
  process.exit(1);
}

/**
 * Splice a group in just before `</svg>`, and re-state the root viewBox.
 *
 * The root's `width`/`height` go with it. An ArchLang drawing declares its PAPER
 * size there — `width="841mm" height="594mm"` — and those win over the viewBox
 * when a renderer picks an aspect ratio, so a composed canvas that changed the
 * viewBox and left them alone gets fitted into the old sheet's proportions and
 * letterboxed. Dropping them makes the viewBox the only statement of shape,
 * which is what a composed image wants: it is no longer a sheet of paper.
 */
function compose(document, markup, viewBox) {
  const openTag = document.match(/<svg\b[^>]*>/)[0];
  const rebased = document.replace(
    openTag,
    openTag
      .replace(/\s(width|height)="[^"]*"/g, "")
      .replace(
        /viewBox="[-\d.eE\s]+"/,
        `viewBox="${n(viewBox.x)} ${n(viewBox.y)} ${n(viewBox.w)} ${n(viewBox.h)}"`,
      ),
  );
  const at = rebased.lastIndexOf("</svg>");
  return `${rebased.slice(0, at)}<g id="overlay">\n${markup}\n</g>\n${rebased.slice(at)}`;
}

/* Composition runs in two measured passes rather than against the sheet.
   1. What the DRAWING occupies, which sets the scale every annotation is
      derived from — a page that is two-thirds margin must not shrink the type.
   2. What the ANNOTATIONS occupy, unioned with it: a label or a highlight can
      legitimately sit outside the building, and cropping to the drawing alone
      would slice it off.
   The caption is composed last, against that union, so it lands under the ink
   instead of under the bottom of the page. */
const vb = readViewBox(svg);
const drawing = await drawingBox(svg);
const annotations = buildAnnotations(spec, drawing);

let union = drawing;
if (annotations.markup.trim() !== "") {
  const openTagOnly = svg.match(/<svg\b[^>]*>/)[0];
  union = unionBox(drawing, await inkBox(`${openTagOnly}${annotations.markup}</svg>`));
}

const margin = annotations.span * 0.025;
const content = {
  x: union.x - margin,
  y: union.y - margin,
  w: union.w + margin * 2,
  h: union.h + margin * 2,
};

let markup = annotations.markup;
let viewBox = content;
if (spec.note) {
  const note = buildNote(spec.note, content, { ...annotations, accent: dominantAccent(spec) });
  markup = `${markup}\n${note.markup}`;
  viewBox = { ...content, h: content.h + note.stripH };
}

// The sheet's own background rect covers the page, which no longer covers the
// composed canvas — the caption strip hangs below it, and the crop may reach
// past a page edge. One opaque ground under everything, spliced in right after
// the root tag so it stays beneath the drawing rather than over it.
const openTag = svg.match(/<svg\b[^>]*>/)[0];
const grounded = svg.replace(
  openTag,
  `${openTag}<rect x="${n(viewBox.x)}" y="${n(viewBox.y)}" width="${n(viewBox.w)}" height="${n(viewBox.h)}" fill="${HALO}"/>`,
);

const annotated = compose(grounded, markup, viewBox);

writeFileSync(join(dir, "plan-annotated.svg"), annotated, "utf8");
writeFileSync(join(dir, "plan-annotated.png"), await svgToPng(annotated));

const counts = [
  [(spec.paths ?? []).length, "path"],
  [(spec.markers ?? []).length, "marker"],
  [(spec.highlights ?? []).length, "highlight"],
]
  .filter(([count]) => count > 0)
  .map(([count, name]) => `${count} ${name}${count === 1 ? "" : "s"}`);
if (spec.note) counts.push("note");

console.log(`ok ${slug} — plan-annotated.svg + plan-annotated.png (${counts.join(", ") || "nothing to draw"})`);
