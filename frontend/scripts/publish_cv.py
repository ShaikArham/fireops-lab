"""Update the published CV's project URL without modifying the source PDF."""
from pathlib import Path
import fitz

pdf = Path("out/Shaik_Arham_Saquib_Updated_Link.pdf")
doc = fitz.open(pdf)
old = "https://fireops-lab.vercel.app/"
new = "https://shaikarham.github.io/fireops-lab/"
found = 0
for page in doc:
    matches = page.search_for(old)
    if not matches:
        continue
    found += len(matches)
    for rect in matches:
        # Preserve the surrounding CV; only replace the project URL line.
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=0, graphics=0, text=0)
    for rect in matches:
        page.insert_text((rect.x0, rect.y1 - 3), new, fontsize=9, fontname="helv", color=(0, 0, 0))
        page.insert_link({"kind": fitz.LINK_URI, "from": fitz.Rect(rect.x0, rect.y0, rect.x0 + 235, rect.y1), "uri": new})
if found == 0:
    raise SystemExit("Expected old FireOPS project URL missing; refusing to publish an unchecked CV")
output = pdf.with_name("Shaik_Arham_Saquib.pdf")
doc.save(output, garbage=4, deflate=True)
doc.close()
check = fitz.open(output)
assert len(check) == 2
assert any(new in p.get_text() for p in check), "Updated URL is not visible"
assert any(link.get("uri") == new for p in check for link in p.get_links()), "Updated URL is not clickable"
assert not any(old in p.get_text() for p in check), "Old URL still visible"
print(f"Published CV validated: {output}, replaced {found} URL(s)")
