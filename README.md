# dsh-nonead-ursim

**A DeepSeek Harness (DSH) plugin that lets you control Universal Robots (UR) collaborative arms directly from natural language, developed by Suzhou Nonead Robot Technology Co., Ltd. based on the same logic as the company's own nUR MCP Server.** ([Suzhou Nonead Robot Technology Co., Ltd.](https://www.nonead.com))

This plugin shares the same ancestry as the company's `Nonead-Universal-Robots-MCP` (see "Reference implementation" below). It exposes the "control a UR robot with AI" capability as **native DSH tools**: the plugin starts a persistent Python worker (which internally reuses the vendored `URBasic` library), and tools talk to the robot through that worker. After a single `connect`, you can keep issuing commands to the same IP.

> 🧪 **Simulation-only by default (since 0.1.0).** This plugin drives **an offline, kinematics-level virtual UR robot** on the reserved loopback address `127.0.0.1` — and, unless you ask for more, nothing else. **In the default `motionMode: 'sim'` it has no real-robot channel at all**: a real IP is rejected as invalid input (`SIM_BADARG`) before anything is dispatched, and the vendored `URBasic` RTDE / Dashboard / SSH paths are unreachable from the tool surface. A real-robot channel **can** be enabled explicitly since 0.1.4 (`motionMode: 'real'` plus an allow-list — see *Real-robot channel (off by default)* below); the default above is unchanged by that. There is no `connect`-to-a-robot step: The simulation is started for you on demand (`UR12e`, upright pose, 100 % scaling), so the plugin works with **no real robot anywhere in the picture**. Commands that need a real controller (force mode, safety bits, programs, raw script, conveyor, power/brakes/freedrive) keep their tool names but answer honestly with `SIM_UNSUPPORTED` — they never fall through to a robot. Standard/tool I/O and the registers *do* have a simulation meaning since 0.1.5: an **in-memory state** where outputs can be written and read back, inputs have no producer (they stay at 0), and the registers have no writer (they stay at their initial values). **Telemetry is estimated since 0.1.6**: joint currents/voltages/speeds, TCP speed/force, the tool accelerometer and the joint temperatures come from finite differences plus an order-of-magnitude model, every reply carries `estimated: true` and a `note`, and the same values are added to `ursim_get_status` — which is what the simulation panel's telemetry row actually reads, so that row is no longer empty in simulation. The per-tool sections below are inherited from the real-robot code base and describe those semantics as they were; the behaviour that matters is the one stated here.

> ⚠️ **Safety notice**: this plugin's target is a simulation, so no physical motion can result from it. The safety warnings carried by individual tool descriptions apply to the real-robot code base this plugin was derived from.

> 🛡️ **Motion approval gate (opt-in; off by default)**: commands that physically move the arm, run a program, **take the arm out of program control, or remove its rigidity** — `ursim_movej` / `ursim_movel` / `ursim_movep` / `ursim_movec` / `ursim_run_sequence` / `ursim_servoj` / `ursim_move_optimized` / `ursim_move_x` / `ursim_move_y` / `ursim_move_z` / `ursim_move_tool_x` / `ursim_move_tool_y` / `ursim_move_tool_z` / `ursim_draw_circle` / `ursim_draw_square` / `ursim_draw_rectangle` / `ursim_draw_star` / `ursim_load_program` / `ursim_run_program` / `ursim_send_script` / `ursim_reset_error` / `ursim_jog_rotate`; `ursim_set_freedrive` / `ursim_set_teach_mode` / `ursim_power_on` / `ursim_power_off` / `ursim_brake_release` / `ursim_unlock_protective_stop` / `ursim_shutdown` / `ursim_zero_ftsensor` / `ursim_set_conveyor_tracking`; `ursim_force_mode` / `ursim_end_force_mode` / `ursim_force_mode_settings` / `ursim_speedj` / `ursim_speedl` / `ursim_stopj` / `ursim_stopl` / `ursim_set_payload_inertia` / `ursim_motion_version` / `ursim_set_speed_scaling` / `ursim_set_payload` / `ursim_set_gravity`; `ursim_set_tcp` / `ursim_set_tool_output_mode` / `ursim_set_tool_voltage` / `ursim_set_tool_communication` / `ursim_set_digital_out` / `ursim_set_analog_out` / `ursim_set_conveyor_tick` — **need no human confirmation by default** (since 0.2.3 the product default is `requireApprovalForMotion: false`). This list is kept in sync with `APPROVAL_OPS` by `scripts/check-doc-tools.mjs`: a missing name, an extra name or a wrong prefix all fail the check. The gate is a capability you can turn **on**: with `true`, those commands **pause and wait for human confirmation** before being sent to the robot, and a call made without an approval service, without an agent, or answered with anything other than `allowed-once` **fails closed** (the command is rejected and never dispatched). **Simulation targets** (`motionMode: 'sim'` plus the reserved loopback address) are exempt either way. The default lives in code (`config.requireApprovalForMotion ?? false`) and **matches** the schema default, so a caller that skips schema parsing behaves exactly like the product default; set `requireApprovalForMotion: true` to turn the gate on. `test/approval-gate.test.mjs` drives the real tool registry and proves all of the above, including that an extra `op` argument cannot re-route a call.

---

## Overview

`dsh-nonead-ursim` gives a DSH agent a **Universal Robots arm it can drive in plain language** — the
complete tool surface of a UR controller (89 `ursim_*` tools: joint and Cartesian motion,
multi-segment continuous sequences, OptiMove,
drawing primitives, pose and status readback, RTDE telemetry, standard/tool I/O and registers,
URScript, TCP/payload/tool settings, force mode, conveyor tracking), plus a live **3D simulation
panel** that renders the same joint data those tools read.

Out of the box it drives an **offline, kinematics-level virtual UR robot** on the reserved loopback
address `127.0.0.1`: no hardware, no real controller, nothing to install beyond Python — start a
simulation and issue commands. A real controller is addressed only after you ask for it explicitly
(`motionMode: 'real'` plus a `realRobotIps` allow-list), and the motion approval gate is **off by
default** (since 0.2.3; set `requireApprovalForMotion: true` to turn it on).

