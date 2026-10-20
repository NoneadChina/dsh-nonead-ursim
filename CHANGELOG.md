# Changelog

This package follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

The version line of this package **starts at 0.1.0**: `dsh-nonead-ursim` is an independent DSH plugin,
so it does not continue the version numbering of the code base it was separated from. That earlier
history was archived verbatim to `CHANGELOG-archive.md`; the file was **removed from this repository**
while preparing 0.1.1 (it is recoverable from the commit that imported the source, `4c91704`) and was
never part of the published tarball.

## [0.3.9] - 2026-10-20

### Changed

- **Home pose redefined** (user request): the panel `回零` (Home) button now brings the six joints to **0°, -90°, 0°, -90°, 0°, 0°** (base, shoulder, elbow, wrist 1, wrist 2, wrist 3) instead of the previous `[0°, -90°, 0°, -90°, -180°, 0°]`. The angle list now lives in exactly one place: a frozen module-level `HOME_JOINTS` constant in `lib/index.js` (radians), next to the `home` branch that uses it. The panel still sends only `{mode:"home"}`, so the simulated and the real path resolve the same pose; the button tooltip (`controlsHomeTitle`, zh and en) was updated in the same commit, so the hint can no longer describe a pose the arm does not go to.

## [0.3.8] - 2026-10-20

### Changed

- **The control rail's "data stalled" hint moved out of the rail too** (user report). 0.3.6 only relocated the red error line, so `数据通道停滞：控件已暂停，恢复后自动解禁` was still rendering at the top of the right rail. The hint node (`data-ursim-ctl-note`) now hangs in the same HUD slot next to `机器人 UR12e · 127.0.0.1` as the error node, through a matching optional `noteHost` argument of `mountRightRail` (falling back inside the rail when omitted, so the rail stays usable standalone). Both nodes keep `:empty { display: none }`, so the identity row shows nothing extra while the channel is healthy, and the slot clips long text with an ellipsis instead of stretching the row.
## [0.3.7] - 2026-10-20

### Changed

- **Panel defaults follow shop-floor habits** (user request): the `坐标系` segmented control starts on **基座系** (base frame) instead of the tool frame, the position jog step starts at **1 mm** instead of 5 mm, and the `基座系` layer button under the 3D view starts **pressed**. Both the button's `aria-pressed` and the scene object's visibility now come from one module-level `LAYER_DEFAULTS`, so the button can no longer say "off" while the frame is actually drawn; `幽灵臂` (ghost arm) keeps its previous default-on state and `可达范围` / `受力` stay off. The derived jog-button titles follow the new defaults, e.g. `沿基座系 X 轴正方向移动 1 mm`.
## [0.3.6] - 2026-10-20

### Changed

- **The control rail's error line moved out of the rail, next to the HUD identity row** (user request). A rejected or failed panel command no longer writes its red message at the top of the right rail; it now appears to the right of the `机器人 UR12e · 127.0.0.1` line under the 3D view, **sharing that line with the panel's own system error row** — each keeps its own slot, so a plugin-level fault and a control-rail command failure can be read at the same time. The mount point is decided by a new optional `errorHost` argument of `mountRightRail` (when omitted the node still goes back inside the rail, so existing callers and tests are unaffected); the HUD slot shrinks instead of stretching the row and ends long text with an ellipsis.

## [0.3.5] - 2026-10-20

### Changed

- **The control rail was re-aligned to the teach-pendant reference** (user feedback with a screenshot of the running panel). Four adjustments, none of which removed a control: the `步长 mm` / `步长 °` labels moved to the **left** of their button column (a fixed 40 px label column, so the text wraps to two lines exactly like the pendant); `Z+` / `Z−` and `RZ+` / `RZ−` grew to 44 px tall so they read as wide buttons rather than pad cells; the joint row went 52 / 30 / 1fr / 30 / 60 with an 8 px gap → **44 / 30 / 1fr / 30 / 52 with a 6 px gap**, which gives the slider ~24 px more room while keeping the 30 × 30 hit area on the ± buttons; and the right column narrowed 104 → **96 px** with the pose axis labels 26 → **22 px**, so each of the six pose inputs is ~8 px wider. The rail is still 500 px wide.

## [0.3.4] - 2026-10-20

### Changed

