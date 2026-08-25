# We compiled The Skeld, and the impostor's map stopped being a matter of opinion

![The Skeld as a deck plan](plan.png)

Every drawing in this repo is compiled, not drawn. So we typed out the most-argued-about map in
party-game history as if it were a building — 90 × 40 m, walls with real thicknesses, sliding
doors, a room schedule, a title block — and then asked the compiler the question the drawing
exists to answer:

```bash
npx arch describe plans/skeld/plan.arch --json
```

`describe` reports rooms, areas, what borders what, and what the doors actually connect. Which
means the crew's movement graph is no longer a thing you argue about in chat at 2 a.m. It is a
JSON object, and you can read it.

## The Cafeteria touches nothing but hallways

Verbatim from `describe.json`, the `input_graph` block — the room-to-room graph the compiler
derives from the doors it can see:

```json
"r_cafeteria": [
  "r_upper_hall",
  "r_caf_hall",
  "r_admin_hall",
  "r_weap_hall"
]
```

Four ways out of the Cafeteria, and every single one of them is a corridor. There is no room on
this ship you can step into directly from the meeting table. Whatever you do next, you do it in a
hallway first, where somebody may be standing.

The stern is the same shape. `r_east_hall` and `r_south_hall` carry five connections each — the
two busiest spaces on the ship are both corridors, and between them they are the only way to reach
Navigation, O2, Shields and Communications at all.

## Half the named rooms are pockets

Counting the entries above: of the fourteen rooms with names on the map, **seven have exactly one
neighbour** — Reactor, Security, MedBay, Electrical, O2, Navigation and Communications. One way
in. The same way out.

Reactor is the purest case:

```json
"r_reactor": [
  "r_reactor_hall"
],
"r_reactor_hall": [
  "r_reactor",
  "r_upper_eng",
  "r_lower_eng",
  "r_security"
]
```

Two doorways lead out of Reactor and both of them open into the same corridor, which is itself
reachable only through the two engine rooms. Reactor is a pocket at the end of a pocket. Getting
cornered down there is not bad luck; it is a graph property.

Navigation and O2 read as two-door rooms on the drawing and as one-neighbour rooms in the data,
for the same reason: both of their doors open onto East Hall. The compiler is counting who you can
be seen by, not how many holes are in the wall.

## Adjacent is not connected, and the compiler keeps them apart

This is the single most useful thing the semantic output does, and Electrical is the example.
From `describe --json --room r_electrical`:

```json
"id": "r_electrical",
"label": "Electrical",
"area_m2": 126,
"adjacent": [
  "r_lower_hall",
  "r_storage"
]
```

Electrical shares 8 m of wall with Storage. `adjacent` says so. And the door graph above lists
Electrical's only neighbour as `r_lower_hall`. Both facts are true and they are different facts:
that shared wall is a bulkhead with nothing in it, so the two rooms touch and do not connect. You
walk round through the lower hallway or you do not get there.

Reactor does it too — it is `adjacent` to `r_lower_eng` and connects only to `r_reactor_hall`.

## Making the compiler reject a route you wish existed

`arch validate --graph` takes a room graph you *believe* is true and checks it against the
interior doors the plan actually has. So we wrote down the Skeld's connections in
`intended-graph.json`, and told two lies in it:

```json
"Cafeteria": ["Upper Hall", "Cafeteria Hall", "Admin Hall", "Weapons Hall", "Electrical"],
"Electrical": ["Lower Hall", "Storage"],
```

The first is the shortcut everybody instinctively wants when the lights go out. The second is the
one the drawing tempts you into, because those two rooms are touching. We also quietly *dropped* a
real connection, Shields ↔ East Hall, to see whether it would be missed.

All three come back. Verbatim from `graph-check.txt`:

```text
  graph: missing connection r_cafeteria — r_electrical
  graph: missing connection r_electrical — r_storage
  graph: unexpected connection r_east_hall — r_shields
✗ 1 warning, graph mismatch

exit code: 2
```

