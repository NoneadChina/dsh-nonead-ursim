"""Cross-check the approval gate against every op the worker implements.

Three questions, all of which must have a definite answer before this can be a gate:

1. **Is every gated name real?** A typo in `APPROVAL_OPS` means that command is not gated at
   all — the set silently does nothing for it. Exit 1.
2. **Which ops are reachable without approval?** Most are legitimate reads. But an op that can
   move the arm, run a program, drop power/stiffness or change a payload/motion characteristic
   must never appear in that list. That judgement cannot be automated, so the list is printed in
   full and a small, explicit set of "must be gated" ops is asserted (see `MUST_BE_GATED`).
3. **Does the product default to *no* human confirmation?** Since 0.2.3 the product default is
   `requireApprovalForMotion: false` — motion needs no approval unless a deployment turns the gate
   on. The gate itself is untouched (see questions 1-2); what is pinned here is the **default**,
   and it is declared in three places that must agree: the Config schema default and the code
   fallback in `lib/index.js`, plus the shipped `cordis.patch.yml`. A disagreement either
   re-introduces a confirmation nobody asked for or advertises a gate the product does not have.

Exit code: 0 only when no gated name is stale, every op in MUST_BE_GATED is gated, and the three
places that declare the product default all say `false`.
"""
import ast
import re
import sys

# Ops whose side effects are physical and unrecoverable enough that a human must confirm first.
# Expanding this list is the intended way to respond to a new dangerous op; the printout below
# is what makes the rest reviewable.
MUST_BE_GATED = {
    # motion
    "movej", "movel", "movep", "movec", "servoj", "move_x", "move_y", "move_z",
    "move_tool_x", "move_tool_y", "move_tool_z", "move_optimized", "run_sequence",
    "draw_circle", "draw_square", "draw_rectangle", "draw_star",
    # open-ended velocity / force control
    "speedj", "speedl", "stopj", "stopl", "force_mode", "end_force_mode", "force_mode_settings",
    # programs and raw scripting
    "load_program", "run_program", "send_script", "reset_error",
    # arm state: stiffness, power, brakes, safety
    "set_freedrive", "set_teach_mode", "power_on", "power_off", "brake_release",
    "unlock_protective_stop", "shutdown",
    # anything that re-zeros or re-defines the force/torque reference, or how motion is planned
    "zero_ftsensor", "set_payload", "set_payload_inertia", "set_gravity",
    "conveyor_tracking", "motion_version",
    # security audit H-1 (2026-10-13): these persist a physical-behaviour change or actuate
    # external equipment, and were reachable **without** approval before the fix:
    #   set_tcp rewrites the reference frame of *every later* motion (sibling of motion_version);
    #   tool-flange semantics / voltage / serial (enabling TCI disables the tool analog inputs);
    #   digital & analog outputs drive grippers, conveyors, welders;
    #   set_conveyor_tick is the sibling of the already-gated conveyor_tracking.
    "set_tcp", "set_tool_output_mode", "set_tool_voltage", "tool_communication",
    "set_digital_out", "set_analog_out", "set_conveyor_tick",
}

failures = []

idx = open("lib/index.js", encoding="utf-8").read()
# ⚠️ 工具声明（`{ op: …, toolName: … }`）自 0.1.3 起搬到了 lib/tool-defs.js；
#    APPROVAL_OPS 仍留在 lib/index.js —— 它是**运行时策略**，不是声明面的数据。
defs = open("lib/tool-defs.js", encoding="utf-8").read()
src = open("python/ur_worker.py", encoding="utf-8").read()
tree = ast.parse(src)

handlers = None
for node in ast.walk(tree):
    if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "HANDLERS" for t in node.targets):
        handlers = node
ops = [k.value for k in handlers.value.keys]

pairs = re.findall(r"\{\s*op:\s*'([a-z_0-9]+)',\s*\n\s*toolName:\s*'(ursim_[a-zA-Z_0-9]+)'", defs)
tool_of_op = {op: name for op, name in pairs}