What the simulation models and what it does not is a deliberate, stated boundary: **motion is real
kinematics**; **telemetry is estimated** and labelled as such; **I/O and registers are in-memory
state**; anything that genuinely needs a controller (force mode, safety-status bits, program load and
execution, raw scripts, conveyor) answers `SIM_UNSUPPORTED` instead of pretending. It is **not** a
safety-assessment tool — there is no dynamics and no safety function — so cycle time, collision and
safety-distance questions stay outside its scope.

## Feature overview

**89** tools (`ursim_*`) in total.

| Category | Tool(s) (`ursim_*`) | Description |
|---|---|---|
| Connection | `ursim_connect` / `ursim_disconnect` | Connect / disconnect a UR robot by IP |
| Status | `ursim_get_status` | One-shot read of TCP, joints, model, serial, version, safety mode, run/program state, voltage, current, temperatures, uptime, joint currents/voltages/speeds, TCP speed and wrench, speed scaling |
| Pose | `ursim_get_tcp_pose` / `ursim_get_joint_pose` | Read current TCP pose / joint angles |
| Targets | `ursim_get_target_values` | Read **where the controller is *taking* the arm**: target joint positions/velocities/accelerations and target TCP pose/speed, plus the matching actual values for comparison. Comes from the RTDE `target_*` fields (part of the receive recipe since before 0.1.0), so it is free — and it is the only direct evidence for "command sent but not executed yet / being blended / held back by the safety limit" |
| Device info | `ursim_get_robot_model` / `ursim_get_serial_number` / `ursim_get_uptime` / `ursim_get_software_version` / `ursim_get_safety_mode` / `ursim_get_safety_status` / `ursim_get_robot_mode` | Model (with `remote_control` field) / serial / uptime / software version / safety mode / **safety and robot status bits** (which safety function fired, incl. violation / fault; numeric limits must be read from PolyScope's Safety page) / run state |
| Programs | `ursim_get_program_state` / `ursim_load_program` / `ursim_run_program` / `ursim_stop_program` / `ursim_pause_program` / `ursim_list_programs` | Program state, load, run, stop, pause, SSH listing (`list_programs` works with the real robot's `/programs` and URSim `~/URSim_Linux-*/programs.*`; `load/run` accept full/URSim paths and `programs_dir`). **Run/stop/pause now check the controller's reply and report the run state**, instead of treating "could not understand" as success |
| Registers | `ursim_get_int_register` / `ursim_get_double_register` / `ursim_get_bit_register` | Read Int / Double / Bool registers |
| Health | `ursim_ping` | Check worker/Python/URBasic readiness without a robot |
| I/O | `ursim_get_digital_in` / `ursim_set_digital_out` / `ursim_get_digital_in_bits` / `ursim_get_digital_out_bits` / `ursim_get_analog_in` / `ursim_set_analog_out` / `ursim_get_tool_analog_in` | Digital in/out (incl. **bit-mask reads**, plus `which="tool"` for the tool-flange digital I/O), standard analog in/out (**in engineering units**: URScript's `set_analog_out` takes a relative level [0,1], and the old code sent 5 as full scale; `full_scale` may be 20 for a current-domain port), tool analog in (function name confirmed against the bundled official manuals; argument semantics not verified on hardware) |
| Tool config | `ursim_set_tool_voltage` / `ursim_set_tcp` / `ursim_set_payload` / `ursim_set_payload_inertia` / `ursim_set_gravity` / `ursim_zero_ftsensor` / `ursim_set_tool_output_mode` / `ursim_set_tool_communication` | Tool voltage (**0/12/24 — the old implementation called a `NotImplementedError` stub and had never once succeeded**), TCP, payload mass/centre of gravity, **mass + CoG + inertia matrix in one call** (`set_target_payload`, 5.10+; avoids the `set_payload` behaviour that resets the inertia matrix and leaves the three parameters inconsistent), gravity direction (for non-horizontal mounting), force/torque sensor zeroing, **tool output mode** (normal / power dual-pin), **tool serial (TCI/RS-485 — ⚠️ enabling it disables the tool analog inputs)** |
| Control mode / power / safety | `ursim_set_freedrive` / `ursim_set_teach_mode` / `ursim_power_on` / `ursim_power_off` / `ursim_brake_release` / `ursim_unlock_protective_stop` / `ursim_shutdown` | Freedrive / teach mode (move the arm by hand), power on / off / **brake release** (⚠️ the arm may fall under gravity), **protective-stop unlock only** (no power-on, no brake release — that is what distinguishes it from `ursim_reset_error`), controller shutdown |
| Force control | `ursim_force_mode` / `ursim_end_force_mode` / `ursim_force_mode_settings` | **Force Mode**: the arm becomes compliant along/about the selected axes and keeps applying the requested force/torque. Arguments match the manual one by one — `task_frame` / `selection_vector` (1 = compliant) / `wrench` / `type` (1-3) / `limits` (compliant axes = max TCP speed, stiff axes = max deviation) / `damping` / `gain_scaling`. The script inserts the manual's recommended `sleep(0.02)` before entering force mode; exit with `ursim_end_force_mode`. ⚠️ `damping`/`gain_scaling` **cannot be read back from the controller**, so the tool reports what it set rather than pretending to read the current value |
| Velocity control | `ursim_speedj` / `ursim_speedl` / `ursim_stopj` / `ursim_stopl` / `ursim_wait_steady` | Joint/TCP **velocity commands** (`speedj`/`speedl`) and the matching decelerations (`stopj`/`stopl`). ⚠️ Velocity commands are **open-ended**: with `t=0` (the default) the function returns once the target speed is reached while the arm **keeps moving** — always finish with a stop* or `ursim_wait_steady`. `ursim_wait_steady` polls the RTDE speed fields instead of using URScript's `is_steady()` (which is documented to return false in force/teach mode) |
| Live telemetry | `ursim_get_runtime_telemetry` / `ursim_get_robot_voltage` / `ursim_get_robot_current` / `ursim_get_joint_temperatures` / `ursim_get_speed_scaling` / `ursim_get_tcp_force` / `ursim_get_tool_telemetry` | Joint currents/voltages/speeds, TCP speed and wrench, tool accelerometer, speed scaling, robot voltage/current, joint temperatures, tool current/voltage, I/O current. **These fields are already in the 500 Hz RTDE stream**, so reading them is free and needs no reconfiguration. Single-value reads and the one-shot `ursim_get_runtime_telemetry` summary coexist: poll a single value when that is all you need, use the summary for diagnosis |
| Speed scaling | `ursim_set_speed_scaling` | Set the speed scaling fraction (**1 %–100 %**, i.e. 0.01–1.0; values outside that range are clamped, and the client's raw value is still returned). In simulation it is applied **in place to the running instance, never by rebuilding it** (pose and joint angles stay unchanged; the new fraction takes effect from the next movement). On a real robot it sends URScript `set_speed_slider` and reports the controller's **measured** value — a reading of 0 while the arm is stationary is normal and is **not** evidence that the setting failed. ⚠️ Affects the speed of every later motion |
| Conveyor | `ursim_get_conveyor` / `ursim_set_conveyor_tick` / `ursim_set_conveyor_tracking` | Conveyor tick read / set, and **starting/stopping linear or circular tracking** |
| Motion | `ursim_movej` / `ursim_movel` / `ursim_movep` / `ursim_movec` / `ursim_servoj` / `ursim_move_optimized` / `ursim_move_x` / `ursim_move_y` / `ursim_move_z` / `ursim_move_tool_x` / `ursim_move_tool_y` / `ursim_move_tool_z` | Joint-space / linear / path / **genuine circular motion** (the old implementation hardcoded `movetype='p'` internally, so it actually sent `movep` and discarded the via point; the worker now passes the manual's `mode` argument: 0 = interpolate orientation, 1 = fixed orientation) / continuous servo / **OptiMove** (`optimovej`/`optimovel`: jerk-limited, smoother, less vibration — ⚠️ its `a`/`v` are **fractions of capability** in (0,1], not rad/s or m/s) / axis-aligned motion — the `_move_*` tools move along **base** axes, the `_move_tool_*` ones along the **current tool** axes (converted in the worker with a rotation matrix, so it does not depend on URScript `pose_trans`). **The default a/v are the manual's again** (`movej` 1.4 / 1.05, `movel` 1.2 / 0.25; the old code defaulted `movel` to v=1 m/s, four times the manual value) |
| TCP rotation jog | `ursim_jog_rotate` | **Incremental** rotation of the TCP about one axis: `axis` is `rx`, `ry` or `rz` (never `x`/`y`/`z` — those mean translation in the other tools), and `frame="tool"` (default) rotates about the **tool's own** axis while `frame="base"` rotates about the **base** axis (`rx`/`ry`/`rz` ↔ base x/y/z). The real-robot and simulation paths share **one geometry** (the same rotation composition), so they compute the same target pose; the TCP position is preserved. ⚠️ Moves the arm |
| Motion sequence | `ursim_run_sequence` | **Walk a whole multi-segment path in one command, with no stop between segments.** `segments` is a list of `{"type":"joint","q":[…]}` / `{"type":"cartesian","pose":[…]}` entries; the optional `v`/`a` (default 0.25 / 1.2) apply to the whole sequence, `t` (≥0, default 0 = use `a`/`v`) sets the **whole path's** duration and, like `r` (blend radius), is **simulation-only** — the real-robot path sends one `movej`/`movel` per segment with `r` as the blend radius and says outright that `t` was ignored. ★ In simulation every segment is turned into joint waypoints and **concatenated into a single polyline that is planned once**, so the whole sequence shares one time profile: a 20-segment sequence is one acceleration and one deceleration, not twenty. An unreachable point in any segment **fails the whole sequence** (it never skips that segment and carries on) |
| Motion planning | `ursim_motion_version` / `ursim_get_freedrive_status` | Set the **Motion Version** (manual chapter 14) and the **jerk gain** (0.01-1.0, which only affects jerk-limited profiles: version-2 `movej`/`movel` and `optimovej`/`optimovel`). Version 2 clamps velocities/accelerations to the hardware limits while planning and **shrinks blend radii dynamically** instead of skipping the whole move with an "Overlapping Blends" warning as version 1 does. ⚠️ Newer robot models and PolyScope X support **only version 2**; CB3 has no such setting. ⚠️ Neither setting has a read-back channel, so the tool reports what it set. `ursim_get_freedrive_status` returns how close the current pose is to a **singularity** during freedrive (0 normal / 1 near / 2 too close — **not** an on/off flag), which is what tells an operator to pick another path |
| Drawing | `ursim_draw_circle` / `ursim_draw_square` / `ursim_draw_rectangle` / `ursim_draw_star` | Draw a circle / square / rectangle / pentagram. The optional `v` / `a` (defaults **0.25 / 1.0 — exactly the values that were hardcoded before**) set the speed, and `t` (≥0, default 0 = use `a`/`v`) sets the whole outline's duration in **simulation**; the real-robot path keeps `a`/`v` and reports that `t` was ignored. **"Completed" is only reported after the script was actually observed running** — the old code probed immediately after sending, inevitably saw "not running", and reported success whether or not the script ever executed |
| Script / emergency | `ursim_send_script` / `ursim_reset_error` | Send URScript (**execution-verified**: sentinels are injected *inside the function body* / between top-level statements and read back, so "sent" never masquerades as "ran"; with several functions and no visible call site it refuses to verify and returns `verified: null`) / reset errors |
| Offline simulation | `ursim_sim_start` / `ursim_sim_stop` / `ursim_sim_status` | **Kinematics-level offline simulation**: create/destroy a virtual UR at the reserved address `127.0.0.1` so the digital simulation can be driven without any real robot. After `sim_start(model=…, preset=…, speed_scaling=…)`, the motion tools and the pose readback act on it; **the default start pose is `upright` (folded upright)** — omitting `preset` gives it, switching the model in the panel resets to it, and a simulation created on demand starts there too; `sim_stop` tears it down (idempotent); `sim_status` reads the state plus the capability list with no side effects. **Every other command reports "no simulation semantics" (`SIM_UNSUPPORTED`) instead of pretending to run** |

Every tool except `ursim_ping` takes an `ip` argument. **A `connect` first is not required** for the
simulation target: it comes up on demand (`ursim_sim_start`, or automatically on the first motion
addressed to the reserved loopback address). A real controller is out of reach until you enable the
real-robot channel in the configuration — see *Real-robot channel (off by default)* below.

### Read-only 3D digital simulation

The plugin also ships a **read-only 3D digital simulation** of the robot, rendered with three.js: the entry is a card in the **right sidebar's Start panel**, directly below the "Workspace files / New terminal / Browser" cards, and selecting it fills the right sidebar's content area with the live 3D view. The view subscribes to the host's **SSE stream** (`/twin/stream`, one frame every 100 ms), so it stays in sync with the live robot's **joint poses, tool (TCP) coordinate frame and recent motion trajectory**. The simulation is **strictly read-only — it never sends a command to the robot**: it only subscribes to the host's read-only routes and renders what it receives. A toolbar offers a reset-view control plus isometric / front / side / top presets, and the camera and base grid are framed from the model's bounding box, so a UR3 and a UR20 are both framed correctly — **except while the "Reach" layer is on, where framing switches to an absolute reference** (the largest built-in model's reach bound) so every model is drawn against **one ruler**: the UR3 envelope (≈0.80 m) takes ~37 % of the view while the UR20's (≈2.17 m) fills it, and the layer's own label prints that model's bound. The readout panel also carries a row of **engineering layer toggles**: reach envelope, base frame, TCP force, and the **"Target pose"** layer — the latter is a **translucent clone** of the real arm (orange = pending approval, cyan = the controller's current target) for comparing against "where it is heading"; it only appears when the target and the current pose **differ clearly** (showing it while they coincide only leads to "there is a second robot on screen"), and it can be switched off at any time. The numeric panel also shows the dashboard-side state (safety mode, robot mode, program state, speed scaling, joint temperatures, bus voltage/current), taken from the same route on a slower cadence.

**Telemetry is pushed, not polled.** The worker pushes readings at 20 Hz and every panel frame reads that push cache first, so the view keeps updating **while the robot moves** — the single-threaded command queue that motion confirmation occupies is never touched. Only a stale (>300 ms) or missing cache falls back to an explicit read, and panel reads use a dedicated **2.5 s budget with `killOnTimeout:false`**: a read-only visualisation read must never destroy the robot session (RTDE/Dashboard) just because it was busy. If a stall does happen, the stream still emits `stale` events and the panel writes "data stopped updating N s · retrying" rather than leaving a silently frozen arm on screen; after a disconnect it reconnects with exponential backoff (capped at 30 s). Set `DSH_URSIM_TWIN_PUSH=0` to turn the push channel off for comparison.

**A swapped robot swaps the model.** The model is cached per IP **together with the connection epoch it was read under**, so a different robot at the same IP is detected and the client reloads the mesh, **drops the previous robot's interpolated sample pair and trajectory** (otherwise the new arm slides over from the old pose and the trajectory line connects two robots' TCPs with a move that never happened), re-frames the camera from the new bounding box and updates the reach envelope and joint limits. Failed loads retry on a 3 s throttle instead of leaving the old arm on screen forever. ⚠️ Detection takes up to the vendored 30 s data-stall timeout, during which the panel still shows the last reading (old model, old pose); call `ursim_connect` again to correct it immediately.

**Offline simulation in the panel.** The panel's top row carries an "offline simulation" control: one switch plus three selectors — **model**, **start pose**, **speed scaling**. **Opening the panel now starts a simulation by itself, with `UR12e` / upright pose / 100 %** — real robot connected or not — so the simulation is useful the moment the card is expanded. The AI then drives the model right there: motion tools act on a **kinematics virtual robot** at `127.0.0.1`, the picture really moves, and **no real robot receives a single byte**. If a simulation is already running (started by the AI through `ursim_sim_start`, or by another window) the panel **adopts that one and never rebuilds it** — rebuilding would push the virtual robot back to its start pose. Collapsing the panel **stops** the simulation and returns the data source to automatic resolution. The simulated state is flagged three times over, because a moving simulated arm looks exactly like a real one: a purple **SIMULATION badge** in the view's top-left corner, a status line reading "Offline simulation · UR12e", and **"offline simulation (not a real robot)" in the screenshot watermark**. Each switch issues exactly one write request (`POST /twin/sim`); on failure it rolls back and shows why — and that row **stays visible while disconnected**, which is where an automatic entry that failed (no Python, worker down, …) reports itself and offers the retry. Changing the model/pose/scaling while running rebuilds the simulation with the new configuration. Tools can start it too: `ursim_sim_start(model="ur10e")`. Hosts that would rather not auto-start can mount the panel with `autoSim: false`.

**The host self-heals the simulation — and the memory survives a restart.** `SIMS` lives in the Python child's memory, so once that child is replaced (crash restart, plugin reload, process reaped) the virtual robot is gone. The host therefore **remembers the simulation configuration** and confirms the robot is still there before handing a simulated command to the worker (immediately when the child generation changed, otherwise once every 10 s as a fallback); if it is gone it rebuilds it from that memory and logs the fact — never leaving the contradiction of "switch on, every command reports not connected". An explicitly stopped simulation is **not** resurrected, and the rebuild happens once: a run of motions does not repeat the probe. A rebuild puts the virtual robot **back at its start pose** (that is the cost, and the log says so).

That memory used to be process-local, so a **host** restart (reopening DSH, reloading the plugin) lost it and the self-healing had nothing to heal from. It is now written to disk (`persistSimState`, default on; `<DSH_HOME>/plugin-data/dsh-nonead-ursim/sim-state.json`, overridable with `simStateFile`): what is persisted is the **intent** (`enabled`), not the last picture — stopping a simulation writes `enabled: false`, so a stopped simulation stays stopped across restarts, while one that was running is created again on load with the same model, start pose and speed scaling (the log says so, and the panel shows why if that restore fails). Persistence is a bonus: a read-only data directory or a corrupt file degrades to "no memory" with one warning, never a failed start.

**The simulation's capability boundary is code, not a documentation promise.** It implements **kinematics only** — forward/inverse kinematics, joint and Cartesian trajectory interpolation, pose readback. The motion tools (`movej`/`movel`/`movep`/`movec`/`run_sequence`/`servoj`/`move_optimized`/`move_x|y|z`/`move_tool_*`/`draw_*`/`wait_steady`/`stopj`/`stopl`) and the readback (`get_joint_pose`/`get_tcp_pose`/`get_robot_model`/`status`/`get_target_values` and friends) all work; **every other command reports `SIM_UNSUPPORTED`** (force mode, RTDE telemetry, safety-status bits, program load/execution, raw scripts, I/O, registers, conveyor, power/brakes/freedrive) together with a pointer to URSim for the real thing — it would rather say "not here" than return a plausible-looking result. The forward kinematics is **element-wise identical** to the client's `fk.js` (`test/sim-backend.test.mjs` pins it), so a read-back TCP always agrees with where the picture draws it.

**The panel follows the app's colour theme.** Light / dark / system is DSH's own appearance setting: the theme plugin projects the resolved snapshot onto the document as the boolean `body[data-ds-dark-theme]` attribute plus the `--dsw-alias-*` design tokens. The panel therefore colours itself **from those tokens** (falling back to theme-paired local values only when the host tokens are absent, e.g. a bare preview page), so it follows the setting — and any third-party theme that overrides aliases via `ctx.theme` — with **no JavaScript involved**. The one thing CSS cannot reach is the WebGL base grid, whose colours are baked into the geometry's vertex colours: `src/client/theme.js` watches the same signal and `scene.js`'s `applyTheme()` repaints the grid **in place** (no geometry rebuild, no new `GridHelper`), so switching the theme never disturbs the camera, the model or the recorded trajectory.

**Six things the panel shows that the tools alone cannot.** Since 0.1.8 the top-left badge is a
**three-state mode indicator**, not just a simulation watermark: purple `SIMULATION` while a virtual
robot is being driven, red **`REAL MODE · <allowed IPs>`** whenever `motionMode: 'real'` is configured
(shown even while disconnected — "no badge" must never read as "safe", and an empty allow-list says so
explicitly), and a neutral `NOT CONNECTED` when nothing is driving anything. The telemetry rows gained
the two readings that were already being delivered but never drawn (joint currents, TCP speed) and are
suffixed **`(estimated)`** whenever the host marks them `telemetry_estimated` — the panel must not
present an estimate in the same shape as a measurement. The capability boundary is readable in the
panel itself: a collapsible line under the simulation controls lists how many ops each bucket holds,
with the full list in its tooltip. And since 0.1.9 there is an **I/O and registers** block: expand it to
read the 16 digital outputs, the 16 digital inputs and both analog inputs (bits rendered as
`00000000 00000001` — the standard and configurable halves), plus one 8-value slice each of the int,
double and bit registers. It reads **on demand**: one request for the bits and one per register slice
when you expand it, and nothing at all while it is collapsed. In simulation it also says outright that
the inputs have no source (they stay 0) rather than letting those zeros pass for signals. And since
0.1.11 it answers the question a picture cannot: **how close is this pose to a singularity?** One HUD
row reports the wrist angle (joint 5 goes to 0 when the wrist axes line up — the textbook UR criterion),
the normalised manipulability `|det J| / reach³`, and the distance to the nearest joint limit, turning
amber then red past calibrated thresholds; and every **over-limit joint has its link tinted red in the
3D view**, so you can see *which* body the HUD is complaining about. Both are computed client-side from
the same forward kinematics the picture is drawn from — no extra worker round-trip, and no numbers that
could disagree with what you see.

Host-side routes (all fenced to loopback callers):

| Route | Description |
|---|---|
| `GET /nonead-ursim/twin/stream[?ip=<ip>]` | **SSE stream** (what the client uses by default): one full state frame every 100 ms, plus `stale` (this frame's read has not returned yet) and `frame-error` (this frame failed) events |
| `GET /nonead-ursim/twin/state[?ip=<ip>][&detail=1][&io=1][&reg=int|double|bit&from=0&count=8]` | Live pose (joint angles / TCP / model). `detail=1` adds the dashboard-side state (safety mode, run state, speed scaling, joint temperatures/currents); `io=1` adds the 16 digital outputs, 16 digital inputs and both analog inputs; `reg=<set>&from=&count=` adds one **slice** of registers (`count` capped at 16 — they are per-index getters). The pose channel keeps polling independently: a failing `detail`, `io` or `reg` query never takes it down, it only writes `{error}` into its own field |
| `GET /nonead-ursim/twin/asset?model=<urXX>` | GLB mesh, with a content-hash `ETag` + `immutable` and `If-None-Match` → 304 support |
| `GET /nonead-ursim/twin/models` | The model list actually present locally |
| `GET /nonead-ursim/twin/sim` | Current offline-simulation state (on/off, model, start pose, speed scaling, available models), the capability list, and the **configured mode** (`motion_mode` plus the `real_robots` allow-list) that the panel's mode badge displays. Read-only, no side effects |
| `POST /nonead-ursim/twin/sim` | **One of the plugin's two write routes**: `{"enabled":true,"model":"ur10e","preset":"upright","speed_scaling":1}` starts the simulation, `{"enabled":false}` stops it. Its write guard is stricter than the read routes (beyond the loopback trust fence it **requires an `Origin`**, `content-type: application/json`, and a body of at most 4 KB). Its side effect is confined to a **kinematics virtual robot on the loopback address** — no real robot ever receives a command through it. The same route also performs **panel I/O writes** (`{"io":{"kind":"digital_out","n":3,"value":true}}` — `digital_out` with a boolean value, or `analog_out` with a finite value in engineering units plus an optional `full_scale` of 10/20), and **only while the offline simulation is running**: otherwise it answers `409 SIM_NOT_RUNNING`. Panel writes never target a real robot — real I/O still goes through the tools, where the approval gate (when enabled) and the declared-parameter allow-list apply |
| `POST /nonead-ursim/twin/jog` | **The other write route — live panel control, offline simulation only**: a single JSON command object with one of eight `mode`s — `step` (axis `x`/`y`/`z`, `frame` `base`/`tool`, `distance`), `rotate` (`axis`, `delta_rad`), `pose` (`pose`), `joint` (`q`), `home`, `speed` (`fraction`), `velocity` (six-element `twist`, optional `frame` + `ttl_ms` watchdog) and `stop`. Any target that is not the loopback virtual robot is refused with `403 SIM_ONLY` **before the body is parsed**, so a real-robot deployment cannot be driven from the panel no matter what the body says; rejection order is 405 → 403 trust fence → 403 `SIM_ONLY` → 400 parse → dispatch |

Failure responses carry a **machine-readable `code`** (e.g. `no_robot` / `robot_not_connected` / `ambiguous_robot` / `worker_unavailable` / `robot_error`) and echo the resolved `ip`, so the UI can say which of four very different failures happened (it used to render one "not connected" line for all of them). A read that is only **temporarily** unavailable (most often: the worker is busy executing a motion command) is *not* reported as `robot_error`: the host replays the last known reading with `stale:true` (for up to 30 s), so the simulation keeps its picture and says the data is stale.

---

## Install into a DSH profile

### Option 1 — install as a bundle (manual)

1. Add the plugin as a dependency in your target profile's `package.json`:

   ```jsonc
   // C:\Users\<you>\.dsh\profiles\web\package.json
   {
     "dependencies": {
       "dsh-nonead-ursim": "^0.3.5"
     },
     "dsh": {
       "profile": {
         "bundles": [               // add the plugin here (later order is fine)
           "...",
           "dsh-nonead-ursim"
         ]
       }
     }
   }
   ```

2. Install dependencies via `dsh plugin` (equivalent to running pnpm inside the profile directory):

   ```sh
   dsh plugin --profile web install
   # or cd "$DSH_HOME/profiles/web" && pnpm install
   ```

3. Restart DSH. The plugin's `cordis.patch.yml` automatically inserts the plugin line into the config tree, and the tools appear in the model's tool list as `ursim_*`.

### Option 2 — local path (development)

Add the repository path to the profile dependency (pnpm supports `file:`) to iterate in this repository:

```jsonc
"dependencies": {
  "dsh-nonead-ursim": "file:<your-checkout>/dsh-nonead-ursim"
}
```

---

## Python runtime

The plugin needs a usable Python and a few dependencies (`numpy`, `paramiko`) to start the worker. Point it at an interpreter with the `pythonBin` config:

```sh
pip install -r requirements.txt
```

`pythonBin` (default `python`), `commandTimeoutMs` (motion/script timeout, default `60000`), and `connectTimeoutMs` (first-connect timeout, default `30000`) in `cordis.patch.yml` can all be overridden per deployment. If `python` is not on PATH, use an absolute path, e.g. `"C:\\Python312\\python.exe"` or `"/usr/bin/python3"`.

> ⚠️ **The dependencies must be installed for the interpreter the worker actually uses (a real trap)**
> `lib/worker.js` points `PYTHONPATH` at the plugin's `python/` directory, and CPython imports
> `sitecustomize.py` from there at startup if it exists. This repository once carried a
> **machine-local** `python/sitecustomize.py` that hardcoded a user-level `site-packages` path into
> `sys.path` — so it worked on that one machine, while on any other machine, or from a published
> install (the file is **not** in the `files` list), `import numpy` fails outright and every tool call
> dies. The correct setup is to **install the dependencies for the interpreter `pythonBin` points at**
> (or point it at a venv). `ursim_ping` / `npm run test:python` is the self-check for that chain, and
> `npm run verify:host` validates tool registration through the host's real schema DSL (it should
> report 89/89).

---

## Health check / testing

Verify the plugin and Python runtime without touching a real robot:

```sh
npm run test:python   # python ur_worker.py --selfcheck: verify Python/numpy/paramiko/URBasic/RTDE config
npm test              # run all 48 test files AND every check gate (see below), then summarise
npm run test:node     # Node-side only: skips the test files *and* the gates that need Python
npm run check         # all static + cross-language gates without running the test files
npm run verify:host   # validate every tool schema through the host's real value-schema DSL, plus peer ranges
npm run verify:models # validate the structural contract of the 14 GLBs
```

`npm test` runs two kinds of thing, and both must pass:

- **48 test files** under `test/` (e2e protocol self-check, approval gate, simulation routes, client
  state machine, FK, vendored-library regressions) — enumerated from `test/test-manifest.json`
  (Python-dependent 17 / Node-only 31), which `check:manifest` keeps honest so a Python-using file can
  never be silently unlisted.
- **11 check gates**: `check-test-manifest` / `check-package-metadata` / `check-client-bundle` /
  `check-doc-tools` / `tool-matrix` / `check-doc-links` (Node) and `check-worker-ops` /
  `check-tool-params` / `check-rtde-recipe` / `check-approval-gate` / `check-new-ops` (Python). When
  the interpreter has no `numpy`, the Python-dependent items are reported as **SKIP with the reason**,
  never as a pass. `check-tool-params` compares the tool schema against the Python handler on both
  sides by *parsing* them (the snapshot that carries `op` for every tool, and `ast` for the handler),
  so parameter names, required-ness and types are all cross-checked.

The most recent full run (**2026-10-20**, v0.3.5): `npm run check` green; `npm test` **59/59**
(48 test files + 11 gates, 0 failed / 0 skipped); `npm run verify:host` reports **89/89** tools
registered through the host's real DSL; `npm run verify:models` passes 14/14 models; plus a live
UR12e offline-simulation smoke run (readback, motion, jog/pose/joint panel control, velocity stream
with watchdog, I/O, telemetry, unsupported-command refusal, argument validation). The evidence, the
reproduction commands and the **true-robot coverage
boundary** are recorded in [docs/test-report-2026-10-20.md](./docs/test-report-2026-10-20.md).

> `scripts/pdf-extract2.py` extracts text from `ScriptManual/*.pdf` into
> `ScriptManual/txt/*.txt` using **only the standard library** (the PolyScope manuals encode
> glyph ids, so the text only comes out through each font's `ToUnicode` CMap). It is the
> reproducible source behind every signature, default and range quoted in this release — when in
> doubt, re-extract and read the manual.

> `check-client-bundle.mjs` rebuilds `src/client/**` into a scratch file and compares the result
> with the committed `lib/client.js` byte for byte, so a stale bundle (source changed UI, shipped
> artifact did not) fails the build instead of silently shipping. It never overwrites the
> committed artifact; `scripts/build-client.mjs` honours `BUILD_CLIENT_OUT` for that reason.

`npm test` prints a per-file summary and exits non-zero if anything failed. If `python` is not on PATH, set it via the environment:

```sh
UR_PYTHON=C:\\Python312\\python.exe npm test
```

> Historically (pre-independence) `npm test` ran **one worker ping** and none of the other 20-plus `*.test.mjs` files —
> so a green `npm test` said nothing about the plugin. `scripts/run-tests.mjs` now enumerates and runs
> them all, plus every check gate, and summarises the result.

Run the **host compatibility check** before a release and whenever the DSH runtime is upgraded — it validates the plugin against an installed host instead of a copy of its keyword list:

```sh
npm run verify:host                                # auto-discovers a real DSH installation
node scripts/check-host-compat.mjs <node_modules>  # or an explicit host
```

It checks the peer ranges against the installed versions, compiles **every** tool parameter schema with the host's real value-schema DSL (a rejected schema silently drops that tool), drives the host route registration, and validates the `dsh.client` declaration plus the client bundle's `__ModuleLoader__` id. Exit code `0` means this plugin works with that host. Against DSH 0.1.7-rc.2 it reports **89/89 tools registered**.

> The first `ursim_connect` to a robot has an ~20s RTDE readiness wait; on timeout it returns a clear error rather than hanging.

---

## How it works

```
DSH model        @deepseek-ai/dsh-tools        python/ur_worker.py          UR robot
  │  ursim_movej(...)  │                              │                          │
  ├────────────────►  ctx.tools.register(defineTool)                        │
  │                  │  lib/worker.js               │                          │
  │                  ├── spawn(ur_worker.py) ──────►│  import URBasic          │
  │                  │   {id,op,params} ───────────►│  RTDE+Dashboard+RTC      │
  │                  │  ◄── {message,data} ─────────┤  run each op             │
  │  ◄── text ───────┤                              │                          │
```

- **`python/ur_worker.py`** — a persistent stdio JSON worker. It keeps `ROBOTS` / `ROBOT_MODELS` dicts, connects by IP, and runs one command per call. Motion commands use (bounded) "arrival confirmation" polling and return a structured error on failure.
- **`lib/worker.js`** — lazily starts the worker once and keeps it alive, matching line-delimited JSON requests/responses, with timeout and cancel (forwards `exec.signal`).
- **`lib/index.js`** — the Cordis plugin that imports `defineTool` to register the above as tools; `inject: ['tools']`.

---

## Tool naming & examples

Tool names are stable as `ursim_*`. Example prompts:

> Connect to 192.168.1.199 and read the current TCP pose.

```
ursim_connect(ip="192.168.1.199")
ursim_get_tcp_pose(ip="192.168.1.199")
```

> Lower the TCP of 192.168.1.199 by 20mm along the Z axis.

```
ursim_get_tcp_pose(ip="192.168.1.199")
ursim_move_z(ip="192.168.1.199", distance=-0.02)
```

> Draw a circle of radius 50mm (vertical plane).

```
ursim_draw_circle(ip="192.168.1.199", center=[0.3,-0.2,0.4,0,3.14,0], r=0.05)
```

---

## Reference implementation

- Plugin repository: <https://github.com/NoneadChina/dsh-nonead-ursim>

This plugin shares the same ancestry as Nonead's [`Nonead-Universal-Robots-MCP`](https://gitee.com/nonead/Nonead-Universal-Robots-MCP) (GitHub: <https://github.com/nonead/Nonead-Universal-Robots-MCP>), reusing its `URBasic` library and robot-control logic, re-encapsulated by the same team for DeepSeek Harness as this plugin's `ursim_*` tools and stdio worker protocol. `URBasic` is MIT (© Tony Ke & Anthony Zhuang / Universal Robots, 2009-2025).

---

## Notes / limitations

- **Connection persistence** — the worker process lives for the plugin's lifetime and keeps robot connections by IP; after a worker crash or a DSH restart you must `connect` again.
- **Remote control mode** — some UR robots must be in "remote control" before they execute motion/program commands, and `ursim_connect` reports that state. **CB3 robots running URSoftware 3.1 through 3.20 already allow remote control by default (nothing to enable at the settings level)**; a `remote_control: false` reading still means the controller is *currently* not in remote mode — in local/teach-pendant mode URScript and motion commands are silently discarded, so switch the pendant to remote control. Other firmware (e-Series, or CB3 outside that range) needs Remote Control enabled in PolyScope first. `ursim_get_status` also reports `remote_control_raw`, and an unreadable state is reported as unknown rather than pretended to be `false`.
- **Tool digital I/O** — `ursim_get_digital_in` / `ursim_set_digital_out` with `which="tool"` control the tool-flange digital I/O. Tool digital signals are **not carried by RTDE**, so reading a tool input runs a short URScript program (via `SendProgram`) that may **interrupt a running program**; writing a tool output sends the URScript `write_tool_digital_out` command. Tool digital **output read-back is not supported** (no reliable `read_tool_digital_out` expression).
- **Joint current** — the current RTDE recipe does not expose per-joint current directly, so `ursim_get_joint_current` is not provided (the reference implementation's version of this tool has a value bug; this implementation does not carry it over).
- **Threading / cancel** — motion commands poll until arrival within `commandTimeoutMs`; for long trajectories, remind the model in the prompt to set a reasonable timeout or split the motion into steps.
- **Not a safety boundary** — this plugin is on par with the `bash` tool and can drive physical equipment; test thoroughly on a real robot before production use.
- **Package size** — the published package is about **21 MB**, almost entirely the **14 `assets/models/*.glb`** meshes; the plugin's own code adds only a few hundred KB. The meshes are down from the converter's raw 35.11 MB in two reproducible steps (`node scripts/compress-models.mjs`, plus `npm run analyze:models` to see where the bytes go): a **lossless** pass to 28.27 MB (`uint32` → `uint16` indices — the largest index in these models is only 24228 — plus dropping the non-standard `_color` attribute no material reads; vertex positions, UVs, textures and the index sequence stay byte-for-byte/value-for-value identical, and the script proves it before writing), then a **lossy, explicitly decided** pass to 20.86 MB that box-filters the **eight** 2048×2048 base-colour PNGs embedded by the five newer models (ur15 ×1, ur18 ×2, ur20 ×1, ur30 ×2, ur8long ×2) down to 1024×1024 (`--texture-size 1024`). The simulation panel is only a few hundred pixels wide, and a same-region 1:1 comparison shows no visible difference. Geometry precision is untouched (Ruling 24); `test/model-contract.test.mjs` guards the resulting size band. To drop whole models instead, regenerate a subset with `python scripts/convert-meshes.py --only <model…>`.
- **Unknown models fall back** — a robot whose model has no bundled mesh (unknown or customized model string) is rendered with **approximate geometry instead of failing**; the simulation never errors out on an unknown model.
- **Can the AI drive the simulation without a robot? — Yes, within a boundary that is written in code.**
  - **The built-in kinematics simulation**: after `ursim_sim_start(model="ur10e")` (or flipping the panel's offline-simulation switch), the motion tools and the pose readback act on a virtual robot at `127.0.0.1` and the simulation follows it. **No real robot and no URSim required.**
  - **What it can do**: point-to-point and path motion — joint / linear / path / arc / axis-aligned / drawing / **multi-segment continuous sequences** (`movej`, `movel`, `movep`, `movec`, `run_sequence`, `servoj`, `move_x|y|z`, `move_tool_*`, `draw_*`, `move_optimized`, `wait_steady`, `stopj`, `stopl`) with a selectable start pose and speed scaling, plus joint/TCP readback. Inverse kinematics is a multi-seed numerical solve, and an unreachable target is **rejected outright** instead of being given an approximate pose.
  - **What it cannot do (and will not pretend to)**: force mode, safety-status bits, program load and execution, raw scripts, conveyor tracking, power/brakes/freedrive. These are **controller behaviours** — with no controller there is no semantics — so the call returns `SIM_UNSUPPORTED`. Open-ended velocity commands (`speedj`/`speedl`) are unsupported too: they need continuous integration and a deceleration model, and half a model is worse than none. Two exceptions have a simulation meaning: **standard/tool I/O and the registers** (0.1.5 — outputs are written to an in-memory state and read back, inputs have no producer and stay at 0, the registers have no writer and stay at their initial values) and **telemetry** (0.1.6 — estimated from kinematics, marked `estimated: true`, never presented as a measurement). Every one of those answers says so in its own fields.
  - **It is not a safety-assessment tool**: no dynamics, no safety functions, and time is approximate (`a`/`v` only set each segment's duration, with no jerk limiting). Do **not** use it to validate collision, cycle time, or safety distances.
  - **When you want the full set of semantics (URSim included)**: URSim is UR's official free simulated controller (it runs in a VM and looks like a real controller on the network). Since 0.1.4 you can drive it as a robot by **enabling the real-robot channel** — `motionMode: 'real'` with its IP in `realRobotIps` — and then all 89 tools plus the simulation work normally (`ursim_list_programs` already understands URSim's `~/URSim_Linux-*/programs.*` layout). In the default `sim` mode that IP is refused as an invalid argument before dispatch (`SIM_BADARG`).
  - **Why the simulation address is `127.0.0.1`**: a real controller serves RTDE (30003) / Dashboard (29999) itself, so a real UR cannot appear on this machine's loopback — which makes "the simulation cannot reach a real robot" a **structural** guarantee. Together with the reserved-address guard on the worker side, a stale host-side registry still ends in a refusal rather than a command to a real controller.
- **Asset pipeline** — the meshes are generated by `python scripts/convert-meshes.py` and their structure contract (7 named nodes per GLB, embedded textures) is validated by `python scripts/verify-models.py` (also exposed as `npm run verify:models`).

---

## Third-party assets & licensing

Beyond its own code, this package distributes 14 robot meshes under `assets/models/*.glb` (≈21 MB) plus `assets/kinematics.json`, all derived from Universal Robots' [`Universal_Robots_ROS2_Description`](https://github.com/UniversalRobots/Universal_Robots_ROS2_Description) (branch `humble`, fetched 2026-09-21).

Two licence regimes apply, split by model, and they are never mixed within a model:

- **BSD-3-Clause** (9 models): `ur3`, `ur5`, `ur10`, `ur3e`, `ur5e`, `ur7e`, `ur10e`, `ur12e`, `ur16e` — this covers the meshes and the kinematic / joint-limit configuration that `assets/kinematics.json` is derived from.
- **UR "Graphical Documentation" terms** (5 models): `ur8long`, `ur15`, `ur18`, `ur20`, `ur30`. These meshes are **not** BSD-3-Clause; they are UR "Graphical Documentation" and their use is governed by UR's *Terms and Conditions for use of Graphical Documentation*, which is not an OSI open-source licence but does allow use, modification and sharing under certain restrictions. Questions: <legal@universal-robots.com>.

The client-side 3D renderer builds on [three.js](https://threejs.org/) (MIT); [esbuild](https://esbuild.github.io/) (MIT) is used only at build time.

See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for the per-model derivation list, the conversion parameters and the licence texts.

---

## Real-robot channel (off by default)

This release *can* drive a real controller, but only when you explicitly ask for it:

```yaml
motionMode: 'real'               # default 'sim' — nothing else can reach a real robot
realRobotIps: '192.168.1.10'     # comma-separated allow-list; empty ⇒ every target is refused
```

- **`sim` (the default) is a structural guarantee, not a policy.** The worker rejects any address
  other than the reserved loopback one *before* dispatching, so the RTDE / Dashboard / SSH /
  remote-control code is unreachable — not "present but unused".
- **`real` additionally requires the allow-list.** A target outside `realRobotIps` is refused on the
  host side before it reaches the worker; an empty list refuses everything (fail-closed), and the
  plugin logs a warning if you enable `real` without writing one.
- **The simulation stays available in both modes**, and the reserved loopback address *always* means
  the virtual robot — it is never handed to the real-robot implementation. (Otherwise forwarding a
  controller's port to loopback would be a way back in.)
- **With the gate turned on there is no approval exemption in `real` mode**: every gated command asks
  a human, including commands aimed at the simulation (with the gate off they all pass). That also
  closes the audit's H-2 finding — the exemption used to be host-side state that the model itself
  could set via `ursim_sim_start`; now it follows from a configuration value a human writes.
- Read [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and the safety note at the top of this
  file before pointing this at hardware.

## Developer

**Suzhou Nonead Robot Technology Co., Ltd.** — R&D Department, **Tony Ke**.

- **Company**: Suzhou Nonead Robot Technology Co., Ltd. (<https://www.nonead.com>)
- **Developer**: Tony Ke, R&D Department (研发部)
- **Questions and bug reports**: please open an issue in this repository. For commercial licensing,
  write to <service@nonead.com>.

## License

This project adopts a **User-Segmented Dual Licensing** model:

- **AGPLv3** for individual users and organizations with **≤10 people** (open source; see <https://www.gnu.org/licenses/agpl-3.0.html>).
- **Commercial license (required)** for organizations with **>10 people**, or for anyone who needs to avoid the AGPLv3 source-disclosure obligation (e.g. SaaS / closed distribution).

See [LICENSE](./LICENSE) for the full agreement. For a commercial license, contact [service@nonead.com](mailto:service@nonead.com).

`python/URBasic` (vendored) remains under its own **MIT License** (© Anthony Zhuang / Universal Robots, 2009-2025).
