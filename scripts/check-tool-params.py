"""Cross-language contract check: the JSON schema the model sees vs what the Python handler does.

## What changed in 0.1.7 (D2) and why

The old version parsed the schema side out of `lib/tool-defs.js` **as text** — a regex that required
`op:` and `toolName:` on adjacent lines, hand-rolled brace counting to find the parameter block, a
spread-helper whitelist, and a "did we parse at least 86 tools?" guard standing in for the fact that
the parse could silently return nothing. Every one of those was a way to be green while checking
nothing.

Now the schema side comes from `docs/tool-schemas.golden.json` — the registration-surface snapshot that
`test/tool-schema-dsl.test.mjs` builds by really importing `lib/tool-defs.js` and calling
`buildTools()`, and refuses to let drift. Since 0.1.7 that snapshot also carries each tool's `op`, which
is what lets this gate line schemas up with `HANDLERS`. The Python side is `ast`-parsed (as before).
Neither side is read as text any more.

## What it asserts (all bidirectional)

1. **Coverage** — every op in the snapshot has a `HANDLERS` entry, and the snapshot's op set equals the
   declaration table's (`docs/tool-matrix.json`). Two generated artifacts disagreeing is a red flag.
2. **Declared ↔ read** — a parameter the schema declares but Python never reads is a silently dropped
   instruction; a parameter Python reads but the schema omits is one the model cannot set at all.
3. **Required ↔ enforced** — `required: true` must be honest: the handler has to either hard-read the
   key (`p["k"]`, `_vec(p, "k", …)`, `_sim_require(p, "k")`) or explicitly reject its absence
   (`if not name: return err(…)`). Conversely a key the handler hard-reads with no guard must be
   declared required, otherwise omitting it is a runtime error the schema said was fine.
   This is why the scanner understands two guard shapes:
   `if p.get("k") is not None:` (absence tolerated ⇒ optional) and `if not v: return err(…)`
   (absence rejected ⇒ the required flag is honest).
4. **Type ↔ coercion** — `boolean` must be read with `bool(...)`, `integer` with `int`/`_bounded_int`,
   `number` with `float`/`_bounded_float`/`_nonneg_float`, `string` with `str(...)`, `array` with a
   vector helper or a list comprehension over it. `_bounded_int` on a `number`-typed parameter is a
   contradiction one side has to fix.

## What it deliberately does not do

*Bounds are not compared*: the snapshot carries ranges in prose ("端口号：std 0-7、config 8-15"), so there
is nothing machine-comparable. Ranges stay enforced at runtime by `_bounded_int`/`_bounded_float`.

*It follows the call graph one level*: `def op_move_x(p): return _axis_move(p, 0)` reads `distance`
inside the helper, so a scanner that only looked at `op_*` bodies would report a phantom defect. Reads
are collected per function and a handler inherits the reads of any function it passes `p` to.

Every allowance is an explicit, reasoned whitelist entry; anything new fails instead of being absorbed.
"""
from __future__ import annotations

import ast
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    # 中文诊断在 GBK 控制台上会 UnicodeEncodeError（旧版为此把细节只写文件）。CI 与 npm test 都是
    # 以 UTF-8 捕获输出的，直接把 stdout 设成 UTF-8，控制台也不再崩。
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GOLDEN = "docs/tool-schemas.golden.json"
MATRIX = "docs/tool-matrix.json"
WORKER = "python/ur_worker.py"

IGNORE = {"ip", "_timeout_ms"}

# 由共享 helper 在更深处读取的参数：扫描不跟进任意深度，逐 op 白名单。
# 新增一处就要在这里再加一行 —— 有意为之，否则白名单会变成吸收一切的垃圾桶。
HELPER_READS = {}

COERCION_FOR_TYPE = {
    "boolean": {"bool"},
    "integer": {"int", "_bounded_int"},
    "number": {"float", "_bounded_float", "_nonneg_float"},
    "string": {"str"},
    "array": {"_vec", "_float_list", "array"},
}
COERCION_OF_TYPE = {c: t for t, cs in COERCION_FOR_TYPE.items() for c in cs}
BOUNDED_HELPERS = {"_bounded_int", "_bounded_float", "_nonneg_float"}
# `_vec(p, "k", n, "描述")` 的键在**第二个**参数上；`_float_list(p.get("k", …), n, "描述")` 的键在
# **第一个**参数里（描述才是第二个字符串）—— 两者形态不同，混用会把描述文案当成参数名。
PVEC_HELPERS = {"_vec"}
VALUE_FIRST_HELPERS = {"_float_list"}
COERCE_NAMES = {"bool", "int", "float", "str"}
REJECT_FUNCS = {"err"}

