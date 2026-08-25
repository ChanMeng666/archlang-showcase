# Apartment 20, Apartment 19, and the hallway between them

**Compiled from 111 lines of source.** Two apartments facing each other across a common
corridor, drawn as one plan: the big one on the west — open living room, kitchen at the
back-left, a glazed wall onto a balcony, two bedrooms along the south — and the smaller one
on the east, where the recliners point at the TV and the foosball table stands where a dining
table would otherwise go.

![Apartments 19 and 20](plan.png)

## The story

Almost nobody who recognises this layout has ever seen it drawn. It exists as a set: a room
you know the shape of because you watched people cross it a thousand times, not because you
ever saw a plan of it. So the interesting part of putting it in ArchLang was that the
*language* asks the questions the camera never did — how deep is the corridor, which way does
the front door swing, is there room to walk past the foosball table? Every one of those has a
number here, and the compiler checks it. `arch lint` reports zero warnings, which means the
bathrooms are enclosed, every bedroom has a window on an outside wall, no fixture stands in a
doorway, and you can walk from the stairs to any of the twelve rooms without squeezing below
700 mm. The two apartments share no wall and no door: the only way between them is out one
front door, across 2.6 m of hallway, and in the other — which `arch describe --json` confirms
in the access graph rather than leaving it to the eye.

The three `zone` blocks are the piece's other trick. They carry no geometry whatsoever: drop
the wrappers and every wall, room, door and fixture lands on exactly the same coordinate. The
one thing they *do* change is the room schedule in the sheet margin, which groups by zone and
closes each apartment with its own subtotal — so "Apartment 20, 108.00 m²" is derived, not
typed. (I checked rather than assumed: strip the zones with the schedule removed and the two
SVGs are byte-identical; leave the schedule in and they differ, which is the grouping and
nothing else.)

## Fan art

Fan art — an original drawing of a fictional set's layout as documented by fans; not
affiliated with the show or its rights holders. No logos, marks or character names appear in
the drawing.

## The numbers

`arch describe --json --select zones` reports:

| Zone | Rooms | Floor area |
| --- | --- | --- |
| Apartment 20 | 5 | 108.00 m² |
| Common Hallway | 2 | 31.20 m² |
| Apartment 19 | 5 | 79.20 m² |
| **Total** | **12** | **218.40 m²** |

The largest room is Apartment 20's L-shaped living/dining space at 51.12 m², written as a
`room polygon` so its area comes from the ring by shoelace rather than from a bounding box it
does not fill. Sheet is A2 landscape at 1:50.

## Reproduce

```bash
npm install
npx arch compile  plans/friends-apartments/plan.arch --json   # renders; errors come back as data
npx arch lint     plans/friends-apartments/plan.arch --json   # 0 warnings
npx arch validate plans/friends-apartments/plan.arch --strict --json
npx arch describe plans/friends-apartments/plan.arch --json --select zones,access

node scripts/render.mjs   friends-apartments   # plan.svg + plan.png
node scripts/permalink.mjs friends-apartments  # the playground link below
```

## Open it in the playground

