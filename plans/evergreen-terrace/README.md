# 742 Evergreen Terrace — Ground Floor

**After 35 years on air, 742 Evergreen Terrace finally compiles.** Ninety-two non-comment
lines of declarative source, and out comes an A2 sheet at 1:50: the most famous animated house on
television, drawn absolutely straight — canted bays on the living and dining rooms, a front
door that opens into the family's main space with no hallway to soften the arrival, a
kitchen you can reach from the garage without crossing the hall, and the rumpus room sitting
where it always has, behind the cars.

![742 Evergreen Terrace, ground floor](plan.png)

## The story

This house has never had a floor plan, exactly. It has had thirty-five years of establishing
shots that disagree with each other — a staircase that changes sides, a kitchen door that
moves, a dining room that is sometimes there and sometimes not — plus one plan the show's
writers published in 2020, and a full-size replica somebody actually built in Nevada in
1997. Fans have been reconciling those sources for decades. What is drawn here is the stable
consensus, the parts that every version agrees on, resolved into a single set of dimensions
that has to close.

That is the whole joke, and it is also the whole difficulty. The moment you write the house
down in a language a compiler reads, the questions the camera never had to answer all come
due at once: how deep is the stair hall, where exactly does the front door land you, is
there room to walk past the fridge to the garage door. Every one of those has a number here,
and `arch lint` checked it. The bay windows in particular turned out to be load-bearing, in
the technical sense — see the notes below.

## Fan art

Fan art — an original architectural drawing of a fictional house's layout as documented by
fans; not affiliated with the show or its rights holders. No marks, logos or character names
appear in the drawing.

## The numbers

`arch describe --json --select schedule` reports nine rooms, 143.22 m²:

| No. | Room | Area |
| --- | --- | --- |
| 01 | Living Room | 31.61 m² |
| 02 | Stair Hall | 12.00 m² |
| 03 | Dining Room | 19.61 m² |
| 04 | Back Hall | 4.80 m² |
| 05 | Bathroom | 4.80 m² |
| 06 | Laundry | 4.80 m² |
| 07 | Kitchen | 21.60 m² |
| 08 | Garage | 28.00 m² |
| 09 | Rumpus Room | 16.00 m² |
| | **Total** | **143.22 m²** |

The building is 16.2 m across the front including the garage and 11.2 m deep outside-to-
outside, before the two bays push another 700 mm into the front yard; the footprint is an L
whose notch is the back yard. Six doors, eleven windows, three ways in — the front
door, the kitchen's back door, and the garage. All nine rooms come back `reachable: true`
from the access graph, and every door connects the pair it was meant to: `d_side` joins the
kitchen to the garage, `d_rumpus` the kitchen to the rumpus room, so you can carry the
shopping in from the car without passing the front hall.

## Reproduce

```bash
npm install
npx arch compile  plans/evergreen-terrace/plan.arch --json   # renders; errors come back as data
npx arch lint     plans/evergreen-terrace/plan.arch --json   # 1 warning, discussed below
npx arch describe plans/evergreen-terrace/plan.arch --json --select schedule,access,site

node scripts/render.mjs    evergreen-terrace   # plan.svg + plan.png
node scripts/permalink.mjs evergreen-terrace   # the playground link below
```

## Open it in the playground

