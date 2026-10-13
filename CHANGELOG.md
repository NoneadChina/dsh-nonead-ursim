# Changelog

This package follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

The version line of this package **starts at 0.1.0**: `dsh-nonead-ursim` is an independent DSH plugin,
so it does not continue the version numbering of the code base it was separated from. That earlier
history is archived verbatim in [`CHANGELOG-archive.md`](./CHANGELOG-archive.md); it is **not** part of
this package and is excluded from the published tarball by the `files` whitelist in `package.json`.

## [0.1.2] - 2026-10-13

A four-expert audit of the 0.1.1 code base (security, architecture, implementation quality and
documentation; the raw reports are kept in
[`docs/audit-2026-10-13-four-experts.md`](./docs/audit-2026-10-13-four-experts.md)) found nine
defects worth fixing immediately. This release is that first batch. The simulation-only contract is
unchanged.

### Fixed

- **The worker leaked one `stdin` `error` listener per call and never removed it.** The eleventh call
  tripped Node's `MaxListenersExceededWarning`, and each call also left a closure on the stream for
  the life of the process. One handler is now attached per child process, and a broken pipe fails
  **all** of that child's in-flight requests instead of only the last writer. Regression: the listener
  count stays at 1 after 20 calls.
- **A killed worker's error message lost its stderr.** `_killFor()` assembled the reason *after*
  `_failAll()` had dropped the per-child stderr tail, so the message that most needs a cause
  ("process terminated") usually had none. The tail is now read first.
- **`respawnCount` incremented before a spawn succeeded**, so one failed start made the host believe
  the child had been replaced: it rebuilt the simulation and made every attached panel re-download
  and rebuild 1.5–3.5 MB of GLB. The counter now increments on the `spawn` event.
- **An IP with surrounding whitespace was treated as a real robot.** The host's simulation test is an
  exact match against the reserved loopback address while the Python side trims, so `" 127.0.0.1"`
  raised a human-approval prompt — which in an `approval=never` session surfaces as "command
  rejected" and is easily misread as a worker fault. Tool arguments are normalised before the gate.
- **Seven ops with physical side effects were reachable without approval**: `set_tcp` (rewrites the
  reference frame of *every later* motion), `set_tool_output_mode` / `set_tool_voltage` /
  `tool_communication` (tool-flange pin semantics; enabling TCI disables the tool analog inputs),
  `set_digital_out` / `set_analog_out` (they drive grippers, conveyors, welders) and
  `set_conveyor_tick`. Simulation targets never take this gate, so the change only affects a
  real-robot deployment — which is exactly where it is needed. `check-approval-gate.py` and the
  approval-gate tests now assert these families move together.
- **The twin's over-limit joint warning never fired.** `writeHud()` passed `fkResult?.jointLimits`, a
  field `fkChain()` has never returned, so `overLimitJoints()` always got `undefined` and returned
  early: the feature was 100 % dead while its tests were green. The limits now come from the
  kinematics table, and a regression test drives J2 past its limit.
- **Stopping the simulation on panel teardown could be aborted by the browser.** That write is sent
  precisely while the page is unloading, so it now carries `keepalive: true`; otherwise the virtual
  robot kept running in the host after the panel closed.

### Changed

- `scripts/check-tool-params.py` now fails when it parses fewer than 86 tools — a broken regex used
  to print `0 / 0` and pass.
- `test/sim-only.test.mjs` asserts `SIM_PASSTHROUGH_OPS` as an exact set instead of "contains these":
  that frozenset is the only switch deciding which ops may reach the real-robot implementations.

## [0.1.1] - 2026-10-13

### Fixed

- **The twin no longer draws an unposed arm when the pose feed has a gap.** A model that has been
  assembled but has not had a pose written to it yet leaves all seven link meshes in their own link
  frames at the base origin — two long tubes lying side by side, the tool flange next to the base —
  and that is exactly what the panel used to show as soon as the pose channel went quiet for a
  moment (a simulation being rebuilt, the worker being reloaded: the state route then answers
  `q: []`, so `if (kin && joints)` skips the whole pose write, and a freshly loaded model kept that
  assembly state forever). `loadModel()` now poses a newly loaded model with the **last known joint
  values** immediately, and a model that has never been given a pose is **kept hidden** until the
  first pose arrives, so the assembly state can no longer reach the screen. The pose write, the TCP
  axis gizmo and the force arrow now share one entry point (`applyPoseToScene`), which is what makes
  "this model has a pose" a state the panel can rely on. Two regression tests in
  `test/twin-panel.test.mjs` cover both halves (a model change on a frame without `q`; a first load
  before any `q` has ever arrived).

