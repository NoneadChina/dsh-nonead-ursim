/**
 * 客户端 i18n（清单第 15 条）专项测试。
 *
 * 最要紧的一条是 **8 套文案的键必须完全对称** —— 漏一个键，该语言的用户就会在那儿看到
 * `undefined`，而中文路径下永远发现不了。带插值的键写成函数，这里也一并钉住它们可调用。
 *
 * 语言与桌面程序一致：`detectLocale()` 优先读宿主写进 `<html lang>` 的活动语言
 * （语言服务 `syncDocumentLanguage()`：zh → `zh-CN`，其余写原 id）。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  activeStrings,
  DEFAULT_LOCALE,
  detectLocale,
  en,
  liveStrings,
  resolveLocale,
  stringsFor,
  SUPPORTED_LOCALES,
  zh,
} from '../src/client/strings.js'

/** 所有语言（zh/en 直接导入，其余经 stringsFor 取，避免测试再引一遍内部表）。 */
const ALL = Object.fromEntries(SUPPORTED_LOCALES.map((loc) => [loc, stringsFor(loc)]))

/** 模拟宿主的 `<html lang>`；返回还原函数。 */
function withHtmlLang(lang, run) {
  const previous = globalThis.document
  globalThis.document = { documentElement: { lang } }
  try {
    return run()
  } finally {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
  }
}