<https://playground.archlang.uk/#z=5Vvdchu3kr7XU3RJF06qKIWiJVlW1qlyYtlxRbFStrLZcyWCM00OoiEwB8CI4p5KVR7iPMM-WJ5kT3cDMxiSirM3u1UrVyoSxUFPo9E_X__gAF6cTODyHt3CIRq4QedUgfDH7_-EhbOtKWFeW-uO9g72DuCtMqBcuABlwDq90EbVoFxR6YBFaJ2qoXRqpc0C7BwU1Gpt2wChUgHwQfvgwZp6DcqDAo8B7HzvAAq1RKdAmUWNHpQpwRqU10JT0yvBV3YFK6cDOmjaWa19hSVoA5PxZHwEH2wANZ_rWquAJax0qPYOIFQoC60DHTw4vaiCh8rWJTr_NRgLS-Xu_Ahqu7CeHisq5VRBbzFqScw0DSoHFToUCdxUKDxp4hSuwBqmbVcGakuSgbm-x8MlBoeHJWIDc2dNgBnta64Kkg0zFhxiIDnvHUCt7-nvztrlCHxQ2kGl6noEpTb9F6iKiuRKy8PKRsL0nYdCObemRxUUygQs9w5gptZ8jiQOlre71wUCH88MK21K0IHlTRQXyqkFfuXaZdN6mNW2uAMVgipI0qq2wvfeAaDy4YgFYWwoKl58BTWqe_R0JIG_caE6XKEPUFhn0JG86IuZKu5grVwp4vxgQ0XsaA-N9Tpoa7CEsNIFHrFWrsE2aNIj2vDXFhSfTwkrlhLyg03dLmfaLPYOeE93OhQVGpjrh9A6BIfe1sTiVC2UNj7w4imd-lQb-DeS4zegTFFZB3_8_l_TEXjLPEeV3jsAH3RdswJ5CHaBoaKdkaY3ygVmH5b2Hv3RHivJ_k7j2od_7AG0hvRmudwDWDhdwukYsn8HgA8BnbYOJuPxqKfv4Xg85mOVXZNIHCkWQq1MSQYGivg_He8BNKpBB68n8l2hGtwD8IWqEY4v-Ak-KWibPXrnG71E4_ktyiFUypSHTa0KLMEp3myolIFpqZceVBvsVBSBfl2qoAsyIG08BHWHTFGYLBNdZBtQJY6i3mkPs1bXJZ1wxW5BlEqTWV2w-EWLiO4zzzRXOhj0HmptkLXKgGsNeP0AbHYeVOGs31A4UhvHJsTmJ8YQ6ZnFEbzV95jYF8dHz9k2eF1iMrsr8GotBNQSQZSXdsLqzwZCFPl9uGzCegSrStN-PKzICyr5TvujPX6SpFfZ1qNYs899gxVb8rYN1WhgWegMVLjUviHPdAFTWTEFLRKiB8U7JGlPSQ5T_oIZYJ_AjsQhirSP4I1TK08HQNv6mpwDe2t2hT1dklOpHRaijlPy_1CiL5yeIRwe_uqtgcNDjzUWAbwOOAWHjXXBH5H26YDwj7RH3ly2l6iPv5F0VFHc6FDjI2Y0GgSofVnwhviAfRJr_q2Eo7Cyhz5Yh2vw7ax1M2Wi8MVFmt7hiTcU7RZJlkymQeOJd0WxBLQJ4iIGDlxOXLRZnDG74pU2pV19TZ648_AkDQ8zZB2LzljlXr933oU1Qkf7pBlz5YBWHsG34s5DhctNTx-9VYXJI47-5R_YKiTE0IdQ8bvk7bVqTenWsneRA0e7rVjAkWDUq1IMHUyqiy9H-6Lof_zz9__f__EuP31_eXXVGbYoDoUZjs8aPcxsqOgUvdicAIdGheoCZsrjiBVmxP48_s7U-LyirolJH8HrpA2G0I8BrHGJJoij0J5c_qKlw6NgoQOfITMTTVmFFLRFgw2yAhSWgA-9cJSUTzS317qCdXWp7pAt-mkcLh-jLl-tbuVYu_gcKl3ccUCajMcc2gG-GI-Oj8fj8ZfwxTHF7-7DS_7wgj88P80-nPSPCYXz82zdy_zRY_pr9il_8PhsnNP5bcA4R9LH-Caez4RIR264XKLa55czC_L7bwxlBt7RJp_ZRebBS9gTPv6SjLb83r0kd3ojAQ2kqQPijsD8Z4j3UtwSAPm7P1l-vLG-EyLbyE8dgjuCaXMrjnXKJjdtbsV3Thl2kXAI76351WKeG4GJKfpKEdjp_C-HsoRa10yKOKv1HcZcCOt6AOSOx-OjbIfNba3vSfl6NNtv8viRA9ihKs1tqc1n6Jyf9HT49510fENu6a_yQ6bWad6ADkfCz_PTMbOLBoXJvyCbk2xPJzvIUHj9C2QmGZnJDjIxMO8ik9Rx0qnj5NGDijH7s2ROcvdykuv1_7lv_l_w_Qfw8fr6x09PaL83O2oM5FB-ur7627vrD59GjDooCZCyzairIzhUlAB0-f76AhST7B4GH2xDgDKDM12y3SNlWNm2LgkhS07LSmssMyMQxrZF9S-sQviGcnQzglkbYIYEULnOYlMyI-xpc6-9ntVI30xTyvLFl5LFCpO0bqXqO0-pXw_wiS3FAJxwUeRVUguHqq7XsLCCpByOxGM7lH1HSeCDonSoskgJNcz1onXYiy3uWYC207M2SKWDRUqIWgeouYBFHlv-Ur5ytzG2NrZeL6xJ4GM7Eg-cdY42NnDIAKEMsMsAntRqhjXsX8nbP1q73IfWo4-xfsAiJzoAdOA5R-D1fyJMTsbjh9MxxSkh-YmTo-9VXe8DCE0mUGhXtLUiJzWgHpOlgQDy4JIHhaEn3IROA1g1QFwDLJZFq1wUb4SPTBTC2YBZxjy5KE42RTHJRPEtPZ0k8RdEESNUT33y59Ql7WPiQp0IDLVLcsGeIpGDxyheydNCUCi2Qdc6rAdEU2WOiKaw2xF9fjYeP5xlRH-Qp3OikcCAaIyHTDQPWUyUfn14kRF9x09HmkKUCgOCrHqiMTpmRIXVnuhJRvSjPC0aMLCGpxQ4vr-Etx-vP9xsZMFcPomucFXZGqGx2oRUWJNOwYU4UElq4R590LO2Rgo2TK6wlLTa2Ww9Sp79CN6HWPlc2zZVyZa6LOuuajdXS12vn3lYKm34eJ9O2ipyL1-VMW0lVT7NnOBKl6Ei5DmWAJvSW5ItQo3zAJ7RM4fCFG8IQ8aAVb5aaXM7U-sUiugNkxe994xvmGy-AVJFcabWo9RHSSnbFvHo5tkSx8__CvWDLrbGtTO13iLN_pSIvphsyuRsB8NddZ5DcVehpZDl-4Ju9EVJ5RXVWeY1Yepp7GZML6SmRy6cmmb0ZK3nVA-6R1ehKhlk6CCJ3gqxYZMQxBH31RkKkSesQCCI0RDBIB1iu6KwxmARS8tZ-hjBRapwR8tRRUGMLpxqqlTKVNTy0gYWqkmPiWAYoBkbyJy6Pk35yiZvzKd1sqVtFDgGon1qDvLj5acbuH7Lv1__dPnh_Yd3Tym5uOrrQYyyoyZKPZotMvtrVgy_kPKp9AzEtzO9OVtjB8u5-XPYKO9JB11rPBQ1VX60icEoxoWZDcEuwQdstjS41ve9cxDsTG5n22Fy0WRzNa3kIkiHcR5dXWrDmyCcB4TI2kUFeYksMhurO9H-jp-Px7BcptZB54W29sGcMB3eyIsOC29zwsWW2AfsGxDBdq1Uci2Sq1BHzPRJW1CUVGnPRTjq8TlaSJmLMgvc4qnUhkBgdObjTZbOt1kaLKfddOtZuKeP7GjVga_X0NjiDgPMuXKHXdODHPHk6AQeYHI0hqXsmXo3xq7YxQYLTRuiE-eyORMsKd2jHHhu2xpQx6IaRv1NL_HacLmPXjflLqCq76hxTfXJYGMLxQu8mfqaJMtzClMonU7F-UYZrPtklJwpHb6dg7e1ljY4k0rK8qtazr7OaVIgn0aHrTRnkzH_PhVaG9FAuvYjSL3yZGrnp_y0MnAu64Q1g1jGGsD0l9ufrr_74fLm9uPPH9IrqWvq7dEAj3C2Ek-FdfNlB9rlJDM94Gcz6XShNiUoc-5y5bVNRi2ejpehTCnnx0dKx8udTYaKqqiokcwk47klhQ-WNY-D8ii2x2aa3tXFZDn54c4SU_HRzAfs3FyvpbQjFj_ROoK_2ZZ6QLAgvU0mVSiXDiuxSRVg8pjs-OKACdMTj9p1oPmADUKjsWBwnCWS0qmf2XJN8BzujF156SOx42FyqnaoyrV8Odwyc92nSblBvux3GmHBY9iyz-sO4HUqJ_VNxZH077EEO58PBJCfe-dCO7Qz5DQS7Hmd7D6Vz_AqZJhVTtP5BfFcZL5lqOvRAb-cSBK5IZrYmvicYLbgq0Du2xXTHo_OT8cxl96GxeRxHlsvcerkrK_NxPUZUEudmg1kLhWHPko-z9cThE7rSUO23x8tJY-y_5P1SQFiKDntMvRt_lnAbOP30VN7be62KMq5RokIdh1QPBtSfGx9NIazTQXLT4Qc9tb6VMfI1p9vGNNg_ROCjYSWP928fv9RHEQfmST05XM64vjQBHQ5HGH0d0HzSw7aJovHAiPTY7VyC3SHa0AjeRhVFqgvntBXX9IYQWidkaCUux6JJoJa-iKvAFV6bZwEXNv26ZQiZOxFl6_8bdtI0v38dDw6m3R1OjL-h-dktHJCT0m7377_j5ufP14-0TxQRv0C1kgtGur3ZObN0ZOdXjIkb-cK_N9bakmlrE5Mbg46bEEeGjl2nIvwhAzDmg7oE_CBGQ2WcRMJtCGTnLfOaB4c1eWr-W24h3AP-eRoDImERWiSmeJeVOKJ1IVTWfjm3_eJx6x0JukI9yuEDYdzLhdPZfx0-tW0iL5rOsA2qmmcfdA0aikob8mtMRkRomk3LnPZB4L3fYJCRaAvLm9_unr93eUtNfC-7BI3kqO0qwo7n2PK5JQpu3m_mH_LF9RbW3EjMI6F8khjYa0rtVGBDsMHVOUOCcqR0f8ktFFL5fxFZ_rcTHiZtYHsXO13Bbeh_DYoF0HNEuNUezw5HY9enJ52TuWYOkynHeXvZKc3tGB4MtukyyHpl8-7cCykz8fjh-OsBRAT55x27AKxPGMv44KhB7SmjEhEIMBI0mVW8pV1d8E2VLwL2rRpapzmXAVkxnp4zNKkdICYKpKdxRzBdUp05k6XMsoXH-pnTEbdiesgI4kx0FG2QFU_nhZjrSeL4RIjhhXZTIbRy6w2mRcaJU6-kHxRKjF2ztPsNMQ2184HMr15oP1nMihsS0YAJc3IdRwIm6JmMePkCdRam5AGTVEm2z23sBttOGn45fXVD5-G5uSj7RS2rtntXGykw7KLETwf_DXLSXYpOp0tpNxEPm44johFo-s4oXeyrvQJ0CbNYO-RIij_kH9_SvN08lmaSbzp5-dpvkgu7kR6dJ95QVS4-GMH012SlXzoyekWTUmKZw7V3ZxQnhgj6-iKxpm4kEKpLJrgkLtBpKLBXmRK_8yzQSXvyzqoTIGdtibv1un0UrIwlfSBYGI6flIq0ulkJUxzw5hgmuujF_XliWBn24AyPiETwkn3dqjS3dD9nJ-djkeT0_HAs51vtUoH7idLHQ_gWy6fKqODopqJ3IzwsLCbE8UJR3N06nAxbfqi2zF9WtG0hqK59ee5ecdyWKJEh0Utug4LU8ltchqrbRK3yUtJXSY2F1hixA-_vi84RVC9Q1pcbZOam-yds9N4oyPY5lBQOgDM69ZXIkNqN5_wTYgNaquCs76iCz85NakcR4IZtRPpM--IJCvlq87UJOik3nrPIOtcRo6hxFl_wL8oT3L9Ct64Nbr9zY4TuVMqD6WZ4O7uiyQ1cRyYqzexvRTbU0S9jllQP6bDsd1jqcwzD3NrQ-OoY8tXinJ8VVmDbNLrrgllDe44IOKNGexkGu0_oZ0sqp5kCOo7xeP9m8eNpuhFuuFYoouOjoUbTkL7bEOi1t0xof2coR3n5zL8wk-mOtKjCqFNxIUR4IyHxsoAZ8d7yORTQX37PZ2W9Gq88Z7jDSD1ji-yiUt4SvnUm_c_Xn749P76g2RUl6aMAweOUFeji7t42UaXKLEiKgs3jPpLDixtY91S1XRdMRUKDr8Jlo0ou5XnGV3RNcWAJkGo7qqMeDSqEaw8md71zzeJIEO2eA3qCD5SRuIpOK3ZHQrxZaquv3n_4-37D5_ev7mcUl3dx8L60zjXUi95RsD382iH3wzHutI5ElrhIrg0zrpePd07epzS2Q5KXPSLlUMO8OlWjCnqtmS_mVHLSXQUd_AVqUGJDd3v6mpYu6gxpXwAa4vaZrswH4ff3O1ZZK3f6C6KjKwcUn2rb7f0GfszH2-S8SyxhxJrPUOnAtZr-HB9k1_6Y1gmr09NLCYpd_3S3brRLg2fa0IoPADKl_Pi4AMHIM7cKezITa84LdGb4EVE6xTL_B3dwMOuTcf3XeY8X69N10OlW5vPPM_40zWcPA_uLxLqwRJ5li-YGbg69JVq6MJXutSYejMzlHp-POFNm0_ztkkp4kVEvtYL3X1DbebkiAKjRb7JWWFJ2-MB3T2AGhdoSvoq8M05uY3SOPsr3cXbfY-OA_o7EeHbdJUOpBhyO1vD_mtXVFfKLOLfKc3fn4wnZ4fj88PJ6T5fM_lt778B>

