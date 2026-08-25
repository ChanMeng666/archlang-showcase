/**
 * Deterministic web fonts for the rasterizer.
 *
 * The social cards are set in the ArchLang brand faces — Archivo (display),
 * Public Sans (body) and IBM Plex Mono (code) — and they must rasterize the
 * same on every machine, so nothing may come from the system font list.
 *
 * The one obstacle: resvg's font database reads SFNT containers (`.ttf`/`.otf`)
 * and **not** WOFF, while `@fontsource/*` ships only `.woff` and `.woff2`. A
 * WOFF1 file, though, is not a different font format — it is an SFNT whose
 * tables have each been deflated and whose 12-byte header has been swapped for
 * a 44-byte one. So we unwrap it here rather than vendoring a second copy of
 * every face as a binary blob in the repo: {@link woffToSfnt} inflates each
 * table and rebuilds the plain SFNT around it.
 *
 * (WOFF2 is genuinely different — Brotli plus a transformed `glyf`/`loca` — and
 * is deliberately not attempted. Every fontsource package ships the `.woff`
 * beside it.)
 *
 * The rebuilt `.ttf`s are cached under `assets/fonts/`, which is gitignored:
 * they are derived from `node_modules`, so an `npm install` plus any script in
 * this directory regenerates them byte-for-byte.
 */

import { inflateSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, "assets", "fonts");

/**
 * Rebuild the plain SFNT (`.ttf`) hiding inside a WOFF1 file.
 * @param {Buffer} woff
 * @returns {Buffer}
 */
export function woffToSfnt(woff) {
  if (woff.length < 44 || woff.readUInt32BE(0) !== 0x774f4646 /* "wOFF" */) {
    throw new Error("Not a WOFF1 file (bad signature) — WOFF2 is not supported here.");
  }
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);

  /** @type {{ tag: number, data: Buffer, checksum: number }[]} */
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const e = 44 + i * 20;
    const tag = woff.readUInt32BE(e);
    const offset = woff.readUInt32BE(e + 4);
    const compLength = woff.readUInt32BE(e + 8);
    const origLength = woff.readUInt32BE(e + 12);
    const checksum = woff.readUInt32BE(e + 16);
    const raw = woff.subarray(offset, offset + compLength);
    // Per the spec a table is stored uncompressed when deflating did not shrink
    // it, and that is signalled by compLength === origLength — not by a flag.
    const data = compLength === origLength ? Buffer.from(raw) : inflateSync(raw);
    if (data.length !== origLength) {
      throw new Error(`WOFF table ${i} inflated to ${data.length} bytes, expected ${origLength}.`);
    }
    tables.push({ tag, data, checksum });
  }
  tables.sort((a, b) => a.tag - b.tag);

  // SFNT header: the binary-search hints are derived, not stored, so they can
  // only be wrong if we compute them wrong.
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  const header = Buffer.alloc(12);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(numTables * 16 - searchRange, 10);

  const directory = Buffer.alloc(numTables * 16);
  const body = [];
  let offset = 12 + numTables * 16;
  tables.forEach((table, i) => {
    const d = i * 16;
    directory.writeUInt32BE(table.tag, d);
    directory.writeUInt32BE(table.checksum, d + 4);
    directory.writeUInt32BE(offset, d + 8);
    directory.writeUInt32BE(table.data.length, d + 12);
    body.push(table.data);
    offset += table.data.length;
    // Every table starts on a four-byte boundary; the padding is not counted in
    // the recorded length.
    const pad = (4 - (table.data.length % 4)) % 4;
    if (pad > 0) {
      body.push(Buffer.alloc(pad));
      offset += pad;
    }
  });

  return Buffer.concat([header, directory, ...body]);
}

/**
 * The faces the cards are set in. `family` is the name the SVG asks for; the
 * weights are separate files because these are static (non-variable) fontsource
 * builds, and resvg picks by the `font-weight` on the element.
 */
const FACES = [
  { pkg: "@fontsource/archivo", file: "archivo-latin-400-normal.woff", out: "Archivo-400.ttf" },
  { pkg: "@fontsource/archivo", file: "archivo-latin-600-normal.woff", out: "Archivo-600.ttf" },
  { pkg: "@fontsource/archivo", file: "archivo-latin-700-normal.woff", out: "Archivo-700.ttf" },
  { pkg: "@fontsource/public-sans", file: "public-sans-latin-400-normal.woff", out: "PublicSans-400.ttf" },
  { pkg: "@fontsource/public-sans", file: "public-sans-latin-600-normal.woff", out: "PublicSans-600.ttf" },
  { pkg: "@fontsource/ibm-plex-mono", file: "ibm-plex-mono-latin-400-normal.woff", out: "IBMPlexMono-400.ttf" },
  { pkg: "@fontsource/ibm-plex-mono", file: "ibm-plex-mono-latin-500-normal.woff", out: "IBMPlexMono-500.ttf" },
  { pkg: "@fontsource/ibm-plex-mono", file: "ibm-plex-mono-latin-600-normal.woff", out: "IBMPlexMono-600.ttf" },
];