orphans = [o for o in ops if o not in tool_of_op and o != "shutdown_worker"]
print("ops in HANDLERS:        %d" % len(ops))
print("tools registered:       %d" % len(pairs))
print("ops without a tool:     %s" % (orphans or "none"))
if orphans:
    failures.append("ops without a tool: %s" % orphans)

block = re.search(r"const APPROVAL_OPS = new Set\(\[(.*?)\]\);", idx, re.S).group(1)
approved = set(re.findall(r"'([a-z_0-9]+)'", block))
print("ops gated by approval:  %d" % len(approved))

stale = sorted(o for o in approved if o not in ops)
print("\nGATED but no such op (stale entry, typo => gate is useless for it): %s" % (stale or "none"))
if stale:
    failures.append("APPROVAL_OPS 里有不存在的 op（门禁对它是空转）：%s" % ", ".join(stale))

missing = sorted(op for op in MUST_BE_GATED if op not in approved)
if missing:
    failures.append("以下 op 的副作用必须人工确认，但没在 APPROVAL_OPS 里：%s" % ", ".join(missing))
    print("\n!! MUST_BE_GATED 里未受门禁的 op: %s" % ", ".join(missing))
else:
    print("\nPASS  %d 个必须受门禁的 op 全部已门禁" % len(MUST_BE_GATED))

# ── 3) 产品默认必须是"运动免人工确认"（2026-10-15 决定，0.2.3 起）────────────────────
# 门禁能力一行没删：APPROVAL_OPS / MUST_BE_GATED 与 requestApproval() 的 fail-closed 全部原样。
# 这里钉的是**默认值**，它被三处声明：lib/index.js 的 Config schema 默认值、同一文件里的代码
# 兜底（裸 config 走的就是这一条）、以及随包发布的 cordis.patch.yml。三处必须同为 false ——
# 任何一处是 true 都意味着"产品默认"被改回去了（用户没要求确认，却被停下来等确认），
# 任何一处读不到则意味着这条声明被删掉或改了写法，本检查已失效。
patch = open("cordis.patch.yml", encoding="utf-8").read()
defaults = [
    ("lib/index.js Config schema 的默认值（z.boolean().default(…)）",
     re.search(r"requireApprovalForMotion:\s*z\.boolean\(\)\.default\((true|false)\)", idx)),
    ("lib/index.js 的代码兜底（config.requireApprovalForMotion ?? …）",
     re.search(r"config\.requireApprovalForMotion\s*\?\?\s*(true|false)", idx)),
    ("cordis.patch.yml 里随包发布的取值",
     re.search(r"^\s*requireApprovalForMotion:\s*(true|false)\s*$", patch, re.M)),
]
print("\n产品默认 requireApprovalForMotion 必须是 false（运动免人工确认；门禁能力本身保留）：")
for label, match in defaults:
    value = match.group(1) if match is not None else None
    if value == "false":
        print("   PASS  %s = false" % label)
    else:
        shown = "读不到（声明被删掉或改了写法）" if value is None else value
        print("   !!    %s = %s" % (label, shown))
        failures.append("产品默认必须是 requireApprovalForMotion=false，但「%s」是 %s" % (label, shown))
if all(match is not None and match.group(1) == "false" for _, match in defaults):
    print("PASS  三处默认值一致（schema / 代码兜底 / cordis.patch.yml），产品默认免人工确认")

ungated = sorted(o for o in ops if o not in approved and o != "shutdown_worker")
print("\nNOT GATED (%d) — each needs a judgement: can it move the arm," % len(ungated))
print("run a program, change power/stiffness, or physically actuate something?")
for op in ungated:
    print("   %-26s -> %s" % (op, tool_of_op.get(op, "(NO TOOL)")))

if failures:
    print("\n%d 项失败：" % len(failures))
    for f in failures:
        print("   - %s" % f)
    sys.exit(1)
print("\n审批门禁一致性检查通过。")