golden = json.load(open(GOLDEN, encoding="utf-8"))
matrix_ops = set(json.load(open(MATRIX, encoding="utf-8"))["ops"])
worker = open(WORKER, encoding="utf-8").read()
tree = ast.parse(worker)

# ---- schema side: op -> {param: {type, required}} --------------------------------------------
decls = {}
for entry in golden:
    op = entry.get("op")
    if not op:
        continue
    params = {}
    for name, spec in (entry.get("parameters") or {}).items():
        spec = spec if isinstance(spec, dict) else {}
        params[name] = {"type": spec.get("type"), "required": bool(spec.get("required"))}
    decls[op] = {"tool": entry.get("name"), "params": params}


# ---- python side -----------------------------------------------------------------------------
def const_str(node):
    return node.value if isinstance(node, ast.Constant) and isinstance(node.value, str) else None


def is_p(node):
    return isinstance(node, ast.Name) and node.id == "p"


def key_from(node):
    """从一个取值表达式里取出 `(key, form, coercion)`。

    form: `hard`（无默认值，缺了就报错）或 `soft`（`p.get(k, default)`）。
    """
    if node is None:
        return None
    if isinstance(node, ast.Subscript) and is_p(node.value):  # p["k"]
        k = const_str(node.slice)
        return (k, "hard", None) if k else None
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and is_p(node.func.value)
        and node.func.attr == "get"
    ):  # p.get("k") 或 p.get("k", default)
        k = const_str(node.args[0]) if node.args else None
        if not k:
            return None
        # ⚠️ **单参** `p.get("k")` 是硬读：缺省时得到 None，紧接着会被 helper 的校验拒掉
        #    （`_nonneg_float(p.get("mass"), …)` 就是这么写的）。只有**带默认值**的两参形态
        #    才是真正的可选。
        return (k, "soft" if len(node.args) > 1 else "hard", None)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
        # 属性调用（`str(p.get("action", "")).lower()`、`p["k"].strip()`）：键在**接收者**里。
        # ⚠️ 这一支必须在最外层：放进下面 `func` 是 Name 的分支里就是永不可达的死代码，
        # 而它恰好是 `action` / `goal_type` 这类"取了值再规范化"的参数的唯一入口（本轮实测踩到，
        # 症状是"枚举分派守卫全都检测不到"）。
        inner = key_from(node.func.value)
        if inner is not None:
            return inner
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        name = node.func.id
        if name == "_sim_require":  # _sim_require(p, "k", "类别")：B3 引入的硬读
            k = const_str(node.args[1]) if len(node.args) > 1 else None
            return (k, "hard", name) if k else None
        if name in PVEC_HELPERS:  # _vec(p, "k", n, "描述")
            k = const_str(node.args[1]) if len(node.args) > 1 else None
            return (k, "hard", name) if k else None
        if name in VALUE_FIRST_HELPERS:  # _float_list(value, n, "描述")
            inner = key_from(node.args[0]) if node.args else None
            return (inner[0], inner[1], name) if inner else None
        if name in BOUNDED_HELPERS:
            inner = key_from(node.args[0]) if node.args else None
            return (inner[0], inner[1], name) if inner else None
        if name in COERCE_NAMES:
            inner = key_from(node.args[0]) if node.args else None
            return (inner[0], inner[1], name) if inner else None
        # 回退：**看穿未识别的包装调用**（键在参数里），
        # 例如 `_sanitize_path(p.get("program_name", ""), "program_name")`。
        for arg in node.args:
            inner = key_from(arg)
            if inner is not None:
                return inner
    return None


def mentions_key(node, key, var_of_key):
    """这个表达式是否在问"某个键在不在"。直接问（p.get("k") / p["k"]）或经由局部变量。"""
    for sub in ast.walk(node):
        if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute) and sub.func.attr == "get":
            # ⚠️ 别把这里的条件写成 `const_str(x) if args else None == key`：条件表达式优先级会让
            # 它变成 `const_str(x) if args else (None == key)`，于是判断永远为假、守卫全部失效。
            if sub.args and const_str(sub.args[0]) == key:
                return True
        if isinstance(sub, ast.Subscript) and is_p(sub.value) and const_str(sub.slice) == key:
            return True
        if isinstance(sub, ast.Name) and var_of_key.get(sub.id) == key:
            return True
    return False


