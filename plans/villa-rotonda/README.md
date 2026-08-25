# Villa La Rotonda — the Piano Nobile

**Palladio designed it so that a quarter turn changes nothing. So we wrote one facade and
placed it four times.**

![Villa La Rotonda, piano nobile](plan.png)

Andrea Palladio began the Villa Almerico Capra on its hilltop outside Vicenza in 1567 — a square
block with a domed circular hall at the centre and four identical temple fronts, one on each face.
It has been called La Rotonda ever since, it is a UNESCO World Heritage site, and it is the most
copied house in the world.

It is also the rare building whose *drawing* has a symmetry group. That is the thing worth
compiling.

## The component is a quarter of the building, and it mirrors the idea

The entire villa below the `component` line is written once:

```arch
place quarter() as north at (ORG, 0)
place quarter() as east  at (EXT, ORG)       rotate 90
place quarter() as south at (EXT - ORG, EXT) rotate 180
place quarter() as west  at (0, EXT - ORG)   rotate 270
```

Four statements, four origins that are themselves a pinwheel around the sheet, and the building
is complete. `quarter()` carries **everything**: the flight of steps, the six-column portico and
its two returning columns, the loggia, the axial corridor, the corner *sala* and its *camerino*,
the two flanking chambers, the service stair, this quarter's run of the outer shell, its share of
the interior partitions, all six doors, all six windows — and **ninety degrees of the drum
itself**. Nothing is authored four times. Nothing is authored twice.

The symmetry is therefore not asserted, checked, or eyeballed. It is the only thing that *can*
come out: `place`'s quarter turn is a signed permutation matrix whose entries are all `-1`, `0` or
`1`, so it introduces no trigonometry and no floating point, and the four porticos are congruent
to the millimetre by construction.

You can check that claim rather than take it. Every drawn contour in the SVG — 840 of them across
the floor, wall, door and glazing layers, arcs included — was rotated 90° about the centre of the
block and compared with the original as a multiset. All 840 land on top of something already
drawn. A rotation preserves orientation, so an arc's sweep flag is unchanged by the test: had any
curve been turned the wrong way, the flags would have disagreed.

## Why the quarter is a pinwheel and not a quarter-square

The obvious cut is to slice the square along both centre lines and place the top-left corner four
times. It does not work: it severs the axial corridor down the middle, so every corridor would
have to be authored as two halves in two different instances, with the front door on the seam.

Cut the ring of rooms into four congruent **strips** instead — each running the full width of the
block on one side and stopping short on the other, like the blades of a pinwheel. Four of those
tile the ring exactly, and not one room, wall or door is cut in half.

The consequence is the nicest thing in the file: each strip declares only the walls it owns, and
the four copies **interlock**. The wall closing the north side of the centre band is three
different statements — the west strip's trailing wall, the north strip's band wall, and the east
strip's corner wall — each landing on `y = 19000` after its own rotation. Nothing in the source
says so; the pinwheel does.

The same interlocking closes a circuit of rooms right around the villa. Each quarter cuts one door
through its own trailing wall, and `arch describe --json` reports what that door actually
connects, derived from geometry rather than declared:

```
north.d_ring -> ['north.camera', 'east.camerino']
east.d_ring  -> ['east.camera',  'south.camerino']
south.d_ring -> ['south.camera', 'west.camerino']
west.d_ring  -> ['west.camera',  'north.camerino']
```

## The rotonda

The block is 25 × 25 m centreline to centreline, in bands of 7 | 11 | 7. The middle band is 11 m
square and the hall is inscribed in it, so the drum is **tangent to all four centre-band walls**
and every tangent point is a threshold. That is why each of the four thresholds is cut twice, once
through the straight wall and once through the arc — miss the second cut and the poché of the
other wall still stands in the doorway.

The drum's faces are true SVG arcs at `R ± 300`, so the circle never goes faceted at any zoom, and
the floor is a `room circle` whose area is exact **πR² = 95.03 m²** in closed form rather than
measured off the polygon the analysis grid uses. The four corners the circle leaves inside the
square belong to no room and carry no schedule row: they are the masonry the dome stands on, which
is what they are in Vicenza too.