- **The single control rail is 500 px wide** (user feedback after the 600 px round). The rail was rescaled as a whole, not just narrowed: the side column holding `坐标系` and the step sizes went 172 → **104 px**, so the two jog pads still fit side by side with 54 px buttons (500 − 1 border − 20 padding − 104 side column − 10 gap = 365 px available; 2 × (3 × 54 + 2 × 6) + 10 = 358 px). The joint row is now 52 / 30 / 1fr / 30 / 60 with an 8 px gap, and the ± step buttons are 30 px.
- **`步长 mm` and `步长 °` are stacked vertically** instead of sitting side by side: `.ursim-twin-ctl-steps` is a column flex container now, and each block keeps its own column of step buttons. Nothing else moved — the layout order, the 24 px collapsed state and the jog / hold behaviour are unchanged.

## [0.3.3] - 2026-10-20

### Changed

- **The single control rail is 600 px wide instead of 700 px** (user feedback after seeing it on screen). The jog pads were rescaled to match: buttons 64 → **60 px**, so a pad is 3 × 60 + 2 × 6 = 192 px and the two pads still sit side by side (2 × 192 + 10 = 394 px) inside the 397 px left column (600 − 1 border − 20 padding − 172 right column − 10 gap). Nothing else moved: the layout order, the 172 px right column for `坐标系` and the step sizes, the joint row (56 / 32 / 1fr / 32 / 64) and the collapsed state (24 px) are unchanged.
## [0.3.2] - 2026-10-20

A review round over the whole plugin — host, worker, panel, docs, gates — fixing 33 defects. Four of them changed behaviour a user could feel: releasing a jog button could leave the velocity stream running, opening the panel could kill the worker, the simulated arm's state could tear across threads, and the README promised a test semantics the runner did not implement. On top of the fixes, the panel dropped from two control rails to one 700 px rail laid out like the teach pendant.

### Fixed

- **Releasing a jog button could keep the arm moving.** The velocity stream was stopped only by button-level `pointerup`/`pointerleave`/`pointercancel`; releasing outside the window (alt-tab, drag off-screen, tab hidden) left it restating 25 mm/s every 100 ms. Window-level `pointerup`, `blur` and `visibilitychange` now always end the hold.
- **Opening the panel could kill the Python worker.** Read-only telemetry and the I/O write used the default `killOnTimeout: true`, so one panel poll queued behind a long command could tear the process down — losing the simulation state, or on a real robot cutting the only channel able to send `stopj`. Panel paths now use a short budget with `killOnTimeout: false`.
- **Simulated state could tear between threads.** The push thread (`snapshot` → `advance`, every 50 ms) and the command thread did read-modify-write on the same fields without a lock: a frame could jump to a segment end and bounce back, and overlapping integrations could double the velocity. `VirtualRobot` now serialises advance/plan/twist/stop/status/snapshot under an `RLock`.
- **`POST /twin/sim` with an empty body silently stopped the simulation.** `enabled` was read as `body.enabled === true`, so `POST {}` or `null` fell into the stop branch and still answered `200`. A non-object body or non-boolean `enabled` is now `400`, and route errors answer their real status instead of always `200`.
- **`ursim_disconnect` cleared the simulation registration regardless of target**, so disconnecting a real robot in `real` mode also disabled the simulation and persisted that; jog then answered `403 SIM_ONLY`. The reset now applies only to the simulation target.
- **`set_digital_out` read `"false"` as `true`** — `bool("false")` is `True`. Booleans are parsed strictly now (`true`/`false`/`1`/`0`), and a missing `value` is `BADARG` rather than a crash.
- **A clockwise `movec` lost its starting orientation**: the signed fraction was clamped to 0 on a negative sweep, dropping the first arc segment. Fixed by normalising the signed fraction.
- **`ursim_jog_rotate` had no upper bound on `delta_rad`** — on the simulation `1e4` became 25 000 segments of `move_cartesian` plus settle with no timeout, wedging the worker. The increment is now bounded by π.
- **Rotation interpolation took the long way across ±π** (component-wise wrap); poses are now interpolated by composing the relative rotation and slerping its rotation vector, so a `movel` across the ±π seam stays on the short path and the final attitude is exact.
- **A serialisation failure could kill the worker silently.** `respond()` called `json.dumps(..., allow_nan=False)` outside its own try and stdin decoded with `errors="strict"`, so one NaN reply or one bad byte ended the process with no error to the caller. Replies now fall back to a `SERIALIZE` error object and stdin decodes with `errors="replace"`.
- **`ursim_stop` was followed by `is_steady: false` for 50 ms** because `stop()` reset the horizon to the minimum segment length instead of zero.
- **`wait_steady`'s 300 s allowance exceeded the host's 60 s call deadline**, so a legal long wait was killed by the host first; `run_sequence`/`speedj`/`speedl` mismatched the browser-side `t` the same way. The host timeout now derives from the requested seconds, capped by the configured maximum.
- **`ursim_list_programs` could never succeed against a real controller** — `RejectPolicy` with an empty known-hosts set rejects every host — and leaked the SSH session on failure. It loads the system known-hosts file, closes on every path, and prints the exact `ssh-keyscan` command when the host key is unknown.
- **`_sim_settle` timed out while the simulated arm kept moving** (the reply said "failed" but the trajectory continued). Timeout now freezes the arm at its current attitude.
- Also: `null` protocol lines no longer throw inside the readline callback; restart timers are tracked, cleared on dispose, and `_spawnOnce` refuses after dispose; `spawn` passes `windowsHide`; `shutdown`'s timer is `unref`'d and cleared; `readJsonBody` rejects non-object JSON; `sendJson` skips closed sockets; `jog_rotate`/`set_speed_scaling` gained the missing gate cases; `tool-matrix` verification now reads the generated Markdown it claims to check.
- **Panel:** a pose/joint submit while busy was silently dropped (the edit was cleared first) — it now reports why and keeps the input; the error line survives more than one frame; HUD rows stop rewriting `aria-live` at 10 Hz; the canvas has a `:focus-visible` outline; joint ± buttons are 32 px with a 12 px gap (they were 26 px/2 px — one mis-click means one real degree); pose inputs accept plain decimals only (`0x10`/`1e3` were sent as 16/1000); the layout gets a container query for narrow docks; `refreshIo` drops out-of-order replies; the mode badge stops being rewritten every frame.
- **Docs and packaging:** the README route table was missing `POST /nonead-ursim/twin/jog` (and had a malformed 3-cell row GFM discarded); non-existent version references (`0.6.0`/`5.0`/`^0.2.4`) were replaced with factual statements; `run-tests.mjs` now exits non-zero when anything was skipped (with an opt-in `--allow-skip`), matching the README's "a skip is never a pass"; `check-package-metadata` matches `files` entries exactly; the tarball carries `LICENSE-AGPL-3.0.txt` and excludes `lib/client.js.map` (15.5 MB instead of 16.2 MB); `prepublishOnly` runs the full check set and the test suite.

