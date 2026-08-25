# The annex finally has an official square meterage. It is 46.75 m².

![Dunder Mifflin, Scranton Branch — floor plan](plan.png)

Not "the sad room at the back." Not "where they put Toby." **46.75 square metres**, printed in a
room schedule, under a subtotal, on an A2 sheet at 1:100, with a title block that says who drew it
and when.

That is the whole joke, and it is also the whole point of this repo. A paper company deserves a
paper drawing, and a drawing is a thing that has to commit to numbers.

## Five departments, five subtotals, one total

The schedule in the bottom-left corner is not typed out. Every row of it — every name, every area,
every SUBTOTAL — is derived by the compiler from the rooms themselves. There is not a single square
metre written anywhere in `plan.arch`.

| Department | Rooms | Floor area |
| --- | --- | --- |
| Management | Michael's Office, Conference Room | 87.00 m² |
| Sales Floor | Reception, The Bullpen | 240.00 m² |
| Accounting | Accounting | 48.00 m² |
| Amenities | Kitchen & Break Room, Back Corridor, Men's Room, Women's Room, Supply Closet | 118.25 m² |
| **Annex** | **Annex** | **46.75 m²** |
| | **11 rooms** | **540.00 m²** |

The grouping comes from five `zone` blocks, and a `zone` in ArchLang is a promise about *nothing
geometric*:

```arch
zone annex "Annex" {
  room id=r_annex at (21500,12500) size 8500x5500 label "Annex" uses office
}
```

Delete the wrapper and the drawing is byte-for-byte identical — same coordinates, same ids, same
SVG. All it does is *declare* which department a room belongs to, which is exactly the kind of fact
a floor plan normally leaves to whoever is reading it. Then `schedule rooms` groups the table by
that declaration and closes each group with a subtotal.

So the annex's number is not an opinion, and neither is anybody else's. Sales has 240 m² and
Accounting has 48; three people in the corner by the window are, on paper, running an eighth of the
floor. `arch describe --json` reports the same numbers under `zones[]` — the drawing and the table
cannot drift apart, because neither of them was typed.

## Everything else is a normal office, drawn properly

Michael has the corner: windows on two facades and the glass wall onto the bullpen, with his door
and the conference room's opening onto the sales floor a metre apart. Reception faces the lift
lobby on the north side, and Pam's desk is square to the door. The bullpen is 195 m² of open floor
with the desks in the pairs everyone remembers — Jim and Dwight pushed face to face, Stanley and
Phyllis, Andy and Creed — and the accounting corner (Angela, Kevin, Oscar) fenced off by a screen
that stops two metres short of the floor, so it is a corner and not a room.

Behind all that: the break room with its counter, sink and fridge backed onto the wall by the
catalogue rather than by a coordinate, the two restrooms and the supply closet off the back
corridor, and then the annex — one door, three desks, and the back stair down toward the
warehouse, drawn with its DN arrow.

Every architectural check passes:

```bash
npx arch lint     plans/dunder-mifflin/plan.arch --json          # zero warnings
npx arch validate plans/dunder-mifflin/plan.arch --strict --json # exit 0
```

`arch lint` reports nothing, so there is nothing here to justify: no door swinging into a wall, no
fixture stranded off its room, no room you cannot walk to from the front door, and no route too
narrow to walk. Getting there needed one honest architectural admission — the reception screen and
the accounting divider had to become *real* short partitions with cased
openings punched through them, because "you can obviously walk from reception into the bullpen" is
not a connection a compiler is allowed to assume. Two `opening` statements, and the access graph
agrees with your eyes.

### The sheet did not fit, and core 1.27.0 is what noticed

This plan used to declare A3. It was never an A3 drawing: at 1:100 the building is 30300 × 18300 mm
on its outer faces, and an A3 landscape leaves 35350 × 11550 mm once the margins, dimension bands,
title block and the five-group room schedule are taken out — 6.75 m too short. Nothing was clipped,
because the sheet margin gives way first and the page grows past the paper, which is exactly why
nobody noticed: the drawing looked right and only the declared paper size was a lie. Core 1.27.0's
fit rule raised `W_SCALE_OVERFLOW` and the sheet moved up to A2. The schedule is the punchline of
this drawing, so dropping a margin table was never the fix.

