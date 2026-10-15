"""Static consistency checks for the worker's op table — as a **gate** (non-zero exit on failure).

Checks, all of which have been wrong at some point in this project's history:

1. `HANDLERS` has no duplicate op names (a duplicate silently shadows the first handler).
2. Every value in `HANDLERS` is a function that actually exists in the module.
3. Every `{ op: '…', toolName: '…' }` in `lib/index.js` maps to a real op — i.e. the host never
   registers a tool that the worker would answer with "未知操作".
4. Every op the worker implements is reachable from a tool (except `shutdown_worker`, which is
   host-side infrastructure called by `lib/worker.js`).

Run: python scripts/check-worker-ops.py
"""
import ast
import re
import sys
from glob import glob

WORKER = "python/ur_worker.py"
INDEX = "lib/tool-defs.js"

src = open(WORKER, encoding="utf-8").read()
tree = ast.parse(src)
fns = {n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}

handlers = None
for node in ast.walk(tree):
    if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "HANDLERS" for t in node.targets):
        handlers = node
if handlers is None:
    print("FAIL  找不到 HANDLERS 字典")
    sys.exit(1)

keys = [k.value for k in handlers.value.keys]
dupes = sorted({k for k in keys if keys.count(k) > 1})
bad_handlers = sorted(
    (k.value, v.id)
    for k, v in zip(handlers.value.keys, handlers.value.values)
    if isinstance(v, ast.Name) and v.id not in fns
)

index = open(INDEX, encoding="utf-8").read()
pairs = re.findall(r"\{\s*op:\s*'([a-z_0-9]+)',\s*\n\s*toolName:\s*'(ursim_[a-zA-Z_0-9]+)'", index)
op_set = set(keys)
missing_handler = sorted((op, tool) for op, tool in pairs if op not in op_set)
orphan_ops = sorted(o for o in op_set if o not in {op for op, _ in pairs} and o != "shutdown_worker")

# 5. 宿主**绕过工具表**直接调用的 op 也必须在 HANDLERS 里。
#
#    这一类真的漏过：`lib/twin-routes.js` 的面板 I/O 取数写的是 `get_digital_out_bits`
#    （照工具名 `ursim_get_digital_out_bits` 少了一个 "put"），真名是
#    `get_digital_output_bits` —— 于是面板 I/O 永远显示「未知操作」、读不出任何数值，
#    而单测里的假 worker 也跟着伪造了同一个错名，上面四项检查全绿。
#    凡是以字面量形式调用的 op 名，都在这里与 HANDLERS 对账。
direct_ops = {}
for path in sorted(glob("lib/*.js")):
    if path.endswith("client.js"):  # 浏览器产物，不是宿主代码
        continue
    text = open(path, encoding="utf-8").read()
    for name in re.findall(r"\.call\(\s*'([a-z_0-9]+)'", text):
        direct_ops.setdefault(name, set()).add(path)
    for name in re.findall(r"\bread\(\s*'([a-z_0-9]+)'", text):
        direct_ops.setdefault(name, set()).add(path)
unknown_direct = sorted(
    (name, sorted(paths)) for name, paths in direct_ops.items() if name not in op_set
)

print("ops in HANDLERS: %d | tools: %d | 宿主直接调用的 op: %d" % (len(keys), len(pairs), len(direct_ops)))
failures = []
if dupes:
    failures.append("HANDLERS 里有重复 op 名（后者会静默覆盖前者）：%s" % ", ".join(dupes))
if bad_handlers:
    failures.append("HANDLERS 指向不存在的函数：%s" % bad_handlers)
if missing_handler:
    failures.append("host 注册了工具但 worker 没有对应 op（调用只会得到「未知操作」）：%s" % missing_handler)
if orphan_ops:
    failures.append("worker 有 op 但没有任何工具能触达（除 shutdown_worker）：%s" % ", ".join(orphan_ops))
if unknown_direct:
    failures.append(
        "宿主直接调用的 op 名在 worker 里不存在（调用只会得到「未知操作」）：%s"
        % ", ".join("%s（%s）" % (n, "、".join(ps)) for n, ps in unknown_direct)
    )

if failures:
    print("FAIL")
    for f in failures:
        print("   - %s" % f)
    sys.exit(1)
print("PASS  op 表一致：无重复、句柄齐全、跨语言契约完整")