### Added

- `docs/test-report-2026-10-20.md`: the v0.3.1 regression — four verification layers, 59/59 items, 89/89 tools registered through the host's real DSL, 6 panel routes, 14 model assets, and the end-to-end smoke matrix over the simulation. The 2026-10-19 report is now marked as a v0.2.4 archive.

### Changed

- **The panel now has one control rail instead of two.** The left rail (jog pads, step sizes, reference frame, home) and the right rail (TCP pose, joints) were merged into a single **700 px** rail that follows the pendant layout requested by the user: readout → `TCP 位姿` six fields with the `坐标系` selector stacked on the right → the position and orientation pads → the six joint sliders. Nothing was dropped, and the stage is a two-column grid (`3D | 700px`) instead of `180 | 3D | 350`; the collapsed state is still remembered in localStorage (the stored `left` key is ignored rather than reset).
- Jog and pose/joint submission now share **one motion gate** (`createMotionLock`): previously each rail had its own busy flag, so a held jog button and a typed pose could be sent to the host at the same time. Jog buttons are 64×64 with a 6 px pad gap, the frame and step segments stack vertically in the right-hand strip, and `data-ursim-jog-mode` is mirrored onto the rail body so the whole panel has a single "stepping vs streaming" state.

## [0.3.1] - 2026-10-19

A version about jogging feel and panel layout: holding a jog button now moves the arm **continuously** instead of one step at a time, both rails are wider, and the left rail lost a control it did not need.

### Added

- **Press-and-hold jogging = a velocity stream.** A short tap still moves one step (for fine adjustment); holding for 250 ms switches to a velocity stream (25 mm/s translation, 15 °/s rotation, restated every 100 ms), and releasing stops immediately. This is the teach-pendant feel — packing more small steps closer together does not work, because each `movel` accelerates and decelerates on its own and still reads as stuttering.
- **Velocity semantics in the simulation.** The virtual robot integrates the twist over time inside `advance()` (first frame `dt = 0`, per-frame clamp 0.1 s); angular velocity is composed by left-multiplication in the base frame and right-multiplication in the tool frame, then solved by IK. The new `speedl` op and the existing `stopl` both drive it. A **watchdog** zeroes the velocity if no new velocity command arrives within 400 ms — if the browser crashes or the tab is backgrounded, the arm stops by itself. That is the deliberately chosen failure direction.
- **Two new modes on `/nonead-ursim/twin/jog`**: `velocity` (`twist` six values + `frame` + `ttlMs`, clamped to 100–2000 ms) and `stop`.