## Notes on the drawing

- **The bay windows are why the two front rooms are polygons.** A bay projects past the
  facade, so a rectangular `room` stops short of it — and a window on the bay's face then
  sits on a wall no room touches. It still draws, which is what makes it dangerous: the
  drawing looks right while `describe()` reports the living room as having two windows
  facing west and north, and `arch lint` raises `W_ROOM_NOT_EQUATOR_FACING` on a room whose
  best window faces the street. Writing both rooms as `room … polygon` rings that walk out
  into the bay and back fixes the fact rather than the symptom: the floor really extends
  there, the areas come from the exact shoelace figure (31.61 and 19.61 m², not 30 and 18),
  and each bay window is attributed to the room it lights. The cost is that a polygon room
  refuses `anchor`/`centered` placement rather than approximating it on a bounding box it
  does not fill, so the sofa, coffee table and dining table are placed at coordinates.
- **The one remaining warning is true and unfixable, so it stays.** `W_ROOM_NOT_EQUATOR_FACING`
  on the rumpus room: it has two windows, north and east, and none facing the equator side.
  That is a fact about the house, not a fault in the drawing — the room is landlocked behind
  the garage, with the kitchen to its west, so it has no south-facing exterior wall to put a
  window in. Silencing it would mean either moving the rumpus room out from behind the garage
  (which is the one thing everyone remembers about it) or dropping its `uses living`, which
  would be laundering a true advisory into a green run. It stays, and `arch validate --strict`
  exits 2 accordingly.
