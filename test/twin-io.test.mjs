/**
 * test/twin-io.test.mjs — 面板 I/O 写请求的校验（0.1.13，方案 P1）。
 *
 * ## 为什么必须有这个文件
 *
 * 这是插件里**第二个**从浏览器收 JSON 的入口（第一个是仿真开关）。面板写请求是不可信输入：
 * 校验漏一条，就等于把"任意 op + 任意参数"的入口开给了页面。所以这里逐条钉住白名单与类型：
 *   · 只认 digital_out / analog_out —— 别的 kind 一律拒（面板不该有能力调任意 op）；
 *   · `n` 必须 0-15 的整数（不是 0-7：标准端 0-7 + 可配置端 8-15）；
 *   · `value` 类型随 kind：布尔 vs 有限数（`NaN` 也是 number，所以不能用 typeof）；
 *   · 模拟输出的域只有 10（电压）/ 20（电流），且 value 必须落在域内；
 *   · **ip 恒为 127.0.0.1** —— 整形阶段就不给真机目标留位置。
 *
 * 运行：node --test test/twin-io.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { IO_WRITE_OPS, parseIoWrite } from '../lib/twin-io.js'

test('白名单只有两种 I/O，且映射到固定的 worker op', () => {
  assert.deepEqual(IO_WRITE_OPS, { digital_out: 'set_digital_out', analog_out: 'set_analog_out' })
  assert.equal(Object.isFrozen(IO_WRITE_OPS), true, '白名单必须冻结（别让运行期改它）')
})

test('★ 合法请求：整形后的 ip 恒为回环地址，别的字段原样透传', () => {
  const d = parseIoWrite({ kind: 'digital_out', n: 3, value: true })
  assert.deepEqual(d, { ok: true, op: 'set_digital_out', params: { ip: '127.0.0.1', n: 3, value: true } })

  const a = parseIoWrite({ kind: 'analog_out', n: 0, value: 4, full_scale: 20 })
  assert.deepEqual(a, { ok: true, op: 'set_analog_out', params: { ip: '127.0.0.1', n: 0, value: 4, full_scale: 20 } })

  // 可配置端 8-15 也要能写（面板上就是这 8 位）
  const high = parseIoWrite({ kind: 'digital_out', n: 15, value: false })
  assert.equal(high.ok, true)
  assert.equal(high.params.n, 15)
})

test('★ 拒绝：未知 kind / 缺 kind / 非对象体', () => {
  for (const bad of [{ kind: 'power_off' }, { kind: 'digital_in', n: 1, value: true }, {}, null, [], 'x', 42]) {
    const r = parseIoWrite(bad)
    assert.equal(r.ok, false, `必须拒绝：${JSON.stringify(bad)}`)
    assert.equal(typeof r.error, 'string')
  }
  assert.match(parseIoWrite({}).error, /缺 kind/)
})

test('★ 拒绝：n 不是 0-15 的整数（小数、越界、NaN、空串都要挡）', () => {
  // 注意：**数字字符串是允许的**（面板从 DOM 读出来常常是字符串），所以 '3' / '7' 不算非法；
  // 但空串不行 —— `Number('')` 是 0，会被悄悄当成"写 0 号端口"。
  for (const n of [-1, 16, 1.5, Number.NaN, '', '  ', null, undefined, 'abc']) {
    const r = parseIoWrite({ kind: 'digital_out', n, value: true })
    assert.equal(r.ok, false, `n=${JSON.stringify(n)} 必须被拒`)
  }
  assert.equal(parseIoWrite({ kind: 'digital_out', n: '7', value: true }).ok, true, '数字字符串要能通过')
})

test('★ 拒绝：digital_out 的 value 必须是布尔（1/"true" 都不算）', () => {
  for (const value of [1, 0, 'true', 'false', null, undefined]) {
    assert.equal(parseIoWrite({ kind: 'digital_out', n: 0, value }).ok, false, `value=${String(value)} 必须被拒`)
  }
})

test('★ 模拟输出：域只有 10/20，value 必须有限且落在域内', () => {
  assert.equal(parseIoWrite({ kind: 'analog_out', n: 0, value: 12 }).ok, false, '默认电压域 10 ⇒ 12 越界')
  assert.equal(parseIoWrite({ kind: 'analog_out', n: 0, value: 12, full_scale: 20 }).ok, true, '电流域 20 ⇒ 12 合法')
  assert.equal(parseIoWrite({ kind: 'analog_out', n: 0, value: -1 }).ok, false)
  assert.equal(parseIoWrite({ kind: 'analog_out', n: 0, value: Number.NaN }).ok, false, 'NaN 是 number，但不能算有限数')
  assert.equal(parseIoWrite({ kind: 'analog_out', n: 0, value: 5, full_scale: 15 }).ok, false, '域只能是 10 或 20')
})