### Changed

- Both panel rails are wider: left 128 → **180 px**, right 176 → **350 px**; jog buttons grow to 52×52 and are labelled with axis and direction (`X+`, `Y−`, `RX+`, …), section titles carry their units, and the right rail's pose inputs become a 3-column × 2-row grid with a fixed-width value column for joints.
- **The left rail no longer has a speed-scaling control** (it was added for mid-run speed changes, but the feel is dominated by the velocity stream). The capability is still available through `ursim_set_speed_scaling`.

### Fixed

- **Press-and-hold moved only one step.** The root cause was setting the pressed button to `disabled` while a command was in flight: a disabled element stops receiving `pointerup`, the browser fires `pointercancel`, and the hold timer was cleared on the spot. Now only unavailability disables a control; the busy state is expressed with `aria-disabled` plus CSS, and pointer capture is used (`setPointerCapture` / `lostpointercapture`).
- The left rail's `3×52 + 2×6 = 168` overflowed the 167 px available width by 1 px and was clipped by `overflow-x: hidden`; the pad `gap` is now **5**.
- `docs/tool-matrix` still marked `speedl` as `unsupported` although the simulation now implements it; regenerated as `simulated`.

## [0.3.0] - 2026-10-19

The release that turns the simulation panel from “read-only” into “controllable”: left-rail jogging, right-rail pose and joints, plus the write route and the two tools behind them. Every control applies **only to the offline simulation**; real-robot control still goes exclusively through the approval-gated tools.

### Added

- **Live controls in the panel.** The left rail offers TCP position/orientation jogging (one step per click), steps of 1/5/10 mm and 1/2/5°, homing, and a speed-scaling control from 10% to 100%; the right rail offers numeric TCP pose inputs and six joint sliders. Dragging a slider runs forward kinematics **locally** for the preview and sends nothing until release — otherwise one drag would become dozens of motion commands, smooth in simulation but dozens of start/stops on a real arm.
- **Host write route `POST /nonead-ursim/twin/jog`** carrying six modes (`cartesian` translation, `rotate` incremental rotation about an axis, `pose` absolute pose, `joint` joint targets, `home`, `speed`). It shares the trust fence with the existing write route, and the **simulation guard is decided by the host itself** (`isOfflineSimTarget`), never by any client-supplied field: a non-simulation target always gets 403 `SIM_ONLY`. The guard deliberately runs **before** body parsing — on a real-robot deployment a malformed body answered with 400 would read as “wrong parameters, fix and retry” instead of “this channel does not write here”.
- **`ursim_jog_rotate`** rotates the TCP incrementally about rx/ry/rz, with a finite non-zero `delta_rad` and `frame` of `tool` (default) or `base`. The real and simulated paths share one geometry implementation; the base frame composes rotations strictly by left-multiplication — repeated jogs accumulate, so approximating with angle addition drifts by degrees after a few clicks.
- **`ursim_set_speed_scaling`** takes a fraction of 0.01–1.0 (the panel additionally clamps to 10%–100%). The simulation changes controller state **in place** without rebuilding the instance, so changing speed mid-run does not snap the arm back to its initial pose; the real path sends `set_speed_slider` and reads the **measured** value back (`SpeedScaling()`; the requested fraction cannot be read — `TargetSpeedFraction()` is unimplemented in URBasic). A reading of 0 while the robot is stationary is normal and does not mean the setting failed.

### Fixed

- **`_matrix_to_rotvec`'s general branch amplified error near π.** The old `θ/(2 sinθ)` form drives its denominator to zero as θ→π, inflating orientation error to the 1e-4 range (worse the larger the jog); it is now “normalize the antisymmetric vector, multiply by θ”, so the same inputs no longer depend on the denominator's numerical health.
- **Large pure-rotation increments in the simulation failed spuriously.** A rotation beyond 0.5 rad hit `MAX_IK_STEP_RAD` point by point and was reported `SIM_UNREACHABLE` — a reachable target rejected by the continuity gate. Pure rotations are now split into ≤0.4 rad segments: the gate still enforces “every step is small” rather than “the whole move must be small”.

### Changed

- Tool surface 87 → **89**, ops 88 → **90**, approval-gated ops 48 → **50**: both new ops can move the arm (`jog_rotate` also rewrites the reference orientation of every later motion), so both are in `APPROVAL_OPS`.
- The “offline simulation” dropdown is renamed **starting speed scaling**: it only applies when the simulation is **created** and rebuilds the instance, which is not the same thing as the live speed-scaling control on the left rail — sharing the name made users expect it to re-speed the running robot.

