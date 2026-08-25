# `arch lint` reviews a $2,950/mo apartment

**Every apartment-listing floor plan is a marketing document. This one is machine-checkable.**

![Railroad walk-up, Unit 3R — 61.2 m², nineteen of them hallway](plan.png)

*A fictional composite of a familiar genre — not a real listing or address.*

## The unit

3.7 by 18.3 metres over its outer faces. Both long sides are party walls shared with the buildings
next door, so the only two facades that can hold glass are the street at the front and the airshaft
at the back. A 900 mm corridor runs the whole 18 metres from the front door to the rear wall, and
every room in the apartment hangs off that one line.

Seven rooms, 61.2 m² (659 sq ft), two windows, one bathroom. Marketed as a 2BR.

Everything above is drawn at real dimensions with real fixtures. Nothing is exaggerated to make the
joke land — the drawing is a plausible listing plan, which is exactly the problem. A listing plan is
allowed to be beautiful and unlivable at the same time, because nothing checks it.

So we ran the checker.

## The roast

`arch lint` returns **12 warnings across 9 distinct codes**. All of them are below, verbatim, in
[`lint.txt`](lint.txt). Here are the six that hurt.

**The second bedroom is not a bedroom.**

```
warning[W_ROOM_TOO_SMALL]: Room "Bedroom 2*" is only 3.91 m² (under 4 m²).
```

3.91 m² is 42 square feet. It is 1.7 m deep, which is shorter than the bed, so the bed goes across
it sideways and what is left over is the corridor to the bathroom.

**Neither bedroom has a window.**

```
warning[W_BEDROOM_NO_WINDOW]: Bedroom "Bedroom 1" has no window.
warning[W_BEDROOM_NO_WINDOW]: Bedroom "Bedroom 2*" has no window.
```

Not an oversight — a consequence. Both bedrooms are in the middle of an 18-metre-deep unit whose
only two exterior facades are 8 and 6 metres away respectively, at the two ends. There is nowhere
for a window to go.

**The only toilet is behind someone's bed.**

```
warning[W_BATH_VIA_BEDROOM]: Bathroom "Bath" is reachable only through a bedroom.
```

The bathroom has no door onto the corridor. Its one door opens off Bedroom 2, so the second bedroom
is also the hallway to the only WC in the apartment. It is 12.9 m from the front door, and the last
1.7 m of the trip is across a mattress.

**That bathroom door is 600 mm wide and hits the toilet.**

```
warning[W_DOOR_CLEARANCE]: Door is 600 mm wide (under the 700 mm minimum nominal width).
warning[W_SWING_OBSTRUCTED]: Door swing is obstructed — the swing needs 600 mm of clear
radius but "wc" is 400 mm from the hinge (200 mm short).
```

Two warnings, one door. It is too narrow to walk through comfortably *and* what little leaf it has
sweeps into the pan.

**The refrigerator is standing in the kitchen doorway.**

```
warning[W_DOORWAY_BLOCKED]: Doorway is blocked — the approach needs 300 mm clear on each
side but "fridge" leaves 50 mm (250 mm short).
warning[W_SWING_OBSTRUCTED]: Door swing is obstructed — the swing needs 800 mm of clear
radius but "fridge" is 602 mm from the hinge (198 mm short).
```

The listing photo's proudest moment is a full-depth American fridge. It is 900 mm deep in a room
2.1 m wide, and it went to the only wall with space, which is the wall with the door in it.

**And the living room faces the wrong way.**

```
warning[W_ROOM_NOT_EQUATOR_FACING]: Room "Living" has 1 window(s), none facing S (the
equator side in the northern hemisphere) — they face N.
```

The plan declares `site { street north hemisphere north }`, which draws nothing and asserts nothing
about sunlight — it just names the compass so the checker can read the aspect. The living room's one
window faces the street, which is north. The south-facing wall belongs to the back room.

The remaining three warnings — a stove with a table 400 mm too close to it, a walk into Bedroom 1
that squeezes to 300 mm between the bed and the wardrobe, and a wardrobe-shaped reason not to open
that door too fast — are in `lint.txt` too.

## Three numbers the drawing does not tell you

`arch describe --json` reports facts rather than opinions. Three of them:

**You are renting a hallway for $954 a month.** The corridor is a room, and at 19.8 m² it is the
second-largest room in the apartment — 32% of the floor area. At $2,950/mo that is $954 of rent for
the space whose entire function is getting to the other spaces.

**The living room is 2.5 m from the front door and a 6.9 m walk.** Its `detourRatio` is **2.76**:
you pass the room, keep going down the corridor, and come back into it through a door at the far
end. `W_CIRCUITOUS_PATH` fires above 3.0, so this misses the warning by a quarter of a turn.