Splitting the drum among the four quarters is what makes its *segmentation* four-fold as well as
its shape. Four walls each symmetric about their own tangent point would need split points at 45°,
and 5500/√2 is not a number any grid can hold; snap it and the drum stops being one circle. Split
on the 3-4-5 triple `(3300, 4400)` instead — exactly on R, exactly on the grid — and let `place`
supply the symmetry.

## Two elements this plan deliberately does not use

The columns are round wall stubs and the steps are drawn as their own tread lines, rather than
ArchLang's `column` and `stair` elements. Both substitutions are there for the same reason, and
both are worth knowing about if you write components of your own: **only walls, rooms and openings
survive a quarter turn exactly.**

- A `column`'s `at` is documented as its top-left corner, but the instance transform treats it as a
  centre, so a placed column shifts by its own width on a quarter turn. With `column` the east and
  south colonnades sat 800 mm off their own axis — visible, and fatal to the one claim this drawing
  makes.
- A `stair`'s `dir` is a *handed* rule — it says which end of the flight you step onto — and the
  transform carries it through unrotated, so all four flights drew their arrow the same way on the
  page instead of turning with their quarter.

The wall stubs are no loss. A closed run of two arcs is a circle on the wall's **centreline**, and
its faces land at that radius plus and minus half the thickness — so a centreline of `COL_R / 2`
carrying a thickness of `COL_R` has its outer face at `COL_R` and its inner face at nothing at
all. The annulus closes into a solid disc. That is how you get a round column out of a language
with no circle primitive, filled with the same poché a plan-cut column should carry anyway.

## How accurate is this?

An **original illustration of a documented building, not a survey**. The parti is Palladio's and
so is every relationship: square block, central rotonda, four porticos on the axes, corner rooms
with small chambers behind them, narrow corridors from each portico to the hall.

Everything dimensional is idealised to whole millimetres a builder could set out with a tape. The
real block is nearer 26.4 m than 25; the hall is drawn at φ11000 where the real one is smaller;
the four service stairs are one per quarter, where the building has two, and they spiral. Palladio
himself did not draw it perfectly symmetrical either — the four porticos differ in their approach
and only three keep their original stairs.

The largest liberty is one a plan drawn square to the page cannot avoid: **the real villa is
turned 45° on its hill**, deliberately, so that every facade takes sun at some point in the day.
Here north is up and the porticos face the cardinal points.

## By the numbers

25 rooms, 819.03 m² in total, on an A1 portrait sheet at 1:100. Each `place` is implicitly a zone,
so `describe --json --select zones` groups the rooms by instance and reports four subtotals of
**181.00 m²** each — an identity computed from the drawing rather than typed in. (Only an explicit
`zone` block draws its subtotals into the room schedule on the sheet; the table here is a flat 25
rows and a total, and the quadrant arithmetic is a read rather than a printed row.) 24 doors, 24
windows, 32 columns, and 10 treads to each flight of steps. The overall spread across the four porticos is
49 × 49 m.

## Reproduce it

```bash
npm install
node scripts/render.mjs villa-rotonda     # → plan.svg + plan.png
```

To check it rather than look at it:

```bash
npx arch validate plans/villa-rotonda/plan.arch --strict --json   # exit 0
npx arch describe plans/villa-rotonda/plan.arch --json --room rotonda
npx arch describe plans/villa-rotonda/plan.arch --json --select instances,schedule
```

`validate --strict` is the ship gate — it fails on warnings as well as errors, and this drawing
passes it clean: every room reachable, every door swinging into space it has, every opening on the
wall it names, a way in from the outdoors, and all four quarters congruent to the millimetre.

### The compiler asked where the outdoors starts. The answer is: between the columns

Core 1.27.0 raised `W_NO_ENTRANCE` here — "there is no way into the building" — on a house with
four front doors, and it was right. Both versions of the compiler agree on the underlying fact:
`describe().access.hasEntrance` was `false` in 1.26.1 and 1.27.0 alike, byte for byte. What changed
is what the rule does about it. 1.26.1 was satisfied by any door *hosted on* an exterior wall;
1.27.0 asks whether a door actually reaches unroomed outdoors. Five lines reproduce the difference:

