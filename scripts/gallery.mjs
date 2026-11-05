// Regenerates the generated regions of README.md from plans/*/:
//   <!-- grid:start -->…<!-- grid:end -->        the 2x2 cover grid
//   <!-- gallery:start -->…<!-- gallery:end -->  the full gallery, in three sections
// Each gallery entry: thumbnail (plan-annotated.png if present, else plan.png), the plan README's
// first heading as the title, links to story/source, and the playground link taken from the plan
// README (keep those fresh with `npm run links`).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const NOTICE =
  "These are original fan-art and illustrative drawings based on publicly available information, " +
  "made for demonstration and educational purposes. They are approximations, not measured surveys. " +
  "This project is not affiliated with, endorsed by, or sponsored by any rights holder, and uses no " +
  "official logos or trademarks.";

// Public-domain and real public buildings first, then original plans, then fan studies.
const SECTIONS = [
  { title: "Real buildings", slugs: ["villa-rotonda", "west-wing"] },
  { title: "Original plans", slugs: ["railroad-apartment", "tweet-house"] },
  {
    title: "Fan studies",
    notice: NOTICE,
    slugs: [
      "dust2",
      "skeld",
      "bag-end",
      "friends-apartments",
      "evergreen-terrace",
      "dunder-mifflin",
      "mccallister-house",
    ],
  },
];
// The 2x2 grid: real buildings and original plans only; fan studies are never the front door.
const GRID = ["villa-rotonda", "west-wing", "railroad-apartment", "tweet-house"];

const onDisk = new Set(
  readdirSync(join(ROOT, "plans"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);
const listed = SECTIONS.flatMap((s) => s.slugs);
for (const slug of listed) if (!onDisk.has(slug)) throw new Error(`gallery lists ${slug}, which is not in plans/`);
for (const slug of onDisk) if (!listed.includes(slug)) throw new Error(`plans/${slug} is on disk but in no gallery section`);

const planDir = (slug) => join(ROOT, "plans", slug);
const title = (slug) => {
  const readme = readFileSync(join(planDir(slug), "README.md"), "utf8");
  return (readme.match(/^#\s+(.+)$/m) ?? [, slug])[1].trim();
};
const shortName = (slug) => {
  const social = join(planDir(slug), "social.json");
  return existsSync(social) ? JSON.parse(readFileSync(social, "utf8")).title : title(slug);
};

function entry(slug) {
  const dir = planDir(slug);
  const readme = readFileSync(join(dir, "README.md"), "utf8");
  const t = title(slug);
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
  return `#### ${t}\n\n[<img src="${img}" alt="${t}" width="820">](plans/${slug}/README.md)\n\n${links}\n`;
}

const gallery = SECTIONS.map(
  (s) => `### ${s.title}\n\n${s.notice ? `> ${s.notice}\n\n` : ""}${s.slugs.map(entry).join("\n")}`,
).join("\n");

const cell = (slug) =>
  `<td align="center" width="50%"><a href="plans/${slug}/README.md"><img src="plans/${slug}/cover.png" alt="${shortName(slug)}" width="100%"></a><br><sub>${shortName(slug)}</sub></td>`;
const grid =
  "<table>\n" +
  [GRID.slice(0, 2), GRID.slice(2, 4)].map((row) => `<tr>${row.map(cell).join("")}</tr>`).join("\n") +
  "\n</table>";

function replaceRegion(md, name, body) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const s = md.indexOf(start);
  const e = md.indexOf(end);
  if (s < 0 || e < s) throw new Error(`README.md is missing the ${name} markers`);
  return md.slice(0, s + start.length) + "\n\n" + body + "\n" + md.slice(e);
}

const readmePath = join(ROOT, "README.md");
let md = readFileSync(readmePath, "utf8");
md = replaceRegion(md, "grid", grid);
md = replaceRegion(md, "gallery", gallery);
writeFileSync(readmePath, md);
console.log(`gallery: ${listed.length} plans in ${SECTIONS.length} sections, ${GRID.length} in the grid`);