**Three of the seven rooms are not in the walking model at all.** `circulation.rooms` lists the
Hall, Living, Bedroom 1 and the back room. The Kitchen, Bedroom 2 and the Bath are simply absent:
before it looks for a route, the model inflates every piece of furniture by a 300 mm body radius,
and once the fridge, the twin bed and the bathroom fixtures are inflated, nothing walkable in those
three rooms connects back to the front door. That is testable, and we tested it — delete the fridge
line and the Kitchen reappears with a 10.7 m walk; delete the twin bed and Bedroom 2 reappears at
13.5 m.

## What the tools offer to do about it

`arch suggest` returns ready-to-paste topology — a real `window` or `door` statement, with a
rationale. Here is what it proposes for the two windowless bedrooms ([`suggest.txt`](suggest.txt)):

```
W_BEDROOM_NO_WINDOW: Bedroom "Bedroom 1" has no window.
  window on w_west at 33.333% width 1200
    → A window on exterior wall "w_west" gives "Bedroom 1" natural light and egress.
```

`w_west` is the party wall. The tool has correctly found the only exterior wall that room touches,
correctly sized a 1200 mm window into it, and correctly noted that this would give the bedroom
egress — into the apartment next door.

It is the right answer to the question asked. The question has no other answer, which is what "the
middle of an 18-metre-deep floor plate" means.

Its third suggestion is genuinely the fix a renovation would make: `door on w_hall at 74.583% width
900` — cut a bathroom door onto the corridor so the WC stops being a bedroom feature.

## The one thing a machine will fix for you

`arch fix --dry-run` prints the unified diff it *would* write, applying only the machine-applicable
fixes — the ones the compiler can prove correct. Out of twelve warnings, it offers exactly one
([`fix-dry-run.txt`](fix-dry-run.txt)):

```diff
-  door id=d_bath on p_bed2_bath at 1150 width 600 swing into r_bath
+  door id=d_bath on p_bed2_bath at 1150 width 600 hinge right swing into r_bath
```

```
applied [W_SWING_OBSTRUCTED] hang the leaf on the other jamb (`hinge right`) — the flipped
swing is clear
(dry run — nothing written)
```

Rehang the bathroom door on the other jamb so it stops swinging into the toilet. One word. It is the
only renovation in this apartment that costs nothing, and the compiler will only propose it because
it re-computed the flipped swing and *proved* it clear.

Everything else is a design decision, and the compiler deliberately does not make those. It will
tell you the second bedroom is 3.91 m². It will not make it bigger.

## The ship gate

```console
$ npx arch lint plans/railroad-apartment/plan.arch ; echo $?
✓ ok (12 warnings)
0
$ npx arch validate plans/railroad-apartment/plan.arch --strict --json ; echo $?
2
```

`lint` reports and exits 0. `validate --strict` fails on warnings as well as errors, so this plan
exits 2 and always will — which is the correct verdict, and roughly the one the internet reaches
about these apartments every few weeks, just without a code next to it.

## Honesty notes

Every diagnostic quoted above is real, unedited output, captured in [`lint.txt`](lint.txt) and
[`lint.json`](lint.json); the suggestions are in [`suggest.txt`](suggest.txt), the diff in
[`fix-dry-run.txt`](fix-dry-run.txt), the numbers in [`describe.json`](describe.json). Nothing was
staged by planting a fault the linter would obviously find, and nothing was quoted out of a run that
had been tuned to produce it.

The plan compiles with **zero errors**. Every warning it carries is an *architectural* complaint
about the apartment, not a drafting mistake in the drawing — the two classes that would have been
drafting mistakes (furniture drawn through a wall, furniture drawn through other furniture) appeared
during authoring and were fixed, because "the drawing is wrong" is not a joke, it is just a wrong
drawing.

The building is a **fictional composite**, invented for this piece: a lot width, a depth, and a room
order borrowed from a genre rather than from any address. No real listing, unit or landlord is
depicted, and the rent is a plausible round number, not a quotation.

Deliberately simplified: this is one floor of one unit, with no stair, no shaft, no radiators and no
riser; the neighbouring buildings exist only as the thickness of the two party walls they press on.

## Reproduce

From the repo root:

