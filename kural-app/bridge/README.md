# குறள் பாலம் · Kural Bridge

A free word game from the Central Institute of Classical Tamil (CICT), Chennai. A student reads a
couplet of the Thirukkural in their own language, then builds the Tamil original again by laying
the scattered Tamil words down in order, like the planks of a bridge. Every Tamil word is also
written in the player's own script, and the meaning of each word appears as it is placed.

It is meant for the students of the 22 languages of the Eighth Schedule (Kashi Tamil Sangamam
5.0 — Thirukkural Payilvom): the first step from a translation into the Tamil text itself.

## How it plays

1. Choose the language to read the couplets in: the 22 scheduled languages (Kashmiri, Konkani and
   Manipuri in two scripts each), English, or the Tamil commentary for Tamil readers.
2. Choose a level: **Easy** (one line at a time), **Normal** (all seven words mixed) or **Hard**
   (three extra words from the same chapter mixed in).
3. Play today's kural (the same for everybody), go chapter by chapter through all 133 chapters,
   or take any kural not yet built.

Tapping a word in the wrong place counts a mistake; a hint lays the next word down. Three stars
for no mistake and no hint, two for at most two mistakes and one hint, one otherwise. Progress,
stars and the daily streak stay in the browser (`localStorage`, key `kb.v1`); there are no
accounts, no advertisements and nothing is sent anywhere. Where the device has a Tamil voice, the
couplet can be heard.

## Files

    index.html  app.js  styles.css     the game (no framework, no build step for the page)
    sw.js  manifest.webmanifest        offline use and installation as an app
    assets/                            icons and the self-hosted Noto fonts of all scripts
    ui/<code>.json                     the interface in each language (English, Tamil and Hindi
                                       are inside app.js)
    data/                              made by build/build_data.py
    build/build_data.py                data from the Thirukkural app (..\kural-app\data)
    build/make_icons.py                the PNG icons

`data/` comes from the CICT Thirukkural app: the canonical text, the translations of each stream
and the word-by-word grammar layer (its English glosses are the word meanings shown). Run
`py build\build_data.py` again after that data changes, and raise `VERSION` in `sw.js`.

**Tamil words in other scripts.** Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Telugu, Kannada
and Malayalam share the layout of the Tamil block of Unicode, so the build writes a table (`data/scripts.json`) from each Tamil letter to the letter of each script, checking with `unicodedata` that it
exists there; a letter a script lacks takes the nearest one (ழ → ள → ல, ற → ர, ன → ந, the short
e and o → the long ones; Bengali va → ব). Urdu, Kashmiri (Perso-Arabic), Meetei Mayek and English
readers see a Latin transliteration: the Thirukkural app's own for most kurals, or one worked out
by the game where the app's does not match the words.

## Run it locally

    py -m http.server 8777 --directory "D:\DL file\kural-bridge"

then open http://localhost:8777/ . The service worker only registers over https.

## Known limits

* The word meanings are in English only; the grammar layer is AI-assisted and still under review
  by Tamil scholars.
* The interface translations other than Tamil and Hindi are drafts that a speaker of each
  language should read.
* A couplet whose two lines do not have 4 + 3 words (about 25 of the 1,330, in the source text's
  word division) simply has more or fewer planks.
