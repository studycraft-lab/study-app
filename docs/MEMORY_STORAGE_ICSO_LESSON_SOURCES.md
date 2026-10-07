# Grade 6 ICSO: Memory and Storage Devices

The interactive lesson is at `/study/icso/memory-storage`. It has six short sorting missions (23 estimated minutes) and six original final questions (about 6 minutes). A local power switch models RAM losing an unsaved edit while ROM/firmware and a saved SSD photo remain; a second model compares stepping through tape with direct drive access. These are simulations, not live hardware. Results remain on the page and are not saved to the StudyCraft progress dashboard.

## Sources and scope

- Saved SOF synopsis: `ingestion-artifacts/icso-grade6-synopses/02-memory-and-storage-devices.html`. The lesson covers volatile RAM, non-volatile ROM and drives, SRAM/DRAM roles, magnetic/optical/flash technology, sequential/direct access and unit sizes.
- Recent downloaded papers: `ICSO - 2025_Class_6_2296_answer.pdf` uses a volatile/non-volatile comparison and HDD/SSD statements; `ICSO - 2024_Class_6_7530_answer.pdf` asks about ROM and optical discs; `ICSO - 2023_Class_6_8757_answer.pdf` asks about RAM, device-memory matching and byte size. The final questions are original.
- Downloaded mock papers add cache and SRAM, sequential tape, flash drives, and 1024-based capacity calculations. These informed the sorting examples, without reproducing paper questions.
- The signed-in SOF chapter question bank was not inspected for this build. Review it before claiming full exam alignment. The 29-minute duration is an estimate, not a child-tested limit.

## Accuracy decisions

| Concept | Check |
| --- | --- |
| Typical RAM is volatile; SSD/HDD retain saved data without power | [IBM storage overview](https://www.ibm.com/think/topics/data-storage), [IBM HDD versus SSD](https://www.ibm.com/think/topics/hard-disk-drive-vs-solid-state-drive) |
| Magnetic HDD/tape, optical discs, and flash drives are distinct storage technologies | [IBM storage overview](https://www.ibm.com/think/topics/data-storage) |
| Modern firmware may be stored in rewritable flash, although school diagrams often label startup memory ROM | [IBM flash storage](https://www.ibm.com/think/topics/flash-storage) |
| 1024 bytes is formally 1 KiB; decimal 1 kB is 1000 bytes | [NIST binary prefixes](https://pml.nist.gov/cuu/Units/binary.html) |

The synopsis and many ICSO questions use “KB = 1024 bytes” and “GB = 1024 MB.” The lesson explicitly labels this as the **paper's convention** and mentions KiB/MiB/GiB for the formal binary units, so the child can answer the exam without learning that all storage labels mean 1024-based quantities. The lesson samples the chapter and does not teach every optical format or device example in the synopsis.