## [0.1.0] - 2026-10-12

First release of **`dsh-nonead-ursim`** as an independent plugin.

### Added

- **86 native DSH tools (`ursim_*`)** for Universal Robots collaborative arms, registered through
  `@deepseek-ai/dsh-tools`: connection (`ursim_connect` / `ursim_disconnect`), status / pose / target values /
  device info, programs, registers, health, digital and analog I/O, tool configuration (TCP, payload,
  gravity, force/torque zeroing, tool voltage and communication), control mode / power / safety
  (freedrive, teach mode, brake release, protective-stop unlock, shutdown), **force mode**, **velocity
  control** (`speedj`/`speedl` plus the matching stops and `wait_steady`), **live RTDE telemetry**
  (joint currents/voltages/speeds, TCP speed and wrench, temperatures, bus voltage/current, speed
  scaling, tool telemetry), conveyor tick and conveyor tracking, motion (`movej`/`movel`/`movep`/
  `movec`/`servoj`/OptiMove/axis and tool-axis moves), motion planning (`motion_version`,
  `get_freedrive_status`), drawing, and raw script / error reset.
- **A fail-closed motion approval gate**: every command that moves the arm, runs a program, takes the
  arm out of program control or removes its rigidity pauses for human confirmation before it reaches
  the robot. The default lives in code (`config.requireApprovalForMotion ?? true`), so a caller that
  skips schema parsing cannot switch it off. `test/approval-gate.test.mjs` drives the real tool
  registry and proves it, including that an extra `op` argument cannot re-route a call.
- **A persistent Python worker** (`python/ur_worker.py`, vendored `URBasic`) over a line-delimited
  JSON stdio protocol: one `connect` per IP, many commands, with RTDE / Dashboard / RealTime links kept
  alive across calls.
- **A read-only 3D digital twin** (three.js) mounted from a card in the right sidebar's Start panel:
  joint poses, TCP frame and recent trajectory, engineering layer toggles, and a numeric dashboard-side
  readout. It is strictly read-only and never sends a command to the robot. Telemetry is **pushed by
  the worker** at 20 Hz and the twin reads that cache first, so the feed does not stall while the robot
  moves; twin reads use a dedicated budget with `killOnTimeout:false` so a visualisation read can never
  destroy the robot session.
- **Kinematics-level offline simulation** on the reserved loopback address `127.0.0.1`:
  `ursim_sim_start` / `ursim_sim_stop` / `ursim_sim_status` drive a virtual robot whose forward kinematics is
  element-wise identical to the client's `fk.js`. Inverse kinematics is damped least squares with
  multiple seeds and reports "unreachable" rather than handing back an approximate pose. Everything
  without simulation semantics reports `SIM_UNSUPPORTED` instead of a plausible-looking result.
- **Five host routes** (all fenced to loopback callers) under the `/nonead-ursim/twin/…` prefix:
  `stream` (SSE, the client default), `state`, `asset`, `models`, and `sim` — the plugin's only write
  route, whose side effect is confined to a kinematics virtual robot on the loopback address.
- **Release gates**: `npm run check` (static / ops / docs / manifest) and `npm test`, including the
  Python dependency manifest in `test/test-manifest.json`.
- **The twin panel follows the app's colour theme** (light / dark / system). The panel's CSS is now
  built on the host's `--dsw-alias-*` design tokens with theme-paired local fallbacks, so it tracks
  DSH's appearance setting — and any third-party theme overriding those aliases — with no JS. The
  WebGL base grid, whose colours live in the geometry's vertex colours and are therefore invisible to
  CSS, is repainted **in place** by `scene.js`'s `applyTheme()` from the same signal
  (`body[data-ds-dark-theme]`) that the new `src/client/theme.js` resolves and watches.