```arch
wall id=shell exterior thickness 300 { (0,0) (8000,0) (8000,6000) (0,6000) (0,0) }
room id=inside at (0,0) size 8000x6000 label "Inside" uses living
room id=porch at (0,-3000) size 8000x3000 label "Porch" uses entry
door id=d_main on shell at 4000 width 1200 swing into inside
```

Silent under 1.26.1; one warning under 1.27.0.

That was this villa exactly. Each `d_main` sits on the exterior shell, but it opens onto the
`loggia` — and a loggia is a declared room here, because it has a floor, an area and a schedule
row. So every front door in the building opened from one room into another, and no threshold
crossed from unroomed ground into the house.

The fix is not to demote the loggia. You do not enter La Rotonda at the shell; you enter it between
the columns, and that line was simply missing from the file. It is there now — one wall on the
loggia's own floor edge, spanning the widened middle bay, cut for its whole length by a cased
`opening`:

```arch
wall id=w_colonnade exterior thickness 100 { (colx[2], STEPS) (colx[3], STEPS) }
opening id=o_portico on w_colonnade at 50% width 2500
```

It is 100 thin because it is a threshold, not masonry, and the cut leaves nothing of it standing
except its two jambs — which land on the two middle columns. That is what those columns are: the
door case of a temple front, which is why the middle intercolumniation is the one widened to 2500.
Both lines live inside `component quarter()`, so all four porticos get the identical threshold
through the same exact isometry: `describe().access.entrances` now reads `north.o_portico`,
`east.o_portico`, `south.o_portico`, `west.o_portico`, the loggias keep their rooms and their
schedule rows, the four quadrant subtotals are still 181.00 m² each, and `arch lint` reports
nothing.

## Open it in the playground

