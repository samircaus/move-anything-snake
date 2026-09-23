# Snake for Schwung

A compact Snake game played across Ableton Move's 8×4 pad grid, packaged as a standalone
[Schwung](https://github.com/charlesvestal/schwung) overtake module.

## Controls

| Move control | Action |
| --- | --- |
| Arrow buttons | Start and steer |
| Knob 1 (blue) | Turn counterclockwise for left, clockwise for right |
| Knob 2 (magenta) | Change the root note through all 12 chromatic notes |
| Knob 8 (orange) | Turn counterclockwise for up, clockwise for down |
| Track buttons 1–4 | Select the native Move track and the food-note destination |
| Step buttons 1–4 | Choose major, minor, major pentatonic, or blues |
| Play | Start, pause, or resume |
| Jog click | Start, pause, or retry after game over |
| Shift + Volume Touch + Jog Click | Exit through Schwung's host-level escape |

The bright green pad is the snake's head, dark green pads are its body, and the
red pad is food. Crossing any edge continues from the opposite side. The snake
accelerates after every piece of food. The session's best score is shown on the
display and resets when the module is unloaded. Arrow and knob turns share the
same two-turn input buffer.

Each food pickup sends a short melodic MIDI note to the selected track, starting
at the chosen root in octave 4 and moving upward through the selected scale.
The display shows the selected track, root, and scale; the defaults are Track 1,
C, and major. Track buttons also pass through to Move so a track set to
**MIDI In → Auto** becomes the selected receiving track. Schwung sends food
notes on external MIDI cable 2, using channels 1–4 for Track buttons 1–4.
If a track has a specific MIDI In channel configured, it must match the
channel Snake sends. The module releases each note after 160 ms or on exit.

## Build and test

Requires Node.js 18 or newer. There are no npm dependencies or native binaries.

```sh
npm test
npm run build
```

The build produces `dist/snake-module.tar.gz`. Its archive root is the required
single `snake/` directory containing the module metadata, UI, and game engine.

Install it with Schwung's supported module installer from a Schwung checkout:

```sh
./scripts/install.sh install-module ../move-anything-snake/dist/snake-module.tar.gz
```

Then open Snake from Schwung's Overtake section.

After a GitHub release, the installer can also use the public repository:

```sh
./scripts/install.sh install-github samircaus/move-anything-snake
```

## Publishing

Tag a version matching `src/module.json`, then push the tag. GitHub Actions
tests and packages the module, attaches `snake-module.tar.gz` to a public
release, and updates `release.json` on `main` for Schwung's installer and
Module Store. The release archive contains only the `snake/` module folder.

To appear in Schwung's built-in Module Store, `snake` also needs an entry in
the upstream `charlesvestal/schwung` `module-catalog.json`. A public release
alone supports direct GitHub installation but does not add the store listing.

## Development status

The game logic is covered by local unit tests and has been installed for
iterative Move testing. Verify track routing, display, LEDs, and input feel on
hardware before treating a new release as fully validated.