test('resolveLocale：只认主语言子标签，认不出时回退缺省语言而不是英文', () => {
  assert.equal(resolveLocale('zh'), 'zh')
  assert.equal(resolveLocale('zh-CN'), 'zh')
  assert.equal(resolveLocale('zh-Hans-CN'), 'zh')
  // 繁体也先归到 zh（有繁体词条时再细化）—— 绝不能因为认不出就退回英文。
  assert.equal(resolveLocale('zh-TW'), 'zh')
  assert.equal(resolveLocale('en'), 'en')
  assert.equal(resolveLocale('en-US'), 'en')
  assert.equal(resolveLocale('EN_gb'), 'en', '大小写与下划线都要能认')
  // 巴西葡萄牙语与桌面程序的 pt 是同一套词条。
  assert.equal(resolveLocale('pt-BR'), 'pt')
  assert.equal(resolveLocale('pt'), 'pt')
  assert.equal(resolveLocale('ja'), 'ja')
  assert.equal(resolveLocale('es-MX'), 'es')
  assert.equal(resolveLocale('fr-FR'), 'fr')
  assert.equal(resolveLocale('de-DE'), 'de')
  assert.equal(resolveLocale('ru-RU'), 'ru')

  // 不支持 / 畸形 → 缺省语言
  assert.equal(DEFAULT_LOCALE, 'zh')
  for (const bad of ['it', 'ko', 'th-TH', '', '   ', null, undefined, 42, {}]) {
    assert.equal(resolveLocale(bad), DEFAULT_LOCALE, `${String(bad)} 应回退缺省语言`)
  }
  assert.deepEqual([...SUPPORTED_LOCALES], ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt'])
})

test('stringsFor：每种受支持语言都拿到自己那套，不认识的回退缺省', () => {
  assert.equal(stringsFor('zh'), zh)
  assert.equal(stringsFor('zh-CN'), zh)
  assert.equal(stringsFor('en-US'), en)
  assert.equal(stringsFor('ja').statusConnected, ALL.ja.statusConnected)
  for (const loc of SUPPORTED_LOCALES) assert.ok(ALL[loc], `${loc} 应有词典`)
  assert.equal(stringsFor('it'), zh, '不支持的语言回退缺省')
})

test('activeStrings：读 navigator.language，可用注入点覆盖', () => {
  assert.equal(activeStrings({ language: 'en-US' }), en)
  assert.equal(activeStrings({ language: 'zh-CN' }), zh)
  assert.equal(activeStrings({ language: 'ja-JP' }), ALL.ja)
  // 没有 navigator 线索 → 缺省语言，而不是崩掉
  assert.equal(activeStrings({}), zh)
  assert.equal(activeStrings({ language: undefined }), zh)
  assert.equal(activeStrings(null), stringsFor(globalThis.navigator?.language))
})

test('detectLocale：宿主写进 <html lang> 的语言优先于 navigator（与桌面程序一致）', () => {
  withHtmlLang('ja', () => {
    // 即使注入点说英文，宿主的活动语言也应该赢 —— 这就是「跟桌面语言走」。
    assert.equal(detectLocale({ language: 'en-US' }), 'ja')
    assert.equal(activeStrings({ language: 'en-US' }).statusConnected, ALL.ja.statusConnected)
  })
  withHtmlLang('pt', () => {
    assert.equal(resolveLocale(detectLocale(null)), 'pt')
  })
  // 没有 <html lang> 时退回注入点 / navigator
  assert.equal(detectLocale({ language: 'de-DE' }), 'de-DE')
})

test('liveStrings：桌面切语言后同一个 S 立刻读到新语言', () => {
  withHtmlLang('en', () => {
    const S = liveStrings()
    assert.equal(S.statusConnected, ALL.en.statusConnected)
    globalThis.document.documentElement.lang = 'ru'
    assert.equal(S.statusConnected, ALL.ru.statusConnected, '切换 <html lang> 后应立刻生效')
    globalThis.document.documentElement.lang = 'zh-CN'
    assert.equal(S.statusConnected, zh.statusConnected)
  })
})

test('8 种语言的键完全对称（漏一个键该语言用户就会看到 undefined）', () => {
  const base = Object.keys(en).sort()
  for (const loc of SUPPORTED_LOCALES) {
    const table = ALL[loc]
    assert.deepEqual(Object.keys(table).sort(), base, `${loc} 的键集合与 en 不一致`)
    // 值也必须同类型：标量 vs 函数不能串（那会在调用点直接抛错）。
    for (const key of base) {
      assert.equal(
        typeof table[key],
        typeof en[key],
        `${loc}.${key} 的类型不一致：en=${typeof en[key]} / ${loc}=${typeof table[key]}`,
      )
    }
  }
})

test('枚举映射表：8 种语言的键对称，且每个键都有非空译文', () => {
  for (const group of ['safetyMode', 'robotMode', 'programState']) {
    const baseKeys = Object.keys(en[group]).sort()
    for (const loc of SUPPORTED_LOCALES) {
      const table = ALL[loc][group]
      assert.deepEqual(Object.keys(table).sort(), baseKeys, `${loc}.${group} 键不对称`)
      for (const key of baseKeys) {
        assert.ok(table[key].length > 0, `${loc}.${group}.${key} 为空`)
      }
    }
  }
  // 与 python 侧上报的原始串对齐（少一个就会显示原始大写下划线串）。
  assert.ok(zh.safetyMode.NORMAL && zh.safetyMode.PROTECTIVE_STOP)
  assert.ok(zh.robotMode.RUNNING && zh.robotMode.BACKDRIVE)
  assert.ok(zh.programState.PLAYING && zh.programState.PAUSED)
})

test('带插值的键是函数，且每种语言都能正常产出文本', () => {
  for (const loc of SUPPORTED_LOCALES) {
    const strings = ALL[loc]
    assert.match(strings.disconnectReason('boom'), /boom/u, `${loc}.disconnectReason 没带上插值`)
    assert.match(strings.disconnectCandidates(['a', 'b']), /a/u, `${loc}.disconnectCandidates 没带上候选`)
    assert.equal(strings.disconnectCandidates([]), '', `${loc}：没有候选时必须是空串，不能留括号`)
    assert.equal(strings.disconnectCandidates(null), '', `${loc}：null 候选必须产出空串`)
    assert.match(strings.disconnectWorkerDown(''), /ursim_ping/u, `${loc} 必须提到 ursim_ping（真实的工具名）`)
    assert.match(strings.identity('UR5E', '10.0.0.1'), /UR5E/u, `${loc}.identity 丢了型号`)
    assert.match(strings.identity('UR5E', '10.0.0.1'), /10\.0\.0\.1/u, `${loc}.identity 丢了 IP`)
    assert.match(strings.overLimit('J2'), /J2/u, `${loc}.overLimit 丢了关节名`)
    assert.match(strings.detailBus('48.1', '2.30'), /48\.1/u, `${loc}.detailBus 丢了电压`)
  }
})

test('西文语言里不该混入中文（抓漏翻的键）', () => {
  const cjk = /[\u4e00-\u9fff]/u
  for (const loc of ['en', 'es', 'fr', 'de', 'pt', 'ru']) {
    for (const [key, value] of Object.entries(ALL[loc])) {
      if (typeof value === 'string') {
        assert.ok(!cjk.test(value), `${loc}.${key} 仍是中文：${value}`)
      }
    }
    // dock 的短标签最容易漏
    assert.ok(!cjk.test(ALL[loc].dockLabel) && !cjk.test(ALL[loc].dockDescription), `${loc} 的 dock 文案仍是中文`)
  }
})

test('中文文案里不该出现英文占位（抓没写完的键）', () => {
  for (const [key, value] of Object.entries(zh)) {
    if (typeof value !== 'string') continue
    // 允许含专有名词（ursim_connect / ursim_ping / TCP / WebGL / GPU / IP 等），但不允许整句英文。
    assert.ok(!/^(TODO|FIXME|undefined|null)$/u.test(value), `zh.${key} 是占位值：${value}`)
    assert.ok(value.trim().length > 0, `zh.${key} 为空`)
  }
})