[Edit this plan live →](https://playground.archlang.uk/#z=pVzrbhs5lv7vpziIMIjdltSyHTuJe9OA2lES77itrOTcMJhtU1WUxUmJ1BRZkdWTBvYh9gn3SRbnQlaV7GQyGf8IIhXrkDw8l-9cqA68NUWhYFgsdWkyB2dqVaouZKoodA4PLhRMXHA2Vw_g__7nf2Fo81IreK2KQuXGdWGmbyoLB8cnj-l5WGhYGWUdWDczhe7vdHY6aTjMKlMECAvjwVkNwcFMg7G5mc91qW3Ab9YLky1grTawcRUUzn0EFcCEU1Dg_16pUsOscNnH7k4HFORuqXPITJlVhSphoYoCcq1yyLQNpe6Csjm8GL-ZgMm1DSZTBQS9XBUa5qWzwXdpJStdwlxlug9XVWl3OrSRvFRrY29AAU4bdAmhKi1RNAGMp0FeLdPIPkwdf-mqMtM4ZF2aELRNQ3c6tDXk1fhyFAl3QVVh4Uqdg7OZ7sKqUJnOYe6qEoJZan9KjAR-EF_b3QPlwboyLJBHu-PJyy4M9r40UCsfgAaO3l91YTx5uQf8V7qggoangy-96l0lc4zeX0EPaKbR-6u9-OrBky--u9Zx2gG9w6_v1dMePh7Q7kafdLkJC2T5TBduTUy7ztxy5ay24RoKY1tMRV7RcSD_bYNbfbhCfm-WSx3KzU4HX7IugPJel0HnXcgWOvuI7C5Bb_SMxR1PpT5ZZ4sN8HLCQgU4G15C5pYaXBVQ8DNVeTzPa9rz9UMft90jMTEelAV9q7IA3txYnfdWulxWQQXjLCxVKM0t7KKYGu2hd_B58PmgC59zHT7DMzjYQwH3LE-0s5Urg8mcB1SBzNmbshKVwSFLUxQGt6thtsHHPpRVhlOxDr579QGuXo3gv94MJ1ejCZxPYQivzy_fvRqNLmB4-Rwux1cwjM97U_zPiBnpZp-MqzxkVSAe-cJkGmfFFbJKqsLhsbmwEM2jw_J0OiwTuMjgVr1CzwNkrrSocunEmK7-pEsvhNWtUQUOLE3uSsjd2spG87zQXWQNDt_UQ9auKnJYqE_RsiSlUh7C2u100D580h6Mxc9Q2x1jfVA2074LaxMWNBFuA7-D3LkSnOiwVss-nFWBPpUoHG6-04HSuSXSDY43VZ_P9Gpy_npKM2iVd0GrbAFlZS0LloZ5VRRs0mBt8rDAqdAmeZMTH2wOPrjVCsf7hStDXIsLC11GwwCw3_vy3z6kP3yTTYYPpVnhUjzcwqDfP3gyGAyE2GeA1ij5-5z-qYmRWeFRpDlKPnXJXOocng4g1zfdSPn-tW1Tpm073GrpKpsz80nW0BGsjF0vtC76jeU2Xo4ftom-wKOhxXkIptD1IZKeFhv2F9aFLbq7OFAEG__2QDfp4nGhBHRhjQ6IxNWVyA5UGWNR7ub1Wtf87kzZXOSNv1fweWteWh87YJnX3xmz_fcZQmsMMJfbPO_1eq0x9f_Y1Mupf_4W2SIJRDuBVkf_vdKoNGsSnlKrnOR8bdgfkniQCvAMuc4KVWofra0mDno0w25tfVcUAB-QFz8bvz4fTeH88mo0uRif_ZkNFGnPw-gK0ZF3YY4HIGrdjTadBqDVwskfepwD_EIXBarBT2l-yArno36KGphcg5tDQxBmhASQcKlRU2tz4tGvLbUNPqEi8oJx2lAqUyB9nKy7rZIPPZPmh8rmgkdqRXvoowWl1eIcxNNCWWK3s7BBH_J0MBiAmiN0MYF3Sz4XvQJcOnJu6B1tE7V4tUGHz5yNiga50549CXqR8-ej4QVEH3F4DLf4z1I4Q346uManLs6Bm_LIw8fwGQ4O4DM85knYpO90EkcPDmCZPIscf1QDg2bWZ6WZ6RypmtCNbjIvqyU-vxpevhxdXuESVFHsdMQk02p6ibXsnNiHBGVv8OBWzlgCAIpO1S9cwbCAUSlij8WGec2yEImn0T5qPYl8lzFKWJSuumG34vHwbxaBjw6XcGeIKrOdDuxeu99wsdc06Nr9htu77rKTlSNL4GivD78aL5BUZ87mtIjIvJXLFrpeMnkOXoAPhv6lsxGqaLzWasOHI-4MpY3JI9guNBRasSslzWiBAURvqDwYBZBdpHVkqiw3-I3PFjqvCjzS9Sm-uSFIQ85deWfLjaxiqWVhuGTbrQ9BrDWs0ZokAsbCW5Np-7tiQR29HV2StD6fvPkVAY9gm9Fz3llDoggcIlrL9IrgmaCqKP6ndOY7nRQJ4GYQtrFvK7UmwUZZZKyBZ-jZmxADifXOa7IsmhwG87EPY1tsRMNfXIzHExK_hFxCw-L04blD9TaB7ShGEkv1UTfP5aEHr2_Q9pCai3z25ijIBMZR6DyZA79QKy3AS4sRCrg2uCZRExSOhhSlPtRIcKfTQpiQKYscnEm8RaOFBxRaRa6VigQvLBRDnF2F4ZQqNt54uCkNWrpS-aBL4xE8sojOdFhrbWnNb0eTq_Oz0ZR0XgHJWbZwZQ4Fmi0Fq4WywS1Fu7LS-QgoMTbc45OPkR3akhQWaiNasTkVq4CORIxBWWmYvn354_P3L3BbeC7KbuB355YsbOPLiw_wbnhxMe3CZDz-dUqYevx6dHl--XIK0zeTt-dvRzXAhqs3k0sYvR-eXV186LbtC2t2US0tcnqh0QqWWoCQaG0180m7fdArH3XIlGTnA7peAeFNtjMvrpm8mBYflCmvQRfss_rwC5oY-UhCwdRZGE0JlUd4GrRIOJlnjarLoZaxMBkNn_866i9z5s7F-S94cHRu6BspKDC2aNoYr8tPiBJoNTyhybUqjNc56mOM06Mw7fJWMKdATm_BmpeWtAG_MqUq9tivG4tixaiM40U8Qwgm37DvEuO1Jn4z7VKrCM3RSGhV6hIOT_qPYPlTc-cFfKI0CoIBxryPjmu7wJK7IDvrSHN3OrWEKbSepMS-SjZOIX-srFMWFk2SutFR4fzCrfsw1brJb3rzAed16vwN6flrSs1cUmrmAfxjB6CyuLblcgdI_-B4sAOwUsjn4QGFnKUyYQfAZ6rQcHB6MMARjFaqFT1I1twt_Q5AoW-0zXd2ADow1SujwNiPyIVCmVxo42LwPBf6Fj6pokKfgbE1W7L1whW40UKHoPs7BIOXlLBZwoPO8ezRydHJA54AASgfL4pKZNVX0OpX_mjtAYaEeJ_BYwRPrb9ORF3olmX0LzL64GB7eKeFE3HHW1DmoYfcqKUOuhRi0_PnIyR2CD_AEPaFOBM7PB4MBowVOf_1RbAViWHgCc-2CDExCvW6sEDzrkpWrYj0JCxEh6e90JrILn-BH-Fwi9bxcVwXeg2EpvW6SpWbyu8IldfjyRVSOb6Hs5LdQLkPc1cuu5yfi3YQd0hAPW1u9Hr6hUOioLogjGWskCHnHJcxGf8nLoOWsy-kImMOW4xRaV3CD1ghCE-HEHc2nrwk_jDpu8uJAcpWAoRgMelr5lyZG6tCYjlmypAkycQ-iYRQ78AjAvbuky4pRCBEuEb_F6ONhoNjlRCiZ-_5HJF4-yQ7cPgoHaQIroQ7C5pEPojsuTlbMA4hSBXRkFtjdY9nJCTEEKEqVQG5CtWSHRKqtLrVniwQwC1aYsooIhv3YZj-g5IbPyAfaPjmXxn-R8NMYMI1et_vsxDRTHRgGAGasSm0apxhl43V7qA72IsYzlUEHNmCCDfJc_fhwiEA2RBlysecX74bTp6fwiAGrjMXENXg-C68GJ6NUpaSqHKo-Mvw7M_x-4bt6fOKY6IyYVdKVaBecISDIVFXcCuB9pm7xZ3gCUsmj7IaHiUrihoFLUSfciDmxuQY3VrPOuwxBOAcKmZB0LN-tG7tMUWSUdzP_k7YQTjAhOgMcOEpwmkklVlsyFa_P59GHWnKMypykmZR4WSZJI9soSC23yZqxNd7lDiZBX5h09IFzCKkM0ik6CiE1L64FCH19D5SjeNKNKbDi-F91rIDuV6FxDSRKDwyRjqZwmKOdQIrGKP4kOiejScTeAaP7tIVcpRORXYVWpWclKxffkcGhBjfY1LE-A4cDIjjdToWMx4Ioet3R_W7--13H7XfpVQHvbvDK6N8fkzUcAWJ_RRmiU6hWrE6mVzTmVtJSNdogqs7LzgW20nb9TqmKbsSmtWJxj6MV9qSsCOoWDlvMNrBqCwRn7y5FMwmNCniiBGZ5GhMWDgMxmFWavUxGWkKL3xQZfBoI3Bjz2DYJ0KE8k3-jPesbwW7hoXJPlrtPUoF1hB0iVnyWWmyj6IWQHUWlL89-h8K9R7sEhqQTzTujyZrG-L30IPOb7RYsMY2Yj5GYioXsxmUjtI278N58EJzafKUSqHEfyu_kiA2Z2yCq8i1Il8W2kqt4HjwJw5A2wxZU04EVqoMhiP1xJKjwQD-AbvDtHvZM3-q9_uqTgU8nGIE_3z0cjIaTWH8IqULvjVDIDQjePpJ6kdiqzRGYB91w1WCLrzezgvolBeo43jedUfovytNkMifeNcOpDPdzhNwHKnCPckBoTcdvfx1dHk1vDofXzYSBMG5rYpPM8rH86FFc_aMs7hcYzOZEFYzlPToEdvHju9brXMPflUY-ZZEv46WmDUIKX_0fy_D7uEemLhoOgKw1XKmS4q-KWLJlAVMvP0E3qoVcijCbBIuLJ14mGlOi9ZZlykuQQhLbSbWVY56j3rHgIJdaNg9OkLL9OjRYLB3TwbKWZjwmtHAiYcVsr5arSSpHUuRp2y6OIZfKevh6KT_5HGKFWd67vD8gt_iXfQLHTg-6h8ccVK3jr6tvk0O8qFv1aZprmjiJFGqCRxTegYdrVB2XKtIb7oyR-uFW0YBTjV5Km_GULQtp-MPW_hDfFRSJLHd9VK3gFM_es7xB-jBpD78O1bkvpzJHStGq5G3tsqiUWC53oNPVWnCYqmDyfoN04hm-cZpD6Ph9AquxvBuNL1qZJYQ0ydXTMLVJYLk_oIjV5YOSujmptSsU8ZD4VTem2mFdahTtDHXqsyuYVYVCLvEzl6MXlzRLKX6pAs6yLUqPqZsYDrDmMOCVRXaJ8Fnti7RdVHONgoPQixT6JKiBl-XFmU76QAaOWwUD8zwiQony7DSQRW-Vqg5tmiU1bIP71SB9XYR_02TGXquqiKIabAOrrP1dT-BhvEHjDtRKPZh0nIFpN_3OYKTr_hGAR-s1SRkpNqU1KOH0V9w6AqT-omMldeQQj2q6VJrVyWe8-vOih00L652VluE1jTgK4TO3jUo0acvUNL_lNKoRWnUpsRK0SpgnTbw2ENPcbOmyiansqj8hFLTao9o5HuE7iUGpbVhwBVuiL64JCuV-CiIJrDTrB1cZSjQp0TUNmqgFX91302EdAc7bDFRLb_ExEMmJsALA9HhxXAvHXT6IsERCk25feDfCEolMAWO3Ez-rHA3N4aKxth5M-xymiM2_Hjzu4Zf4FZSMumvUDNdwIMLevkBflMhg9GCbFrkBakbR-RbwhfJE76_bcQ-ifxZfPkBk6euLenhSqY5zuRVwbXv2ELUnIhnGsItB0t3ZpqqgrchGynMJ8xXtHYSo6Um_XRMif7uEHryXXMn8vIDoe-DK9WNbm8go0SmSidxdwO7Z--gB8O9BrviBuTlOMGXuES7SMfdUuE0CScEe4Df80TNXTSOe6ZzpNuSUPJ0jca57xJWIfhK3yofNoU-BW9uU4qPfSqWTCk_CTPMaKV2HC4SkxlYY9GGiwIY5YN3DZBANuKjxopIhKHq1giwxLeXiLBKjVYILRg1FhGWnRfKftyu9qoIEhlLI7xMOcGIHRT4rNTatrHQUDbGiJ3KSFgfYnQgrW1chJFKy3YxJUIpSYejq41efs4mV9J8p9w9IRkctiW02xi--qr8ZD7pupORbbCAWKogCOVUR0hRauyhqNM61NWB2-H1P_RwrcI1pvtUBBt1EYXJxlpSrudUkUI2Ul1N8qFSzpO2x8wVzlosjCDG8YDCsFyCm8_jkUbwdkudpARFmikkjKx9H6aCugm1YpwwHVHejHtTMJqTZclz7PthwpXfArZDm8dyJAuCgsn4zeVz4UFdt5EoOVLOqCfNutBHeUB3lROirHMQsU5KAiK19YjVVFE89HA2uryajC7OL0ddaT71vEPq9-DQD_MHnGtnsq8v3nAF8tfzyzdT6j9iFU6Oiuq-Lh0Z5cTcHM7GF79xWobq9dT_mrQrvpvGYc0NQ1BKgFE-Axsl6REtzYKxtvEoJgOx9FYUTZitrK0KjDjZpVMnnQLvCpNDbnzWhbmhJs1kEAiEcmMDl8t62PHA5xGTMTHTaTfYz9DIgOEKKQUG238xC0aqq6RWeEoy2KjWCJ0LoIxWzbQ7dGrmytlygoA7oTHFUhP7wMS4HrEvRJvE2PCWbh37NUROYs0kpSIx9El0M1fcwjP4S4SwT44H3Zi_Oxo0PmDKtBuzc60PjWH7ROCvRJ1arDCmG_T7Jwlik5LcB414Q3EYwC6u7C_mr7jXiy6cfRAUHr_upa8FZZ9dtAfs3x0gxP_Yqf_9xvUw1UFNFZnwJIUG8Wlv--l9a7uPSnuJ37G0468u7fgbl3Yfle2lxaTTq9FkRBmx8Zur5-PxZArTq-HkatqH6_y3pTI2toisjC4zAeKUsezCTFpkOYFJtfnkDQSbSmEc4wVO3JLJiE_JHhK8EUslwq6yDDl0U6rVIlbRUS9iNEnNuuIfU28AekLsp8eUZmzWFBtjOdZNnVJYjVsotNkUp5rka9hkwbuIDbAn5JRcR05VDkTJumyW3FWDBX344CoZQhUO6mlp4BZBQd1GWB69oOAAsiLkqhAntf2TXDyIHfLSVpmfRqclzGPeStplXiCvKE3SAj0xt1UfWDI8ycJwj-XZB6oBsDFlu4WUmt3NEasJfJsp6bHNqnhimHmBTKFnFMDChiV4QT6Ftjdhgell6g0cDKgrP3bgi0FtNOwRwkqojRrKUl_vgju28SUBRRI-VkFyu-wm1w7-ppYzHx17weixwRMcIpuSo8M4VYWUfJV-rwhusXE54VPcLmdHmph6O2atJeCeAsABB5qk1Id_TfEdf3FUf8GWJnLW5M_cbxG_OgvNSVSgpDs3oSOwblYIpKDObfgsbDeqzLXtSpcKA5YNNUtpFYzXkk_CqzvE07ojqRb7pdfYkd9NTV7IVjpelEsfzw3evP7x-SWoEp0ftVKQ09NkWKyzejvDttXT9NDLu6aZ32pc7sD2VgbmCIwJY6AAClymDERctFvJVqJa3q9TKdkaGC57yhNSkdRjNQU7-U-5G4gJc8zSaF7AfGysNIohe-hhqZWvsLKAMkH5c7EX0g4A2UIZrAok3MZ9Y0dYR6wh0BUifW6guOPLDwb_3Jkfc_oqwghMixn4gcnu1Wm27Qff5JjvoT3Y2_qCrU2vTfdbKO5vU9z_EsV2-Jv6e__NBI2oE1lUtAXd5Nhuje_DtbPwH7iPn1Ef_2Pl_M_XUshVUJiAZ0wRRCxHNq0dFahWpfaeHqQrMlIzYWfdvEBViW4iwboS2SjspQqJTb0LWCg1y5lPFVdmOwrQUDpyuKZa-zIbpda3au6dRiFVbt8JH0S3Si6HUJMPQ9IBtbUfR0nmaxb5M4YjyEnGGyrwqGjMMCvnuSMGnX7KXsUzPrdi06RQgdFauwBTGG7lu3o3jt3jQS7reUd1OeXl2lHt2vjagythuwdbDBBd8_lyA_bpndbwWFmKPeTNnnY2Ooqrb7EAG9MedzvM2_jh0aD_9OTk5E-p1AnzKgIDdrBcqPoRnkpXxbxUXMKIYEuiVa7PJ6s2J15JXeueIg73tt8j8xz6Y4NwmSFGwF0NJ2dC9mJ0-fLqFUx-CAsdVKseigOpJVj6WOfmhiSP7u6lojZFj6nSp-xNo9BR3yTgQiXelhiSiFep_dRLP7v0HkoPMStat3lvry6fRAPSvr-Xbh4haKA6G8thRVc5-ne990ygiFTC2177kZjz1hu0G2d5V5QhTMfdeK3ZDsDJ9NO6IaP3M6Q8Jv4fk7K9n1OrSbc1kpOR3UbRUtKTvZ9pc1uZ_rpfpSGhrQpDatwQUFUTZl5hwosL6Iqvc6n60tgiJRpqY5G2wgiIiytoM54kk0HtnA2TEV_ZopTyrkxJfwMlfmV7RTHLLZiM6kZbdLaMGL5y32qQk0yFqxQoILUpfIopj-3VGOu2KBEX03qkeKICoYiv76vpNW8K9Ts-_36XWXvNScPneVA3ytgutbAlQFTrtlSiml6rD7-Q9yNfYprRaO3CdtF20YAecOtK41qtl2bSZXJXez9hu8Mn3bgznNqdOg1i-3DLdV7yfHuC8o3N0Rnnz9bG0vH_Zg9aDuzp0fEAIq85U9WRuAvzOYdHx4MvUjpsu8KDk-PBlyk9OvkypTW0KGGb1p01cfBOzlmi5TahTC2RTntJg5rQU87CRUIng5qQVBvX3DbPvwaAsLiyuY5elWKZLmfv053aBK_u5TYexPaCjh9_jUdPHt_Lo6j-TUqHR4dfo3RwcnjcMratew8xmkIwwXHDXOADOSwpDHA2pb6hzAFD0-B-xEhWoJwUZDnsRd-oCA3KXQSMrgqt5uDXFIAgJokhBfrgJPPRlEdDn6y1dIKhBfMBazbUN9i_G1YcfnNYAfvw-LiuxR0dkhphHEFVdxpw-LUR_0qccc9ke3D3-5PjmvA3kLyzvPuWXdP8Y-s-QxtrfK_hZAnjNEqMIfswovuL2KxrpezQakqum9moLLb1qwZElUBLC-b8s18lQHH4ph-v-O6frvj-H674_p-taJ9Z7HL695xdR66oIQINXhdz8qyoQ6n0EeWiG1mf9VZ0aSreW252ur3jpBRRprsH4qvosuFp4-56u4ewOY_88An29lGXJx62SqnCHe6A_GHy34e4SqlycQO4TYg2aO91waVrjkGaF_-o8Mzxn6Xd8notBiE5Vf5ic5dk_QilSz2Gfq6mR-1r8W6XzBFHoPTFUnk8JanHUL38fRfO3jd6fhrtA3BGZhYvTNVDMRol1U39Cw1RoOxfTFClwPf7ROE6N0u6DuquOa9bmJkuVdDFBsYvXvT5R1PoEEV7jw5TzjGVFOm3cVSZdblU3iGCsHR59ChqVmxgQSFo43LzMlXQJ-jHCq1yubsVFqYMm15dd112mW7dFpd-Eyf--o9kyIgtvr4NnJultp5BHaXYf5KOWLpWD3x3hYG-o18UofIzHTrdgbvRoYZldKtkVs1mhW5cj5QbanQPQu5C5IaqZfO514GvXNSpCOq1s65cKrofgcR7PwdXd09aaW4eT56PJo02gQ433fFVfKqnViHejm6YX4pKKUuXsnk0Yvx2NBleXEC8P8NWmXfvtmw0ZeGXjn4QAK-EpOS98AnQHuDgtQnkmPgmKKMoSTWwJV-uwkZu5TXa9ugc-cePBGEh93KzjOZwr_cz22IypsJIShrXwwY4SIZzMHFnWFJh0UpUo2BCoQUqrEr3N52FeJ-x_TtVJIqNn6jiGAb1_7fZBh4My2xxoeyNfI_a-OBwcHjSGzzpHR4_IKf7x87_Aw)

The link carries the entire source in its fragment, so nothing is stored anywhere. Change `A` from
7000 to 8000 and watch all four corner rooms grow together.
