# Operation Absolute Resolve — Miraflores Palace, Caracas

> **ILLUSTRATIVE RECONSTRUCTION — interior layout is schematic, based on public reporting
> (CNN, USNI News, PBS). Not an actual building record.**

A news-style infographic reconstruction of the 3 January 2026 raid on Miraflores Palace, the seat of
the Venezuelan presidency, drawn as a compiled ArchLang floor plan with the reported route laid over
it.

![Miraflores Palace — illustrative reconstruction with the reported route](plan-annotated.png)

The same drawing without the route overlay is [`plan.png`](plan.png) / [`plan.svg`](plan.svg).

## What was reported

On 3 January 2026, U.S. special operations forces carried out an operation at Miraflores Palace in
Caracas. Special-operations forces were inserted by helicopter at around 01:00 local time. A
firefight with palace guards followed. President Nicolás Maduro and Cilia Flores attempted to reach
a safe room and were captured at about 02:00. Both were flown out via the USS Iwo Jima.

Sources:

- USNI News, 3 January 2026 —
  <https://news.usni.org/2026/01/03/maduro-wife-captured-by-american-forces-u-s-to-oversee-venezuela-ahead-of-new-government-trump-says>
- CNN — live coverage of the operation, 3 January 2026
- PBS NewsHour — reporting on the operation, 3 January 2026

## The disclaimer, in full

**ILLUSTRATIVE RECONSTRUCTION — interior layout is schematic, based on public reporting (CNN, USNI News, PBS). Not an actual building record.**

That exact sentence appears in three places in the artefacts themselves: the caption strip drawn at
the foot of `plan-annotated.svg` / `plan-annotated.png` (word-wrapped across five lines of the
caption box, but nothing else), the plan's `accDescr` — the SVG `<desc>` emitted under
`arch compile --accessible` — and the header comment of `plan.arch`.

The drawing's **title block** carries the disclaimer in the three lines that fit it:

| Field | Value |
| ----- | ----- |
| PROJECT | Miraflores Palace, Caracas |
| DRAWN BY | Illustrative reconstruction |
| DATE | 3 January 2026 — schematic |

The title block cannot hold the sentence in full, and that is a property of the sheet rather than a
choice: its value column is a fixed 34 mm on the sheet at a fixed 1.9 mm type size, so it holds
about 26 characters regardless of `paper` or `scale`, and a longer string does not wrap — it runs
left out of the box and overprints its own row label. The caption strip is where the full text is
drawn.

### What is public and what is invented

Public, from the sources above and from published descriptions of the building: Miraflores is a
late-19th-century neo-baroque **quadrangle wrapped around an arcaded central courtyard**, and it
contains a set of named ceremonial halls — **Salón Ayacucho** (the auditorium, about 250 seats),
**Salón Sol del Perú**, **Salón Joaquín Crespo**, the **Ambassadors' Hall**, **Salón Boyacá**, and a
**chapel**.

Invented: **every dimension and every wall position**, the 70 × 55 m footprint, the subdivision of
the working wing, the seat count actually drawn, and the **safe room** in particular, which is
generic and deliberately says nothing about the real building. The route overlay is likewise a
schematic reading of the reported sequence, not a documented track.

## What the overlay shows

Four numbered beats and a dashed route, in order:

1. **~01:00 — helicopter insertion**, outside the palace walls (the marker sits off the building, in
   the sheet margin).
2. **Arcades** — the entry route crosses the north-west range behind the auditorium seating and
   enters the continuous arcade that rings the central courtyard.
3. **Office wing** — the route turns off the east arcade into the antechamber and runs through the
   *Despacho Presidencial*.
4. **~02:00** — the route ends in the executive corridor, short of the safe-room door: *Maduro and
   Flores captured before reaching the safe room.*

Only beats 1 and 4 carry a label on the sheet — the two times the reporting actually gives. Beats 2
and 3 are bare numbered circles, because the reporting supports no intermediate timestamp and
inventing one to fill the slot would be a fact this drawing does not have. The caption strip below
the drawing spells out all four in full, which is also why no marker needs a long label: one long
enough to hold a whole beat would run about half the width of the sheet.