## [0.2.5] - 2026-10-19

A declaration-only release: runtime behaviour is unchanged from 0.2.4, but the package now declares
the host version family it is actually installed against.

### Fixed

- **Peer ranges now cover the host version family actually installed.** The running host (Nonead DSH
  Desktop 2.1.6) ships `@deepseek-ai/dsh` / `dsh-tools` `0.2.1-alpha.5`, `cordis` `4.0.5-alpha.2` and
  `schemastery` `3.18.5-alpha.2`, and none of them matched the previous `^0.2.0-rc.2` / `^4.0.2` /
  `^3.18.2` ranges — semver only lets a pre-release satisfy a comparator carrying the same
  `major.minor.patch` tuple. `verify:host` against the installed host now reports 4/4 peer checks plus
  87/87 tool registrations; the functional checks were green all along, only the declarations were stale.
- Two messages that promised something the plugin cannot do are corrected: the "no simulation
  semantics" refusal used to tell users to point `ursim_connect` at a URSim IP (which is rejected in
  sim mode), it now points at `motionMode=real` + the `realRobotIps` allow-list; `ursim_sim_stop` no
  longer claims the plugin returns to a real robot. Both are pinned by assertions in
  `test/sim-only.test.mjs`.

### Documentation

- Added [`docs/test-report-2026-10-19.md`](./docs/test-report-2026-10-19.md): records the four-layer
  verification of 0.2.4 — `npm run check` green, `npm test` **59/59** (48 test files + 11 gates,
  0 failed / 0 skipped), `verify:host` registers **87/87** tools through the host's real DSL,
  `verify:models` passes 14/14 models, plus a live UR12e offline-simulation smoke run. It also states
  the reproduction commands and the **true-robot coverage boundary** (force mode, safety status bits,
  program load/execute, URScript, conveyor).
- The “Health check / testing” section of README / README.zh now carries the latest regression result
  and a link to that report, so “how to verify” and “what was verified” live in one place.

## [0.2.4] - 2026-10-17

A hardening release driven by a full-project audit (four read-only reviewers covering the host half,
the Python worker/simulation, the browser panel, and packaging/docs). Every item below ships with a
test that fails on the previous code.

### Fixed

- **The register rows in the panel no longer disappear after ~100 ms.** `renderIo` used to assign
  `ioBody.textContent`, which removes every child node, while `renderRegisters` appended a row — so the
  1 Hz HUD beat wiped the registers that had just been shown. `ioBody` is now split into two fixed
  children (bits / registers) that are updated independently.
- **Read admissions are no longer racy, and a frame's fan-out fits the gate.** The class/total checks ran
  before an `await`, so a same-tick burst of reads passed them all (8–16 reads could fill every slot and
  push `stopj`/`stopl`/`stop_program` into `WORKER_BUSY`). Admission now reserves a slot synchronously, and
  one frame's reads are issued serially, so a full register frame occupies a single read slot. `readIo`
  also falls back to the last good reading instead of turning the whole block into an error line.
- **Cancelling no longer kills the Python worker unless the request was already dispatched.** Slow
  approvals and pre-dispatch aborts used to tear down an idle worker (on a real robot that loses the RTDE
  session while the controller keeps executing). `onAbort` now respects `killOnTimeout` and only kills
  after the payload was written; timeout messages say explicitly that the controller may still be moving.
  Gated tools also get an approval margin on their host deadline (the worker budget is unchanged).
- **`ursim_connect` / `ursim_disconnect` register the simulation lifecycle** they implicitly start/stop,
  so the gate's simulation exemption, the panel's I/O write route and post-respawn self-healing all agree
  with the worker again (and both paths report the same model).
- **Motion failures are reported as failures.** When `_wait_robot_idle`/`_sim_settle` could not confirm
  arrival (including "the controller never started the script"), the envelope used to be `ok: true` with
  `data.ok: false`. It is now `ok: false` with `NOT_EXECUTED` / `NOT_CONNECTED` / `TIMEOUT`; the success
  path is byte-identical.
- **Inverse-kinematics fallback has a continuity gate.** A multi-seed fallback could return a solution
  5.3–6.7 rad away from the previous waypoint, i.e. the simulation reported "arrived" along a path the
  real arm cannot take. Fallback solutions must now stay within `MAX_IK_STEP_RAD = 0.5` of the incoming
  seed (with one local retry), otherwise the move fails with `SIM_UNREACHABLE`.
- **Worker stdin is UTF-8.** On Chinese Windows, `sys.stdin` is GBK, so non-ASCII parameters were silently
  corrupted and the reply then raised `UnicodeEncodeError` *after* the side effect. The worker is spawned
  with `PYTHONUTF8=1` and reconfigures stdin to UTF-8.
