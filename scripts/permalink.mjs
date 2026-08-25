#!/usr/bin/env node
/**
 * Print the playground share URL for a plan.
 *
 *   node scripts/permalink.mjs <slug>          # → https://playground.archlang.uk/#z=…
 *   node scripts/permalink.mjs --embed <slug>  # → the chrome-less embed viewer
 *   node scripts/permalink.mjs --decode <url>  # → the source back out of a link
 *
 * The codec is ArchLang's own, replicated here (this repo never imports from the
 * compiler checkout):
 *
 *   #z=<base64url(deflate-raw(utf8(source)))>
 *
 * The playground decodes it with the browser's `DecompressionStream("deflate-raw")`;
 * Node's `zlib.deflateRawSync` emits exactly that stream format, so a link minted
 * here opens in the browser. Deflate does not have to be byte-identical across
 * implementations for this to hold — only the DECODED bytes matter — so the proof
 * that counts is the round-trip, which every run performs before printing (encode,
 * inflate back, byte-compare; a mismatch aborts rather than emitting a dead link).
 *
 * The older `#src=<base64url(utf8)>` form is still read by the playground forever,
 * but is never minted here.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");

const PLAYGROUND = "https://playground.archlang.uk/";
const EMBED = "https://playground.archlang.uk/embed.html";

const bytesToB64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const b64urlToBytes = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** source → `#z=…` hash fragment. */
export function encodeSrc(source) {
  return `#z=${bytesToB64url(deflateRawSync(Buffer.from(source, "utf8")))}`;
}

/** `#z=…` (or legacy `#src=…`) → source, or null. The exact inverse of encodeSrc. */
export function srcFromHash(hash) {
  const z = hash.match(/[#&]z=([^&]*)/);
  if (z) {
    try {
      return inflateRawSync(b64urlToBytes(z[1])).toString("utf8");
    } catch {
      return null;
    }
  }
  const m = hash.match(/[#&]src=([^&]*)/);
  if (!m) return null;
  try {
    return b64urlToBytes(m[1]).toString("utf8");
  } catch {
    return null;
  }
}

function main(args) {
  if (args[0] === "--decode") {
    const decoded = srcFromHash(args[1] ?? "");
    if (decoded === null) {
      console.error("Could not decode that link.");
      process.exit(1);
    }
    process.stdout.write(decoded);
    return;
  }

  const embed = args[0] === "--embed";
  const slug = embed ? args[1] : args[0];

  if (!slug) {
    console.error("usage: node scripts/permalink.mjs [--embed] <slug>");
    console.error("       node scripts/permalink.mjs --decode <url>");
    process.exit(1);
  }

  const src = join(PLANS, slug, "plan.arch");
  if (!existsSync(src)) {
    console.error(`No such plan: ${src}`);
    process.exit(1);
  }

  const source = readFileSync(src, "utf8");
  const hash = encodeSrc(source);

  // Round-trip proof: a link we cannot decode ourselves is a link nobody can open.
  if (srcFromHash(hash) !== source) {
    console.error("Round-trip FAILED: the hash does not decode back to the source. Refusing to print a dead link.");
    process.exit(1);
  }

  console.log(`${embed ? EMBED : PLAYGROUND}${hash}`);
}

// Only run the CLI when invoked directly — the two codec functions above stay
// importable, so anything exercising them does not also print a URL.
if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