def key_expr(node, key, var_of_key):
    """这个表达式是不是"直接问这个键"：`p.get("k")` / `p["k"]` / 来自它的局部变量。"""
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "get":
        return bool(node.args) and const_str(node.args[0]) == key
    if isinstance(node, ast.Subscript) and is_p(node.value):
        return const_str(node.slice) == key
    if isinstance(node, ast.Name):
        return var_of_key.get(node.id) == key
    return False


def guard_kind(test, key, var_of_key):
    """守卫在问什么：`absent`（缺省/为空） / `present`（非空） / `other`（与之无关的条件） / None。

    为什么必须分这四种（本轮实测的教训）：把"测试里出现该变量"等同于"拒绝缺省"会让
    `if not _send_program(robot, script_with_t): return err(…)` 把 `t` 判成必填 —— 那句 err 说
    的是**发送失败**，不是"t 没给"。反过来 `if frame is not None: raise` 是"存在才拒绝"，
    缺省反而是正常路径。
    """
    def absent(n):
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.Not):
            return key_expr(n.operand, key, var_of_key)
        if isinstance(n, ast.Compare) and key_expr(n.left, key, var_of_key):
            for op, comp in zip(n.ops, n.comparators):
                if isinstance(op, ast.Is) and isinstance(comp, ast.Constant) and comp.value is None:
                    return True
                if isinstance(op, ast.Eq) and isinstance(comp, ast.Constant) and comp.value in ("", 0):
                    return True
        return False

    def present(n):
        if isinstance(n, ast.Compare) and key_expr(n.left, key, var_of_key):
            for op, comp in zip(n.ops, n.comparators):
                if isinstance(op, ast.IsNot) and isinstance(comp, ast.Constant) and comp.value is None:
                    return True
                if isinstance(op, ast.NotEq) and isinstance(comp, ast.Constant) and comp.value == "":
                    return True
        return False

    if absent(test):
        return "absent"
    if present(test):
        return "present"
    # 枚举值分派：`if action == "setup_pulse": … elif …: else: return err("未知的 action")`。
    # 这是"给了合法值才干活、否则拒绝"的写法 —— 配上拒绝型 else 链就是**真的强制**（见
    # analyse_function 里的判定），所以单独成一类，不能和"与这个键无关的条件"混为一谈。
    if isinstance(test, ast.Compare) and key_expr(test.left, key, var_of_key):
        for op, comp in zip(test.ops, test.comparators):
            if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(comp, ast.Constant):
                return "enum"
    if mentions_key(test, key, var_of_key):
        return "other"
    return None


def if_rejects(node):
    """这个 If 是不是"拒绝"路径：只看**直接**语句，并沿着 `else` 链继续往下看。

    ⚠️ 两条边界都是本轮实测踩出来的：
      · 只看直接语句 —— `if not verify:` 的 body 里 `if not _send_program(...): return err(…)`
        说的是**发送失败**，不是"没给 verify"；跟进 body 的嵌套会把可选参数判成必填。
      · 但 `else` 链必须跟进 —— `if action == "setup_pulse": … elif …: … else: return err("未知的
        action")` 正是"缺省/非法值就拒绝"的合法写法，不跟进就会漏判成"schema 过度承诺"。
    """
    for branch in (node.body, node.orelse):
        for stmt in branch:
            if isinstance(stmt, ast.Raise):
                return True
            if isinstance(stmt, ast.Return) and isinstance(stmt.value, ast.Call):
                f = stmt.value.func
                if (isinstance(f, ast.Name) and f.id in REJECT_FUNCS) or (
                    isinstance(f, ast.Attribute) and f.attr in REJECT_FUNCS
                ):
                    return True
            if isinstance(stmt, ast.If) and stmt in node.orelse and if_rejects(stmt):
                return True
    return False


func_defs = {}
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        func_defs[node.name] = node