Exit code 2 — this is a gate, not a comment. You cannot get from the Cafeteria to Electrical
without being seen in a corridor, and the compiler will fail a build over it. It also found the
door we forgot: Shields has *two* ways in, from East Hall and from South Hall, which is why
holding it is harder than it looks.

## And now the joke

There are twelve vents on this drawing. Here is what they are, in the source:

```arch
furniture id=v_medbay    vent at (38000,14000) size 1200x1200 label "Vent" in r_medbay
```

They are furniture. Twelve labelled squares. The compiler draws them, assigns each to a room, and
checks none of them is buried in a wall or parked in a doorway — and has **no idea whatsoever that
they are connected to each other**, because nothing in the plan says they are. `vent` is not a
fixture ArchLang knows, so it gets the fallback labelled rectangle and no entry in the sheet's
legend, which lists only the two wall hatches.

That is not a limitation we are apologising for. It is the point. `describe` gives you the crew's
map: the rooms, the doors, the corridors you have to be seen walking down. The vent network is
precisely the graph that is *not* in the building, and every disagreement between the two graphs
is a place where someone can be somewhere they should not be able to be.

Take MedBay and Electrical. One vent. On the crew's graph, computed by breadth-first search over
the `input_graph` above:

```text
6 doorways | MedBay -> Upper Hall -> Upper Engine -> Reactor Hall -> Lower Engine -> Lower Hall -> Electrical
```

Six doorways and five rooms crossed, out to the bow and back — or one move. Security to Electrical
is four doorways, or one move. Weapons to Shields is the entire length of the stern, or one move.

The impostor's graph and the crew's graph disagree. `describe` gives you the crew's, exactly and
only, and that is what makes the difference measurable.

## What the linter said

One warning, verbatim from `lint.txt`:

> `warning[W_NO_ENTRANCE]: The plan has no exterior door or opening — there is no way into the building.`

The ship has no front door. There is no airlock on the map, because nobody has ever needed to
arrive: the crew begins every round already inside. As an architectural fact it outranks
everything else on the sheet — the building fails at the first question a plan is asked.

`arch suggest` then offers to fix it, and its top-ranked answer is the best thing in this
directory:

```text
W_NO_ENTRANCE: The building has no entrance — no exterior door or opening lets anyone in.
  door on w_void_mid at 61.667% width 900
    → A door on exterior wall "w_void_mid" opens "Lower Hall" to the outside as the building's entrance.
```

`w_void_mid` is the wall around the sealed plant cavity in the middle of the ship — one of the
black gaps between rooms on the map, drawn here as a walled void. The rule's definition of
"exterior" is "declared `exterior`, and not between two rooms", and by that definition a sealed
cavity is the outdoors. It is right by its own lights and useless by ours, which is a fair
description of a 900 mm front door on a spacecraft.

## By the numbers

Every figure below is from `describe.json`.

| Measure | Value |
| --- | --- |
| Rooms | 22 (14 named, 8 corridors) |
| Floor area | 2,546 m² |
| Largest room | Cafeteria, 360 m² |
| Sliding doors | 21 |
| Cased openings (no leaf) | 7 |
| Windows | **3** |
| Exterior entrances | 0 |
| Vents drawn | 12 |
| Named rooms with one neighbour | 7 of 14 |

Three windows, in 2,546 m². Two are the angled cockpit viewports in Navigation and the third is
over the gun console in Weapons — the only two rooms on the ship where the job is looking outside.
Everywhere else, including the room where you eat, is interior space with no daylight.

The zones roll up as `bow` 604 m² (5 rooms), `midship` 1,211 m² (9 rooms) and `stern` 731 m²
(8 rooms), and the room schedule on the sheet subtotals by the same three groups. `zone` draws
nothing; it only groups.

## Honesty notes

Everything quoted above is real output, captured in `describe.json`, `lint.txt`, `lint.json` and
`graph-check.txt`. Nothing was edited, and no fault was planted to produce a warning — the missing
entrance is what the map's exterior actually is. The two false edges in `intended-graph.json` were
planted on purpose and are the whole point of that file; it is a claim about the ship, not part of
the ship.