<https://playground.archlang.uk/#z=5VrdbuO2Er73Uwwc4DQLOK6k2E687S6QtrtYoNtt0QYtepXQEmWxkUiDpOO4RYE-RJ_hPFif5GCGlETLsp2enquzi2AjO9Sn-eNw5hudwc2KaVtxaSGJRsGneD4CJjOwBYeCleWGbWHB7YZzid9V48HZ4AzeMglM25fAJCgtlkKyEphOC2F5atealZBpthFyCSoHBiXbqrUF_sj1Fh4F33ANrNScZVt4kGpjBmew2ELBmbZj-KAssDwXpWCWZ7ARtiB5TKE2oDQIa0CLZWENFKrMuDZOqtuCw6ZQJYe8VLjOgJK8lmQMt4XmHO5_VZLfw6JU6YOBv_74E-xGAastYGr1B2eQqqpSkuxAC1Om9RakgiVXFbd6C8wCK8vPcP0WlCy3sNRqvSJxtVKVGcGmEGmBsmyK7eDMKZIWPFuXHG-nlagMWsppybmFtFSGG-AsLVrZnClQfbWRgzMw64VVlpVksgKtLQyslBFWKMkzMilpsxEpf-nNr1Zc1kuFxGVWAQO9RsRMGMtkyoGVSi6BgWQVugAtcH6vJHyOl69R8M9Xyry-f0Hmcsircl0thFx--iBsWnDEy8WTXWsOmhtVPnID92zJhDSWIO9HYBRU6lHQs1BNEh2_4mgwZlGBpQGV5yDseLAqmYThTeuseA7_giQawm8DgLVE21TVAGCpRQbTaACwYiuu4SaBksnMpGzFBwAmZSWH-CWtkErbAtarAcAZ3G4UqEeuUeNMVFwaoaQZgWUPXELOUo72wt9jeMdkdrEqWcoz0MwWXIMtmCSc-0xUBtjaqntUEj37yLUVKSshLZiQTh5QtK-AM2MRlWUc0D6cZaByQtJrSQ6zhVbrpdsKC1amSm7HgwEAS9NbYUsOQ5Q9ZylZszWRkrQNaE8M3fqvuEk1DG_ACLls9suqZJa_pO2qlxxy8cgvMIiDALROkw03dgQs3CCYKCg8GRjLhN5wNKDaOPUqkWUld6mFgalYWXJ97AlojzHtaNyduVbSQqaUNs4FtC8UWZylWhkTJqzxcECG--vPP_7vf0jRm-9uvr_95s2HW0gil9EwRMQS_T6GOTxBnEA1prU_qzW6DaOMdlWY6I3VjFKRkN4NpaC9iT5y3vBbG4QhNEwm6DJhm_BkkIxnUEHKDM_qbPOZj1pcpCryJCagBTcCA9462fABy5L9ihmH-xwB5xgAGyEztTHABfmc7qKTxZQiQwkJUXmxCcxvkRf4HIpZBFMrSo_cxZi0ejuGL5QtYMEzytfAdJ38KBmrtS3GH1M04ekIbGWTKMizPsMOAMDZUWSvNkl05zInf7JcC6UBbCHSB8mNgWQawW9wHo2iF3A-jyK6-H0PgNx8GiAaxUkU9SKQh44j-HudGA0QIZ2FQf0pxicsKEe1SYV0bIsiHyh7y5pI2RXvQdg7A8HR1soXR16-yxmJN7uO6ut9NRGHH8WZzJyR3cUhHFTxjh_DITFOyrPg2Z08odf1pDW7u-7HqY7rNWlud9d9HvSbHQ8vzUQp5HIEEstISl1NTtzNFisujcsZlMaY0Pv-82g1ap-ak2uS7SJGu-98uEoiF73uwktMEonslXZupXTKrA9198-IXzmgH5_Q_lCyBS9h-LVbPPSLYI0VYl1rdZEplgEIuQ6NGjlJOshf-MQ8DJERYR_W-csL7NzSCDzpwvq9Eu-K7LdQL7auRW693m-MGjvpxw5iIzjDYKPZyu3X_T2PQcIkvB9BxZlZa1dA-2obNLYQeyJ77JUqt0slg81Tp7ww-s-Di709P3BKeO1uVrY-y9-7R3wKXwk8SYdOT__gjL7ryWXU_PjDuXOQd85iYXCnONWa3iB7pYLoVBKCXMYsYHTDRmS2gGQWRXQv7SkAvDcL4s_f6_MO3nvd3ItXhrpEKjjqsO2F83FXw7n0wyzF8hE4vO0Qnu7Dm81O4enQ3N1y5aUvVch1O-nGO8JnKvq7WzoO5Wus51bVCF5MegwKGTVCkjlxGYeS59YlMCdCeFNj-fq2xLvtwNpJEqyNjq-9un7-2jhq_XVgrSsqEHce4E5617rTvw6DZ64lF4drvT99fsWGKygBnTjo2zHcqzw33N7XNWXTLudaVU2V-YnxgMYy3XQ0K8FT_omBL998uP3-TVtQ5ErZlRbYqVFd3kD53tljpcyyUi1dXDlElBM5FIPxMAr-8zuM4xloqF-1TJQuzvK1loJ68lyLbMl98gzb8sALTl8ggwkJwZHVATNWPdZYJ8DQ5MfBUrWWluvngJHfj4L5b--MkA8nwC57wDpomJ_senECaHrVAjUZLQQxQvap5qq82k7zoyCb9IB9dkAwPe-AHDgYhUECxh1jxMrguVcqDJ_2kUgZObaDLYwq15aXW493fi8kfI5Qr4HJtFAa_vrj3_cOV_PUMiQaLogiS0u2Npw2gOY5HWeMztcX3RC1bOFYsnPMV764onoAc9kTJpD6xLzFpU0t4DV2GnZDVeXMFxkE2hYZCRYwlHQ86A8qZw3mUdBWUhRyNJ23kmKxdRWAfqnynHPwAh8DRZ5IE-gllkPTVn3UnrJuUzDoilYPT0ragl5F_zNQ-7hTa14F6qNNJ4H6tz-2Fu2CdvcJz5oVrgDwobVQ1qrqAg88yMu1KZAzw2jHs5CeOo2ipyTaKReHHXStFrwX3arVhaNk4QA66jQLdPqJ6Qzhuo_oKqA7CrinhM-4_Cca6FADMg78Vyr8_pHxZ7fv3sC7m_fvf7r5mc5XR2CpvOY3U6W1yJRuD22iOGv63rMgMmtZrC5paYTFMkRYiBF5TWx_KSR3nGlLZ358XJO38fBL9_ud4yL36aY79IIvJIkv2FJ07_I9FUMeiJWwUmnBsT_fbcT6aSQHTRT834GO45pycVcHwVExbC-OMl2NoA3sASDzHKCa8zoqGfK-dy6UjzEwBHiZBHiXvXzGXbMrGmUaxoHa96TNZj_UMwLfz6ZCp-uSoQAdUJq-taDu0S3o9XUL2sSOJwPw1rDgyUvHbhukfjk2-My6QgcHHvpii5sYzu8zoWG9un8RDO8cX5x5dhkBa9KcGjccSpgxfM2xb4cKqHuoy3RUxUlYMANGVXxTcE11uRG-83amE9krc1fhcIj0pfJkt5CgE8HJF2qGguBdMquTC3UQONYJOg2huae-PPGPI6iG13CkfPYqu-NPwrrWOAxeRsdH2LztdMfO-x0kpxYhBcG2ywLsI3X91smmo3rIdXgK1NEoie7c_V6nOpEwC9PdfhRwjMpBcqZ9-9ZhAILyp4GP53vwlEzqPvq58PG8hf_YzuB2hhXPHRW369ERzMazepIF30ru6C3H6vk3BAjIN27cWt7bxY_oM4aU5ikewdoAE5VLBvin2x-bLUOAuVJmgUnI1fhu7zJPvdVfqnWZuVDcCMNhqcbwRTNSCsAa2o0qghxHWKTnBaU5L8GCpQ8fXyHAVjaeh0OneL5fBcTz00On4Fy-TnqP0njuT_tjKPW9_qr_DI3npydQO2dwF20PjvKkPHYeO7zZJICb9Y1XajBzGuzqOgBzH_bBiMPdHAWbRAHY5HDFVaMdnUTF2Js2aPRh12xNkdAkzpqAskEU1DUI0n5PaKiQZPfJpiHZmxlLyLL3zli8dZtOtn3mrD2z6ZnxZLdECfvfsFLpwmNL94vi2w781fUuYTFJjk1cjs1cvBd2VQhc2DItO8_oDIsOjou8Cim-g4SvexB84NPjKiSHVNibVISewBO43UTMwuVlewAnPaOKeN7aOLzZ4M0Bsd0dBgT-6cNs7LqHGQjUh9k3_4jnrRH38KaHBxYdBwy6pHiTTLFQmbR26uHPw6XT66MUfpNcmacf_dJZ79KGlY-TfUcdWDqd7C59PrHdqNEltsPS65m8dher4bUPYR1hortYyeUJrCMUeRfrMt7DOsjexTGxl1E7d8X8lfTSd0fFa0jG-DLaJVnnNcdaI37vy7Dh30Kc_mPEgFzGJmB0eb1LWl4HWr_1NWAX0Tcp8fgKqvA92fZYM1Byhm8zUlLLsVd0cx16Me_bD29cr-jeTpLl9qWHXChfr14Ua5ww4_TIwFLRm3G-hsU5RFslc5m1vd6GlQ_N63cekloeenXKWLZF0h1fYuU0Kuoy7_3ThfbY7on5Zw869lCaIc4hlL6ZS5MQmji_7KAcImP3jtZ9UvkIaUpjmWdwsgeeEpLL_U_BkmE6DcL5JLu8d9CeIJn_kULdpxzkmlGF0wpRKZeJylEo7etaF693K2Xv5DmdDMH6cFFzz-56et_Xv3FNHdkAoORLLjP8k6V3Z38jrVda_cJTC0NkHbDH_Kl-9_wtvSH7Xcmksw--VC7vFlsckqTFeyaX_ntmOQyTKJldRNcXydSp-PvgPw>

## Notes on the drawing

- **`arch lint` is clean, and it took three passes to get there.** The first run flagged seven
  warnings, all real: `offset` on `furniture … against wall` positions a piece's *centre*, not
  its near edge, so three appliance runs started half inside the corner wall; a wardrobe stood
  150 mm from a door hinge; and two bedrooms had their walking route pinched to 500 mm. The
  bathroom in Apartment 19 is 1.7 m between partitions, which is exactly why all three fixtures
  ended up on one wall — putting the tub opposite the WC left a 550 mm gap to walk through.
- **The balcony is a railing, not a room.** It has no floor area, so Apartment 20's subtotal is
  a clean 108 m² of interior, and the sliding door onto it is what gives the plan its second
  exterior opening (the first is the fire door off the stair landing).
- **The party walls carry `material poche` explicitly.** Wall poché keys off the wall's
  category, and the corridor's flanks are `party` — structurally right, but an unhatched band
  in the middle of a hatched drawing, so the material is named rather than inferred.
- **Dimensions are hand-placed rather than `dims auto`.** The automatic vertical chain lands on
  the west facade, which is where the balcony is; moving it to the east elevation keeps it off
  the drawing.