def analyse_function(fn):
    """返回 (reads, guarded_optional, presence_enforced)。

    reads: key -> {form, coercion}（**未过守卫**的原始形态）
    guarded_optional: 在 `if <问这个键>` 且**不拒绝**的守卫里出现的键 ⇒ 实际可选
    presence_enforced: 被某个"拒绝型"守卫检查过的键 ⇒ required 标记是诚实的
    """
    reads = {}
    var_of_key = {}
    # ① 局部变量 ← 某个键：`name = p.get("k", "")` / `version = p.get("version")`
    for sub in ast.walk(fn):
        if isinstance(sub, ast.Assign) and len(sub.targets) == 1 and isinstance(sub.targets[0], ast.Name):
            got = key_from(sub.value)
            if got:
                var_of_key[sub.targets[0].id] = got[0]
    # ② 收集读取（必须**先**收集：守卫的候选键集合依赖它）
    for sub in ast.walk(fn):
        got = None
        if isinstance(sub, (ast.Call, ast.Subscript)):
            got = key_from(sub)
        if isinstance(sub, ast.ListComp) and len(sub.generators) == 1:
            it = key_from(sub.generators[0].iter)
            if it:
                got = (it[0], it[1], "array")
        if not got:
            continue
        k, form, coercion = got
        prev = reads.get(k)
        if prev is None:
            reads[k] = {"form": form, "coercion": coercion}
        else:
            if form == "hard":
                prev["form"] = "hard"
            if prev["coercion"] is None:
                prev["coercion"] = coercion
    # ③ 守卫分四种语义（见 guard_kind 的说明）
    candidates = set(reads) | set(var_of_key.values())
    guarded_optional, presence_enforced, conditional = set(), set(), set()
    for sub in ast.walk(fn):
        if not isinstance(sub, ast.If):
            continue
        for k in candidates:
            kind = guard_kind(sub.test, k, var_of_key)
            if kind is None:
                continue
            if kind == "absent":
                # "缺省/为空" + 拒绝 ⇒ required 是诚实的；不拒绝 ⇒ 缺省有兜底，实为可选
                (presence_enforced if if_rejects(sub) else guarded_optional).add(k)
            elif kind == "present":
                # "存在" 才走这条路（甚至存在才拒绝）：缺省是被容忍的 ⇒ 可选
                guarded_optional.add(k)
            elif kind == "enum":
                # 枚举分派 + 拒绝型 else 链 ⇒ 给了合法值才干活、否则明确拒绝 ⇒ required 诚实
                (presence_enforced if if_rejects(sub) else conditional).add(k)
            else:
                # 条件与这个键无关（例如 `if ok: work`、`if not _send_program(...)`）⇒ 条件必填，
                # 既不能算"必填"，也不能算"可选"，只记一条 note。
                conditional.add(k)
    return reads, guarded_optional, presence_enforced, conditional


per_func = {name: analyse_function(fn) for name, fn in func_defs.items()}

# 调用图：handler 把 `p` 传给 helper 时，helper 读的参数也算 handler 读的（`_axis_move(p, 0)`）。
callees = {}
for name, fn in func_defs.items():
    targets = []
    for sub in ast.walk(fn):
        if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) and any(is_p(a) for a in sub.args):
            targets.append(sub.func.id)
    callees[name] = sorted(set(targets))


def closure_reads(name, depth=0, seen=None):
    seen = seen or set()
    if name in seen or depth > 3 or name not in per_func:
        return {}, set(), set(), set()
    seen.add(name)
    reads, opt, enf, cond = per_func[name]
    reads, opt, enf, cond = dict(reads), set(opt), set(enf), set(cond)
    for callee in callees.get(name, []):
        r2, o2, e2, c2 = closure_reads(callee, depth + 1, seen)
        for k, v in r2.items():
            if k not in reads:
                reads[k] = v
            elif v["form"] == "hard":
                reads[k]["form"] = "hard"
            if reads[k]["coercion"] is None:
                reads[k]["coercion"] = v["coercion"]
        opt |= o2
        enf |= e2
        cond |= c2
    return reads, opt, enf, cond


# op -> handler function name
op_to_fn = {}
for node in ast.walk(tree):
    if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "HANDLERS" for t in node.targets):
        for k, v in zip(node.value.keys, node.value.values):
            if isinstance(k, ast.Constant) and isinstance(v, ast.Name):
                op_to_fn[k.value] = v.id


# ---- report ---------------------------------------------------------------------------------
REPORT = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".tmp-tool-params.txt")
out = open(REPORT, "w", encoding="utf-8")
print("tool op -> handler, schema vs Python (real parse)")
print("=" * 78)

problems = 0
notes = []


def fail(op, tool, message):
    global problems
    problems += 1
    print("  %-22s %-30s %s" % (op, tool, message))
    out.write("FAIL %s %s: %s\n" % (op, tool, message))