- **`ursim_connect`/`ursim_disconnect` work in `real` mode**: the loopback address still means the
  simulation (structural guarantee unchanged), other allow-listed addresses now establish/release a real
  session instead of failing with a confusing `SIM_BADARG`.

### Changed

- Tool descriptions are **mode-aware**: in `real` mode `ip` is documented as required and allow-listed
  (85 golden entries updated; no non-description field changed).
- The READMEs' gated-operation list is now **derived from `APPROVAL_OPS`** by `check-doc-tools.mjs`
  (both directions), and the seven H-1 operations that were missing are listed.
- `engines.node` is `>=22.15` (what `verify:host` actually needs); CI uses Node 22 + `npm ci` and no longer
  hides `verify:host` behind `continue-on-error`; `npm test` runs **11** gates (adding `tool-matrix` and
  `check-doc-links`), and the READMEs' counts were corrected to 48 test files / 17 Python / 31 Node.
- Added `package-lock.json` (the committed bundle is only byte-reproducible with a pinned esbuild).
- Third-party licence **full texts** now ship: MIT (URBasic, three.js), BSD-3-Clause (UR graphical docs)
  in `THIRD_PARTY_NOTICES.md`, and `LICENSE-AGPL-3.0.txt`.
- Install examples no longer contain the author's local GitLab path; the absolute-path gate recognises
  `X:/…`, `/home/…`, `/Users/…` and registers one vendored commented-out sample path as a documented
  exception.

Verification: `npm run check` exit 0; `npm test` 59/59 (48 test files + 11 gates); `verify:host` 87/87.
## [0.2.3] - 2026-10-15

### Changed

- **Motion no longer requires human confirmation by default.** `requireApprovalForMotion` now defaults to
  `false`; the approval gate is a deliberate **opt-in** (set it to `true`). The gate itself is unchanged:
  while it is on, every gated op (`APPROVAL_OPS`) still waits for confirmation and still **fails closed**
  when no approval service or agent answers, or the answer is anything other than `allowed-once`. Simulation
  targets (`motionMode: 'sim'` plus the reserved loopback address) stay exempt either way.
- The default is declared in three places that must agree: the Config schema (`z.boolean().default(false)`),
  the code fallback (`config.requireApprovalForMotion ?? false`) and the shipped `cordis.patch.yml`. A new
  check in `scripts/check-approval-gate.py` fails the build when any of them says `true`, so the product
  default cannot drift silently — proven by temporarily flipping the shipped value (exit 1) and restoring it.
- README / README.zh / the panel-parity design note now describe the gate as opt-in. The 0.1.0 CHANGELOG
  section and the dated audit are historical records and were deliberately left untouched.

Verification: `npm run check` exit 0 (87 tools / 88 ops); `npm test` 57/57 (0 failed, 0 skipped);
`scripts/check-host-compat.mjs` reports 87/87 tools registered through the host's real value-schema DSL.
## [0.2.2] - 2026-10-15

### Added

- **`ursim_run_sequence` — a whole motion sequence in one call.** It takes an ordered list of segments
  (`{"type":"joint","q":[…]}` / `{"type":"cartesian","pose":[…]}`) plus one `v`/`a` (and an optional
  whole-sequence `t`) and runs them as **one continuous trajectory**: in the offline simulation every
  segment becomes joint waypoints and the whole polyline gets a **single** time profile
  (`ur_sim.VirtualRobot.run_sequence` → exactly one `_plan` call), so the arm does not stop between
  segments — 20 segments are one acceleration and one deceleration, not 20 start-stops. A cartesian
  segment is densified at 1 cm and inverse-solved point by point (each point seeded from the previous
  one); any unsolvable point fails the **whole** sequence instead of silently skipping it.
  On the real-robot path the same segments are emitted as URScript `movej`/`movel` with `a`/`v` and an
  optional blend radius `r`; a whole-sequence `t` is **not** modelled there and the reply says so
  explicitly (`t_ignored`).
- `ursim_draw_circle` / `ursim_draw_square` / `ursim_draw_rectangle` / `ursim_draw_star` now accept
  optional `v` / `a` / `t`. Their speed used to be hard-wired (`a=1.0, v=0.25`), so the only way to
  stretch a shape was to slow the entire simulation down via `ursim_sim_start(speed_scaling=…)`.
  Defaults are unchanged, so existing calls behave exactly as before.
- `ursim_run_sequence` is motion-gated (`APPROVAL_OPS` / `MUST_BE_GATED`); the pending-motion summary
  reports the segment count and kinds (joint vs cartesian) without pretending the sequence has a single
  target pose.

