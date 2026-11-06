// Regenerates the generated regions of README.md from plans/*/:
//   <!-- grid:start -->…<!-- grid:end -->        the 2x2 cover grid
//   <!-- three-d:start -->…<!-- three-d:end -->  the 3D line and its limits line (PS-D12), after the grid
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

// The 3D preview is always shown beside its plan, from the same source (archlang public-surfaces
// PS-D12): the line and the limits line below are that ruling's wording. Pictures come from
// `npm run preview3d`; never hand-edit them.
const THREE_D =
  "**Same source, plan and 3D preview.** The 3D preview is extruded from the same `.arch` file by the " +
  "separate archlang-3d package, and checked against the plan. You can also download it as a validated GLB. " +
  "[More at archlang.uk/3d](https://archlang.uk/3d)\n\n" +
  "<sub>3D preview: walls, openings, floors, stairs and furniture in flat colours; no pitched roofs yet, " +
  "and no sections, elevations or BIM.</sub>";

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
  const has3d = existsSync(join(dir, "plan-3d.poster.webp"));
  const pics = has3d
    ? `<table>
<tr><td align="center" width="50%"><a href="plans/${slug}/README.md"><img src="${img}" alt="${t}, plan" width="100%"></a><br><sub>Plan</sub></td>` +
      `<td align="center" width="50%"><a href="plans/${slug}/README.md"><img src="plans/${slug}/plan-3d.poster.webp" alt="${t}, 3D preview of the same source" width="100%"></a><br><sub>3D preview, same source</sub></td></tr>
</table>`
    : `[<img src="${img}" alt="${t}" width="820">](plans/${slug}/README.md)`;
  const links = [
    `[story](plans/${slug}/README.md)`,
    `[source](plans/${slug}/plan.arch)`,
    url ? `[open in playground](${url})` : null,
    has3d && existsSync(join(dir, "plan-3d.replay.mp4")) ? `[3D replay](plans/${slug}/plan-3d.replay.mp4)` : null,
    has3d ? `[GLB](plans/${slug}/plan.glb)` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `#### ${t}

${pics}

${links}
`;
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
md = replaceRegion(md, "three-d", THREE_D);
md = replaceRegion(md, "gallery", gallery);
writeFileSync(readmePath, md);
console.log(`gallery: ${listed.length} plans in ${SECTIONS.length} sections, ${GRID.length} in the grid`);