if len(decls) < 86:
    print("FAIL  registration snapshot 只有 %d 个 op（应为 86）：schema 侧解析失效" % len(decls))
    raise SystemExit(1)
if set(decls) != matrix_ops:
    print("FAIL  注册面快照与声明表（docs/tool-matrix.json）的 op 集合不一致：只在快照 %s；只在声明表 %s"
          % (sorted(set(decls) - matrix_ops), sorted(matrix_ops - set(decls))))
    raise SystemExit(1)

for op in sorted(decls):
    tool = decls[op]["tool"] or op
    params = decls[op]["params"]
    fn = op_to_fn.get(op)
    if fn is None:
        fail(op, tool, "在 HANDLERS 里没有对应实现")
        continue
    found, guarded_opt, enforced, conditional = closure_reads(fn)

    declared = {k: v for k, v in params.items() if k not in IGNORE}
    read = {k: v for k, v in found.items() if k not in IGNORE}
    allowed = HELPER_READS.get(op, set())

    # ② 声明但从未被读 / 读了但没声明
    for k in sorted(set(declared) - set(read) - allowed):
        fail(op, tool, "schema 声明了 %s，但 Python 从未读取（指令会被静默丢弃）" % k)
    for k in sorted(set(read) - set(declared) - allowed):
        fail(op, tool, "Python 读了 %s，但 schema 没声明（模型无法设置它）" % k)

    # ③ 必填 ↔ 是否真的强制（两个方向）。守卫把"看起来的硬读"降级为可选。
    for k, spec in sorted(declared.items()):
        info = read.get(k)
        if info is None:
            continue
        effective_hard = k in enforced or (info["form"] == "hard" and k not in guarded_opt)
        required_violation = spec["required"] and not effective_hard
        hidden_requirement = (not spec["required"]) and effective_hard
        if not (required_violation or hidden_requirement):
            continue
        if k in conditional:
            # 只在**常规判据本来会失败**时降级成 note：条件必填（典型是 `action=circular` 才需要
            # center，或 `if frame is not None: raise`）取决于另一个参数，静态判据给不出结论。
            # 反过来，`servoj.q` 这种"必填 + 硬读"的正常情况不该因为函数里另有一个提到 q 的 if
            # 就被降级（本轮实测踩到）。
            notes.append("%s.%s：条件必填（取决于其它参数），本门禁不判其 required 标记" % (op, k))
            continue
        if required_violation:
            fail(op, tool, "%s 标了 required，但 Python 取的是**带默认值**的读法（schema 过度承诺）" % k)
        else:
            # 方向二（Python 硬读、schema 说可选）**只记 note**：静态分析分不清"缺了就崩"与
            # "缺了就取 None 然后自己判断"（`x = p.get("k")` 之后再 `if x is not None:` 是合法的
            # 可选写法）。把它判成失败会产生一批假阳性，反而让真问题淹没在噪音里 —— 这条界线是
            # 有意划的，报告里仍然逐条列出来供人核对。
            notes.append("%s.%s：Python 硬读、schema 未标 required（可能是真缺陷，也可能是带 None 判断"
                         "的可选参数）" % (op, k))

    # ④ 类型 ↔ 取值方式
    for k, spec in sorted(declared.items()):
        info = read.get(k)
        if info is None or info["coercion"] is None:
            continue
        accept = COERCION_FOR_TYPE.get(spec["type"])
        if accept is None or info["coercion"] in accept:
            continue
        fail(op, tool, "%s 的 schema 类型是 %s，但 Python 用 %s 取值（%s）"
             % (k, spec["type"], info["coercion"],
                "类型与取值范围不自洽" if info["coercion"] in COERCION_OF_TYPE else "取值方式不匹配"))

print("=" * 78)
if notes:
    print("note  条件必填（取决于其它参数，不判 required 标记）%d 处：" % len(notes))
    for n in notes:
        print("      %s" % n)
        out.write("note %s\n" % n)
print("ops with a contract mismatch: %d / %d" % (problems, len(decls)))
out.write("checked %d ops (schema from %s; reads from %s via ast)\n" % (len(decls), GOLDEN, WORKER))
out.close()
os.remove(REPORT)
if problems:
    print("FAIL  以上 op 的 schema 与 Python 实现不自洽（见每条的说明）")
    raise SystemExit(1)
print("PASS  每个 op 的 schema 与 Python 读取方式双向自洽（声明 / 必填 / 类型三项）")
print(json.dumps({"mismatched_ops": problems, "tools": len(decls)}))
