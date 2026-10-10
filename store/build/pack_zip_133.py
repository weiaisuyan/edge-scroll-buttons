# -*- coding: utf-8 -*-
"""按 v1.3.2 的同一份文件清单，重打 v1.3.3 商店包（manifest 在根层）。"""
import zipfile, os, sys, json, hashlib

ROOT = r"E:\程序\edge-scroll-buttons"
OLD = os.path.join(ROOT, "store", "edge-scroll-buttons-v1.3.2.zip")
NEW = os.path.join(ROOT, "store", "edge-scroll-buttons-v1.3.3.zip")

names = zipfile.ZipFile(OLD).namelist()
missing = [n for n in names if not os.path.exists(os.path.join(ROOT, n))]
if missing:
    print("MISSING:", missing); sys.exit(1)

with zipfile.ZipFile(NEW, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.write(os.path.join(ROOT, n), n)

z = zipfile.ZipFile(NEW)
sizes = {n: z.getinfo(n).file_size for n in z.namelist()}
old = {n: zipfile.ZipFile(OLD).getinfo(n).file_size for n in names}
print("files:", len(z.namelist()), " zip_size:", os.path.getsize(NEW))
for n in names:
    if sizes[n] != old[n]:
        print("  ", n, "<= changed (%d -> %d)" % (old[n], sizes[n]))
print("manifest in root:", "manifest.json" in z.namelist())
print("version:", json.loads(z.read("manifest.json").decode("utf-8"))["version"])
print("sha256:", hashlib.sha256(open(NEW, "rb").read()).hexdigest())
print("namelist:", names)