```bash
npm install

npx arch compile  plans/railroad-apartment/plan.arch --json          # exit 0, zero errors
npx arch lint     plans/railroad-apartment/plan.arch                 # the 12 warnings above
npx arch lint     plans/railroad-apartment/plan.arch --json          # …as data, with fixes
npx arch suggest  plans/railroad-apartment/plan.arch                 # the window into next door
npx arch fix      plans/railroad-apartment/plan.arch --dry-run       # the one free renovation
npx arch validate plans/railroad-apartment/plan.arch --strict --json # exit 2, on purpose
npx arch describe plans/railroad-apartment/plan.arch --json --select circulation,totals

node scripts/render.mjs    railroad-apartment                        # → plan.svg + plan.png
node scripts/permalink.mjs railroad-apartment                        # → the playground link below
```

The `.txt` and `.json` files in this directory are the captured output of exactly those commands.

To check the hallway arithmetic yourself:

```bash
npx arch describe plans/railroad-apartment/plan.arch --json --select rooms,totals
```

`r_hall` is 19.8 m² of the 61.2 m² total.

## Open it in the playground

Edit it live — give Bedroom 2 another metre and watch which warnings go away, and which one moves
into the room next door:

[Edit this plan live →](https://playground.archlang.uk/#z=rVldchs3En7nKbqorbKdorgzpKgfp_wgO0lFtY6VcpR15UkBZ3o4CDEACwA1ZFyu2kPsSfYIe5Q9yVY3MH-ULD1EfCA5M8CHRvfXf5gjGM_efvwG_vevf8PfZpOLRfL3yvBVZv7cT6DYKgWmgKwUVmQe7Xh0NDqCS_jh6t3N1fWHy_fw7vqnn69_ubr5nsYJWKG2-Bp8ifABa_jN2DVYIZU1IodaqPXxdgO-FB5WBt3oCO6kFQqMzhAEVEb7cgofjAcBFoUCJZ2XejUB3d0TeW7Ruf690REst1LlUq-m8P0d2j2Iutgq8KXUK5AapAfpQMQbLIF0oHAl1AQsao_5BITOR0ewKY03Kys2JeZQS1-CgFrmeCz0SiEo1A6cqbAu0SJh-1I6yKTfT1k9NyWCK8UGaQXSRF0ahbCxZqmwmvLzrZYeKhRua9HBfHoGO0jPp3OowNyhBekdmK1HOzqCQmTo2CrzaUoDCsgUCktC-TLojpbxtYF5kkBVwUZYvyd9KwfCInixRk2AzR4vwjhTwM2PlzckaGaslbmxU3hrfAnK6BU4mWMAcKWwjTZorUbbDjTu_OgIcmPsBJyhpxZ5Du5E5tUebj5d0x4EYbHiM6GhNCqHlRLOBbY4bxE9vNTG-vLV6Ijk5AeWdiqkdaUoPLx0ZuvLV9HIrXWX6GtEDUtjrakdqy8XeyVXpe-MIkgtFWo2fW5FTWJodF7tXwdq5bJC7aTRbhJuFHLnyUTxknbppqMjomhY29E2Vyu0wmMOhbEs9B9mjcHQ9I9G_a6k9lO_879PRxslNIw_Nm7xidzi1w1b-FfixfzjGD6PgEnioKpGACsrc1gkI4CN2KCFyxlsjPVWSD8CcJlQCOlrHsAahO1mBLQdB2LrDZNKKEVjpUf43Og7DC6xkm7Dhgs3vjBoiflWIVhjKjcCchbU-WgEILLsRnqFvU00vt3qeBI4Pv84DhO-Q5dZGF8y2Zf7yHb0tm8Xo0E0XNvapdCgjJ8E3tNQx44IUhMzp3DZ8LghL9itDj7HoSvHjS-hsKbqc4yMCN507CI_-Rac3IWtQin0CkxRMI1qdJ4dgXgmQEmNbCkl7zgwLTGnWRNYS5-VqCe0A8yMzrtH7DHCl3TFxBawFNmal5vCtVb7vnw0oJXLdd5SS52b2n3bOvuBj_ad_tBfNcpVuTRbS6RtnXc6JmsewfFf_4Arkfl11IsfXQDqyfa6CVKmaMSshDPa7oO4FFqNRoZC5fCFGxKErSssBAr8ZrakIUoF2dZzpCYtgdTeAEqKRmA0TkfAq4PM39S3bFMA3Hm0kl1WZmuNzrFon-FlMkle0Xd6niTJK3aHbjaKJ2bPT5IAwH8exIimfkqCBmk4mbnzuPhx0QMJWKcUlVp_IVBiYLCQ9NLoCaTnULEBJ-RPOiRMBNReWoxOZQoG84OwSn6BnH2Z6TIYi-OA2VDaJKfibGk0sisN7VLSv1aQ3r7SsK_ZPCqW_wy39c4a57rJbkJ-rz05OulrCt-LrKRIrEXVi9TkR8HrpYdc3pE39YXa3AZHv11ingI8Jl0yOTklgaJ44eLLAItAbmOgeALr7KSHFS6GWBGGMGdPYKXpLOnUFi7uCTa7pRAF8NQm09lFDyxcHIAJX96aopAZPgm2SHpgi75BnyMoNanrgPVcCTYU5VKr1mCpWOD6KBaLHJI5kh8rYVcUM2gOw0Vqt9SfQnoxPYfqv_-hsEY8rsU-ZIzTlG-TFxCxwrL5GxvYLnxHayf_REjTJNkxtUGJJSoY_yiUGsPWIRWZNtsqwdqk6aMBYGAqMCYD0odBaYUdEbLBfM9Dx9B-GD4ADDAj7SNmJHiHOTvvMN-GdAfpuI8Zk-AAtPGAABqZ3oHOe6D_CEPHQ0EjwKGks07SyPIOND27L-nsm_ETkjYuEUED23vbT3ugwpc9hTagwpcDxMYvImKgfG_vPcO_NXrr4KMxVZSTEQPA8_kI17Stj_RrpBCzOZP6nvtMoC5liKWx_KKijLjNs2T-Jr8NsddoaFOd8DA7XySxaaGJrg7VuzcQnGE0gGjYzCCNr8xpYsQ4P8Ro6duBNPQdgJwmHQixgip5KpGoqPDC-iEqQQwwG_YOMM9njwjW0XUg2eyeZOksaVV0dohCMwYQDZWGEKeLJPmaIH3u3PSL0lI4-HAdzX5o8ClcUYykMjUsHhJ560WU9xkytH8H5S9HWxUfNZExrsCY3kiFvl8tTBntiqPwaUexHvFq6iNrQR184bm7GfKP_dZo6Gc2Uk7aqvf0nnrJU5_Hq5pSPei5NlO40iA0pOfH3MYc54i9VonrjVi25m9qqRvuH_hPT3qKG_dmRT7wrFgjDmddJMmz7LA15b3U-sKBovKYhPbBVBu6pgn8oD0nCDk2nKFwfySzfaZC2a_kHTruny03z9qEcdQOEHXWrL5myhR-FnaNeeipwhwPZum83WY-GEGb5uCH606PlvuqeALTI1bLypUxOWisXeg54okBHTCNAIqt1ZIOBkj1xe1SrmkDa4zpfJFM0rOTRRPYLyj59sK6XOOY6N5Fvb9qkbivGP4OpHOmEMBfvGbkltBZaWzwn0JtXRlkPV8ku1kvB_1iCjG-j-nvAIC_aMfpxSKZnLaJjNNtLzPe_HPcX_oZNtzGlqZRvOSG_5iXX2Iem-xa2NyaZTyKaa746LHHvPZ-Ib2bMFxLhyWWMh5EEXMfsj1nGFoz7JGvv6Lc9IQ0czEoRB5QLgmTAovE2j0l7XZ0Ok2SXQ_jUxR_3K3_HBqmLXd5izS8EkrhHgS39vS4a-pD2UztXyAiH9qGg9QXjk4-tzmVz5Vp2kSGFMFooaG8rNBK8kmLhZV8oMa5KJqIDqI3G0OnVw8YITPb4NPxlz9iJaR2PkyOTb8pCoeUrRdJrDhTUiclA9Zet-NDJ5Ka4mmjknD9yAoXJ7TCE5je3FGH1Pw-JXWaUCh_HLOwMl8hQPP7ECaXCo0mzlpNnEVePb7A2oulQoDwQ_y8oNYtmSf9cNcrtm9o4HiI-owRwNeG0bqifkyOm07PoALKs8H5yUHZ70XGBwUytnp1-yagaJo-hrN0-t6UKU2Z9LD7z0LEIU9dcOPReiq1cbs0Gfg7vPS11K86b509Xykfm40DEeuMSRB_HuPXfNGY_2GkpXBSA8Sfx5BO0seRXGlqtBB_HuFnekKZs-XVxQD2OTJnexDLYD9RJUEn-YKOCEpTYey3Aov6_XdlclTdO5wYptbEGen50Lk9IQvdEFenVJCdTS-g6qKl0Xy2QKWcoRBWVUQ9PjswGo8j0R_gXo5uDRC-WSmxAPxK9qFAl_bqkO_QrR_IPlkppIXwTaQ-J_c-7dz7ZJHsTpo41DUUnl8I0GsLoID_B2YexvF1xvAF45jH8PuX2-Uexpc2K98LvYr3hUcYz5LZ6XFyfjxb0N0voy-j_wM)

The link carries the entire source in its fragment, so nothing is stored anywhere.
