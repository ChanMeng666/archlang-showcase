# The annex finally has an official square meterage. It is 46.75 m².

![Dunder Mifflin, Scranton Branch — floor plan](plan.png)

Not "the sad room at the back." Not "where they put Toby." **46.75 square metres**, printed in a
room schedule, under a subtotal, on an A3 sheet at 1:100, with a title block that says who drew it
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

The plan passes the ship gate clean:

```bash
npx arch validate plans/dunder-mifflin/plan.arch --strict --json   # ok: true, zero diagnostics
```

`--strict` fails on warnings as well as errors, so there is nothing here to justify: no door
swinging into a wall, no fixture stranded off its room, no room you cannot walk to from the front
door, and no route too narrow to walk. Getting there needed one honest architectural admission —
the reception screen and the accounting divider had to become *real* short partitions with cased
openings punched through them, because "you can obviously walk from reception into the bullpen" is
not a connection a compiler is allowed to assume. Two `opening` statements, and the access graph
agrees with your eyes.

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
npx arch compile  plans/dunder-mifflin/plan.arch --json
npx arch lint     plans/dunder-mifflin/plan.arch --json          # zero warnings
npx arch validate plans/dunder-mifflin/plan.arch --strict --json # the ship gate
npx arch describe plans/dunder-mifflin/plan.arch --json --select zones
npx arch describe plans/dunder-mifflin/plan.arch --json --room r_annex
node scripts/permalink.mjs dunder-mifflin
```

`--select zones` is the one to run. It prints the five departmental subtotals as data, which is the
version of this joke a machine can read.

## Open it in the playground

[Edit this plan live →](https://playground.archlang.uk/#z=tVtdchs5kn7XKTKoiG3PLqUlKVGS1e3ekGXZ62lb8srq6didmLDAqiQLrSqgBkC5xO5wxBxiz7AH2Jd576PMSXYzgfqjiqTs7taD-Ad8yEzkP1C78KJQMRp4K-fzVCp4J3I0cK6zXKjlEN5HRiinFTw3QkUJ_ONv_w0WI61imKdamyG4BEHP5zJCsIV0uL-zu7MLZ5AzUOSBIEaL5iNaEOGH2IhSqsU-3CTSQp4KBXgvrbMw1wa0QjAorFan4DTkhQOhdnbh6uXL1-evz97A-__4_uz6At5e3Fxcn726AK2YEKEU3jORQsX0JX5EswTtEjRgtM5AgJUu0hkkwoLNUTlQUuHOLlhez4IzKJxUCxBE7RwxpQ9GMIZLhKJviXcQBoVn9yZByDBKhJI2A2nBlRqsEw4zVM6CcEye0znoOb9ljonIufyIUBqR52gszDDVJQ3IThkY4PYnEsY3Mv4WBm_EDNMB_Az_-Nv_wKdbAAE_vL589a8vLt6dXd-8vbi8gYXRRU4El9Il8F8X11ewQJ2hM8t9uCBpMOqGv5pskMrKmDbC6pT2Du9F5NIlCUZ6LgLdUKLBbbgxpugw9iokMoRIaxNLJRzaof9GxnYIs6XDPRmjcjISKbz_06v9bdBvMZuhsYnMSfYvLs7fnF1fvBiCou0HqeZoDMYwNzqDMkGDIFgbtuEmxB2phCat8WTc2ijBuEiREextm0MjSstyYVWrB3oLYwWQLkWYpTq6O4XLq3345e9wefb2An75-zZazq4vzuBJ9sv__mEffqC9ZcW49WAWcoMWlRuG5UsLr66vvn8Hs637zfpFmogiSrz-QJRqi9brkID33z-_ubo5e0O4fvv0NtBBokvIiigJpiItvBVKLFix_m1AnwVZeDwEpR1ZZZF5U2IddQmpsPRGXctRWojRyI_VVlaSZplnFklJv6b3hscGYKkWKSknWSu4ZY4xCLX0asArSAtzmeI-3AoTJeSqIiNnCHt7P1qtbsFgro3zG8tqqgpWN7-vO7t-J-yf_3LLYqwV5M9_uR1CmcgoYY9ARm80m39wB8EH8izWDjFLESKhlHY7uxAbOXcgcmGcF81LchnGBZ9JIlRwdf361evLszc1mJ6Tf5KRk1qJFCy6ryykYqnJh1qIdVTQHvy_Ic6WMBfK0o7u7HppKe_KpUjBYKRNPGTi-Lf5XKZS0ERWC5YG7TLtrrNg5CJxFhKdxmjs_g47uMFKdCHlWQkpA_h5B6BQhJFlOwC7cLswMobp6PbUS00YJ4kdS3sIk9GINi26q-W2SIW1UIo0tTAejYZgNcvg3hUGYSaiO4wZWCvHv4gIIRUqthQiBHnT6ajljvwOCcICJiXSReqlgPdkaHZ_ByAQuQMhop0deMxI5LgDYCORIoxPxyMaorRxCRT5DkAsMwuiIErSlAe2_ckOQIoLVPEOU0yBJS9mqYyAfXFQpJQ0I9Wz2bKKfH6BuYhEjCxmVjCtjfUxkIy8FOmdZViXGF0skn24tdLhbfBcl1c3__768tXXIB1olS5BiQz9ghylYmkw8htxu2olDBssxSuNdN7KYyPmHE8TLIy0TkYc4kmXbY6Rq9y0gFgsU9IiiFIhM5IxUQc_g3UG0QUeP5FkRBTdsC9d1bBau2Y-YQmpCUnEeyLSy4FHeEE8wOBMgc5R7bHGtlOZU8hqnxV-sMyawQhzEgSIVKvFgw0YsiXlqMCKFC3MijSlT0HsPD6TcZyiF9WddFGCakih1nmPVum2z2hEZLT1O0HqvD_w2rG3t7cHNsE05be_9o8xD0ZwD-MTyMiTpCgs1qke6ZB12uByWNPHepJqEe_NUBjJwmj5bpIpbSQZJ8j4mScW7x0aqY23Y4XWwsFoBJmgr0UKkVaRQd76J6Ph6A_w5GA0GrXfjU9GI_pUv-OI5XUjyKVxG6etDZoR4V8kmLcySgSmX9lKRyoRRJoSDFRRiPtO3GGz4l6J1kGkjULzdUtzrHTeFmfIlk0TUDnSWvyatFMXypuNsC00FDVaW67lh0xGyYeWs2zJljzmz_DkuBIhvzlisX3qYBAnmzHGh9MA4t81KJTz28ggqbGPvIR7Sm7AOp0zwogihnFVDhzMwvvrhmH2GudX15cX16DnwV-htydvw91knIW-1AUopNjOXo9cTFc-Iorch7KXt7HnbTKpBOTfHQbeakc8F5kubAg3qVSUMtQ6qzgbC_45oYTAQSIcZUDa0JyfiDcuTRoiAnOCXSU5YQWzwrH85jJNMd6H59olwZEnguP7HKQb-nAwW_LrsE7NfVrjEmRkjs954XOXrEdf7Fp5dPjyduj3eov2fAZiC6hHm27qwB4JYyRyrM5J-1ve17KaSev2ErlIav1jyyyMsiB9xE91yaCx_CgpWgiji8rBNooXzMqLnFKNvFAUnEnMAiJ2hbekhlItbqGUsZcyquDUQ1rnddQ6maac4lqikytaUlTSgFnhqggRFL6kydVOUfXo9y8XkWc8UEqyXBiRJ57HAWl9REizj1IXlhRApHc-BR40OXCklfKRGwQDU1kuU-S8XKSpLjGmIkdYW2TY1ROW9udsa3srgyX1aQvbo4XtBhmQvN8_attkr5un-PhlXn6vQx_H5A9qkzMcDceTKRN3QiyHD6tGYcwH1c9mgGlPfjIZr4XiVGAzRZ3ZVajsw_LcbXT1HbL8h5OefSwjYu8RDB52GDzsIaqMsg-4GWp8MGphhU_9ZJVbsY7bdIVPfVhe8P2xo1fw4dNJW1mf_cZ_DHp9dfX2_dAX7d5PxUhUUsa672MWJe7dVoHvMQkfJ6BMdIrwo75Dtp8l44qYyp26c0T9K5Gmdda35Nnss7yb7Zbp3uc2lIjUJzpFvEDHgZNjYvBu7DcT8RFDHZAI6tyxF_odpLYTGh7ZInMwaHoSvgz1aYyPAyHNO4VSqpgaKrTvpQ4pvh2G6BScs0ukiffhtbM-_wiSCpgrKSLlkJTNcD3ayoS4spaU05DYqa_qmzLcv9xnLI4hMn5mOIALTGlvfJJs5U8IFFTvyUtCSs1CGDRp6xXzM4CCWjueuRVIIpO-IcgqW_So0xXU84aha62zVdBPtZx9ATR4zy8vKTJWkm6W5RATlq0TzP51r6vYH1akjHnZz0wlUy8fHzgYlN3i_dG0QSVDee6HdziBSJqoSEVI1RquKHjB4KxOHR7yxCNo6Tqr5LVPVrenjbFOhiJDBYOzDJV0Eu3DxUL9GFgNXsivRwKctlj9Lgz9J3huUNy1dy-gPNAJYyqdaIcEhmcHfD9p8fOcwu-5NkbGtNUM3JViG7yMPmRd8MMGnN7eH7Rof4vqK9umuIwe4pUVXidU9AP-oLOtkLbI83QZII8f0DhagXzvh59TOeoCJtXMYrGyp1zXD87opfE9pIjcc47l_T5cKd_C4Zy_UzDViY51QhqIdakguJJSGEx0YTEcOgTkuTCAKvTzuAqxvgwLhUdTnPju5qq3CX0ItxLq-pUscNWjzyFp8_XMZydo64vzW63gG4rY3xKN3-TafnsLuVQ2ONCQaTvNvcpEWwfP_xPOry7f31x_f37z-ury1M_yTbK6giJI8talAlMo33YmhLk01kGuJbXcraZgyTvF5Rdl5BzKZhhaYhiTHPYIjQTLQ2X8LP7g_RdQFPGtkaC9nDtQieESfg-29F0Vp6FxmLtNH7zpCHbwqyChFdQlH-FPKW8J-E_pbQc_zOogVbGBkUKpx5S2kMajVUpp4AMYShgbGGSYw40EhcV3q66zcVCKJUg19BKoS8LOWl5nw1pV9iwckOquJ5kHdnAqL8U4Vb5LOJPpBppp1ipM2QdzdLwFpqwL4uCMuNnluNHEJ6o6ukPHK52ydqYo5lBy05pTh1JaBFsi5qFh5d2zr16r7vBfCyzQel_ikxppWMrBsdS9ya4GV_4xENEwR7oxbrSYOLMpnydSj9c7g3OuqYN18kkEWRKRP-QimXNNX0mHGraqj6vsUT6sjYm-urSOn-naXJi2qp4VDthve-ooVqxO4xBeq08oV0lVRxunVcGYp1VVJG1zs9qkZ1oVZ4Nh-KqRlKzlCKajUcuJVj2l38yJXrZa2Ke1oFs9cN7-YasBg5IbcdyLCk29qofJkcYXE3WK85Vtty45rfYhJaRILT59-cU-sTt2-hljT066Y082jOWARoMfM3Z6Mm2P3UTDZNTF3Tj24PE0TI43jmXJ_0BNyGo_m0LA78GwJ6XglJB2eWWDRsMJ58-PYWI0JF_ejJ1sHHvSwd3E8Gg4HnHO8bixvnv7KHrHR9P1Y1mQF6IlyB597pElh5EVMfqGzOTRLPvxjxenH_94kYYG0aPFGsYftMdPesT1XhcrjqTRrO7JVo-Aqr7JYwg66hm_2cBaEx5jZNPptvG_X3Pn5eubvavvb363PkgIIw_OtX51HKFMJUZ7xwfttj6JXrkMQRd8DLbDS57IVFudJ8u6NPGnuKQl88IoyQf6Mn42rxNbXidUfFRqs-GHuoQ-33NG1e2FDChraGe5K9iLAq0bA0QJFVcB-4gs96TGPvJ1PMBjsCZdrIMvxIroEhMARGImFbrKYoaHzHLgmQrSaYvnc4Mxqp_ECtPN_vcdYf76_ffn4nShJXQNS7qe48VgYYEKjXDV0Uqqdd451PPXdHThqjtrfBqC4Zxs9Q4QLxOqtIjyD_Sncw8l6G_Y-P-cIBxPR0NyCu1ynjSop8_Fs4IUQ1lDXUxJ34z296ehiG9W9Fvu85DpCP4FJPwzNYCGMD6qV5xOuXTuwD4O5OBkugnk084amBGxfNxoTN_kvonjydN65pqJjVI1KeKv8SZtpXonqG3K5k5H52D_WnALW69knXMR8fXHRHMJHml_hcVfvKBLfA-UIhcZX09sHMn4iCQ8aXZpcjga3Z-0rOqdyIIqMKcPQUshHYDVc1GDHp74A6xK8MdV66xuRwnpG4GbgOmqmu24gMlo0gUm9er4gJc0pwPbNf-QuFCoNhh8d5QW1uFndmlCshQl1fTqLixBWsgLS8epfP_Kaf8a7iotwSa0n9Q6iRfYihVlsqzbMcuqygh3kJnSEE_q30JvJi0sF8Mx5nSc66-x8d0UTG2fcxAqXkKlCSRY8gbD48mKYKlar_tc8TKINYiw12mz115BfTpdi3pOM7bBWidUissGdjxqqO2Ffe9nbAPOk2WaSvsA-Ol0HfA7P2Mb8I8yg454x0dbKP6jzLaBxiVfGHsAup7aFzxjG25Gfbw2sb6Nv4HYt2gwli5ZQe5RCJ1LNADVa5Vd9Kha2-Oc8_Ct2qZ16sH9a6sRPj7u0n7U8TyOfSVN2rbEzHugFRfEKzxt6D9YzUPaPqglnJYXenAT40tjR59pLzAV3WQxHA80QjkJEq-Nm-YEiqn98xD2Dj9KBT2wk8la2O9ozkZUbSNhVlCPppuJvaI5G1FFT-A4aMrLJsy1-vjtPWPUZsPu6nOkVmn3hfsVWvhiIaSyzhdX_MCDns-pz_lNllE3v7odk0uMKN07v7i8ub7w58d0vNHcxWSEqv3k08VQhnAsqI5TKP74Yp1yCYdmj06zmyMSvqYKkXAi1YuCAle4Ukw3pqtu9FxrlxtJ5-2Xun2J2EccSEQ632vuC1BAM9I5VHxW0BOG2AjYGv2rPxJoy6a5vhEExBlrk_4ftfNXBgl72JzwrUYTqVjXwgD_efOaB1T4b0adGxkvEKB6fQQnVMpsQf2IiqsgeiVfwX_tKUAlI10u1TnM08Im_SbzJz9_0FMlzNIxgfo6oaKb-35shYddR_q0dfrJttCuFNay4WbpZMMiR5MvW6RVkUw2VCTcxWhXJAdr8vr2ofCjgKbT3wjoeNJf3zRAnzoFR3Vz-kud0MYAUkbZGMqoR4GrS0uVKdZmEc5_HgJNHgU0GW8GmtkMYCYsXRfZbFJH2ygq17JWrmWt7AVay1q5lrUeoJkt17C2KqOjDlDrTnznnOw31wZb5ONOJB0fH5PRHh_UKntw1A2lfC9A1tHUExhOXcKY6iYRsWoKdQoCpqPRXskXffV9eDCIn7Dh66TVddMQlBzeO1576E9dVMx3TD-imaeaTxT9MhSBtLHoOy1K9zZKbJFPVjK8p8ThdNxYd1W-thlayej4APZ3MUinZ8tOes69v-lobYZ0o2dV7VOd8D7I5tJ0-QDyaH3S9R1N2IxplkK1yeQewCYyr5dCdSDrjtq2-x77cBuH3_geOj3kZdptMoqbCgV5yrqg9jvku7PWA764BGHoST9_d9mvseQL9iJyhUirW8a-meIpokc7PjCF_mxqsnJPhtmkdBMqGokx_zhk-_JL6wHJr-ihRv0jnflGdDOCHwuYy3uM4eAQsowvYFdGYxNEV7MwL7iRT6Crzwd1nm_ufx6NTIYzOt8_IFm_u77648X5jd-k_Ra94SkjumktMt_OrJ_uZV6G3buR_JwlP5PMCbNWQYpQ87qO4P0BD-OHBD7MljA4M1HyRvgEBiCmlHMwGU2O9kYne5PpgOPjp53_Aw)

The link carries the entire source in its fragment — nothing is stored anywhere. Widen the annex
and watch its subtotal move.