**The overlay is a post-process, not ArchLang.** `plan.arch` compiles to `plan.svg` and knows
nothing about the raid. `scripts/overlay.mjs` then reads `overlay.json` and appends a single
`<g id="overlay">` to a *copy* of that SVG, in the plan's own millimetre coordinates. The plan file
is never modified, and deleting one element removes every annotation. The route is drawn geometry
laid on top of the drawing — it is not derived, checked, or validated by the compiler.

## Verification

`plan.arch` has nothing architectural to justify — `arch lint` reports not one warning:

```console
$ npx arch validate plans/miraflores-raid/plan.arch --strict
✓ ok
```

It reached that state by turning the sheet. This plan used to declare A2 **landscape**, and core
1.27.0's fit rule raised `W_SCALE_OVERFLOW`: at 1:200 the palace is 70600 × 55600 mm on its outer
faces, against 105500 × 41580 mm of drawing area once the margins, dimension bands, title block and
four-group schedule are taken out — 14 m too tall for its own sheet. Nothing was clipped, because
the page grows past the paper instead, which is why the drawing looked right while the declared
sheet was wrong. The building is the landscape-shaped part; what needs the height is the 22-row
schedule under it, and those tables cost 212 mm of sheet whatever the scale. So the sheet turned
portrait and the paper size and scale both stayed put.

`arch describe` confirms the plan says what the infographic claims: 22 rooms, 3270 m² of floor,
16 doors, 24 windows, two entrances (`d_main`, `d_service`), and **no unreachable room**. The four
`zone` blocks roll up as Ceremonial range 1775 m², Courtyard arcades 392 m², Executive wing 459 m²,
Service range 644 m², and the same subtotals are drawn in the room schedule on the sheet.

Every threshold the route passes through is a connection the compiler itself reports, not a line
drawn by eye:

```console
$ npx arch describe plans/miraflores-raid/plan.arch --json --select doors,openings
opening o_ayac       r_ayacucho  <-> r_arc_w
door    d_ante       r_arc_e     <-> r_ante
door    d_despacho   r_ante      <-> r_despacho
door    d_corr       r_despacho  <-> r_exec_corr
door    d_safe       r_exec_corr <-> r_safe
```

## Notes on the drawing

The **courtyard is not a room**. Nothing is declared inside (20500,17500)–(49500,37500): it is the
hole the quadrangle wraps around, open to the sky. Declaring it a `room` would put 580 m² of weather
into the floor schedule and into `describe().totals`. It is enclosed by one four-segment wall
pierced by twelve arcade arches, and the peristyle columns and fountain standing in it belong to no
room at all.

The **arcade is four rooms, not one**. A rectangular annulus is not a simple polygon, so it cannot be
a single `room … polygon`. The ring is cut into four corridor rooms — the west and east arms run full
height and own the corners, the north and south arms span between them — with no wall between the
arms, so it reads and floods as one continuous circulation loop.

## Reproduce

```bash
npm install
npm run render   miraflores-raid   # → plan.svg + plan.png
npm run overlay  miraflores-raid   # → plan-annotated.svg + plan-annotated.png
npm run permalink miraflores-raid  # → the playground link below
```

## Open in the playground