/** The family names those files declare — what an SVG must name to get them. */
export const FONT_FAMILY = {
  display: "Archivo",
  body: "Public Sans",
  mono: "IBM Plex Mono",
};

/** Resolve a file inside an installed package whose `exports` map hides it. */
function packageFile(pkg, relative) {
  // `import.meta.resolve` honours the exports map, which fontsource's does not
  // open for `files/`, so walk from the package's own manifest instead.
  const manifest = fileURLToPath(import.meta.resolve(`${pkg}/package.json`));
  return join(dirname(manifest), "files", relative);
}

let cached = null;

/**
 * Ensure every brand face exists as an SFNT under `assets/fonts/` and return
 * the absolute paths, for `Resvg`'s `font.fontFiles`.
 * @returns {string[]}
 */
export function brandFontFiles() {
  if (cached) return cached;
  mkdirSync(CACHE, { recursive: true });
  const paths = FACES.map(({ pkg, file, out }) => {
    const target = join(CACHE, out);
    if (!existsSync(target)) {
      const source = packageFile(pkg, file);
      if (!existsSync(source)) {
        throw new Error(`Missing ${source} — run \`npm install\` to restore ${pkg}.`);
      }
      writeFileSync(target, woffToSfnt(readFileSync(source)));
    }
    return target;
  });
  cached = paths;
  return paths;
}

/* ── Glyph coverage ───────────────────────────────────────────────────────────
   These are LATIN SUBSETS, so a character can be perfectly ordinary and still
   be missing: `→` is absent from IBM Plex Mono's latin subset and rasterizes as
   a tofu box, which on a social card is a shipped defect that no exception ever
   announces. Rather than trust a reading of the finished PNG, we read the
   font's own `cmap` and refuse to emit text it cannot set. ─────────────────── */

/** The offsets of every table in an SFNT, by four-character tag. */
function tableDirectory(sfnt) {
  const numTables = sfnt.readUInt16BE(4);
  const at = new Map();
  for (let i = 0; i < numTables; i++) {
    const d = 12 + i * 16;
    at.set(sfnt.toString("latin1", d, d + 4), sfnt.readUInt32BE(d + 8));
  }
  return at;
}

/** Parse a face's `cmap` into codepoint → glyph id. */
function cmapMap(sfnt) {
  const cmapOffset = tableDirectory(sfnt).get("cmap") ?? -1;
  if (cmapOffset < 0) throw new Error("Font has no cmap table.");

  // Prefer a full Unicode subtable, then the BMP one.
  const records = sfnt.readUInt16BE(cmapOffset + 2);
  let best = -1;
  let bestRank = -1;
  for (let i = 0; i < records; i++) {
    const r = cmapOffset + 4 + i * 8;
    const platform = sfnt.readUInt16BE(r);
    const encoding = sfnt.readUInt16BE(r + 2);
    const sub = cmapOffset + sfnt.readUInt32BE(r + 4);
    const rank =
      platform === 3 && encoding === 10 ? 3 : platform === 3 && encoding === 1 ? 2 : platform === 0 ? 1 : 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = sub;
    }
  }
  if (best < 0) throw new Error("Font cmap has no usable subtable.");

  const covered = new Map();
  const format = sfnt.readUInt16BE(best);
  if (format === 4) {
    const segCount = sfnt.readUInt16BE(best + 6) / 2;
    const ends = best + 14;
    const starts = ends + segCount * 2 + 2;
    const deltas = starts + segCount * 2;
    const ranges = deltas + segCount * 2;
    for (let s = 0; s < segCount; s++) {
      const end = sfnt.readUInt16BE(ends + s * 2);
      const start = sfnt.readUInt16BE(starts + s * 2);
      if (start === 0xffff) continue;
      const delta = sfnt.readInt16BE(deltas + s * 2);
      const rangeOffset = sfnt.readUInt16BE(ranges + s * 2);
      for (let c = start; c <= end && c !== 0x10000; c++) {
        let glyph;
        if (rangeOffset === 0) {
          glyph = (c + delta) & 0xffff;
        } else {
          const at = ranges + s * 2 + rangeOffset + (c - start) * 2;
          if (at + 1 >= sfnt.length) continue;
          glyph = sfnt.readUInt16BE(at);
          if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
        }
        if (glyph !== 0) covered.set(c, glyph);
      }
    }
  } else if (format === 12) {
    const groups = sfnt.readUInt32BE(best + 12);
    for (let g = 0; g < groups; g++) {
      const at = best + 16 + g * 12;
      const start = sfnt.readUInt32BE(at);
      const end = sfnt.readUInt32BE(at + 4);
      const glyph = sfnt.readUInt32BE(at + 8);
      for (let c = start; c <= end; c++) covered.set(c, glyph + (c - start));
    }
  } else {
    throw new Error(`Unsupported cmap format ${format}.`);
  }
  return covered;
}