- **`arch lint` found the kitchen problem, and it wasn't the one I was looking for.** The
  first draft ran the appliances down the party wall the garage shares with the house. Nothing
  collided; nothing overlapped a doorway. What lint reported was two *walks*: 500 mm to the
  garage and 300 mm to the rumpus room, both under the 700 mm minimum, because a fridge's
  working clearance plus the breakfast table left no route past them to the two doors in that
  wall. The fix was to move the run onto the back wall (sink under the window, range, worktop
  to the corner) and leave the party wall to the fridge alone, in the one gap it has.
- **Two doors are non-hinged on purpose.** The bathroom is a `pocket` — a 2.4 × 2.0 m room off
  a 2.0 m hall has nowhere to put a leaf that does not foul either the corridor or the basin —
  and `slide right` matters: it drives the panel into 1100 mm of solid wall, where `slide left`
  would aim it at the 500 mm to the corner and trip `W_POCKET_RUN`. The laundry is a `bifold`,
  which folds into its own opening instead of over the machines. Neither sweeps any floor, so
  neither can raise `W_SWING_OBSTRUCTED` — which the back door did, in draft, against the
  laundry's original hinged leaf.
- **Dimensions are hand-placed, and one of them could not be placed at all.** `dims auto` takes
  every dimensioned facade, and this building has a notch: the west chain's witness lines then
  run six metres across the back yard to reach the service wing. Five chains around the outside
  of the L say the same thing. The living room's yard wall is the exception — a chain there
  raises `W_DIM_INSIDE` whichever way round it is written, because the rule asks whether the
  line falls inside the plan's extent, and the back yard is inside the extent of an L-shaped
  building without being inside the building.
- **The checkered floor is the one canon detail the language cannot say.** ArchLang hatches
  walls by material, not floors, so the rumpus room's famous chequerboard is not in the
  drawing. It is a room label and 16 m² like everything else here, which is arguably the most
  deadpan thing on the sheet.