The one number in this page that is not printed by a CLI is the six-doorway walk, which is a
breadth-first search over the `input_graph` block quoted above. The command that reproduces it is
in the next section.

The layout is the canonical map redrawn at plausible ship dimensions. Corridors are modelled as
rooms, because a corridor you can be seen in is a place and not a gap, and the access graph is
only honest if it says so. Doors an impostor can seal are `door sliding`; the thresholds nobody
can close are leaf-less `opening`s, which still count as connections. The angled bow and the
pointed cockpit are `room polygon`; everything else is rectangles.

**Fan art — an original drawing of a game map's layout; not affiliated with Innersloth.**

## Reproduce

From the repo root:

```bash
npm install

npx arch compile  plans/skeld/plan.arch --json     # exit 0, zero errors
npx arch lint     plans/skeld/plan.arch            # the one warning above
npx arch suggest  plans/skeld/plan.arch            # where it thinks the front door goes
npx arch describe plans/skeld/plan.arch --json     # rooms, areas, adjacency, doors, zones

# the room-to-room graph on its own, without the floor polygons
npx arch describe plans/skeld/plan.arch --json --select input_graph

# the gate: a claimed graph, checked against the doors that exist. exits 2.
npx arch validate plans/skeld/plan.arch --graph plans/skeld/intended-graph.json

node scripts/render.mjs    skeld                   # → plan.svg + plan.png
node scripts/permalink.mjs skeld                   # → the playground link below
```

`describe.json`, `lint.txt`, `lint.json` and `graph-check.txt` in this directory are the captured
output of those commands.

The six-doorway walk, and any other pair you want:

```bash
node -e '
const d=JSON.parse(require("fs").readFileSync("plans/skeld/describe.json","utf8"));
const g=d.input_graph, label=id=>d.rooms.find(r=>r.id===id).label;
const a="r_medbay", b="r_electrical";
const prev={[a]:null}, q=[a];
while(q.length){const c=q.shift(); if(c===b) break;
  for(const n of g[c]||[]) if(!(n in prev)){prev[n]=c; q.push(n);}}
const p=[]; for(let c=b;c!==null;c=prev[c]) p.unshift(c);
console.log((p.length-1)+" doorways | "+p.map(label).join(" -> "));'
```

## Open it

Edit the source live in the playground, vents and all:

