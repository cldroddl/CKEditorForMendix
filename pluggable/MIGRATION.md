# CKEditor for Mendix — Dojo → Pluggable Widget rewrite

Branch: **`ckeditor4-react`** — the CKEditor **4.22.0** variant of the rewrite. It shares everything with `react-ver`
(shared package, viewer widget, workspace, build tooling) and swaps only the editor widget's engine. The old Dojo widget
under `../src/` is left in place for reference until parity is reached.

## Why a CKEditor 4 branch

|              | `react-ver` (CKEditor 5)                  | `ckeditor4-react` (this branch)                                                        |
| ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Editor       | CKEditor 5 v48, bundled (~4.8 MB `.mpk`)  | CKEditor 4.22.0, loaded at runtime (~64 KB `.mpk`)                                     |
| Licence      | GPL-2.0-or-later + mandatory `licenseKey` | **GPL-2.0 / LGPL-2.1 / MPL-1.1 tri-licence** — usable in a proprietary app with no key |
| Support      | active                                    | **EOL since June 2023** — no security patches for the open-source line                 |
| Architecture | modern                                    | legacy (iframe editing, global `window.CKEDITOR`)                                      |

Use this branch only if the permissive licence outweighs running an unpatched editor. 4.22.0 is the last open-source
release; 4.22.1 is the last open-source _patch_ but is not on the CDN, and 4.23.0+ ("CKEditor 4 LTS") is
paid/commercial.

## Target stack

| Tool                                        | Version                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| React                                       | ≥ 19 (peer, provided by the Mendix client — Mendix 11)             |
| `@mendix/pluggable-widgets-tools` (**pwt**) | 11.12 (same as `react-ver`)                                        |
| TypeScript                                  | as bundled with pwt 11                                             |
| Editor                                      | **CKEditor 4.22.0** ("full-all"), loaded at runtime via `<script>` |