### Changed

- Tool table 86 → **87** tools. `docs/tool-schemas.golden.json`, `docs/tool-matrix.json` and
  `docs/tool-matrix.md` were regenerated from source; the other 81 tool schemas are unchanged
  byte-for-byte.

Verification: `npm run check` exit 0 (87 tools / 88 ops; both README tables and totals agree);
`npm test` 57/57 (0 failed, 0 skipped); `scripts/check-host-compat.mjs` reports **87/87** tools
registered through the host's real value-schema DSL.
## [0.2.1] - 2026-10-15

### Changed

- **The data-feed hint now shares the identity line.** The 「数据已停止更新 …」 hint used to occupy a row
  of its own; it now sits on the same line as 「机器人 <model> · <IP>」, right after the identity text
  (`display: flex` on the identity row, so both stay on one line and ellipsize independently). The two
  meanings are unchanged — the identity row still answers *which robot*, the hint still answers *how the
  data channel is doing* — they simply no longer take two lines.
- The identity text moved into its own `<span data-ursim-twin-identity-text>` child. That is not cosmetic:
  assigning `textContent` **removes every child element**, so writing the identity text directly on the row
  deleted the hint that had just been nested into it (the HUD refreshes at ~10 Hz, so the hint would have
  been invisible in practice). A panel test now pins 〔same row〕 by structure.

Note: the version goes `0.1.17 → 0.2.1` at the maintainer's request; `0.2.0` was not released on its own.

Verification: `npm run check` exit 0; `npm test` 57/57 (0 failed, 0 skipped); the rebuilt bundle is
byte-reproducible from `src/client/**`.
## [0.1.17] - 2026-10-15

### Fixed

- **The panel's I/O and register readout could never show a value.** The `/state` route forwarded only
  `detail` to the reader, dropping `io` / `reg` / `from` / `count` — so `wantsIo` / `wantsRegisters` were
  always false and the frame simply had no `io` / `registers` field; the panel left both blocks empty (or
  stuck on the reading hint). 0.1.16 fixed the op **name** on this same path; this is a second, independent
  defect: **one wanted the arguments forwarded, the other wanted the name spelled right.** The URL→query
  translation is now a pure, unit-tested whitelist function (`twinStateQuery`) shared by the route and its
  test — the previous tests called the reader **directly** and never went through the route, which is
  exactly why four gates stayed green while the panel showed nothing.

Verification: against a real worker, using the route's two forwarding styles — the old one yields
`body.io = undefined` / `body.registers = undefined`; the new one yields
`body.io = {digital_out[16], digital_in[16], analog_in[0,0], simulated, note}` and
`body.registers = {set:int, from:0, count:8, values:[0,…]}`. `npm run check` exit 0; `npm test` 57/57.
## [0.1.16] - 2026-10-15

### Fixed

- **The panel's I/O row could never show a value.** `lib/twin-routes.js` read the digital outputs with the
  op name `get_digital_out_bits`, following the *tool* name (`ursim_get_digital_out_bits`); the op the
  worker actually implements is `get_digital_output_bits`. One unknown op is enough to sink the row:
  `readIo` runs its four reads in `Promise.all`, so `body.io` degraded to `{error}` and the panel showed
  nothing. The registers were never broken on the host side — they were hidden by that same error line. The
  panel test faked the same wrong op name, which is why four gates stayed green; `check-worker-ops.py` now
  audits **every op name the host calls literally** (including the twin routes, which bypass the tool table)
  against the worker's `HANDLERS`, so this class of slip is caught statically.
- **The animation stuttered and the panel sat on 「数据已停止更新 Ns · 正在重试」.** The SSE detail slow-beat
  (one frame every 2 s) awaited two worker round-trips (`status` + `get_target_values`) **on the frame
  path**. The worker is a single-threaded stdin queue, so while a motion ran those reads queued until the
  twin read budget (2500 ms) expired — one stalled frame every two seconds, indefinitely. Detail is now read
  with a bounded wait (`TWIN_DETAIL_BUDGET_MS`, 400 ms) plus a last-good cache and per-robot de-duplication:
  when the worker is idle nothing changes, and a failure still reports `detail.error` honestly.
- **Simulated frames carried no connection epoch.** The push loop sent `conn` from `ROBOT_CONN_SEQ`, which
  has no entry for a simulation, so the host saw `undefined` and fell back to re-reading the robot model
  every `TWIN_MODEL_TTL_MS` (10 s) — another read that queues behind a running motion. Simulated pushes now
  send `round(sim.created_at, 3)`: constant within one simulation, changed when it is restarted.
