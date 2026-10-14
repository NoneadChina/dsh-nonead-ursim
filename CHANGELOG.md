# Changelog

This package follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

The version line of this package **starts at 0.1.0**: `dsh-nonead-ursim` is an independent DSH plugin,
so it does not continue the version numbering of the code base it was separated from. That earlier
history was archived verbatim to `CHANGELOG-archive.md`; the file was **removed from this repository**
while preparing 0.1.1 (it is recoverable from the commit that imported the source, `4c91704`) and was
never part of the published tarball.

## [0.1.12] - 2026-10-15

### Fixed

- **A disconnect now cleans up the C1/C4 state (a 0.1.11 regression).** 0.1.11 added the singularity row and
  the over-limit link tinting, but the disconnect path only cleared the older HUD rows — so two stale
  readings could survive a disconnect: the row kept showing the previous pose's "⚠ at singularity · wrist
  1.2°", and the tinted link **stayed red**, including after reconnecting to a different robot or switching
  models, where that joint is no longer the one out of range. The row (text, level and title) and the tint
  are both cleared now, and the "last rendered" caches are reset with them — without that reset the next
  frame would skip re-rendering and re-tinting entirely, because it would see "nothing changed".

## [0.1.11] - 2026-10-15

### Added

- **Singularity and manipulability hints (roadmap C1).** The 3D view can show *where* the arm is but not
  *how close it is to not being able to move there*: a UR wrist singularity (joint 5 ≈ 0, the wrist axes
  lining up) looks exactly like any other pose, yet inverse kinematics diverges there and a Cartesian
  command suddenly demands very fast joint motion. A HUD row now reports three things, all computed
  client-side from the same forward kinematics the picture is drawn from: the **wrist angle**, the
  **normalised manipulability** `|det J| / reach³`, and the **distance to the nearest joint limit**
  (amber past the near thresholds, red past the at thresholds).
  - The Jacobian is the **analytic geometric** one (position rows `z × (p_end − p)`, angular rows `z`,
    read straight out of `fkChain`'s link matrices) — no finite differences, no extra FK calls.
  - Thresholds are **calibrated, not guessed**: `scripts/calibrate-manipulability.mjs` samples 4000 poses
    per model across all 14 models and sweeps the wrist angle. Two findings from that calibration are
    worth keeping: a **position-only** Jacobian cannot see the UR wrist singularity at all (σ_min/reach
    moves from 0.2766 to 0.2413 as `|q5|` goes 0.5° → 90°, because the degeneracy lives in the angular
    rows), and taking the joint axis from `links[i-1]` instead of `links[i]` silently drops the 90°
    fixed transform, making `det J` identically 0. The shipped thresholds (`at = 0.001`, `near = 0.004`)
    sit where ordinary poses trip them 3% and 10% of the time.
- **Over-limit joints are tinted in 3D (roadmap C4).** The HUD already said "J2 over limit"; the picture
  gave no clue *which* of six similar-looking links that was. The matching link group is now tinted red.
  Materials are cloned on first tint (GLB materials are shared between instances, so tinting one panel
  must not colour another) and the original emissive values are restored when the joint comes back in
  range.

## [0.1.10] - 2026-10-14

### Added

- **The simulation state is persisted, so it survives a host restart (roadmap E2).** The host has always
  remembered "what simulation ought to be running" in order to rebuild one when the Python child is
  replaced — but that memory was process-local, so **reopening DSH or reloading the plugin** lost it and
  the self-healing had nothing to heal from (the symptom was "it was on a minute ago, now everything
  starts over, and nothing says why"). It is now written to disk:
  `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`, atomic (temp file + rename), overridable
  with `simStateFile` and switchable with `persistSimState` (default on).
  - What is persisted is the **intent**, not the last picture: `enabled: true` plus the model, start pose
    and speed scaling. Stopping a simulation writes `enabled: false`, so **an explicitly stopped
    simulation stays stopped across restarts**, exactly like the in-process self-healing already
    promised. A simulation that was running is created again on load (one `sim_start`, logged).
  - Persistence is a bonus and can never break the plugin: a read-only data directory, a missing file,
    bad JSON, an unknown format version or an `enabled: true` entry without a model all degrade to "no
    memory" (the last two with a warning) — writes go through try/catch and only log.
  - `GET /nonead-ursim/twin/sim` now also returns `remembered` and `restore_error`, and the panel says
    so in the simulation bar when a restore failed, instead of leaving "why is there no simulation
    here?" unanswered.

## [0.1.9] - 2026-10-14

### Added

- **An I/O and registers readout in the panel.** Remove the last "feature without an entry point": the
  simulation has had an in-memory I/O and register state since 0.1.5, and `ursim_get_digital_out_bits`
  and friends could read it, but nothing in the panel showed it. Expanding the new **I/O & registers**
  block reads the 16 digital outputs, the 16 digital inputs and both analog inputs (bits rendered as
  `00000000 00000001` — the standard and configurable halves), plus one 8-value slice each of the int,
  double and bit registers.
  - **It reads on demand**: nothing at all while collapsed; one request for the bits and one per
    register slice when you expand it, and the bits then refresh at 1 Hz while it stays open. The
    registers are per-index getters (24 for a full int sweep, 64 for the bit registers), so they are
    read once per expansion rather than on a timer.
  - The host side is two optional channels on the **existing** `twin/state` route (`io=1` and
    `reg=<set>&from=&count=`, `count` capped at 16) instead of two new routes: that route already
    resolves the IP, carries the read trust fence, and treats a failing bonus channel as `{error}` in
    its own field without taking the pose channel down.
  - It deliberately uses **RTDE-side reads only** (`get_digital_out_bits` / `get_digital_input_bits` /
    `get_analog_in`): `get_digital_in` with `which="tool"` sends a short URScript that can interrupt a
    running program, and a read-only panel must not cause that. In simulation the block also states
    that inputs have no source (they stay 0) rather than letting those zeros pass for signals.

## [0.1.8] - 2026-10-14

### Added

- **The panel now shows the current mode (P0, safety-relevant).** The top-left badge used to appear
  *only* while a simulation was running, which made "no badge" read like "nothing will move" — yet in
  `motionMode: 'real'` a command does reach hardware. It is now a **three-state indicator**: purple
  `SIMULATION` while a virtual robot is driven, red **`REAL MODE · <allowed IPs>`** whenever real mode is
  configured (**shown even while disconnected**, and it says so explicitly when the allow-list is empty),
  and a neutral `NOT CONNECTED` when nothing is driving anything. `GET /nonead-ursim/twin/sim` now
  carries `motion_mode` and `real_robots` so the client can render it.
- **Telemetry rows: the estimation label plus two readings that were never drawn (P1).** `joint_currents`
  and `tcp_speed` were already delivered in `detail` but nothing rendered them; both have rows now (TCP
  speed as the linear-velocity magnitude). And whenever the host marks the telemetry
  `telemetry_estimated`, those rows carry an **`(estimated)`** suffix — the panel must not present an
  estimate in the same shape as a measurement, which is exactly the honesty the tool replies carry.
- **The simulation's capability boundary is readable in the panel (P2).** A collapsible line under the
  simulation controls lists how many ops each bucket holds (motion / readback / I/O and registers /
  telemetry / not simulated), with the full list in its tooltip; the data was already in the
  `twin/sim` response.

## [0.1.7] - 2026-10-14

### Changed

- **The term is now "simulation panel"（仿真面板）** in both languages: `twin panel` / `digital twin` →
  `simulation panel` / `simulation`, and 「孪生」→「仿真」, across documentation, tool descriptions and
  UI strings. Internal identifiers were deliberately left alone — `lib/twin-*.js`, the `/twin/*` routes
  and the `ursim-twin` DOM namespace are a wire/DOM contract, so renaming them would buy nothing and
  risk the client bundle. The archived four-expert audit keeps its original wording; editing a record of
  what the experts wrote would falsify it.
- **The sidebar card icon is a robot arm** instead of the "house with a knob" it used to draw: base
  plate → column → upper arm → wrist with a two-finger gripper, two joints circled, same 26 px slot and
  accent colour.

### Added

- **`check-tool-params.py` is now a real parser on both sides (roadmap D2).** The schema side used to be
  read out of `lib/tool-defs.js` **as text** (a regex that required two fields on adjacent lines, hand
  counting of braces to find the parameter block, and a "did we see 86 tools?" guard standing in for the
  fact that the parse could silently find nothing). It now reads `docs/tool-schemas.golden.json`, the
  registration snapshot — which since this release carries each tool's **`op`**, and that is what lines
  schemas up with `HANDLERS`. The Python side stays `ast`-parsed, and the scanner understands the shapes
  the code actually uses: helper delegation (`_axis_move(p, …)`), `_sim_require(p, "k", …)`, `_vec` vs
  `_float_list`, `str(p.get("k", "")).lower()` dispatch chains, and the difference between
  "absent ⇒ refuse" and "present ⇒ refuse" guards.
- The gate now asserts three families instead of two: **declared ↔ read** (as before),
  **required ↔ enforced** (a `required: true` the handler quietly defaults, and a hard read the schema
  calls optional), and **type ↔ coercion** (`boolean`↔`bool`, `integer`↔`int`/`_bounded_int`,
  `number`↔`float`/`_bounded_float`, `array`↔vector helper). Bounds stay unchecked on purpose: the
  snapshot keeps ranges in prose ("端口号：std 0-7、config 8-15"), so there is nothing machine-comparable.
  Anything the static analysis cannot prove (the second direction of required-ness, conditional
  requirements) is reported as a **note**, not silently absorbed.

### Fixed

- **Two tools declared an int register as `number`** (`ursim_send_script`, `ursim_draw_circle`) while the
  handler validates it with `_bounded_int` — the schema promised a fractional register index the worker
  would refuse. Found by the new type assertion.
- **`ursim_set_tool_output_mode.mode` no longer defaults to `1` (power).** The schema marked `mode`
  required, but the handler silently defaulted to the mode that reuses the tool's digital-output pins as
  an extra power supply — the one setting in this plugin that can damage whatever is wired to the flange.
  A missing `mode` is now refused with an explicit `BADARG`.

## [0.1.6] - 2026-10-14

### Added

- **Simulated telemetry (roadmap B1).** Five ops that used to answer `SIM_UNSUPPORTED` now return
  **estimated** values: `get_runtime_telemetry` (joint currents/voltages/speeds, TCP speed and force,
  tool accelerometer, momentum, robot voltage/current, joint temperatures) plus the single-value
  readers `get_robot_current`, `get_robot_voltage`, `get_joint_temperatures` and `get_tcp_force`.
  - The estimate is **finite differences plus an order-of-magnitude model**: joint speeds and
    accelerations come from two consecutive samples, torques/currents/voltages from those, the
    temperatures settle towards `ambient + load` with a ~60 s time constant, and the TCP wrench is the
    nominal payload's inertial + gravity reaction.
  - **Every reply carries `estimated: true` and a `note`.** There is no controller and no dynamics
    here, so a telemetry reading can only be an estimate — presenting it as a measurement would be the
    one genuinely dangerous thing this feature could do.
  - The same six fields (`robot_voltage`, `robot_current`, `joint_temperatures`, `joint_currents`,
    `tcp_force`, `tcp_speed`) are now part of `ursim_get_status`, with `telemetry_estimated: true`.
    That matters because **the simulation panel's detail channel reads `status`, not
    `get_runtime_telemetry`** (see `body.detail` in `lib/twin-routes.js`) — without this the row would
    still be empty in simulation.
- New test `test/sim-telemetry.test.mjs`: while a motion runs in a background thread, the main thread
  samples the telemetry and asserts that speeds, currents and TCP speed are non-zero — the
  user-visible "the panel's telemetry row has values" claim — plus the honesty labels and the `status`
  fields.

### Changed

- `ursim_sim_status`'s capability list moved telemetry out of `not_simulated` into a new `telemetry`
  key, and its note states that the values are estimated.
- The READMEs no longer list RTDE telemetry among the things the simulation cannot do.

## [0.1.5] - 2026-10-14

### Added

- **Simulated I/O and registers (roadmap B3).** Nine ops that used to answer `SIM_UNSUPPORTED` now
  have a simulation meaning, so a teaching/demo script can finally write "set → read back → assert":
  `set_digital_out` / `get_digital_out_bits` (std 0-7, config 8-15 on UR's global numbering, tool 0-1),
  `get_digital_in` / `get_digital_input_bits`, `set_analog_out` / `get_analog_in`, and
  `get_int_register` / `get_double_register` / `get_bit_register`.
  - The state is **in memory** and hangs off the virtual robot **instance**, so `sim_stop` +
    `sim_start` (or the host's self-healing rebuild after a child process is replaced) returns to the
    initial state — the same semantics as a controller reboot, with no extra bookkeeping.
  - **Inputs have no producer** (no tool can set an input) and the **registers have no writer** (the
    plugin ships read-only register tools), so both stay at their initial values — and every such
    reply says so in a `note` field instead of quietly returning 0.
  - Parameter validation is not relaxed: an out-of-range port is refused, and a *missing* required
    parameter is now a clear `BADARG` (the real-robot handlers raise `KeyError` there, which surfaces
    as an opaque failure).

### Changed

- `ursim_sim_status`'s capability list moved I/O and registers out of `not_simulated` into a new `io`
  key, and its note now states the memory-state semantics.
- **The READMEs' capability claims follow the code again**: the top banner and the "what it cannot do"
  list no longer say that I/O and registers are unsupported, and the URSim paragraph now states what
  it takes to drive it (enable the real-robot channel) instead of claiming this release cannot.

## [0.1.4] - 2026-10-14

### Added

- **The real-robot channel is back — off by default, behind an allow-list (roadmap A).** Two new
  configuration keys: `motionMode` (`'sim'` | `'real'`) and `realRobotIps` (a comma-separated
  allow-list). In the default `sim` mode nothing about the plugin's behaviour changes: the worker
  still rejects any address other than the reserved loopback one *before* dispatching. In `real` mode
  a target outside the allow-list is refused on the host **before** it reaches the worker, an empty
  allow-list refuses everything (fail-closed), and the plugin warns when `real` is enabled without
  one.
  - **There is no approval exemption in `real` mode**: every gated command asks a human, including
    commands aimed at the simulation. That closes the audit's H-2 finding structurally — the
    exemption used to be host-side state the model could set itself via `ursim_sim_start`; it now
    follows from a configuration value a human writes.
  - The reserved loopback address **always** means the virtual robot, in both modes: it is never
    handed to the real-robot implementation, which would otherwise re-open the
    controller-port-forwarded-to-loopback path the audit named.
  - The prerequisite fixes this depended on (H-3 read-class gating, M-1 approval payload binding)
    shipped in 0.1.3.
- **CI** (`.github/workflows/ci.yml`): the full suite plus an explicit client-bundle rebuild checked
  with `git diff --exit-code`, on Ubuntu **and** Windows. `verify:host` runs report-only, because it
  compares against the *installed* host packages, which this repository does not publish.
- **`scripts/check-doc-links.mjs`** (wired into `check:docs`): every relative link in the shipped
  Markdown must resolve. This is the assertion that would have caught the audit's D2 and D8 dead links
  automatically; the three intentionally-absent targets are listed with their reasons.

## [0.1.3] - 2026-10-13

Everything below comes out of the four-expert audit of the 0.1.2 code base (raw reports kept in
[`docs/audit-2026-10-13-four-experts.md`](./docs/audit-2026-10-13-four-experts.md)) and the follow-up
work that audit recommended. **The simulation-only contract is unchanged**: `ip` still only ever means
the reserved loopback address, and there is still no real-robot channel.

### Fixed

- **The simulation's read requests could starve a stop command (H-3).** Simulation reads and commands share one
  single-threaded worker with an in-flight ceiling of 8, and admission is "total ≥ ceiling ⇒ BUSY".
  Every SSE subscription has its own frame pump, so **8 subscriptions filled all 8 slots** — and
  `stopj` / `stopl` / `end_force_mode` were then rejected **on the host side**, never reaching the
  worker: exactly when a moving robot most needs to be stopped. Reads now pass their own gate
  (`class: 'twin-read'`, ceiling 3), which reserves **at least 5 slots** for commands; `/twin/stream`
  additionally refuses more than 4 concurrent subscriptions with an explicit `503` instead of letting
  every subscription starve.
- **`send_script` asked a human to approve a script they could not read (M-1).** The approval prompt
  truncated the payload at 240 characters, so everything after character 241 was approved sight
  unseen. It now reports line count / byte count / the first three lines, and the approval reason
  carries a **payload fingerprint** (sha256, first 16 hex digits) that is re-computed after approval:
  if the payload changed while the human was deciding, the command is cancelled and never dispatched.
  The binding is deliberately over the *whole* payload rather than the script text — `sanitizeArgs()`
  is a shallow copy, so nested arrays (`force_mode`'s `task_frame`, `selection_vector`, `wrench`) are
  shared with the caller and really can be mutated during the approval window.
- **`list_programs` shipped a hard-coded SSH credential.** The `root/easybot` default is gone
  (a password must now be supplied explicitly, and its absence is a clear error), and
  `paramiko.AutoAddPolicy()` became `RejectPolicy()` — the old policy accepted *any* host key, which
  made a channel that runs commands on the controller transparent to interception.
- **The model loader could fetch the same mesh twice.** Two calls in the same await window each ran
  `GLTFLoader.loadAsync` and each assembled a group; only the second entered the cache, so the first
  was dropped without ever being released. There is now an in-flight table (the second caller waits
  for the same promise), the reference count is uniformly owned by the caller, and the cache has a
  bound (`MAX_CACHED_MODELS`) that evicts only entries with no live references.
- **`disposeObject3D` disposed *every* property of a material.** Any field with a `dispose` method was
  released, including `envMap` — which, when set, points at the scene-shared PMREM environment: disposing
  it turns **every PBR material in the scene black**, and switching models walks that path. Disposal is
  now a whitelist of model-owned texture slots, with `envMap` deliberately excluded.
- **`/twin/asset` re-read and re-hashed the whole GLB on every request** — including the `304` path,
  which the browser revalidates whenever the panel opens. It now checks `size + mtimeMs` (meshes are
  regenerated in place, so the name alone is not enough) and serves subsequent requests from memory.
- **Static frames recomputed the pose 60 times a second.** Only a new sample (10 Hz) and the short
  interpolation window that follows it carry information; every other frame's result was bit-identical
  to the previous one (`interpolateAt` clamps to the current sample outside the window). Such frames
  now reuse the previous FK result instead of re-running interpolation, forward kinematics, matrix
  writes and a trajectory redraw. The first frame *after* the window still computes, so the displayed
  pose **converges exactly** to the last sample the controller reported.
- **A gate could die on a leftover temp file.** `check-new-ops.py` removed its scratch log with a bare
  `os.remove`, so a stale file held open by a previous run (Windows `WinError 32`) aborted the whole
  check. Cleanup failure is now tolerated — a scratch file must not be able to fail a gate.

### Changed

- **The tool declarations now live in `lib/tool-defs.js`** (`lib/index.js` went from 1977 to 957 lines).
  The 963-line declaration table and its six parameter-DSL helpers moved out; `index.js` only registers
  and applies runtime policy. The declaration surface became a factory (`buildTools(config)`) because
  the per-tool `timeoutMs` comes from configuration, which the array used to read through the
  enclosing closure. Ten readers of the old location (four gates, two scripts, four tests) were
  updated, and the move is proven behavior-preserving by the two golden files below, which are
  byte-identical across it.
- **Every op must now declare its classification.** `docs/tool-matrix.json` states, per op, whether it
  is behind the human-approval gate and what the simulation does with it
  (`simulated` / `passthrough` / `unsupported`); `docs/tool-matrix.md` is the readable matrix.
  `scripts/tool-matrix.mjs` (wired into `check:docs`) fails when an op is undeclared, when a
  declaration disagrees with `APPROVAL_OPS` or with the worker's `SIM_OPS` / `SIM_PASSTHROUGH_OPS`, or
  when a stale entry remains. Until now those two decisions were **silent defaults** — which is exactly
  how H-1 (seven ops with physical side effects sitting outside the approval gate) went unnoticed.
- Documentation: the READMEs no longer claim that every tool but `connect` takes an `ip` and needs a
  prior connection (only `ursim_ping` takes no `ip`, and the simulation target needs no prior
  `connect`); the CHANGELOG preamble no longer links to the removed archive file.

### Added

- **`docs/tool-schemas.golden.json` + a golden-snapshot test.** The existing gates only compare
  parameter *names* against what Python reads, and check that tools appear in the README tables —
  **none of them covers types, defaults, `required`, or description text**, so moving 1300 lines of
  declarations could silently change a `type: 'number'` into `'string'`. The snapshot records every
  tool's name, description, timeout and parameter schema (canonicalised) and fails with a field-level
  diff. Proven by mutation: the type change leaves `check-tool-params.py` green while the snapshot
  names all six affected tools.
- `URSIM_WRITE_GOLDEN=1 node --test test/tool-schema-dsl.test.mjs` regenerates the snapshot for an
  intentional contract change.

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
- **The simulation's over-limit joint warning never fired.** `writeHud()` passed `fkResult?.jointLimits`, a
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

- **The simulation no longer draws an unposed arm when the pose feed has a gap.** A model that has been
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
- **A read-only 3D digital simulation** (three.js) mounted from a card in the right sidebar's Start panel:
  joint poses, TCP frame and recent trajectory, engineering layer toggles, and a numeric dashboard-side
  readout. It is strictly read-only and never sends a command to the robot. Telemetry is **pushed by
  the worker** at 20 Hz and the simulation reads that cache first, so the feed does not stall while the robot
  moves; simulation reads use a dedicated budget with `killOnTimeout:false` so a visualisation read can never
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
- **The simulation panel follows the app's colour theme** (light / dark / system). The panel's CSS is now
  built on the host's `--dsw-alias-*` design tokens with theme-paired local fallbacks, so it tracks
  DSH's appearance setting — and any third-party theme overriding those aliases — with no JS. The
  WebGL base grid, whose colours live in the geometry's vertex colours and are therefore invisible to
  CSS, is repainted **in place** by `scene.js`'s `applyTheme()` from the same signal
  (`body[data-ds-dark-theme]`) that the new `src/client/theme.js` resolves and watches.
- **The simulation panel enters an offline simulation by itself when it opens** (`UR12e`, upright pose,
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
  effectively random joint speed from one simulation frame to the next). Measured on a 0.5 m `movel` at the
  20 Hz simulation cadence: **3** near-zero frames instead of ~52, cruise speed flat to within 1.5 %, no
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
  `ip` parameter is optional everywhere and only `127.0.0.1` is accepted. The simulation route ignores
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
  - the simulation route prefix `/dsh-nonead-ur` → **`/nonead-ursim`** (`/nonead-ursim/twin/{state,asset,models,stream,sim}`);
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