<https://playground.archlang.uk/#z=tVzrbhs5lv6vpzhwsEgakA1ZF996eoAkne4JkMSD2N0D7GJhU1WUinGJrCFZkjWDBuYh9l32_z7KPsngHLKqyKqSrHQ7_pGYUvEjeXiuH1l-AbcZh5sHnqdDSDXbSGAGGJhMFMBkChmTKU_BKmCQqFUhcq5PBi8GL6hjwqSSImE5vF4puYRfDKxYMQTDLajSArPAoMhZacQ853A5gkeYjmBF0FZzZnlKA8rBC1A6FZLpLRghlzk_NlZpvgVjdZnYUvMr-MxZYpVGWJtxmKsNvMr5wn43hE9sLZbMCiX9t4MXUCghcQBjuZbwSotlho9iV7tRwOVSSA6SJTzPuQGrimNEo8nNlbVqRe2hmy1BvmULbrkWDBYiz4VcOjRVgFrASqQot0Y8NAH8Bh9C6WIHYUAqG350Au8tfrzJmIUFy3NDwlMLEPZq8ALumU4ySLlJtJhzOD7-YpS8B80Lpa0BvuZ6C1qp1RCENcA0Z0MHJgiXpV9YwqWlXZTp4EX1pYFUKW2AJbZkeb6FREnJEwv__6__AaNojonmm5cGVmrNV4ix1KzIwFhVGJhzXBAbvACb4W9bVQLTy5IDm-MKhIQERyKB8kStOOpW82zCJPy95HpbiUxzDinPxZxrZjmsVMqdlJNMiYSbIXCWZCiZTSaSjCbIJMu3RhhsSEh5wWVqQMkrwgT4v_-lvfArlSBWhULVotENZzkKDO7xezC5SIVc3p9QF5tpbjKVp7hjc5VusQthAiS5Mpzk5JXypSGlWqnSZmYIr9OVkC-N07ZEaS1SpeFLKRPUUUM9cdycs8Vxzo3xuPeq4BKnYE7gjbIZJKqUFm3E7w31FtItPUm4MW5Lvgcl8y0oyb3CrTwiKgCt_qQSx1s_HVIV-Hx9_fFmSDq5ZIXBpbNGHVfsgZNo_cZnSnJjr2j7UuWHwL4blj_AQqtVYCNWwY1Vmi35kDr0PSMk-ZaM5fmGbT2gxaGNWnGSOs8NhxXbwpyDsUymZEbyJNzeX999ur2h9SxKLQX6ixO43fB8zSFnc7TwFMzfS6ZRi1AhpXKKuFL0aMZhzaWtVsTtRukHFAN_ZInNt87Qs8rkvU0lWy-XVHFn14mSlgk59BoqTL0kDptM5Ry-qAd-BfeVPd_DUqy5IQGFBod-VKJt06eV1r40zlZ-YhKYtifwWoLSYikky2sXoxbAYMlWKLXipYGcbVVpv6f5scVC5IIc70bYDN5LybXJlc1OBkXOJBzVEeEI_jkAKCU6itVqALDUIoXT0WgAULCCa3g9hpzJ1CSs4AMAk7Ccw-nVmB6RStsMymIAkIqVAVZaBWrNNctzejjjaZlz8lxmAJDzJZfpAFCtb4XNeTAVspeUJw8YTeSRe-hHlCAcva4CBn1vCpZwCl_45BBjznxLQYdbzc1JXxBRzpycs-9EklYc8Q9TNBlWQYTW8EQEYZAzveSB7rNEK2P6QsjRYADwAn54rh9C-8svHz6QIHFA_ohzUBq4XPNcFXyIXmWhSg26lOaZhye4Wyfuq8BlMtw4tEXDTwaADiIHkf6wucvKPL_DvannaTORPEj0d7PRCFaMRJijvSWaW066CvDqfDQaDccXo9HoO3g1psYsbIxcgx47xX-_GwD85ib4Rm3QZ7l9Zrlqwns4Z63Uwvn1Xwo0gndRHkHfEJop8GNUeP_gX3B1qAm1BjiYv3FWoFen7zVHnz6sPuyRivx9MnGLhVenZz2tqWtddhoTLyGAV2fj-oOqMWuE2Wr4xy7GncbpLBY6agVJ_CowvZemtrpEJQ-FsH2CYOuvFkU4B3h1cR62LiMN8a1p-OT4MlyJazUruSG9mbPkAbUIlbfRIecNruAmEzxPzRDeqtWqxNyZIvqwDpSE9C7nidWYWDsN-aA2HUXrEYj5neKIlzWphDPttqZ-K897WpNZoyvnEZJrTSPViVvVk2ejbms6bnCn0-aTuuWRJqNua-K3bzzutkLcyxD2MnQhgT9pdvr5HCOivf90--7zp9cf4Nfr9z_euOSbM_SLGMKsD2kw53bDuY8-GG9O4Nq1VqzA_43zO5gEkcrlqImY01XJdp2n2Uyrcpl9Dxl3D2-pF6oTWhxbCyu4cbpY5TGwybZYFKxKl4HbTBiqE18aOKr07sip5IImLOSG6fTkm4USsaziJayVSIew0awoMAH6yNM3bItVyJqTx73hSamF3aJfwfzalDmDOc_VJjYjxLlbifSrDcmplLej8XmnQX4WVXbUbfkHpw2EV3ZnnKf-64ue1kWo0K1WYI7OGKpA6Fqn0dO-RWVN7JtRJDDnmXBFcBO8fMVjsOKp8nfTI06GpdBXC3Q2DZc7O-tpnYcepNUKxOi8SOXjfMsv3o_y1OIbwwtCdxW2Ub-uxz0L33BWfPW63fxPT8Ng2mpVXvespxVs-lnwSdWqJHgWqtaudXNmiIWgWnbXxt7xr09HIr0-P-tpXYaBw7da03w-j4Jof339-fb97fvrT87_Ok6lKaYNb-roDdsC1g8wL_OHjLO0IYgQKRWLBddcJjxSHDQVR1IAl1bouHr_Bk6y2qziTvuKx_0UTFtB5U2zXZPRCP7Znxp62_gtQiy5XEL98zRiFHd9K0bMvw6x1_HFiIYncBBi5AAj59mz6rsSPd1BiJMQ8LIHb8XTOdseMsMwnoQxI8ZL2OJuc8iKp-H8pjvnh3hJtdy9eFFoijx3CxHR7oxXxqcR-7x0d47skDnOdvu_GJHQfNDaixhhxFGohUh-0vhZPo3Y5_xaum2VrgH3IvbEvkmfbidqtTKH6E6cr0d5fmuObq-p3tmLeB7VGS4A7EHkT8uxFUR2I_KD5xhixHVSjKjGgdN5GvE0WnWvPm58mnEoYlxsT3oQsW4-aI6tYnm3PqIVSn6IPoa0QZTqtKbodoYyqP2L7lIPvYAYX-7yg313HF8mfRGL52GA2YMYV6KuZu1FzA_2jqE_bCPWORxmHFWKYhzZKxVg9uLLvyGyEll1XOAO864C7gFMhnQ5AV7Aio5dcLIE5fkKSn2wvDRW5DlkbI18masytSopL6LBHMOKPAbh-XrBpU4VJYvUCR7dWNVlPar50zkNninl-UlnP2rhPS29eD986f9bX97kc5M9iBFhsCdtUuM6rjxhJnFOHAerb5D9-jOgpVZlwVNYKM2PrTpmC3sC9_9Qkt_T2YKpD00wRxbWdXBJbUXnOwpCpv5U475zbMkcovmv_74HrfL8uCy-QfaLQxAFd4SkLk7X6RHXQi6PfCWCLArujK5T5ELl26WSB1CmPfzQbr554HacDqLgyKv7EZSGGyityIXdtiZUImN8R4rHbMjFAoAR_-BAnv2RfF2FG9LRe8HJDFvgfgkR-DQAD41xL3hlNeRrET6qAQj-rINeeQCkwD16InRS5kSPtkYwnswBN_0ofyd8_PURN6aReUUAeXC1WIikLiZJWSoq6eij-6WrJG5P6nWFWb4blzb78YwGjvbkoGUF5QDBB0l_uCvnIbwjuo5aSEl9wkRI0x0TJZFVSDWx4eeZCjyG7gLf-RhKwGHe3-xsLPnmuOsgKbhkuRZylLY3Q5xFQxBB8RXwUAs5yuGdkEk0F6GQCb6tOF17ainGOFBI-iRWDGdPB82ZNxEZ4aN8ws0Zf3-8DOGbKL7XWI2P4tWGTtszP-3aqo_8HtcjRKbkDtCO6Dyka0aY1HktarZgFmjnRXeHwyOyJ-UVZMw4QHgg5RdF20E73RqgbUlBOk9zDZP2QF2inb0et1GQSAtWHCXqjU6TkjQbiOTbQcvFdL6OW9_kfCuIXc0RXXuRxAM3RhBVnoEqRaK6Ie74oFUGBWqjNZPOTkSGG5-xdSbsjuJqNZkegOiP746-FQ354_X1Z8dA3ld3kWBTHdIEl0DAsLmyaLkrLsvmKpOw7tCmvkbkewvrz3--yWnMG7Vp7lVkLLwJ1WTz9SUod_mGbj7hZQoubIZ3CgH8nHF3VJ1G0IWLhsNkFsaz_4CNSG0GqLy7-plOv_N2PyolRPpDWvOZXuaua0ByMguzUd171Oqd9_XOD-1d8ZRR74C8jHpjyHYy_1hdNmyv4473rMPTlvtnUiUgUe84K5ns7l2xj1HvgJKMx27vAD5o-nontd_c09s4TWn1bsrpA8ZuSy0gFvt6RzrnchZcJ3WNGMS483hXZ1N3DsnCWOLjHr3r7HZAdOzf7Yq_iHoHpAazcDHbrbUo8U177H0Sb65IDJsLVMd4vxhypVqKjNLnfergWaYnt8TnAHcb1zXik_q2pBm6yh6ioeOUYo9U1fhOdqQaZxGN_yJrbvU2T_Q-391bsjUNHvUOyD4ce7S3d8cC494X7d6RyD2ZWilyxNY-Yb4UVe9kSxdDcrZP6tHoHmMTjd7XubPwKrOIdS1KN_a5bzSEthEG_PwOQ3i-CIxoP394_Z_vP_1cX-6jq8AYhN29REcxudsaPiFgckt3a3OlHui6-XMnBoj2lkureVpdmcQJ-Qt__lKXvyiCPkDJ6kD9pb85irzZCdwrCX_CX__smCULfyqU-fM9UYwmuFarSznE-yl0Q7xQxlFr_sh1JdLoMr7hS7zNTpDC0k0QucQLnO5iNmyETPEyIN5D1kxCgdk4vgGhJdewUWWOLFmeeo7TX09znfCAXEhvjUpCcFst8udTp0rdXqbb63x_L-fXgl5t_41Z97dQvJ_e3x5f_3L7LZLKmje4crdSLZvjWxqsYpU5Hc_PS2tJvfDCOL2U4K5HlZIuHtWXwVFSizs7z-_kxkG5gpdKsfOgNiSOZRJUhrf48BFejg2IlR3QPICezZ4T2nRnHZahfwi6O-vngPY74_8j7NPgeKbmoR7HAfa7FddLulb_hvp1hvFZBHEOV5DgayKmvn9RXUcj97coed6jAtTl1PUMhDkZ7ZnVW3zYT6XhO_qAxyHw5TMCT7oznjwL8DQAnj2nKGZd4Is_Cox7iu9SMPkAoShC4CkCTxvgn0qet3DdjR-6W4makyhpVM5Nn7YojWloUEW-Op81JIobEo3lcdbDZr9VulqSR-iOQMUZVO8ROMKcuI2zYITz9ggVD0_Y9VlBP3rehz4ZNyLbj14fFvRIh1GO5OXnuM8J2XhA-5B00KE0hPCKawZvXa9qazw_3x3EILlB75bgmypuEOKdT0M9neGuB4N85OlNwir_4YrYHh_F01MAmPPUMavjNu7prKVNb3j6NOY4xJzOngVzEmKeP8M8N0JzcwoFk9zzyqcdAmzmaOWaJBXu9IxwG1Z6B_a4gz09fQbsgojzEHvWnrfjrMcN-F-pz4_CWC3mJbGXTw-0LKmSC7X7fNJw1Y1yh27s51K2NNuXjl18NWZ0DIx-yCv2WXhXuD_6Xo_hVvMKXI37cOdtXHeC_AdxfS0YysO9FOAPRgl32hbIJ7ZuCUSydZ-jpXorBD8jYU_O9rkS6hXDE1KPG3GlYLSbLnictwYIPaHje-G11mxbeSpHAXdH8ISPy6U8S02qOZ605BPK3Z1dhTkV4XyLZN29I0k1onsx0r8P6d5-rN7uBsPxjU_3xFw9cvM9lkhI60oFIuWMwOqXBr4oId0b4piPM7whwHXz-iMUmifCcP8GJVVhz19rRluxDshjfKfThT0XmC5mjQcat7zEr1za_eF6HdDLLeRx6Dd_D3JDN9fIY_dGS-vkahfyzjRgHZDRLezJ5WGz3pkErIPT-AYbz4-GYwynB2DvCv3rgHuuoScX7csE-6D7Y9-6dvsBsDskjyLUHuDdcWMdnL434JOv2cidRdU6OL6usd3x5vj8sIk759LBbfjNGvdi1K7W9uHuiHLrgEFskJ3BnB2G3BMu1sHZXYP6VRtYefEBgKV3jd0pdaHVF_wDCPvePAb3hzLu5ls4eq2T7AOTS_851jtH3pGm7p16etadF_42-Dc>
