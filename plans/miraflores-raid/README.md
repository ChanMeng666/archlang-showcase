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
$ npx arch validate plans/miraflores-raid/plan.arch --strict --json
ok false  total 1   W_SCALE_OVERFLOW
```

<!-- TODO(1.27.0): decide whether to re-sheet this plan or keep the warning. -->

That one diagnostic is about paper, not architecture, and it is new in core 1.27.0: at 1:200 the
palace is 70600 × 55600 mm on its outer faces, against 105500 × 41580 mm of drawing area once A2's
margins, dimension bands, title block and four-group schedule are taken out. It is 14 m too tall
for its own sheet. Nothing is clipped — the page grows past the paper instead — which is why the
drawing looks right and only the declared sheet is wrong. Core 1.26.1 did not check this, so this
section used to claim a clean `--strict`; it was clean only because nothing was measuring. Re-sheeting
is a drawing decision, so the warning stands for now.

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

[Edit and recompile this plan in the browser](https://playground.archlang.uk/#z=tVzNdhs5dt7zKe6RFra7SYb_kjxxzlFL7LZmbMmR5PaZbCSwChTRKgLVAEoUu49z5iHyArPJLptkl2X6TeZJknuBqkIVyZI0M_HCZpF1P1xc3H8A3oezDx8-X11fHl-f_TiFy-nJxfnV9eXnk-uzi3P4y5_-DYS0XAulIWFrlVkQBky04EtmRdSGGTM8BiUhzWaJiFr7oHmqtBXyDl6fnJ-34fPV-Rmc85Vpw6fvrt504VxZYBJYZDOWwCwTSYxvax4pHXdb-619-Cg0mydKcwOfWMIi3oYTplnEDLFkFxwMZxbUnD7_yCX_JeMJk5BqbkTMZbRuA5Mx_tzaLwdhlggiLq3mOfkQfs9kxvQaBr3BBFTKNbNCSRASVgsRLeBz96oLJuWRYElrv3zDwFzpiBuIWGozzWP45Me3cC4ilfz2ZwMfWZxpRdyciEQw-J5m5mb65f3xNZxdwafP3304O4Hj89Piq7PzH6fn19PTLlwvOKQkh1cG-KNfj2iBIrFcgzCtfYhVlC25tDx-CwwSZnmnf2QXHZxrptcguerMmFY_Zxz--fPx6eXx-Q8fprDSLE15DEyrTMbAZGsfmI5YzGMnJpZApDJt10zHbVgJuwAGhpPwJVvSa5ovlRQsgQVLErdGVyz57b8Q7HjNoixaKHiNsv7XwbjXobVjWSys0iJbvmn7t-FKJRDzBD5x_dt_F9_-XrGfs9_-A8FONDepatOyHS9nzBgWK21ewXuWJAXBd2rNot_-TCJnKKeUJyhFZTixbNpeL37OWKyZvEt4oS3lZIFpDrFmKwlzrZZew8GoDJe8C9Mfp5d_vH5_dv4DTD9cTf9PzXDe_IHrNcRiyaURSrb9FyuWJJAqIyx9iQOtlL5HnVwJeffKgMlmsXgQjojJuLXv9JzNOWillqiNKdNWRFnCtDNNAwzShGVGzBJemiUI-cAljtSFUwVSWdCcOURhaE5kDEhuMv3A17kp5IbilPP6_RROLj5fXv_x-PIUVfL84hqO4fLi4iOZ8QJREJBHCUPtFxKVv7UPrwe9ca_X7h-Me703ndejI3wa0tNbEOREcLiFSjh9KBcCf6rqZNtZnASrnETu1104pSFpfAsMblFCt7BSWRJDmlkYH_Zg-T__ifNacWYXaCXSAbT2YZ4opUlecZZwWnr69TbmJtJixl-_6VplWWJuu_BlwSxwGSXKcOOZV5JgVKY7ht-h2dEKt-F2dUMKdNuGVHAd8Rhma7Arnjxwb1f4z4Kb39FkUq6FsesE4SKVZEtpCk2cq0xaJiQY6zikb0kUTOg2zHii5B3KwOIiOy1By0qScv2OL0-OT6e4eN9ffL6ktbtq00JenE-7cIx-1zJ5R0rFpMySzOAMUWkYGLFMibdUJes71EyjUAQRk_jCjKMknPThL3_69_y1W-eztNePCMMGyhcFRhPVWsRKE8cGtcZyFheufcWNJSFwhh_00oDOJMyzJIEFF3cL96taSb-ckdKSa2fVIJVGFyVjtFT8hPQmZRJm3K44J6IlDUbOTCpnnP5Xb3ZIRZN1D7RuaENudVB_8CMpAkRKWiEzlRmIhEbzpOiRKJV2WylGpb2NgEbjnyVJZiyGkgcOlzxS0lidRUi9B7-2ADIprIHlsgVwp0UM414LIGUp13A8gITJ2EQs5S0AE7GEQ__toIevOBlkaQvQExlgmVWgHrhmSUIve8Un-bcAEn7HZdxqAbAouhY24VtYrsZgEfKuq7w7nFO0Jdg7BiPQsDvGKs3XQAJRc2Bw0EPbGI9hyTEahwEq8AcbAWp3eOrCST0UqSjK0nVNMUjBEB4jAas4YqcTZJl5JEcwNZ-LiDs0wZ3zIu0klDJ4EEcy4vDAjRUzlDEBzhMmaYy7DCNLqow1MGeRhzJWc4yozsJJb7t_38Tsb03L9lA59oNMBGOitOgPTZgAzBUSZLqYzNXF5-v3vytUB0OWJSg2Q6b7ve4YYn6nOTduhbpwa4TltxSmyA9RmKEZWxe-YY5KFwt0XZiFEZ6SpfuGTucnoyR0OoYnPLJAiF1UfWE5_JoL3HmIBV8Kky64znXkq5tsp9PpgFlw9OtOW7YkCZ1n_WmBczIifkeAZRZnFyK6l9wYmPR68Cu87rV7b-D1Qa_XCz-Nx70ePhWfKBzlnF6vFLnHzkrEduHSBJefxgqWyhSZMqr6W3JaM74QfjJu0jRDJ8m5M542vSikW-ocwsmM3u7ClEULl4Y4I89dacQy48CQJBGS4nrgKPkDOWKV3S1ghQFWWDA8ZZpZTKcXXtwY4EDYbiC_1c2MyfhGlrMMZDjMZdgfOXk56fmnr5swphlm1A9h_NPX0hbsSgHxmHuTSuxqA7tjGN2CKFKdimby_mbVxEP_IJiAfyr42IDiTVDjYQjlnjanVKq2sIYnc6cuLrvB-A0-4TFtp4NxdUbO-Bu4CDND8Jlh9Wnon9yb_qmi7-elxkKklTHEgKlyIvuNbBzmBuY-bVUROWiCGE1yCPepgCAevxRBJmCxyuGqkcNemzgrVt0_efhpEX3KvCmIY9WBeONAThMGFVUfbFMx3igOBzOswAy3wgyfATMahzDuqQYz2goz8DCH4wDGPQV2sw_jXs9RvXVptVfyPM2mNMWSZzK-Clxw9iA4umwm0TgIRmJCOlMZpp95dFAyoTwncsVNNTsCw9YYSNYurrl8PYiIlaKvuoz09bY5j92cJ6NQdO6pauBXpfPebTimUVv6Iax_8jGpuj6mUVsGkxDGPW2HadSWYejF_NN2mO3akptyBWbUADNu1N0wTPin7TCTJphJBWZShSlTE8re23CnVZZyX8Gi7RtMq29_UZLfPiM9IbxjwNdhwQz8y_TyAu64wqR8_da3L4xlllOZ60p80Nyo5IFjO4pFNlljLSQoQSA8l7RrWGFSFfOEWx534SNfzrg2C5GiUZ1OTz4cX05P277JhoX_wqXqRYESMUl4EdN6Td2KGdXlQOBU-qKJSgVsidUyJimJUvdBry_vdkTYGyCwBcPskWvx4IIXTT3IYfeCKoJMxRVj4Nsw8Tt9w_KmFgCO45I2_GPELxzIUz-SaUDCZjyBPd-Zypthe_Ryhg2FhTP_EN2oJOU6gxy9iFWE3t-JXmmf7e2Ej6iJBgV8Eccc86Nd8Hkfznfhdg_Ays6cl44PjY7_g40BNlp5e7uFM8PmHiu5LwJjCD7c5N43BZ3kd8O7bmEI7-3QwW8K54QIcthm8LIqdOAV7-UG6G0MMM1ryh9zai95LDbX-TDkGEiTXZ5pYO8k6GTSV1v0WEc3K2KlkmcSK8Nxr_c4OAg4oZTmmLDyBQobHts0QUc33CmZS_Qa8SmneTG-dDbSq-MPjlCUOEqO79LGfIDn4psA3yejO_BddH0Kv1wp_sijjBooe9PiIzqrLQslLS-VspLJB3pPwiyMSloeLRi63GZ3E3OTMnJmJfagv2FTvWClTnOSfL8Dd0b8lF2vpDYGTvUG-37BGMONMUiYhTYUIjnx_cJNmdZGcUPfsHAmPh2iUTCIPk5okGLNLJvP4YII9wopbZ2DR5959DDB3IV-LGJuXgXwu9EpuStWuJLKETo66TrvSHKp1HKv4niw0caoli9VzXD9gB2svSv_YUdgW6jM8IVKYucURhv-abDhn94XJB7bL1NmRSLsujYANcBuVnlkm9QHCIJDPsAP1DP7hG0M9EDNYnT4uYMdbTjYZnz0QM342BY0pSH2nuHAPxHJ5jptxb8XNlpwmavBc_DzJf2DIy3491C5HvisMeg3ur7O8zpYW9PGj7g7UfQ8w_YlNjdZzNvFrkvZEW27bqjfGXFNFEILeqOYlsW4RyPid_HNEoeheHkYpMKu14XpikusXWPNULInZAUg137E8P20XoCBSr2JoTLbqqDkqqskUFnCLGmTBznq9YrBrYJC07dAcA8xeh4Er0CUFupABjUQVJAqSkFRwfGJjgPp10EGdRD3egXBmYIDGD_JBb1doc9V3SFMnkTI9ZmUpUiGim1Bv9uDavfW7_IXabxdaG5QBG2sFRLO5sVGGdCOGg0Tv1OUogW65k3PsURGR3qSdw_r1F6ouZ5VyfuTp8idRMmx9Md18sHm6FWr3tiHxw0r9DLhJtaTVl1hCOscFwkOD8ZFxuH4Gdb5kXVqoxKf54bJ5Q5ZblBjmeKc-OEG9dNjI-fEQFlAHewAkP0tjAfDTxqJBxsjL32G4Nt2_R2Urvdbp56pdUjtM4AG6tKe2HJG5EhNyYkvjLz2jUviVb9qWUHBVtOpyt7Y3xApaDtYZXZrR2yukkStzNtcRy2elimS13b4AFYV2wpbduja-U6ddwrFTjO1CTAM5DtuYYctECGm2eSPfDudWapTQhlWJSdt1T0XybTLETc0oIw11JZtBisT5sMgYQ78Yw40qALlTGyAYUFTnx-Z9k6nWyTuFawi0SbmxugbKpp6FPA2rALmpNvwZi7p6Q9ejjcr1AyXtkMJFeK7UJAw2oTxQSDPVEghw7Ytd3qyYr636w7OYDOqqiakPcTqppE2sFrKsmpklXMhoGShvM_fZPTbgHTMJHJbv86r4PGK8FQKCsFZGKDxdOGW1MFt2zAL_5gq80-3ronHkntnLTifV4ZOXOBJDNxwGBzBsg2DHv1dfKafylMTOB2mXUswP_zk8r6K_eMCREyCxGYjxFrMbRG2VptBmuHWTpXrg8G4B4GX3CAY1Aj6o9KqtxIMawSDfmkl2wh4naXhqNc4Aq-zNDx6gqDO0uiJEUydpfFk0DgHU2dpMmyWkqmzdNBrltKqztLhsHkOqzpLh4dPENRZOqqPUNreXcJ--evjWmh7KyFjtUIOpMs8XFMt79tur1W20XGfbXnC59BhsrLyedbghXTcl8m9F9BhYuTnN34xXRSEs5fQeXc7aaSrEHKXwQU134Si50Y2vTkm9-22ktRvUD-HFGOv70n6rdTR1iR-J60JaQ-fTUvVUUA6Gm8tPbZIyhRN76Ju8SX2MwY2rrzM-zm9zQK9kTivqV2WPq4T9xs0w1CtVqj-cIO4eWQizvV_8ELivI4n4oMXsp23kFzu9FRHo0bsltl3h7YQ9xoWelXWc3lB84wxV2VFU8tlm6mKSqaWIDVToSrmGy9Nyl8rfV94HmtXBnVcHsh1p25d9lY5eOvSn8PiuO5PmSm2RctsLs-gkrY_hl6c5vXJp9t-Z4_C4Nk7md9GMHRSCvtdVJ64o-CI5TZiNXU8KEmls87M3PvtU8p47YKv_blgzPHo-O4aYsX9gd40TdaYTc0xk8VRet3ukW8Cu_k4S6RC51sQ8A3gHlUb-oeDsIWKOw1PEw0nvS1EX2vjj3eM34Y6YvP4o4OjZxHR-JmWAm9slMtS7scNxmXXnfb7wmbr9_79vUADa5u7ruTYdtPh6e5LkcRrtTKkEisu7boNJk2ExcyZAWWiy2V-i4UJg01VfzNDc6adbrkzJfhjWVLkBXZeCblz2sRlRPvn4SHSLp0MtnA1Pb6GdzCi08e4ctqvXH_glw7fMmt4B9g0g29BwzdwMHYrhARRTtDzBOEKRAs0qjx6wLcQwTdUJrfBrP0yEAuP7h8hodyAb0BDPfir4L5uKEnMhIvK_T5lA6UtTPJufLEzxoTZq4FWfZWi2wgbzboX-qqSOcvw8geNmB8cQM3geCGDeHTnBQ6DLeugMYrEe7vw_EmBKtykDnfJI566kyyNaOGxgCrkUR2yciCgGdWfB3iCxxOVyUgU86UVcTv3b8GIR0j5yp3uxSPQicW7EMHRTddbzkvRkg33phOV7_zKaKE0zJS1agnzJDOL8ljF41EwQyTd8waVevuYePMoR0i5y40ou_EV37eQokqPqnta6PUCTvJdn8Ay0MC5Z7c8ieA5tirtJHxuQ57RGz5uW-jqYsy4xOM7W2EJUki8L-b2FLxCPtZKsY1e41zYDh6He3EQD6yWm3vHVtmUKybrmRoUTNFkKU8Otu2K9iJi7VTBAr6qhJj0VBBPlJxzzXGvbItOGzVn29l12tTZKstcr6orotQ9doG2wwU4oxxm7MNca4cEqSCqq0qdFzS4TV5K7QhBNN3jadaMD3xu_0H7Cz9IZdqUxliV-kOb1Pszr6g1R60mn10J7U-1U8aYp1DMTShlGncfMxlz7S_w4HUMNM7lEmOua9q9_nJz9eXs_Iebi-_cxYvp6ZvuDvGU_dBAxH52B4V4Js6cnokRSuiFGLO_Ax-z5_Gxa61di3RD4Q7DlUbdrbooNhOS200EVLmQj8MKH5MNV2LCUw5_XU2wQzpFwVr3JJtmUD1fsOlBAmnVUH342Grrk50LVxSl_w-s8eeytstH-q3NDdbGOYI7WTcoefvA8XJzmFQEqWdeNITZ5agxuRyH2eWEoumkV2SrQTTdSA7znes8M6xM0W9K3xgh74ucwff_zQQ9lPezPjqXhzICz2_VA8-PhuzEmDRi5NG9GeOwEWOuRXzHn-LDHQTbCRKseb7BXw2Lw_pCf9I8DRKzrVDlqYcnwL4ofb8tulayn-CUU6mQQeIz8ofpgos-dClylqjo_pWBB5ZkPK89sTSgk_vDXnkn32Dbgue31uiG1Fw8cheHhiMMNBfndEH36v10ek2nEdwb0O8e4c92nXLixt-5pf9kgEXClvW8OxpNd6Vc-XdLd0NvQWm4pRuht3n3ATsCXOPBHwxtRUMAz2nThWyd-Wt05KtxNvmNcPXobts-cJ1qkV_5o60gtXJSd1VkLEyUMLF0_yGB36TVHG8E0vltwWOgS3a-n-J2ovBumHEdjbmwbX8X2132dS_6A-CuwsAJpMjbLV7Q6NA1ZIaHy83D3W2b9rryq6e3BRiOdjk9Pv04xfjtltK5ilSrn_B-YMNt1z16kW6A3MzWsHfWfPEVIGaWw17tP5WgfbG8sN4jN_K19b8)
