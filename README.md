# Splice

Splice transfers point-in-time review notes between two local OpenTimelineIO JSON cuts. Its CSV receipt records each note, source URL and source time, mapping status, and candidate times in the revised cut. The comparison uses timeline metadata and notes on your computer. Review whether each mapped note still applies to the edit.

## Try it

Requires Node.js 18 or newer. No packages need installing.

```sh
node splice.js examples/old.otio examples/new.otio examples/notes.csv receipt.csv
node edl.js examples/old.otio examples/new.otio examples/notes.csv edl-receipt.csv markers.edl 24 86400
node --test
```

Choose unused output names for each run. The EDL command validates both outputs before creating them and cleans up its new files if creation fails. Input notes use UTF-8 CSV columns `id,seconds,text`, unique IDs, and nonnegative decimal seconds measured from timeline start. The notes and timelines accept an optional leading UTF-8 BOM.

The `old_seconds` column keeps the original decimal text. Source seconds, new seconds and candidates use exact rational seconds (`numerator/denominator`). Clip ranges are half-open, so a cut boundary belongs to the following clip. `mapped` means one matching source range. `ambiguous` includes all candidates. `deleted_or_unresolved` means there was no match, and `old_gap_or_outside` means the original time did not identify a clip. The bundled sample maps two notes and flags the removed shot.

Receipt cells that begin with a tab, carriage return, newline, or a formula marker (`=`, `+`, `-`, or `@`, including after whitespace) are prefixed with an apostrophe to reduce spreadsheet formula interpretation. This changes those values in the CSV; the rows returned by the library and the marker EDL retain the original values. Spreadsheet behavior varies by application and import method.

## Supported subset and limits

Only one flat video track, explicit clip and gap source ranges, and external media references with identical `target_url` strings are supported. When a clip has a media reference map, Splice reads the entry selected by `active_media_reference_key`. Earlier single-reference inputs remain supported. Track or stack trims, effects or retiming, transitions, nested compositions and multiple tracks are outside the supported subset. Renames, proxy substitutions, duplicate filenames and shifted source origins require manual reconciliation. Frame rates are interpreted as decimal rational values in OTIO JSON. Drop-frame timecode, precision beyond JSON's numeric representation and note ranges are unsupported. [OpenTimelineIO Clip reference handling](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/v0.18.1/src/opentimelineio/clip.cpp)

The optional EDL targets DaVinci Resolve's timeline-marker import. Set FPS to 24, 25, or 30 non-drop frames and START_FRAME to the revised timeline's start timecode in frames. At 24 fps, 86400 means 01:00:00:00. The file includes only uniquely mapped, exactly frame-aligned notes. Other notes stay in the receipt. The command rejects fractional frames, unsupported rates, non-ASCII marker text, more than 999 markers and timecodes outside 24 hours. Parser tests cover the generated frame numbers. **Actual Resolve import and marker text compatibility remain unverified.** Inspect imported markers before use. Splice covers video cut metadata and notes. AAF, visual matching, complex retiming, audio and editor integration are outside its scope. Back up work and verify the receipt against the edit.

## Context

Splice parses its supported OTIO JSON subset directly. Related projects include [FreeFrame](https://github.com/Techiebutler/freeframe), [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO), [ResolveConformTools](https://github.com/polisvfx/ResolveConformTools) and [Matchbox](https://www.thecargocult.nz/products/matchbox/).

MIT licensed; see LICENSE.




