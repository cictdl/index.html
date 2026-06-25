# -*- coding: utf-8 -*-
"""
Optional: download full-resolution leaf JPEGs from Zenodo (IIIF) into page/,
beside the PAGE-XML, to assemble a complete HTR-United package
(image <manuscriptId>.jpg next to <manuscriptId>.xml).

Reads index.csv for the IIIF image service of each specimen.
"""
import csv, os, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "page")

def img_url(record_url, manuscript_id):
    # record_url like https://zenodo.org/records/20810653
    recid = record_url.rstrip("/").split("/")[-1]
    return f"https://zenodo.org/api/iiif/record:{recid}:{manuscript_id}.jpg/full/max/0/default.jpg"

def main():
    with open(os.path.join(HERE, "index.csv"), encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    n = 0
    for r in rows:
        msid = r["manuscriptId"]
        dst = os.path.join(PAGE, f"{msid}.jpg")
        if os.path.exists(dst):
            continue
        url = img_url(r["recordURL"], msid)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "cict-gt/1.0"})
            with urllib.request.urlopen(req, timeout=120) as resp, open(dst, "wb") as out:
                out.write(resp.read())
            n += 1
            print("ok", msid)
            time.sleep(0.3)
        except Exception as e:
            print("FAIL", msid, e)
    print(f"downloaded {n} images into {PAGE}")

if __name__ == "__main__":
    main()
