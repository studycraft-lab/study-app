# Tabby’s Tablecloth: v2 proposal snapshot

This is the reviewed **v2 proposal snapshot**. Its content has been promoted to the [canonical bank](../../ingestion-artifacts/tabbys-tablecloth-question-bank.json), which is the importable file. It keeps the existing 13-question shape: nine one-mark multiple-choice items and four nine-mark reference-to-context sets, each with three three-mark parts. The four extract themes and their level of challenge remain.

## Evidence and calibration

- The chapter scan is `Scan_20260925_174441.pdf`, printed pages 77–81. Its SHA-256 matches the existing chapter manifest.
- The supplied 2025 first-term English Literature paper is `FIRST_TERM_VI_ENGLISH_LITERATURE_1787974373.pdf`. Its SHA-256 also matches the manifest. The paper has 16 objective marks and a 15-mark Tabby extract set with five three-mark parts. Parts test identity, events, motives, consequences and the tablecloth’s significance across the story.
- This bank keeps a 9:36 objective-to-extract mark balance (20:80) and three-mark subparts. It is chapter practice, not an 80-mark mock paper.
- Short quotations are included in the child-visible prompts. The original page scans remain local and are not copied into this proposal.

## Decision by question

| Question | Decision | Reason |
| --- | --- | --- |
| q-001 | Keep question and key; improve distractors | The secret message under the eggs is central; the earlier fanciful options made it too easy. |
| q-002–003 | Retain | Secrecy and reporting the strangers are grounded and useful. |
| q-004 | Keep question and key; improve distractors | The basket step still tests sequence, with more plausible wrong choices. |
| q-005 | Replace | The old maid-identification item repeated a minor detail already used in q-011. The new item tests Deacon Hosmer’s reason for sending Tabby with eggs. |
| q-006 | Keep question and key; improve distractors | Tabby’s self-control matters; the alternatives now require closer reading. |
| q-007 | Retain | The simile is directly supported by the text. |
| q-008 | Keep question and key; improve distractors | Boston remains correct; the unrelated “Saharanpur” option is removed. |
| q-009 | Retain | Author identification is a fair one-mark item. |
| q-010 | Retain extract; revise (b) and (c) | Brown’s reply, physical reaction and inferred feeling are distinct marks. Part (c) asks for earlier evidence without naming the three answers. |
| q-011 | Retain extract and difficulty; revise rubric | Part (b) now scores reaching and using the hiding place. Hiding the basket earns no required mark because the prompt does not ask for it. Part (c) accepts a defensible view supported by purpose and action. |
| q-012 | Retain (a) and (b); revise (c) | The revised consequence question separates time to act, moving supplies and cannon readiness; “ready” and “aimed” are not counted as two independent facts. |
| q-013 | Retain extract and questions; refine (c) | Its three marks now distinguish the later act of care, Tabby’s earlier risk and the connection between them. |

## Marking principles

The exact words in an ideal answer are examples, not required phrases. Each three-mark part has three independently identifiable ideas. A concise answer may earn multiple marks in one sentence. Do not require the child to repeat the quotation or introductory wording, and do not deduct spelling or grammar marks unless a question explicitly tests language.

The feedback that showed 1/9 cannot be audited from the screenshot alone because the child’s actual response is missing. This proposal fixes identifiable rubric-to-prompt mismatches without assuming that a particular score was wrong.

## Release boundary

The canonical `ingestion-artifacts/tabbys-tablecloth-question-bank.json` advanced to reviewed v3 after the user's feedback on q-011's wording. This v2 proposal snapshot remains unchanged as a record of the earlier revision. The canonical bank has not been imported into StudyCraft. The existing source manifest stays valid. Printed-page exercises remain outside this compact, exam-style set, consistent with the documented v1 scope.
