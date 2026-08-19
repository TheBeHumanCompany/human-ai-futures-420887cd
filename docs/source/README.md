# Source copy

The documents Maya supplied, extracted to text so copy fidelity can be *proved*
rather than asserted. `src/lib/copy-fidelity.test.ts` reads these files and
holds the built pages to them.

Without these, "the copy is verbatim from her PDF" is a claim no reviewer can
check — a reviewer looking only at the repo cannot see the PDF at all, and the
first external review of this work said exactly that.

| file | source | provenance |
|---|---|---|
| `why-we-exist.txt` | 3-page PDF | WhatsApp, Maya Brstilo → Sid, 2026-08-18 16:52:25, msg `4A5181BD7CB9BE5133E7` |
| `meet-the-founder.txt` | 4-page PDF | WhatsApp, Maya Brstilo → Sid, 2026-08-18 11:52:56, msg `4AA79D2AC963D5871078`, sent one second after "Build the 'About the Founder' page like this - I will make sure to provide you with the proper text and images" |

Extracted with `pdftotext -layout`; not retyped, and not edited afterwards. The
originals live in the WhatsApp bridge store, which is outside the repo and
outside CI, which is why the text is committed here instead of the PDFs being
referenced.

**These are inputs, not outputs.** Nothing regenerates them. If Maya sends a
revised document, replace the file, re-run the fidelity test, and let it tell
you what drifted.
