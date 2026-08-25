// Regenerates the Gallery section of README.md from plans/*/.
// Each row: thumbnail (plan-annotated.png if present, else plan.png),
// the plan README's first heading as the title, links to story/source,
// and the playground permalink extracted from the plan README.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const ORDER = [
  "west-wing",
  "villa-rotonda",
  "miraflores-raid",
  "dust2",
  "skeld",
  "bag-end",
  "friends-apartments",
  "evergreen-terrace",
  "dunder-mifflin",
  "railroad-apartment",
  "tweet-house",
  "mccallister-house",
];

const slugs = readdirSync(join(ROOT, "plans"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

const rows = [];
for (const slug of slugs) {
  const dir = join(ROOT, "plans", slug);
  const readme = readFileSync(join(dir, "README.md"), "utf8");
  const title = (readme.match(/^#\s+(.+)$/m) ?? [, slug])[1].trim();
  const img = existsSync(join(dir, "plan-annotated.png"))
    ? `plans/${slug}/plan-annotated.png`
    : `plans/${slug}/plan.png`;
  const url = (readme.match(/https:\/\/playground\.archlang\.uk\/#z=[A-Za-z0-9_-]+/) ?? [])[0];
  const links = [
    `[story](plans/${slug}/README.md)`,
    `[source](plans/${slug}/plan.arch)`,
    url ? `[open in playground](${url})` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  rows.push(
    `### ${title}\n\n` +
      `[<img src="${img}" alt="${title}" width="820">](plans/${slug}/README.md)\n\n` +
      `${links}\n`,
  );
}

const readmePath = join(ROOT, "README.md");
const md = readFileSync(readmePath, "utf8");
const START = "<!-- gallery:start -->";
const END = "<!-- gallery:end -->";
if (!md.includes(START)) {
  throw new Error("README.md is missing the gallery markers");
}
const next =
  md.slice(0, md.indexOf(START) + START.length) +
  "\n\n" +
  rows.join("\n") +
  "\n" +
  md.slice(md.indexOf(END));
writeFileSync(readmePath, next);
console.log(`gallery: ${rows.length} plans`);