One deliberate deviation from the brief: the title block reads **Dunder Mifflin Paper Co.** rather
than the full "Dunder Mifflin Paper Company — Scranton Branch". The project cell is a fixed 34 mm
wide on the sheet, and anything over about twenty characters overprints its own PROJECT label. The
branch is named by the plan title and by every room on the drawing.

## Fan art

**Fan art — an original drawing of a fictional set's layout as documented by fans; not affiliated
with the show or its rights holders.** Room names and their broad relationships follow the layout
fans have reconstructed from the episodes; everything dimensional is plausible rather than
surveyed. The footprint is a round 30 × 18 m, the partitions land on a tidy 50 mm grid, and nobody
has ever measured the annex. Now somebody has.

## Reproduce it

```bash
npm install
node scripts/render.mjs dunder-mifflin     # → plan.svg + plan.png
```

To check it rather than look at it:

```bash
npx arch compile  plans/dunder-mifflin/plan.arch --json          # renders; W_SCALE_OVERFLOW as data
npx arch lint     plans/dunder-mifflin/plan.arch --json          # zero warnings
npx arch validate plans/dunder-mifflin/plan.arch --strict --json # exit 2 on W_SCALE_OVERFLOW
npx arch describe plans/dunder-mifflin/plan.arch --json --select zones
npx arch describe plans/dunder-mifflin/plan.arch --json --room r_annex
node scripts/permalink.mjs dunder-mifflin
```

`--select zones` is the one to run. It prints the five departmental subtotals as data, which is the
version of this joke a machine can read.

## Open it in the playground