[Edit and recompile this plan in the browser](https://playground.archlang.uk/#z=tVzNdhs5dt7zKe6RFra7KYb_ktxxzmFL7LZmbMmRZPtMNhJYBYpoFYFqACWK3cc58xB5gdlkl02yyzL9JvMkyb1AVaGKZEnumfSizSLrfrgA7s-HC0D7cPbu3cer68vJ9dmnKVxOTy7Or64vP55cn12cw1___G8gpOVaKA0JW6vMgjBgogVfMiuiNsyY4TEoCWk2S0TU2gfNU6WtkHfw8uT8vA0fr87P4JyvTBs-fH_1qgPnygKTwCKbsQRmmUhifFvzSOm409pv7cN7odk8UZob-MASFvE2nDDNImZIJbvgYDizoOb0-ROX_JeMJ0xCqrkRMZfRug1Mxvhza79shFkSiLi0mufiA_gDkxnTa-h3-2NQKdfMCiVBSFgtRLSAj52rDpiUR4Ilrf3yDQNzpSNuIGKpzTSP4YNv38K5iFTy218MvGdxphVpcyISweAH6pnr6ee3k2s4u4IPH79_d3YCk_PT4quz80_T8-vpaQeuFxxSGocXBvijn49ogUNiuQZhWvsQqyhbcml5_BoYJMzyg96xXRxgXzO9BsnVwYxp9XPG4Z8_Tk4vJ-c_vpvCSrM05TEwrTIZA5OtfWA6YjGP3TCxBCKVabtmOm7DStgFMDCcBl-yJb2m-VJJwRJYsCRxc3TFkt_-C8EmaxZl0ULBSxzrf-2Pugc0dyyLhVVaZMtXbf82XKkEYp7AB65_--_i2z8o9nP2238g2InmJlVtmrbJcsaMYbHS5gW8ZUlSCHyv1iz67S805AzHKeUJjqIynFQ2bW8XP2cs1kzeJbywlrKzwDSHWLOVhLlWS2_hYFSGU96B6afp5Z-u356d_wjTd1fT_zMz7Dd_4HoNsVhyaYSSbf_FiiUJpMoIS19iQyul79EmV0LevTBgslksHoQTYjJu7Ts7Z3MOWqklWmPKtBVRljDtXNMAgzRhmRGzhJduCUI-cIktdeBUgVQWNGcOURjqEzkDiptMP_B17gq5ozjjvH47hZOLj5fXf5pcnqJJnl9cwwQuLy7ekxsvEAUBeZQwtH4h0fhb-_Cy3x11u-3e4ajbfXXwcniMTwN6eg2Cggg2t1AJpw_lROBPVZtsO4-TYJUbkft1B06pSWrfAoNbHKFbWKksiSHNLIyOurD8n__Efq04swv0EukAWvswT5TSNF5xlnCaevr1NuYm0mLGX77qWGVZYm478HnBLHAZJcpw45VXkmBUpg8Mv0O3oxluw-3qhgzotg2p4DriMczWYFc8eeDer_CfBTffUWdSroWx6wThIpVkS2kKS5yrTFomJBjrNKRvaSiY0G2Y8UTJOxwDi5PsrAQ9K0nK-ZtcnkxOpzh5P1x8vKS5u2rTRF6cTzswwbhrmbwjo2JSZklmsIdoNAyMWKakW6qS9R1aplE4BBGT-MKM40i40Ye__vnf89duXczS3j4iTBs4vjhg1FGtRaw0aWzQaixncRHaV9xYGgTO8INeGtCZhHmWJLDg4m7hflUr6aczUlpy7bwapNIYomSMnoqfUN6kTMKM2xXnJLSkxiiYSeWc0__q3Q6lqLPugeYNfcjNDtoPfiRDgEhJK2SmMgOR0OielD0SpdJOK8WstLeR0Kj9syTJjMVU8sDhkkdKGquzCKX34NcWQCaFNbBctgDutIhh1G0B7MOHi8vry8nZdRsTL8Z6GZuIpYH70vBXneqwO-524RFGI_wXs5s1oDLLNWHOWYRx0eU7g78tWJqKZA0s0spgv2HS_w5W6A2x4s5C5qUv9_sHWq0KpyLQTMboeDYPvpbNEsyWyljo9_qwXKKDmgXnNp9ZxMeQ6Vw9YhiaE84eKGBJQp30gy73hrAEs1C6YAMuU8LL2883VyeTd9Obi0_Tyx_eXXy-fdWB60xL8hgKrUvuGifYWbb2UclpMmPRfWECKUu5RkdcG2w_d1FS0H_de93vdjst8O9O-oBESDOB8O5FeqUF3kaztAWYKQywzCpQD1yzJKGXfWAi_2gBJPyOy7jVAmBRdC1swreYVJUjidC2dNW2HM4pxjrYm4ARaCMHxirN10AGq-bA4LCLsWs0giVHthQSiMC0NgjEbvrQgZM6VVBRlKXrmuNSAEB4tEhWSZTOZ2lGcqaFYGo-FxF3aIK7aaToQShlcieNZMThgRsrZjjGBDhPmKQ27jLM_Kky1jiXcNNsNZqochGY4krn70uc_1bavNciGy6ZInIWaQ15eUDQ5goFMl105uri4_Xb7wrTQUrh3IHNUOletzOCmN9pTh6vseO3Rlh-SzSCogDRAOqxdfQK5mh0scDUgiyZ8JQs0yscHPxklISDA8MTHlkgRPQd_AC_5gPuIviCL4VJF1znNvLFdfbg4OAA_RfzrrOWLSTu4Fn_tcAlARG_IcCSZduFiO4lNwYwbP4KL7vt7it4edjtdsNPo1G3i0_FJ6ILuabXK0Xp62AlYrtwNM6tH2IFS4yGPnahqb-mpDLjC-E74zpNPXQjOXfO06YXhXRTnUO4MaO3OzBl0cLRROfkeaqLWGYcGIokQlKKCBIZf6BEqbK7hQv5woLhKdPMYgBf-OFGAoLxPRi_1c2MyfhGlr0MxnCQj2Fv6MbLjZ5_-rIJY5phhr0Qxj99KX3BrhSQjnk0qXCLNrA7huwjyPLVrmgm729WTTr0DoMO-KdCjw0o3gQ1GoRQ7mmzS6VpC2t4Mnfm4tgn8ivwhNS0nQ3G1R4552_QImTu4Jl79Wngn9yb_qli7-elxYJjD6iAqWoie41qHOUO5j5tNRHZb4IYjnMI96mAIB0_F0kmULGq4apRw26bNCtm3T95-GmRfUpeG-SxakO8sSFnCf2Kqfe3mRhvHA4HM6jADLbCDJ4BMxyFMO6pBjPcCtP3MEejAMY9BX6zD6Nu10m9dsseb-T5MohoiqXIZPwqfYE0kZgjI3ZLMBLJ3ExluDzIs4OSCfGcyC0-q-wIDJI5Jtcur7n1VJARK4vy6jTS19v6PHJ9Hg_DoXNPVQe_KoP3bscxjdbSC2H9k89J1fkxjdbSH4cw7mk7TKO1DMIo5p-2w2y3ltyVKzDDBphRo-2GacI_bYcZN8GMKzDjKkxJTYi9t-FOqyzlvsKAvm-QVt_-oiS_fQY9cUsewNdhwQz8y_TyAu64QlK-fu3LS8Yyy6kM4UowoLlRyQPHciGLLK7iDAgiCITnSLuGFZKqmCfc8rgD7_lyxrVZiBSd6nR68m5yOT3NF4VYmFms_bLHL1AivySLmNZrqibNqG4CBO4WWsziGpstsZqBJCVR6j6oxebVqAhrNwS2YMgeuRYPLnlR1wMOuxesIshV3GIZfJksfqNvWF50BMB2HGnD_4z4hQNF6kdyDUjYjCew5yuHebFyj17OsOCzcO4fohuVpFxnkKMXuYrQezvRK-XNvZ3wERU5oYAv8phTfrgLPq-T-irp7gZYWTn1o-NTo9P_cKOBjVLr3u7BmWHxlZXaF4kxBB9sau-Ltm7kd8O7am4I7_3QwW8OzgkJ5LDN4OWq0IFXopdroLvRwDRfU37Kpf3I42JznTdDgYEs2fFMA3snQaWZvtpixzq6WZEqFZ5JqgxG3e5j_zDQhCjNhLDyCQoLUtssQUc33BmZI3qN-MRpvhpfOh_p1vH7xziU2EqO72hj3sBz8U2A78noDnyXXZ_CL2eKP_IoowLK3rT4iMFqy0RJy0ujrDD5wO5pMAunkpZHC4YhtzncxNykjIJZid3vbfhUN5ip01wk34_CnSvfZVcrqbWBXb3BumzQxmCjDRrMwhqKITnx9dzNMa214pq-YWFPPB2iVjCJPo6pkWLOLJvP4YIE94pR2toHjz7z6CHB3IU-ETE3LwL43ehE7ooZrlA5QscgXdcdRS6VWu5VAg8W2hit5UtTM1w_YAVr78p_2JHYFiozfKGS2AWF4UZ86m_Ep7eFiMf205RZkQi7rjVABbCbVZ7ZxvUGguSQN_Aj1cw-YBkDI1DzMDr8PMAONwJsMz5GoGZ8LAua0hG7zwjgH0hkc5624t8LGy24zM3gOfj5lP7RiRb6e6jcDjxrDOqNrq7zvArWVtr4HnePippnWL7E4iaLebvYFSsrom1XDfU7V66IQmhBbRRpWYx7aCJ-E98ssRnKl0cBFXa1LqQrjli7wpohsidkBSC3fsTw9bRugIFGvYmhMtuqoOSmqyTQsoRZsiYPctztFo1bBYWlb4HgHmL4PAhegSg91IH0ayBoIFWUQqKC44mOA-nVQfp1EPd6BcG5ggMYPakFvV2Rz03dIYyfRMjtmYylIEPFtq3fjUOze-1PYRQ03i40NzgEbVwrJJzNi41MoB1PaiZ-o4iiBbbmXc-pRE5HdpJXD-vSflBzO6uK98ZPibsRpcDSG9XF-5utV71645wEbihilAk3GZ_06opCuM5xmeDocFQwDqfPoK6PrEsblXieG5LLHWO5IY3LFBfEjzakn24bNScFygXU4Q4A2duieND8uFG4v9Hy0jMEX7br7ZB0td-69EytQ2nPABqkS39iyxmJozSRE78w8tY3KoVXvapnBQu2mk1V9sb-hkxB2_W4G7ytIjZXSaJW5nVuoxZPMxXktR0-gFXFtsKWHbp2vlPng0JxEoDKBJgG8h23sMIWDCHSbIpHvpzOLK1TwjGsjpy01fBckGnHETcsoMw1VJZtBisJ81FAmIP4mAP1q0C5EhtguKCp949ce2fQLYh7Basg2qTcCGNDxVKPA90GVcBcdBvezJGeXv_r8WaFmeHUHhChQnyXChJGmzA-CeRMhQwyLNtyZycr5mu77mATFqOqZkLWQ6puOmmDquVYVp2scm4HlCyM9_mbjH4bkI4BRW7r10UVPP4SnhrCQXAeBug8Hbglc3DbNszCP6bK_NOtK-Kx5N55C_bnhaETMXhSBjcc-sewbEO_S_8vPtNP5akW7A7TriSYH05zvK_i_zgBEZMg6WBGrMXcFmlrtZmkGW7tVLU-7I-6EETJDYF-TaA3LL16q8CgJtDvlV6yTYDXVRoMu40t8LpKg-MnBOoqDZ9owdRVGo37jX0wdZXGg-ZRMnWVDrvNo7Sqq3Q0aO7Dqq7S0dETAnWVjustlL53l7Bffn9eC31vJWSsVqiBdMzDFdXyuu32tco2Oe7Zlhd8jhySlZXnWf2vlON-mdz9CjkkRr5_o6-Wi4J09jVyPtyOG-UqgtwxuGDNN6bsucGmN9vkvtxWivoN6ueIYu71NUm_lTrcSuJ3yppQ9ujZsrQ6CkSHo61Ljy0jZYqid7Fu8UvsZzRs3PIyr-d0NxfojcL5mtqx9FFduNdgGYbWaoXpDzaEm1sm4dz--18pnK_jSfjwK9XOS0iOOz1V0agJu2n21aEtwt2GiV6V67l8QfOMNlfliqbGZZulipVMjSA1S6Ep5hsvTcZfW_p-5XmsXQxqUh6YdqeiHXurHIx29OeoOE79U2aKbdGSzeUMKmn7awLFaWtPPv2p10dh8OydzG-LGDophfUuWp64o_qI5TZiNVU8iKTSWXRm7v32KTFeu-Brf24bOR4dr16Xx2lZmiZrZFNzZLLYSrfTOfZFYNcf54m00PkWBHwDuEfVht5RPyyh4k7D00KDcXeL0Jda-6Md7behjtjc_vDw-FlC1D4e08UbNeW0lPtx_VFZdaf9vrDY-oN_fy-wwNrmrltybLuJ8nT1pSDxWq0MmcSKS7tug0kTYZE5MyAmulzmt4yYMFhU9TdnNGfa2ZY7U4I_lkuKfIGdr4TcQW7SMqL98_AQaYdOBlu4mk6u4Q0M6XQ4zpz2M9fr-6nDt8wa3gAWzeBb0PANHI7cDKFAlAt0vUA4A9ECnSrPHvAtRPANLZPbYNZ-GkiFR_ePkFBuwDegoR38LrgvG0YSM-Gycq9HbKD0hXFejS92xpgwezXQaqxSdFtko1j3lbGqVI4OvbsW84MDaBkcL8yQju68wFGwZR0URlF4bxeePylQhRvX4S55xFN3kqURLTwWUIU8rkNWDgQ0o_rzAE_oeKIyGYmivzQjbuf-NRjxCClfudO9eAQ6sXhXJTi66WrL-VK0VMO96YbKV35ltFAaZspatYR5kplFeazi8TjoIYrueYdKvX-MvXuULaTccSNiN37F9y2kaNLD6p4WRr1Ak3zXJ_AMdHDu1S1PIniNrUoPEj63oc4YDR-3TXR1MmZc4vGdrbAEKSTe53N7Ct4gH2tLsY1a41zYAzwO99VJPPBabu6dWmVRruisV6pfKEWdJZ4cbNsV5UXE2mmCBXzVCJH0VBBPlJxzzXGvbItNGzVn29V11nSwdSxzu6rOiFL3WAXaDhfgDHOYkU9zrR0jSAuiuqnUdUGH29SltI4QRNMdmGbLeMfn9h-0v5CFUqZNNMaq1B_apNqfeUGlOSo1eXYltD_VTowxp1DMdShlGncf3eUhd8EKr2Ogc_oLQ2SBLz_fXH0-O__x5uJ7d_Fievqqs2N4ynpoMMS-d4fF8IydOz0TIxyhr8SY_R30mD1Pj11z7UqkGwZ3FM402m41RLGZkNxuIqDJhXocVfQYb4QSE55y-H1rgh2jUyxY65Fk0w2q5ws2I0gwWjVUnz62-vp458QVi9L_B9X4c1XbFSP91uaGaqMcwZ2s65e6veN4-TwkFQH1zBcNIbscNpLLUcgux5RNx92CrQbZdIMc5jvXOTOsdNFvSt8YIe8LzuDr_2aMEcrHWZ-dy0MZQeS36oHnR0N2YowbMfLs3oxx1Igx1yK-40_p4Q6C7QQJ5jzf4K-mxUF9oj9ongbEbCtUeerhCbDPSt9vy64V9hOccioNMiA-Q3-YLrjoQ5ciZ4mK7l8YeGBJxvO1Jy4N6OT-oFv-zQSDZQue31qjG1Jz8chdHhoMMdFcnNMF6qu30-k1nUZwb0Cvc4w_23XKSRt_J5r-CASLhC3X8-5oNN2Vcsu_W7oaegtKwy3dCL3Nqw9YEaALpnRnuigI4DltujCvM3-NjmI19ia_sa8e3W3oB65TLfIrf7QVpFZu1N0qMhYmSphYuj8Y4TdpNccbgXR-W_AY6JKdr6e4nSi8G2ZcRWMubNvflXeXsd2L_gC4W2FgB1LU7RYvaBzQNXGGh8vNw91tm_a68quntwUYtnY5nZy-n2L-dlPpQkWq1U94P7DhtusevUg3QG5ma9g7a774ChAzy2Gv9kc_aF8sX1jvURj50vpf)
