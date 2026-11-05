#!/usr/bin/env node
/**
 * The README "Try it" doors block, generated from ArchLang's `site-shared/doors.json`.
 *
 *   node scripts/doors.mjs                    # rewrite the block between the markers
 *   node scripts/doors.mjs --check            # exit 1 if the README block or the vendored copy drifted
 *   node scripts/doors.mjs --vendor [path]    # refresh data/doors.json from a doors.json
 *                                             # (default ../archlang/site-shared/doors.json)
 *
 * Source: `../archlang/site-shared/doors.json` when that checkout sits next to this repo, else the
 * vendored copy `data/doors.json`, so the repo builds standalone. Never retype a URL or command
 * here: every string in the block comes from the JSON.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SIBLING = resolve(ROOT, "..", "archlang", "site-shared", "doors.json");
const VENDORED = join(ROOT, "data", "doors.json");
const README = join(ROOT, "README.md");
export const START = "<!-- doors:start -->";
export const END = "<!-- doors:end -->";
export const CANON_START = "<!-- canonical:start -->";
export const CANON_END = "<!-- canonical:end -->";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Pure: doors object -> markdown between (and including) the markers. */
export function renderDoorsBlock(d) {
  const x = d.doors;
  const out = [START, "## Try it", ""];
  for (const key of d.order.readme) {
    switch (key) {
      case "agent":
        out.push(
          "Paste this to your coding agent (fill in the brief):",
          "",
          "```text",
          ...d.agentPrompt,
          "```",
          "",
          `Or add the server once: \`${x.agent.claudeCodeHttp}\``,
          "",
        );
        break;
      case "chatgpt":
        out.push(`- **ChatGPT, ${x.chatgpt.note}:** [${x.chatgpt.label}](${x.chatgpt.url})`);
        break;
      case "claudeai":
        out.push(`- **claude.ai, ${x.claudeai.note.split(";")[0]}:** add \`${x.claudeai.url}\` as a custom connector`);
        break;
      case "vscode":
        out.push(`- **VS Code:** [Marketplace](${x.vscode.marketplace}) or [Open VSX](${x.vscode.openVsx})`);
        break;
      case "playground":
        out.push(`- **${x.playground.label}, ${x.playground.note}:** ${x.playground.url}`);
        break;
      default:
        throw new Error(`doors.json order names an unknown door "${key}"`);
    }
  }
  out.push(END);
  return out.join("\n");
}

/** Pure: text with `block` (which carries its own markers) replacing the one marker pair. */
export function applyBlock(text, block, start, end) {
  const s = text.indexOf(start);
  const e = text.indexOf(end);
  if (s < 0 || e < s) throw new Error(`README.md needs one ${start} ... ${end} pair`);
  if (text.indexOf(start, s + 1) >= 0 || text.indexOf(end, e + 1) >= 0) throw new Error(`more than one ${start} block`);
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  return text.slice(0, s) + block.replace(/\n/g, eol) + text.slice(e + end.length);
}

/** Pure: README text with both generated blocks (canonical line, doors) refreshed. */
export function applyDoors(text, d) {
  const canon = `${CANON_START}\n**${d.canonicalLine}**\n${CANON_END}`;
  return applyBlock(applyBlock(text, canon, CANON_START, CANON_END), renderDoorsBlock(d), START, END);
}

function main(args) {
  if (args[0] === "--vendor") {
    const from = resolve(args[1] ?? SIBLING);
    mkdirSync(dirname(VENDORED), { recursive: true });
    copyFileSync(from, VENDORED);
    console.log(`doors: vendored ${from}`);
    return;
  }
  const source = existsSync(SIBLING) ? SIBLING : VENDORED;
  const doors = read(source);
  const text = readFileSync(README, "utf8");
  const next = applyDoors(text, doors);
  if (args[0] === "--check") {
    let bad = false;
    if (next !== text) {
      console.error("doors: README block differs from doors.json (run `npm run doors`)");
      bad = true;
    }
    if (existsSync(SIBLING) && readFileSync(SIBLING, "utf8") !== readFileSync(VENDORED, "utf8")) {
      console.error("doors: data/doors.json differs from ../archlang/site-shared/doors.json (run `npm run doors -- --vendor`)");
      bad = true;
    }
    if (bad) process.exit(1);
    console.log(`doors: ok (${source === SIBLING ? "sibling checkout" : "vendored copy"})`);
    return;
  }
  writeFileSync(README, next);
  console.log(`doors: block written from ${source === SIBLING ? "sibling checkout" : "vendored copy"}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