/**
 * A parsed face: what it can draw, and how wide each glyph is.
 *
 * The widths are why this exists. resvg has no measurement API and the SVG is
 * built as a string, so every line break, right-alignment and collision check
 * on a card is decided here, from the face's own `hmtx` advances — not from a
 * characters-times-a-guess estimate.
 */
function parseFace(file) {
  const sfnt = readFileSync(file);
  const at = tableDirectory(sfnt);
  const head = at.get("head");
  const hhea = at.get("hhea");
  const hmtx = at.get("hmtx");
  if (head === undefined || hhea === undefined || hmtx === undefined) {
    throw new Error(`${file}: missing head/hhea/hmtx.`);
  }
  const unitsPerEm = sfnt.readUInt16BE(head + 18);
  const numberOfHMetrics = sfnt.readUInt16BE(hhea + 34);
  return { sfnt, cmap: cmapMap(sfnt), unitsPerEm, numberOfHMetrics, hmtx };
}

/** "family|weight" → parsed face. */
const faceCache = new Map();

/** Which cached SFNT carries a given family + weight. */
const FACE_FILE = {
  "Archivo|400": "Archivo-400.ttf",
  "Archivo|600": "Archivo-600.ttf",
  "Archivo|700": "Archivo-700.ttf",
  "Public Sans|400": "PublicSans-400.ttf",
  "Public Sans|600": "PublicSans-600.ttf",
  "IBM Plex Mono|400": "IBMPlexMono-400.ttf",
  "IBM Plex Mono|500": "IBMPlexMono-500.ttf",
  "IBM Plex Mono|600": "IBMPlexMono-600.ttf",
};

function face(family, weight = 400) {
  const key = `${family}|${weight}`;
  const cachedFace = faceCache.get(key);
  if (cachedFace) return cachedFace;
  const file = FACE_FILE[key];
  if (!file) throw new Error(`No brand face for ${family} ${weight}. Known: ${Object.keys(FACE_FILE).join(", ")}`);
  brandFontFiles();
  const parsed = parseFace(join(CACHE, file));
  faceCache.set(key, parsed);
  return parsed;
}

/**
 * Width of `text` when set in `family`/`weight` at `size` px.
 *
 * Sums the face's own advances. Kerning (GPOS) is not applied, so a shaped run
 * is at most a hair narrower than this — which is the safe direction for a
 * layout decision.
 *
 * @param {string} text
 * @param {string} family
 * @param {number} size
 * @param {number} [weight]
 * @returns {number}
 */
export function measureText(text, family, size, weight = 400) {
  const f = face(family, weight);
  let units = 0;
  for (const ch of text) {
    const glyph = f.cmap.get(ch.codePointAt(0)) ?? 0;
    const i = Math.min(glyph, f.numberOfHMetrics - 1);
    units += f.sfnt.readUInt16BE(f.hmtx + i * 4);
  }
  return (units / f.unitsPerEm) * size;
}

/**
 * Throw unless every character of `text` can be drawn by `family`.
 *
 * @param {string} text
 * @param {string} family one of {@link FONT_FAMILY}'s values
 * @param {string} where a human label for the error message
 */
export function assertGlyphs(text, family, where) {
  // All weights of a fontsource face share one subset, so the regular stands
  // for the family.
  const { cmap } = face(family, 400);
  const missing = [...new Set([...text])].filter((ch) => ch !== "\n" && !cmap.has(ch.codePointAt(0)));
  if (missing.length > 0) {
    const shown = missing.map((ch) => `"${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`);
    throw new Error(
      `${where}: ${family} cannot draw ${shown.join(", ")} — it would rasterize as a tofu box. ` +
        `Use an ASCII equivalent, or set that run in a family that covers it.`,
    );
  }
}