- **The self-healing probe could kill a worker that was executing a motion.** `heal()`'s `sim_status` probe
  now passes `killOnTimeout: false`: a probe that times out is not a process that died.

### Changed (development tooling only — not part of the published package)

- `scripts/check-client-bundle.mjs` normalizes line endings before hashing: with `core.autocrlf=true` the
  byte comparison mistook a CRLF checkout for a stale artifact (the committed blob and the rebuild are
  byte-identical), which produced a false red gate on Windows.
- `scripts/check-doc-links.mjs` lists `python/sitecustomize.py` as intentionally absent — the file was
  deliberately removed, and the audit report that cites it is preserved verbatim.

Verification: `npm run check` exit 0; `npm test` 57/57 (Python included); the panel reader re-run against a
real worker (digital outputs read back after being set; `digital_in` / `analog_in` / registers populated);
the host frame path measured during a motion (45 frames, 224 ms mean, 0 stale frames).

## [0.1.15] - 2026-10-15

### Fixed (development tooling only — no runtime change)

- **`npm run verify:host` now works out of the box.** The host API compatibility check (peer versions,
  compiling all tool schemas through the host's real DSL, route shapes, the client-load contract) used to
  fail immediately with "pass the host node_modules path": its candidate list hard-coded the product
  directory name (`C:\Program Files\DSH Desktop\…`) while this machine's install is
  `Nonead DSH Desktop`, so every candidate missed and the audit effectively never ran — and a check that
  does not run is worse than one that reports a problem, because this is exactly what guards against
  silently missing tools. It now scans the usual install roots for any DSH directory, and reports
  `result: 全部通过` (86/86 tools registered through the host DSL) with no arguments.
- This release contains **no change to the shipped plugin**: `scripts/` is not part of the published
  package (`files` in package.json). The version is bumped so the tooling fix is traceable.

## [0.1.14] - 2026-10-15

### Fixed

- **Code review: two "same rule, two places" drifts.** Both were found by sweeping for the failure classes
  this project has hit before (duplicated constants, thresholds re-implemented by the caller, capabilities
  with no caller), not by re-reading the diff:
  - **The loopback address was written in two places.** `lib/index.js` had its own `SIM_IP` and
    `lib/twin-io.js` carried a second copy "to avoid an import cycle". Changing one would have made the
    panel's I/O writes silently target a different address — the hardest kind of drift to notice, because
    both sides still look right. The address now lives in a zero-dependency module (`lib/sim-ip.js`, which
    is why it cannot create a cycle) and both files import it; a test pins the write path to that source.
  - **The panel re-implemented the module's threshold.** The singularity row decided "is this joint near
    its limit" with a hard-coded `hint.limitDeg > 5`, while the real threshold is `LIMIT_MARGIN_DEG` in
    `manipulability.js`. The fix is not "have the panel import the constant" but **letting the module
    return the verdict** (`limitNear`), so the rule exists in exactly one place; the boundary (5° counts,
    5.1° does not) is now pinned by tests.

### Note

- The `io` write verb added in 0.1.13 currently has **no caller in the panel** (the I/O page shipped in
  0.1.14 and was rolled back on request). It is kept deliberately — it is part of what 0.1.13 released and
  documented — but it is recorded here so a later reader does not delete it as dead code.

## [0.1.13] - 2026-10-15

### Added

- **The panel can write I/O (design plan P1, host half).** Through the single write route the panel could
  already start and stop the simulation; it can now also write **digital outputs** (a boolean) and
  **analog outputs** (a finite value in engineering units, with an optional `full_scale` of 10 V or
  20 mA) — the two things the reference I/O page actually writes. Three deliberate restrictions:
  - **Only while the offline simulation is running** (`409 SIM_NOT_RUNNING` otherwise). Panel writes never
    target a real robot: real I/O still goes through the tools, where the approval gate and the
    declared-parameter allow-list apply. A panel button must not become a way around the gate.
  - **A parameter whitelist, validated as untrusted input** (`lib/twin-io.js`): only `digital_out` and
    `analog_out` exist, `n` must be an integer 0–15 (standard 0–7 plus configurable 8–15), and the value
    type follows the kind. Validating it in a pure module (rather than inline in the route) is what makes
    it unit-testable — the route itself is then thin enough to need no test of its own.
  - Writing that validation turned up two real holes worth keeping in mind for any write endpoint:
    `Number('')` and `Number(null)` are both **0**, so "the port was not supplied" would have been silently
    read as "write port 0". Both are rejected now, and the tests pin them.

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
