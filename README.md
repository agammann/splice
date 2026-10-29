# Splice note transfer (alpha)

Splice compares two local OpenTimelineIO JSON timelines and carries point-in-time review notes through source ranges. It writes a CSV receipt with original note, source URL and time, status, and new-time candidates. No media or network service is used. This is an experimental notes-only workflow, not an NLE or a guarantee that a comment remains relevant.

## Try it

Requires Node.js 18 or newer. No packages need installing.

```sh
node splice.js examples/old.otio examples/new.otio examples/notes.csv receipt.csv
node edl.js examples/old.otio examples/new.otio examples/notes.csv edl-receipt.csv markers.edl 24 86400
node --test
```

Outputs must be new files: existing paths, including inputs, are never overwritten. The EDL command validates both outputs before creating them and cleans up newly created outputs if creation fails. Choose new output names for each run. Input notes use UTF-8 CSV columns `id,seconds,text`, unique IDs, and nonnegative decimal seconds measured from timeline start. Receipt times are exact rational seconds (`numerator/denominator`); ranges are half-open, so a cut boundary belongs to the following clip. `mapped` means one matching source range, not editorial approval. `ambiguous` includes all candidates; `deleted_or_unresolved` means none. `old_gap_or_outside` means the original time did not identify a clip. Review every result manually.

## Supported subset and limits

Only one flat video track, explicit clip/gap source ranges, and external media references with identical `target_url` strings are supported. A timeline with effects/retiming, transitions, nested compositions or multiple tracks is rejected. Identical media URLs must truly identify the same source: renames, proxy substitution, duplicate filenames, and shifted source origins require manual reconciliation. Frame rates are interpreted as decimal rational values in OTIO JSON, not timecode labels; drop-frame timecode and floating-point precision beyond JSON's numeric representation are unsupported. Notes are points, not ranges. This tool does not inspect media or verify whether a note still makes sense.

The optional EDL is a candidate DaVinci Resolve timeline-marker import: select the timeline in the Media Pool, then Timelines > Import > Timeline Markers from EDL. Set FPS to 24, 25, or 30 integer non-drop frames and START_FRAME to the new timeline start timecode expressed in frames (86400 means 01:00:00:00 at 24 fps). Only uniquely mapped, exactly frame-aligned notes are exported; unresolved notes stay in the receipt. Export aborts on fractional frames, unsupported rates, non-ASCII text, more than 999 markers, or a 24-hour timecode overflow. The EDL parser test checks its generated frame numbers, but **no actual Resolve import has been tested**, and compatibility including marker text is unverified. Inspect all imported markers before use. No AAF, visual matching, complex retiming, audio or editor integration is provided. It is a standalone clean-room prototype; no code from the inspirational projects is included. Back up work and verify the receipt against the edit.

## Context

[FreeFrame](https://github.com/Techiebutler/freeframe) is a media-review platform; [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) defines timeline interchange; [ResolveConformTools](https://github.com/polisvfx/ResolveConformTools) supplies Resolve conform scripts; and commercial [Matchbox](https://www.thecargocult.nz/products/matchbox/) provides broader change management and reconforming. Splice explores a narrower portable notes receipt, not feature parity or a claim of uniqueness. This prototype reads a restricted OTIO JSON subset itself and does not bundle OpenTimelineIO.

MIT licensed; see LICENSE.