[Edit this plan live →](https://playground.archlang.uk/#z=tVvdchtHdr7nU5yCqmI5AREAFEiKtpyiKErRWiIVirIq2doiGzMNTJsz3bPdPRrCLlXtQ-QZ8gC52Xs_yj5Jcs7p-QOHAC3buhABsvub8__XPY_gRaFjaeGtWixSpeGdyKWFE5PlQq-G8D6yQnuj4bkVOkrgH3_7b3AyMjqGRWqMHYJPJJjFQkUSXKG8HO082nkEx5ATUMRAEEsn7SfpQIQ_xFaUSi9HcJkoB3kqNMhb5byDhbFgtAQrhTP6CLyBvPAg9M4jOH_58vXJ6-M38P4_PhxfnMLb08vTi-NXp2A0ESK0lrdEpNAx_lJ-knYFxifSgjUmAwFO-chkkAgHLpfag1Za7jwCR89z4K0UXuklCKR2IWWKX6wgDJ8Ijb9F3kFYKZjdy0RCJqNEaOUyUA58acB54WUmtXcgPJHnTQ5mQR-JYyRyoT5JKK3Ic2kdzGVqSlyQHREwwPVPKIxvVfwdDN6IuUwH8DP842__A5-vAQR8fH326l9fnL47vrh8e3p2CUtrihwJLpVP4L9OL85hKU0mvV2N4BSlQagb_tVkg9JOxagIZ1LUnbwVkU9XKBjFXAS6oZRWbsONZSq9jNmERCYhMsbGSgsv3ZB_o2I3hPnKy10VS-1VJFJ4_8Or0TbotzKbS-sSlaPsX5yevDm-OH0xBI3qB6UX0loZw8KaDMpEWgmCrGEbboLcoUkYtBom49pFiYyLVBKCu25zaEXpSC5kavVC9jAyAOVTCfPURDdHcHY-gl_-DmfHb0_hl79vo-X44vQYHme__O_XI_iIuiXDuGYwB7mVTmo_DI8vHby6OP_wDuZb9U32hZYoRZSw_UCUGicd25CA9x-eX55fHr9BXFaf2QY6SEwJWRElwVWUg7dCiyUZ1r8N8LtAD4-HoI1HrywydiWyUZ-gCSt26lqOykEsrfpUqbKSNMk8cxKN9Bv8bGltAFZ6maJxoreCX-UyBqFXbAb0BOVgoVI5gmthowRDVWTVXMLu7o_O6GuwMjfWs2LJTHVB5sZ63XnEmnB__ss1ibE2kD__5XoIZaKihCICOr015P4hHIQYSLvIOsQ8lRAJrY3feQSxVQsPIhfWs2heYsiwPsRMFKGG84vXr16fHb-pwcwC45OKvDJapOCk_8pBKlYGY6iD2EQF6uD_HXG-goXQDjW684ilpTmUK5GClZGx8ZCIo78tFipVAjeSWZA0UMuoXe_AqmXiHSQmjaV1ox0KcIO17ILGs5ZSBvDzDkChESPLdgAewfXSqhhm4-sjlpqwXiE7DnUI0_EYlRbd1HJbpsI5KEWaOpiMx0NwhmRw6wsrYS6iGxkTsNGe_iIiCanQscMUITCazsatcMQaEogFREpkipSlIG_R0dxoByAQScDHU7bj470RHHuYHE2IyEbFWsrYweRwbzxGDSUSpYVPR7ZN4aUlqtywYopgMTfsskfWTpCnBRtTKpcS14obCZPDyWgGWYbYLpHSw1wujJW0cF6oNEYiltI7wsWMzH6MKj_eg1I42B8dzCBDnVpPVDihYlzy-Prj1fuT4zenV-c_nF68fHP-8frrEaU8Nlg2bgLOCx0lqdKS0xw6LAuAdMImg9RlBp24nVNr-0fRcolwPGUlRSJHdBeJVLJodwC0sT6BIt8BiFXmQBSo2jSlhe0AvQNBUjtEIZKdF_NURUDJLXhmiq6Wmvl8VZUS_ICFiEQsSVikTmOs46ICo2Yp0huWqE-sKZbJCK6d8vI6pIKz88t_f3326htQqOt0BVpkkh9IaT9WVkZs2dfrYYdgQ-hhq1Cew2ZsxYIKlEQWVjmvIqqZMDi4XEa-ynsCYrFKydCiVKgMJYvUwc_gvEU1MI-fUTIiii4pOa27bO2uc64AQ62HEuHQjo4-YIQXyAMMjjWYXOpdCgHt2vAIsjoJhD84Ys3KSOYoCBCp0cs7ChhSaMqlBidS6WBepCl-C2Kn9ZmK41SyqG6UjxKph1i7eE4RVbDgElFE1jjWBMaH0YCtY3d3dxdNNE3p42_9R5h7Y7iFySGQc6ZSOFnXzmhDzhsrV7Xfs52kRsS7cymsImG0kiHKFBWJ0Q5U_IyJlbdeWmUsB0YtnQOMNJnAX4sUIqMjK0n1j8fD8dfweG88Hrc_TQ7HY_xWf6ISgG0jyKWJw0ctBc2R8C8SzFsVJUKmX7nKRioRRAYrNqmjUEhRiKufuFtK5yEyVkv7TctynArRbS7Js3GD1B6tVn6D1mkKzW4jXAtNihqtLdfyKlNRctXKPi3ZYgr6GR4fVCKkD_skts8dDORkM8bkySyA8KcGBZsoF1mJZsylDOIeYRhw3uSEMA7hOjQVwS04ATYMU9Q4Ob84O70AswjxSrI_sQ93uxsS-soUlLUwjOCShVmTj4gif1X28jZh3qbTSkD86UngrQ7EC5GZwoX8jWljBNe1zWoqb0N8TrDC8pAIjyWlsbjnJ-SNer2GiMCcoFCJQVjDvPAkv4VKUxmP4LnxSQjkiaCCaQHKDzkdzFf0c1j3OlwnVvmNCp684GIw67EXd688OnyxH7Kut1jPr0BsAfVY02VdKUXCWiWp-MnR-lvR15GZKed3E7VMavsjzyysdqC4hEpNSaCx-qQwWwhriirANoYX3IpFjrUb1QdcegqIKBReoxkqvbyGUsUsZalDUA91Mtuo8ypNqWdwSCeNCNBQ0QLmha8yRDD4EjdXmsJ2nPWXY5FVTwuiCGW5tCJPmMcBWn2ESPNPyhQODUCkN9xTDJqmIjJac-YGQcA451CppEZHpKkpZYxdo3CuyGTXTkjav0atbVUGT-qzFvJHB9sdMiBx3N9v-2RvmMf8-GVRfrdDH-XkK70pGI6Hk-mMiDtElsOXdaew9kr3sxlg2psfTyf3QlEpsJmizu4qVfZhMXcbQ32HLP5y2KPHMkL2HsDgkw6DT3qIKqPsSm6GmuyNW1jhWz9Z5VasgzZd4VsfFgu-P3f0Cj58O2wb67Pf-R-BXpyfv30_5CkIx6lYIpVYsXLPQ4V7d_bCQzsR2q0yMamEH82NJP9ZcccVY_9Yj-JwICjStK76VrSbYhaH2e7cg2NuQ4lIudAp4qX0lDgpJ4boRnEzEZ9k6AMSgaNQikJ_gNR2wgQpW2YeBs2Qh_t6LmM4D4Qy7whKpWOcUKHeSxNKfDcM2SkEZ58oG4_gtXdcfzR9McfbTomINSRWM9TgtyohGlUorGlQ7NSV0pSLBsIjwqIcouJnlhK4kCnqhotkp36SgEn1FqMkpDh9hUFTtp4TPwMocFbGzK1BIpn4G4SsqkVGna2hnjQMXRiTrYN-ruXMDdDgPf14iZmxknTzWEox4bF1gdn_3Isq94cnYsW86memkinLhxMHgVJYvN2fNajoKM95eYcTiJSNilSEUq3hCpMXDI7r0uEuT7QCH11XlfTsw3X1tDHuk6HIpIbBcSa18kq6uw8L_WNgNUQhfh4KcNZi9fuw9J_guZXipq29gHLHJqytbKKdEgieAvDttMXPc0y_J8ZaFaOqCbgrxTZ4GV1lXfAnDTh-vN1r0f5W6q9cm-IyuotXVnidVNEP-NFkWyFdkefpKkAe3KFxvAb5npefYDvqAyb2zGK5plPq6wfH-KOJPWiINMSP1e0IzjWPcKjm7zRMdaHjvFAWYlNqCKGkFFYmpnAynOIE5IWwIHUYkFIX4taHXqE54XHxerQJcwi_lur6jSxw1WPPoWjjfuZXF2j3N-fXRsO3mLG_Qxq_zY377hpypV0IoKHS9oYmmIlxHp7_J5ycn72_vPhwcvn6_OyId_GQrO6gEBKjdanBFprn-IiwUNZ5yI3CMwxnMFmSpqj9woqcUtlchpGYjFEOu4iGgqWlKn4WX3H8AswiPBoJ1ku1A7YYPqHP4EqeqngDTcB81BwsNBPBDn6VJIyGuuVD_BnWLQH_KX7s4IddHaQqNxBSaPWI0hbSZLxOKS68A4MFYwMjCebJRoLCwx9VY3zroRQrUHrIEqhbws6z2GbDs6rqWXhA072fZFrYwamiFOFU9S7iTGcbaMZd6zBlH8z-wRaYsm6IQzCiYZenQRMdUZvoRnp60hFZZyrFAko6BaDSoVROgiulzMPAisMzd6_VdPivhSyk41jCRY2yJOUQWOrZZNeCq_gYiGiYQ9uYNFaMnLmUDmhxxsvB4IR66uCddLSDnoTkD6lJplqTO-nQw1b9cVU9qru9MdJXt9bxM1O7C9FW9bPCA8Vtpg5zxfo2SuG1-YR2FU11vHFblYxpW9VFopqbp017tlV5NjgGd41oZK1AMBuPW0G0min9bkH0rDXCPqoF3ZqBk_qHrQGMVDSIo1lUGOpVM0zKNNxM1CXOV649uqSymlNKKJFafHL7RTGxu3b2K9YeHnbXHm5YSwkNFz9k7exw1l67iYbpuIu7ce3ew2mYHmxcS5L_iEPISp9NI8A6GPaUFFQSopbXFDQeTql-fggT4yHG8mbtdOPaww7uJobHw8mYao6HreXp7YPonezP7l9LgjwVLUH22HOPLCmNrImRBzLTB7PM6x8uTl7_cJGGAdGDxRrW77XXT3vE9d4Ua4GksazuyVaPgKq5yUMI2u9Zv9nBWhse4mSz2bb1f9xw5-Xry93zD5d_2BwkpJE751q_OY9gpRJLd8N3BOqT6LXbJXhjysp2eskTlRpn8mRVtyZ8iotWsiisVnRDQsXPFnVhS88JHR-22uT4oS_B77dUUXVnIQOsGtpV7hr2spDOTwCiBJurgL2PnntYY-9zHw_wEKxpF2vvC7EivBUGAJGYKy195THDJ8Ry4Bkb0lmL5xMrY6l_EmtMN_rvO8L87frnc3G8IRGmhiXed2IxOFhKLa3w1dFKakzevV5B955M4atLgHQaIsM52fqlKnpM6NIirD8kn87dlSDfAOH_qUA4mI2HGBTa7TxaUM-ci3YFKYa2BqeYCn8zHo1moYlvnsgq5zpkNoZ_AQX_jAOgIUz26yfOZtQ6d2AfBrJ3ONsE8nnnHpgxsnzQWEzf5r6Nk-nTeuc9GxujakrE3xJN2kb1TuDYlNwdj87B_bWgEbZZqzoXIqL7pImhFjwyfIWFL17grcg7RpGLjO57NoFkso8SnjZamj4Zj28PW171TmTBFIjTu6ClUB7AmYWoQZ8c8gFWJfiDanRWj6OE4kHgJmC8--c6IWA6nnaB0bw6MeAl7unAdt0_FC6Yqq0MsTtKC-flr5zShGIpSqrt1eVihHSQFw6PU-lCmzf8M9xVWoFLUJ84OomXspUrymRVj2NWVZcRLnUTpSGf1H8Lsxm8eIaGEsscj3P5XiDdTZGp6wsOQscrqCwBBYvRYHgwXRMsduv1nCteBbEGEfYGbYraa6hPZ_einuCObbDOC53KVQM7GTfU9sK-5x3bgPNklabK3QF-OrsP-B3v2Ab8o8qgI97J_haK_6SybaBxSRfG7oDeT-0L2rENN8M5XptYHuNvIPattDJWPllD7jEIkytpAaqfVXXRY2rtiHNCy7damzEpg_PP1iB8ctClfb8TeTzFSty07RFzjkBrIYie8LShf2-9DmnHoJZwWlHozk2ML80dfa69lKnoFovheKARymGQeO3cuCdQjOOfu7A38pPS0AM7nd4L-z3u2YhqXCTsGur-bDOx57hnI6roSRx7TXvZpLnWHL-tM0JtFHZTnyO1Wrsv1FcY4YulUNp5bq7oDRKzWOCc89ssw2l-dTsmVzLCcu_k9Ozy4pTPj_F4o7mLSQjV-InLxdCGUC6ojlMw_3CzjrWEl3YXT7ObIxK6pgqR8CI1ywITV7ijjVfQq2n0whifW4Xn7WemfSubMw4kIl3sNvcFMKFZ5b3UdFbQk4bICcgb-ScfCbRl01zfCAKiirUp__fb9SuBBB02J3zr2URpsrWwgL9vfuYeNv6bURdWxUsJUP18ACfYymxB_YTXyAEAf2KsoH_tLYAtI14uNTks0sIl_S7zA-8f9HQJ83SCoNwnVHTT3I-88Ek3kD5tnX6SL7Q7hXvZ8PN0uuEh-9Mve0irI5lu6EhoitHuSPbuqevbh8IPAprNfiegg2l_f9MAfe40HNXN6S8NQhsTSBllEyijHgOuLi1Vrli7RTj_uQs0fRDQdLIZaO4ygLlweF1ks0vtb6OovJe18l7Wyl6ge1kr72WtB2juyntYW5fRfgeodSe-c072u1uDK_JJJ5NODg7QaQ_2apPd2--mUroXoOpsygSGU5ewprpJhKzaQh-BgNl4vFvSRV9zG960oleW6Dppdd00JCUvbz09exhemonpjuknaRepoRNFfgxmIGOd5EmLNr2DElfk07UK7ylyOJs03l21r22G1io6OoD9QxzSm_mqU57T7G82vrdCujTzqvepTnjvVHNpuroDuX9_0fU9btiMaVdCt8mkGcAmMi9WQncg64natvseI7iOw9_oHjq-NWfbYzLMm1oKjJR1Q80a4ulseOXpxRkIi69O8t1lfsaKLtiLyBcirW4Z8zCFKcJXO66IQj6bmq7dkyE2sdyEikZkjN8vbV9-ab1x-hW-JWp-xDPfCG9G0GsBC3UrY9h7gi-PkWMEp6H3tGoWFgUN8hF0_f2gzgvj_S_4octQRcfzA5T1u4vzP52eXLKSRi16w1tGeNNaZDzOrF-XJl6G3buR9OIqveRNBTO9Ucd4Fa_3ETwa0DJ6SeBqvoLBsY2SN4ILGIAYS87BdDzd3x0f7k5nA8qPn3f-Dw)

The link carries the entire source in its fragment — nothing is stored anywhere. Widen the annex
and watch its subtotal move.