- **The twin panel enters an offline simulation by itself when it opens** (`UR12e`, upright pose,
  100 % speed scaling), whether or not a real robot is connected — collapsing the panel stops it and
  returns the data source to automatic resolution. A simulation that is **already** running (started by
  the AI through `ursim_sim_start`, or by another window) is **adopted, never rebuilt**: rebuilding
  would push that virtual robot back to its start pose. The simulation row is no longer hidden while
  disconnected, since that is where an automatic entry that failed (no Python, worker down, …) reports
  its reason and offers the retry. Embedders that do not want this can mount the panel with
  `autoSim: false`.
- **Fixed: the reach envelope was a 1 m sphere for every model.** `linkLengthsFromKinematics()` was
  written against "7 row-major 4×4 matrices" (and only ever unit-tested with that shape), while
  `assets/kinematics.json` actually stores **6 `{x, y, z, roll, pitch, yaw}` relative transforms** —
  so on the production path it returned `null`, `reachRadiusFromKinematics()` returned `null`, and
  `reachSphere.scale.setScalar()` never ran: the envelope stayed at its **unit radius** for all 14
  models ("whichever model I load, the reach looks the same size"). It now accepts the real shape
  (each segment's length is the magnitude of its translation), giving the documented bounds —
  UR3 ≈0.80 m … UR20 ≈2.17 m. The same null also left the fallback arm at UR3-ish lengths for every
  model; that is fixed too.
- **The Reach layer now frames absolutely, so model sizes are comparable.** Per-model framing (needed
  so a UR3 does not look tiny and a UR20 does not clip) also normalised the reach envelope away — every
  model filled the view, which is exactly the complaint above. Turning the **Reach** layer on now frames
  with a fixed reference (`fitTo(..., { minRadius })` = the largest built-in model's bound, UR20), so all
  models share **one ruler** and the grid becomes a fixed scale; the layer's own label prints the current
  model's bound (`Reach 1.32 m`) and updates on every model switch.
- **Fixed**: the right-dock entry card referenced `--dsw-alias-bg-elevated` /
  `--dsw-alias-border-secondary`, two token names the DSH design system does not define (0 definitions
  anywhere), so its `var()` calls always fell back to the light values and the card stayed **white in
  dark mode**. It now uses the tokens its neighbour cards use (`--dsw-alias-bg-layer-1` /
  `--dsw-alias-border-l3`).

### Changed

- **A swapped model clears the old robot, and the new one starts folded upright.** Switching the model
  in the panel now (a) guarantees the previous robot is gone from the 3D scene — `loadModel()` tags its
  root and `removeStrayRobots()` sweeps any same-named leftover before the new mesh is framed, so two
  arms can never be on screen at once — and (b) resets the start pose to **upright (folded)**, syncing
  the pose selector so the UI and the simulation agree. `upright` is now the default in all three
  places a robot can be created: the tool default (`ursim_sim_start` without `preset`), the panel's
  automatic entry, and a model switch. `test/sim-only.test.mjs` additionally pins that `upright` is
  inside the joint limits of all 14 built-in models (a silent fall back to zero would mean "the pose
  changes when you change the model"), while `test/model-contract.test.mjs` keeps checking that every
  model's assembled links really meet at several poses.
- **`movel` is one smooth motion instead of a few dozen stop-and-go steps.** The Cartesian line is still
  subdivided every 1 cm and inverse-kinematicked point by point (that is what keeps it a straight line
  rather than an arc), but the *timing* is no longer per segment: the whole polyline shares a single
  speed profile — the total duration follows from the **path-wide** travel, per-segment durations are
  allocated in proportion to their joint displacement, and `_sample()` maps time through one global
  smoothstep before interpolating the six joint angles. Previously every 1 cm waypoint decelerated to
  zero and re-accelerated: a 0.5 m move became ~50 micro start/stops (a visible stutter, and an
  effectively random joint speed from one twin frame to the next). Measured on a 0.5 m `movel` at the
  20 Hz twin cadence: **3** near-zero frames instead of ~52, cruise speed flat to within 1.5 %, no
  frame-to-frame speed jump above 0.02 rad/s per 50 ms, and the total duration down from ~9 s to 3.7 s.
  `test/sim-motion-smooth.test.mjs` pins both the structure and those numbers.
  - Fixed along the way: reaching the end of a long polyline relied on floating-point subtraction
    segment by segment, so the arm stopped a hair short of the final point (a drawn circle closed to
    2.6e-5 instead of 4e-7). `_sample()` now returns the final waypoint verbatim once the path is done.
- **The plugin is now simulation-only: it has no real-robot channel at all.** Every tool targets the
  offline virtual robot on the reserved loopback address; a real IP is rejected as **invalid input**
  (`SIM_BADARG`) in the worker *before* dispatch, which is what makes the RTDE / Dashboard / SSH /
  remote-control paths **unreachable** rather than merely unused. Calls no longer need a
  `connect`-to-a-robot step: `route_op()` starts a `UR12e` simulation on demand (upright pose, 100 %
  scaling) and then dispatches, so directly issuing a motion command just works. `ursim_connect` now
  means *ensure the simulation is running* and `ursim_disconnect` means *stop it* (idempotent); the
  `ip` parameter is optional everywhere and only `127.0.0.1` is accepted. The twin route ignores
  `?ip=` and the client always resolves the reserved address, so no read can target a real robot
  either. Commands without simulation semantics (force mode, RTDE telemetry, safety bits, programs,
  raw script, I/O, registers, conveyor, power/brakes/freedrive) keep their tool names and answer
  `SIM_UNSUPPORTED` — they never fall through to a robot.
  - Tests: the obsolete `test/remote-control.test.mjs` is removed together with the probing it
    covered (CB3 remote-control advice) and replaced by **`test/sim-only.test.mjs`**, which pins both
    halves of the new contract — the structural one (only `SIM_PASSTHROUGH_OPS` can reach `HANDLERS`)
    and the behavioural one (rejection, auto-readiness, `SIM_UNSUPPORTED`, connect/disconnect).
  - **Still to do (dead-code removal, no behaviour change):** the now-unreachable real-robot
    implementation (`python/URBasic/**`, the dashboard/SSH/RTDE helpers and the ~40 real `op_*` bodies
    in `ur_worker.py`) is still in the tree. It cannot be reached, but it is not yet deleted.
- **Package renamed to `dsh-nonead-ursim`**, and every identity that has to agree with the package name
  follows it: the client bundle's `__ModuleLoader__` id (asserted against `package.json.name` at build
  time by `scripts/build-client.mjs`), the `cordis.patch.yml` insert row (`id: nonead-ursim`,
  `name: 'dsh-nonead-ursim'`) and the plugin name exported by `lib/index.js`.
- **The sidebar / right-dock entry is titled `NoneadURSim`** in both Chinese and English; the copy's
  single source of truth stays `src/client/strings.js` (`dockLabel`).
- **The version line restarts at `0.1.0`.** The pre-independence changelog (the former
  `0.1.0 → 0.8.0` development line) was archived to `CHANGELOG-archive.md` /
  `CHANGELOG-archive.zh.md` and is no longer shipped.
- **The whole tool/route/UI namespace moved to `ursim_*` / `/nonead-ursim/…` so this plugin can be
  installed next to the plugin it was separated from.** DSH's tool registry and web server both refuse
  duplicates at load time (`tool "X" is already registered`, `webserver: duplicate exact route`), so
  sharing a namespace meant only one of the two could ever load. Renamed:
  - all **86 tools**: `ur_*` → **`ursim_*`**;
  - the twin route prefix `/dsh-nonead-ur` → **`/nonead-ursim`** (`/nonead-ursim/twin/{state,asset,models,stream,sim}`);
  - the client's DOM/debug namespace `ur-twin` → **`ursim-twin`** (style element id and marker attribute,
    the right-dock `data-*` attributes, the panel CSS classes, the three.js object names and the
    screenshot filename) — the other plugin uses the same `dsh-ur-twin-styles` id, so a shared id would
    make one plugin reuse the other's `<style>` element and render unstyled;
  - the debug globals `__UR_TWIN__` / `__UR_TWIN_IP__` / `__DSH_UR_TWIN_MUTATION_HUB__` → `__URSIM_TWIN__` /
    `__URSIM_TWIN_IP__` / `__DSH_URSIM_TWIN_MUTATION_HUB__`;
  - the worker's diagnostic switch `DSH_UR_TWIN_PUSH` → `DSH_URSIM_TWIN_PUSH` (and it is now exempt from
    the `DSH_*` env scrub in `lib/worker.js`, which had made that documented switch unreachable).
- **Deliberately unchanged** so the Python half keeps speaking the same protocol: the worker's internal
  `op` names, its stdio protocol, and the vendored `URBasic` API (which has its own `ur_shutdown` /
  `ur_power_on` / `ur_force_mode` identifiers that must stay).