("pwt" = `@mendix/pluggable-widgets-tools`, Mendix's widget build toolchain — used throughout this doc.)

### Editor loading (this branch)

-   `ckeditor4-react` (the npm package) is **not** used: its current majors are tied to the commercial LTS licence and
    only declare React `^18`. Instead `src/components/Editor.tsx` is a hand-rolled `useEffect` wrapper —
    `loadCKEditor()` injects the script once, `CKEDITOR.replace()` on mount, guarded `destroy(true)` on unmount (handles
    React 19 StrictMode double-mount).
-   Default: the CKEditor 4.22.0 runtime the build bundled into `assets/ckeditor/` (see phase 6 below) — loaded from
    `<app>/widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js`, same origin, no external request, offline-safe,
    like the legacy vendored widget. `config.versionCheck` is `false` (also stops CKEditor's own CDN "update" ping).
    `config.allowedContent = true` — ACF off, so stored HTML is not stripped (parity with the legacy full build).
-   The **"Editor script URL"** widget property overrides the default with any other CKEditor 4.22.0 build — e.g.
    `https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js`, or one copy shared across apps.
-   If the script never loads (offline, firewall, CSP), the widget renders a warning plus a plain `<textarea>` bound to
    the same attribute — the stored HTML stays visible and editable as raw source, and formatting returns once the
    script loads (e.g. after fixing the URL or on a later mount). The legacy widget showed an empty box.
-   Bundled plugins (inlined as TS, registered on `window.CKEDITOR` before `CKEDITOR.replace`):
    -   `mendixlink` (`src/ckeditor4/mendixLinkPlugin.ts`) — port of the legacy `plugin.js` + `dialogs/mendixlink.js`,
        but writes the `data-mf` wire format.
    -   `pastebase64` (`src/ckeditor4/pasteBase64Plugin.ts`) — verbatim port of the legacy MIT plugin; enabled when
        Image Mode = Base64.
-   From `full-all`: `divarea`, `tableresize`, `maximize`, `widget`, `codesnippet` (when code highlighting on),
    `wordcount` (when Count plugin on).
-   **Not ported yet:** `oembed` / media embed (needs jQuery + a hosted `libs/`), image **upload** (`uploadimage` /
    `simple-image-browser`). `imagePasteMode="upload"` + `imageUploadMicroflow` are accepted in the XML but inert.

### Multiple widgets per page

Supported. CKEditor 4 is designed for many editors on one page: `CKEDITOR.replace` on the nameless host `<div>` gets an
auto-unique `editor{n}` name, config is passed per-instance (never via the global `CKEDITOR.config`), plugin
registration (`mendixlink`, `pastebase64`) is idempotent, and unmount cleanup targets only its own `instance.name`.
The `RichTextViewer` never loads `ckeditor.js` at all, so any mix of editors + viewers coexists.

The **one constraint**: `ckeditor.js` loads exactly once per page. If two `RichText` widgets set **different**
`editorScriptUrl` values, the first to load wins and the second is ignored (with a `console.error`). Use the same
value on every RichText widget on a page.

The `mendixlink` dialog is registered with the editor CKEditor passes at open time (`mendixLinkPlugin.ts` —
`dialog.add("mendixLinkDialog", dialogEditor => buildDialog(dialogEditor))`), so each editor's "Insert Mendix link"
dialog reads its own configured link list even with several editors on the page.

## Widgets

Two pluggable widgets ship from one package (`CKEditorForMendix` client module):

1. **RichText (editor)** — `id: ckeditorformendix.RichText`

    - `messageString: EditableValue<string>` — the HTML attribute, two-way bound (`.readOnly` = editability)
    - Legacy interface: 14 `toolbar*` toggles + `customToolbars`, `enterMode`/`shiftEnterMode`, `enableSpellCheck`,
      `autoParagraph`, appearance (`width`/`height`/`showLabel`/`fieldCaption`/`maximizeOffset`/…),
      `enableCodeHighlighting`, `countPlugin`, `imagePasteMode`, and the **microflow-link** plugin
    - `onChangeMicroflow` / `onKeyPressMicroflow` actions

2. **RichTextViewer** — `id: ckeditorformendix.RichTextViewer`
    - `messageString: EditableValue<string>` (read-only render)
    - Renders stored HTML, rehydrates `a.mx-microflow-link` placeholders, wires click → `mfName` action, always
      highlights `pre code`, clips to `cutOffRules` pixels

## The microflow-link mechanism (must stay wire-compatible with existing stored data)

The old widget stores links as:

```html
<a
    href="__LINK__"
    class="<user classes> mx-microflow-link"
    onclick="CKEditorViewer.mf.exec('<functionName>', '__ID__', '__GUID__');"
    title="<title>"
    >Label</a
>
```

`__LINK__`, `__ID__`, `__GUID__` are literal placeholder tokens persisted in the attribute value. The **viewer**
replaces them at render time:

-   `__LINK__` → `#<timestamp>" name="<timestamp>`
-   `__ID__` → base64(widget instance id)
-   `__GUID__` → base64(context object guid)

and on click runs the microflow mapped from `functionName` via the widget's `microflowLinks` list (`functionName` →
`ActionValue`).

### Rewrite approach

-   Keep the **stored format identical** (`mx-microflow-link` class, `__LINK__/__ID__/__GUID__` tokens, `functionName`
    in a `data-mf` attribute instead of an inline `onclick` string — inline JS won't run under a React viewer and is
    CSP-hostile).
    -   New editor writes: `<a class="... mx-microflow-link" data-mf="<functionName>" href="#">Label</a>`
    -   New viewer ALSO understands the legacy `onclick="CKEditorViewer.mf.exec('fn',…)"` form (parse `fn` out of it) so
        existing content keeps working.
-   Editor: a CKEditor plugin `mendixlink` — on `react-ver` a CKEditor 5 plugin (schema node + upcast/downcast + toolbar
    dropdown); on this branch a CKEditor 4 plugin (toolbar button + context menu + a dialog for name/label/css/title,
    `src/ckeditor4/mendixLinkPlugin.ts`). Both pick a `functionName` from the configured list and write the `data-mf`
    form.
-   Viewer: pure DOM pass over `dangerouslySetInnerHTML` output — find `a.mx-microflow-link`, read `data-mf` (or parse
    legacy `onclick`), attach a React-managed click handler that calls the matching `ActionValue.execute()`.

## Widget XML — mirrors the legacy interface

The widget `.xml` reproduces the legacy `src/CKEditorForMendix/CKEditorForMendix.xml` /
`CKEditorViewerForMendix.xml` interface: same property `key`s, captions, defaults, enum values, order, and grouping.
Legacy `<category>` values become top-level `<propertyGroup caption="...">` (Studio renders them identically). Editor
groups, in legacy order: **Data source · Behavior · Document · Custom Toolbar · Appearance · Code · Microflow links ·
Images · Count** (+ `Advanced` for `editorScriptUrl`, + `Common` for system properties).

### Deviations forced by the pluggable schema

| legacy                                                                                    | this branch                            | why                                                                                                             |
| ----------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `<category>` per property                                                                 | `<propertyGroup>` nesting              | pluggable widgets ignore `<category>`                                                                           |
| `onKeyPressMicroflow` / `onChangeMicroflow` / `imageUploadMicroflow` — `type="microflow"` | `type="action"` (same keys)            | `microflow` is a legacy-only type                                                                               |
| viewer `mfName` — `type="microflow"`                                                      | `type="action"` (same key)             | ″                                                                                                               |
| `imageentity` — `type="entity"` (`isPath`/`referenceSet`)                                 | **dropped**                            | `entity` needs a companion `datasource` property (extra UI); target entity is decided in `imageUploadMicroflow` |
| `imageconstraint` — `type="entityConstraint"`                                             | **dropped**                            | no pluggable equivalent; was already non-functional in the legacy widget                                        |
| `fieldCaption` — `type="translatableString"`                                              | `type="textTemplate"` (same key)       | `translatableString` is legacy-only                                                                             |
| —                                                                                         | **added** `editorScriptUrl` (Advanced) | legacy vendored CKEditor; this build loads it at runtime                                                        |
| viewer `highlightCode` (from the first-cut rewrite)                                       | **removed**                            | legacy viewer always highlights `pre code`                                                                      |

Everything else — `messageString`, all 14 `toolbar*` booleans, `useCustomToolbar` + `customToolbars`
(`ctItemType` 69-value enum + `ctItemToolbar`), `enterMode`/`shiftEnterMode` P/BR/DIV, `autoParagraph`,
`enableSpellCheck`, `bodyCssClass`, `width`, `height`, `showLabel`, `maximizeOffset`, `showStatusBar`,
`showToolbarCollapsed`, `enableCodeHighlighting`, `microflowLinks`/`functionNames`, `imagePasteMode`,
`useImageStyleProperty`, `countPlugin`, `countPluginMaxCount`, viewer `cutOffRules` — is verbatim.

### Runtime mapping (CKEditor 4)

-   14 `toolbar*` booleans → `config.toolbarGroups` (ported from legacy `_addToolbars`, `src/ckeditor4/buildToolbar.ts`).
-   `useCustomToolbar` + `customToolbars` → `config.toolbar` grouped by `ctItemToolbar` (ported from `_buildCustomToolbars`).
-   `enterMode`/`shiftEnterMode` → `CKEDITOR.ENTER_P` (1) / `ENTER_BR` (2) / `ENTER_DIV` (3).
-   `enableSpellCheck` → `config.disableNativeSpellChecker`; `autoParagraph` → `config.autoParagraph`.
-   `width`/`height` → `config.width`/`config.height`; `maximizeOffset` → `config.maximizeOffset`.
-   `showStatusBar=false` → `removePlugins: elementspath`, `resize_enabled: false`.
-   `showToolbarCollapsed` → `toolbarStartupExpanded`.
-   `enableCodeHighlighting` → `codesnippet` extra plugin; `countPlugin` → `wordcount` extra plugin + `config.wordcount`
    (`maxCharCount` from `countPluginMaxCount`).
-   `imagePasteMode="base64"` → `pastebase64` extra plugin. `showLabel`+`fieldCaption` → a `<label>` above the editor.
-   Viewer `cutOffRules` (px) → wrapper `max-height` + `overflow: hidden`.

## Phases (this branch)

1. ✅ **Scaffold + build green** — both `.mpk`s build, lint + shared tests pass.
2. ✅ **Legacy XML interface + CKEditor 4 config mapping** — editor XML reproduces all 40 legacy properties + groups;
   `toolbar*` / `customToolbars` / enter mode / spell check / count / code highlighting / label wired to CKEditor 4
   config. Default build → `full-all`. `mendixlink` + `pastebase64` inlined.
3. 🟡 **Microflow links** — `mendixlink` plugin (button + context menu + dialog for name/label/css/title) and the
   viewer's click→action wiring are in; legacy `onclick` upcast + `migrateStoredValue` covered by tests. Manually
   verified in an `mxcli`-scaffolded test project (`tests/testProject/mdlsource/setup.mdl`): editor + viewer render
   and round-trip; the `microflowLinks` list entries themselves must be set in Studio Pro (`mxcli` v0.16.0 can't write
   widget object-list properties — see README "scaffolding with `mxcli`"). Still to do: end-to-end link-click test with
   a real microflow; C6 (insert-over-selection deletes text — see `review-2026-09-03.md`).
4. **Image upload** (`imagePasteMode="upload"` + `imageUploadMicroflow`) — accepted in XML, not implemented.
5. ⚖️ **oembed / media embed — DECISION NEEDED.** The legacy widget bundles the third-party `oembed` plugin (media/URL
   embed via an "insert" toolbar button; no dedicated widget property). To bring it back:

    - Bundle jQuery + the legacy `oembed/` folder (`plugin.js` + `libs/jquery.oembed.js` + `css` + `lang/`) as widget
      assets (needs the asset pipeline from item 6).
    - `CKEDITOR.plugins.addExternal("oembed", <assetUrl>, "plugin.js")` and set `CKEDITOR.jQuery = <jQuery>` before
      `CKEDITOR.replace` (the plugin can't reach jQuery from the `full-all` CDN basePath).
    - Add `oembed` to `extraPlugins`, keep `config.oembed_WrapperClass = "embededContent"`.

    **Trade-off:** this pulls jQuery (~30 KB min) into a modern React widget purely for one editor plugin. Alternatives:
    drop oembed permanently (media embed = paste an `<iframe>` in Source mode), or find a jQuery-free CKEditor 4 media
    plugin. `videodetector` from the legacy `lib/plugins/` is **not** a candidate — it had no `plugin.js` and was never
    referenced by the legacy widget.

6. ✅ **Self-hosted asset pipeline** — `packages/rich-text/rollup.config.mjs` (a custom config pwt merges over its own)
   copies a CKEditor 4.22.0 runtime tree into `assets/ckeditor/` at build time, from two pinned dev dependencies:
   `ckeditor4@4.22.0` (the "standard-all" distribution — most plugins + all languages inlined in `ckeditor.js`, the rest
   under `plugins/`) and `ckeditor-wordcount-plugin` (MIT — `wordcount` is not in the CKEditor package). Only the
   `moono-lisa` skin and no `samples/`/`dev/` are copied; the `.mpk` goes from ~65 KB to ~2.7 MB. With `editorScriptUrl`
   empty, `getBundledCKEditorUrl()` points the loader at `<app>/widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js`
   — same origin, no external request, offline-safe, matching the legacy vendored widget. Setting `editorScriptUrl`
   still overrides it (e.g. to the CDN or a copy shared across apps). `versionCheck: false` already suppresses
   CKEditor's own CDN "update" ping.
7. **Review follow-ups** — `review-2026-09-03.md` C2/C4/C5/C8 partly addressed (C4 rejected-promise reset, C8 null
   guard, C2 emit only on real change); C1 handled via `allowedContent: true` (parity, not sanitization).

### Build/tooling notes

-   pwt resolved to **11.12.0** (Node ≥ 20; 11.13 needs Node 22 and this machine is on Node 24).
-   pwt's tsconfig base uses `jsx: "react-jsx"` + `noUnusedLocals` — do **not** `import { createElement }` in `.tsx`.
-   React 19 types: `useRef<T>()` needs an explicit initial arg; don't assign a ref during render (use an effect).
-   `shared` is consumed by the widget bundlers as **compiled JS** (`dist/`), not raw TS.
-   `.eslintrc.js` must use `require.resolve(...)` for the pwt base config (npm-workspaces resolution).
-   CKEditor 4's `ckeditor.js` is a self-loading IIFE — it must be an external `<script>`, never Rollup-bundled.

## Known constraints / decisions

-   **Licence (the reason this branch exists)**: CKEditor **4.22.0** is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1
    (`node_modules/ckeditor4/package.json` confirms). Under LGPL/MPL it can be used in a proprietary Mendix app with no
    licence key and no copyleft on the app — the same footing the legacy Dojo widget relied on. The `rich-text` package
    stays `Apache-2.0`.
-   **Security**: CKEditor 4 open source is **EOL (June 2023)**. 4.22.0 will not receive security patches. For an editor
    that stores and renders HTML this is a real risk — prefer `react-ver` (CKEditor 5) unless the licence is decisive.
-   CKEditor 4 is a **global singleton** (`window.CKEDITOR`) — only one `ckeditor.js` per page. Fine for one widget; a
    second widget needing a different CKEditor build would conflict.
-   `config.versionCheck: false` is set to stop the CDN "update available" notification (CKEditor activated it for all
    CDN loads on 2024-07-01).
-   `ckeditor4-react` (npm) deliberately unused — see "Editor loading" above.
-   No inline `onclick` in stored HTML going forward (CSP + React). Legacy content is read-compatible; re-saved content
    is migrated to `data-mf`.

---

# 한국어 번역 (Korean translation)

> **이 브랜치(`ckeditor4-react`) 요약**: `react-ver` 재작성의 **CKEditor 4.22.0 변형**입니다. shared 패키지·뷰어위젯·워
> 크스페이스·빌드 도구는 `react-ver`와 동일하고, **에디터 엔진만** CKEditor 5 → CKEditor 4로 교체했습니다.
>
> -   CKEditor 4.22.0은 **GPL-2.0 / LGPL-2.1 / MPL-1.1 3중 라이선스** — 라이선스 키 없이 비공개(프로프라이어터리) 앱에서
>     사용 가능. 그래서 `rich-text` 패키지는 `Apache-2.0` 유지. (구 Dojo 위젯과 동일한 근거)
> -   대가: CKEditor 4 오픈소스는 **2023년 6월 EOL** — 보안 패치 없음. 라이선스가 결정적이지 않다면 `react-ver`
>     (CKEditor 5) 권장.
> -   `.mpk` 약 2.7MB — 빌드 시 CKEditor 4.22.0 런타임을 위젯의 `assets/ckeditor/`에 번들 (dev 의존성
>     `ckeditor4@4.22.0` + `ckeditor-wordcount-plugin`(MIT)에서 복사, `rollup.config.mjs`). "Editor script URL"이
>     비어 있으면 `<app>/widgets/ckeditorformendix/richtext/assets/ckeditor/ckeditor.js`를 로드 — same-origin, 외부
>     요청 0, 오프라인 OK (레거시 vendoring 위젯과 동일). "Editor script URL"에 값을 넣으면 다른 4.22.0 빌드(예: CDN)로
>     대체.
> -   스크립트를 못 받으면(오프라인·방화벽·CSP) 경고 메시지 + 같은 속성에 바인딩된 `<textarea>`를 렌더 — 저장된 HTML을
>     원본 소스로 계속 보고 편집할 수 있고, 스크립트가 로드되면(URL 수정 후 또는 다음 마운트 시) 서식 편집으로 복귀.
>     레거시 위젯은 빈 박스만 나왔음.
> -   `ckeditor4-react` npm 패키지는 **사용 안 함** (현재 메이저가 상용 LTS 라이선스에 묶여 있고 React `^18`만 선언). 대
>     신 수동 `useEffect` 래퍼로 스크립트 주입 + `CKEDITOR.replace` + StrictMode 안전한 정리.
> -   `mendixlink` / `pastebase64` 플러그인은 구 Dojo 위젯 소스를 TS로 인라인 포팅 (`mendixlink`는 신규 `data-mf` wire
>     형식).
>
> **위젯 XML은 레거시 인터페이스를 그대로 재현합니다** — `src/CKEditorForMendix/CKEditorForMendix.xml` /
> `CKEditorViewerForMendix.xml`의 property key·caption·기본값·enum·순서·그룹 동일. `<category>`는 pluggable에서
> 무시되므로 최상위 `<propertyGroup>`으로 변환 (Studio에서 동일하게 표시). 스키마상 불가피한 차이:
> `type="microflow"` → `type="action"` (같은 key), `imageentity`(entity)·`imageconstraint`(entityConstraint) 삭제,
> `fieldCaption` translatableString → textTemplate, `editorScriptUrl` 추가. 자세한 표는 위 영어 "Widget XML" 절 참고.
>
> 아래 본문은 초기 `react-ver`(CKEditor 5) 기준 번역이라 일부 서술(밸룬 UI, `preset` enum, 4.8MB 번들 등)은 이 브랜치에
> 해당하지 않습니다.

# CKEditor for Mendix — Dojo → Pluggable Widget 재작성

브랜치: `react-ver`. 이 디렉터리(`pluggable/`)는 `@mendix/pluggable-widgets-tools`(이하 **pwt** — Mendix의 위젯 빌드
툴체인, 이 문서 전체에서 이 약자로 지칭)로 빌드하는 새 React + TypeScript pluggable 위젯을 담고 있습니다. 구 Dojo
위젯(`../src/`)은 기능 동등성(parity)에 도달할 때까지 참고용으로 남겨 둡니다.

## 목표 스택

| 도구                                    | 버전                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| React                                   | ≥ 19 (peer, Mendix 클라이언트가 제공 — Mendix 11)                       |
| `@mendix/pluggable-widgets-tools` (pwt) | ≥ 9, **11.x 권장**                                                      |
| TypeScript                              | pwt 11에 번들된 버전                                                    |
| 에디터                                  | CKEditor 5 (`ckeditor5` + `@ckeditor/ckeditor5-react`), GPL 라이선스 키 |

## 위젯

하나의 `CKEditorForMendix` client module에서 두 개의 pluggable 위젯이 배포됩니다.

1. **RichText (에디터)** — `id: ckeditorformendix.RichText`

    - `content: EditableValue<string>` — HTML 속성, 양방향 바인딩
    - `editability`는 `content.readOnly` + `content.setValue()`로 처리
    - 툴바 구성, enter 모드, 이미지 처리, 코드 하이라이팅, 글자 수 세기, oembed, 그리고 **microflow-link** 플러그인
    - `onChange` / `onKeyPress` 액션(`ActionValue`)

2. **RichTextViewer (뷰어)** — `id: ckeditorformendix.RichTextViewer`
    - `content: EditableValue<string>` (읽기 전용 렌더)
    - 저장된 HTML 렌더, `a.mx-microflow-link` placeholder 재수화(rehydrate), 클릭 → microflow 배선, 이미지 URL 치환, 코
      드 하이라이팅, 선택적 줄 수 제한(line clamp)

## microflow-link 메커니즘 (기존 저장 데이터와 wire 호환 유지 필요)

구 위젯은 링크를 다음 형태로 저장합니다.

```html
<a
    href="__LINK__"
    class="<사용자 클래스> mx-microflow-link"
    onclick="CKEditorViewer.mf.exec('<functionName>', '__ID__', '__GUID__');"
    title="<title>"
    >Label</a
>
```

`__LINK__`, `__ID__`, `__GUID__`는 속성 값에 그대로 저장되는 리터럴 placeholder 토큰입니다. **뷰어**가 렌더 시점에치환합
니다.

-   `__LINK__` → `#<타임스탬프>" name="<타임스탬프>`
-   `__ID__` → base64(위젯 인스턴스 id)
-   `__GUID__` → base64(컨텍스트 객체 guid)

클릭 시 위젯의 `microflowLinks` 목록에서 `functionName`에 매핑된 microflow를 실행합니다 (`functionName` →
`ActionValue`).

### 재작성 방식

-   **저장 형식은 동일하게 유지**합니다 (`mx-microflow-link` 클래스, `__LINK__/__ID__/__GUID__` 토큰). 단
    `functionName`은인라인 `onclick` 문자열 대신 `data-mf` 속성에 넣습니다 — 인라인 JS는 React 뷰어에서 실행되지 않고
    CSP에도 불리합니다.
    -   새 에디터가 쓰는 형식: `<a class="... mx-microflow-link" data-mf="<functionName>" href="#">Label</a>`
    -   새 뷰어는 레거시 `onclick="CKEditorViewer.mf.exec('fn',…)"` 형식도 이해합니다 (`fn`을 파싱해 냄) — 기존 콘텐츠가
        계속 동작하도록.
-   에디터: CKEditor 5 플러그인 `MendixLink` — 스키마 노드(인라인 요소), upcast/downcast 컨버터, 설정된 목록에서
    `functionName`을 고르고 label/title/css를 설정하는 밸룬/다이얼로그 UI.
-   뷰어: `dangerouslySetInnerHTML` 출력에 대한 순수 DOM 패스 — `a.mx-microflow-link`를 찾아 `data-mf`(또는 레거시
    `onclick`)를 읽고, 매칭되는 `ActionValue.execute()`를 호출하는 React 관리 클릭 핸들러를 붙임.

## 속성 매핑 (구 XML → 새 pluggable XML)

| 구 key                                                                                                              | 신규                                                              | 비고                                                |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `messageString` (attribute String)                                                                                  | `content` (`attribute`, `EditableValue<string>`)                  |                                                     |
| `onKeyPressMicroflow` / `onChangeMicroflow` (microflow)                                                             | `onKeyPress` / `onChange` (`action`)                              |                                                     |
| `enterMode` / `shiftEnterMode` (enum P/BR/DIV)                                                                      | enum 유지; CKEditor 5 설정에 매핑                                 | CKEditor 5에는 `shiftEnterMode`가 없음; 한계 문서화 |
| `autoParagraph`, `enableSpellCheck`                                                                                 | boolean 유지                                                      |                                                     |
| `toolbar*` 불리언 + `useCustomToolbar` + `customToolbars` 목록                                                      | `preset` enum (basic/standard/full) + 선택적 `customToolbar` 목록 | 단순화; CKEditor 5 툴바 아이템 이름이 다름          |
| `bodyCssClass`, `width`, `height`, `showLabel`, `fieldCaption`                                                      | 유지                                                              | 라벨은 `fieldCaption`(`textTemplate`)로             |
| `maximizeOffset`, `showStatusBar`, `showToolbarCollapsed`                                                           | 제거 또는 매핑                                                    | CKEditor 5 UX가 다름                                |
| `enableCodeHighlighting`                                                                                            | `codeBlock` boolean                                               | CKEditor 5 `CodeBlock` 플러그인                     |
| `microflowLinks` 목록 (`functionNames`, `mfName`)                                                                   | `microflowLinks` 목록 (`linkName` string, `linkAction` action)    |                                                     |
| `imagePasteMode` (base64/upload), `imageentity`, `imageUploadMicroflow`, `imageconstraint`, `useImageStyleProperty` | `imageUpload` enum + `imageDatasource`/`imageUploadAction`        | phase 2로 연기                                      |
| `countPlugin`, `countPluginMaxCount`                                                                                | `showCount` boolean + `maxCount` int                              | CKEditor 5 `WordCount`                              |
| 뷰어 `cutOffRules`                                                                                                  | `maxLines` int                                                    | dotdotdot 대신 CSS line-clamp                       |

## 단계(Phases)

1. ✅ **스캐폴드 + 빌드 성공** — npm-workspaces 모노레포, 두 위젯 `.mpk` 빌드, shared 유닛 테스트 + lint 통과. 에디터가
   `content`에 바인딩된 CKEditor 5를 렌더하며 읽기 전용 지원 및 `onChange`/`onKeyPress` 액션 포함.
2. 🟡 **microflow 링크** — `MendixLink` CKEditor 플러그인(editing 컨버터 + 툴바 드롭다운 + command)과 뷰어의 클릭→액션배
   선 완료; 레거시 `onclick` upcast + `migrateStoredValue`는 테스트로 커버됨. 남은 것: label/CSS/title 편집용 밸룬 UI (
   현재는 이름만), 실제 저장 데이터 대상 왕복(round-trip) 테스트. `mxcli`로 스캐폴딩한 테스트 프로젝트
   (`tests/testProject/mdlsource/setup.mdl`)에서 수동 확인 — `microflowLinks` 목록 항목은 Studio Pro에서 직접 입력해야
   함 (`mxcli` v0.16.0은 위젯 오브젝트 리스트 속성을 못 씀; README "`mxcli`로 스캐폴딩" 참고).
3. **툴바 프리셋 + enter 모드 + 글자 수 세기 + 코드 블록** — 프리셋은 배선됨; 글자 수 UI 요소와 enter 모드 동등성 마무리
   필요.
4. **이미지 처리** (base64 먼저, 이후 datasource/action 기반 업로드) — 미착수.
5. **oembed / media embed, line clamp, 다듬기, 에디터 프리뷰, 문서, 앱 개발자용 마이그레이션 가이드** — 미착수.

### 빌드/툴링 노트 (스캐폴드 중 해결됨)

-   pwt는 **11.12.0**으로 해석됨 (Node ≥ 20; 11.13은 Node 22 필요, 이 머신은 Node 24).
-   pwt의 tsconfig base는 `jsx: "react-jsx"` + `noUnusedLocals` 사용 — `.tsx`에서 `import { createElement }` **금지**.
-   React 19 타입: `useRef<T>()`는 명시적 초기 인자가 필요 (`useRef<T | undefined>(undefined)`).
-   `shared`는 위젯 번들러가 **컴파일된 JS**(`dist/`)로 소비함, 원본 TS가 아님 — rollup의 typescript 플러그인은 위젯 자
    체의 `src/`만 컴파일함.
-   `.eslintrc.js`는 pwt base config에 대해 `require.resolve(...)`를 사용해야 함 (npm-workspaces 해석 문제).

## 알려진 제약 / 결정 사항

-   CKEditor 5 플러그인 API는 CKEditor 4와 완전히 다름 — 구 `plugin.js`와 `dialogs/mendixlink.js`는 설계 참고용일 뿐이식
    가능한 코드가 아님.
-   CKEditor 5 ≥ v44는 `licenseKey`가 필수 — `'GPL'` 사용 (위젯과 CKEditor 5 모두 GPL 호환; 이 저장소의 Apache-2.0은배포
    전 라이선스 검토 필요 — 아래 참고).
-   **라이선스**: 현재 저장소는 Apache-2.0. CKEditor 5 오픈소스는 GPL-2.0+. CKEditor 5를 배포용 위젯에 번들하면 위젯이
    GPL이어야 하거나 상용 CKEditor 라이선스가 필요함. Marketplace 배포 전에 관리자(maintainer)에게 확인할 것.
-   앞으로 저장 HTML에 인라인 `onclick` 없음 (CSP + React). 레거시 콘텐츠는 읽기 호환되지만, 다시 저장되는 콘텐츠는
    `data-mf`로 마이그레이션됨.
