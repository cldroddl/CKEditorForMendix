# CKEditor for Mendix — Dojo → Pluggable Widget rewrite

Branch: `react-ver`. This directory (`pluggable/`) holds the new React + TypeScript pluggable widget, built with
`@mendix/pluggable-widgets-tools`. The old Dojo widget under `../src/` is left in place for reference until parity is
reached.

## Target stack

| Tool                              | Version                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| React                             | ≥ 19 (peer, provided by the Mendix client — Mendix 11)                  |
| `@mendix/pluggable-widgets-tools` | ≥ 9, **11.x recommended**                                               |
| TypeScript                        | as bundled with pluggable-widgets-tools 11                              |
| Editor                            | CKEditor 5 (`ckeditor5` + `@ckeditor/ckeditor5-react`), GPL license key |

## Widgets

Two pluggable widgets ship from one package (`CKEditorForMendix` client module):

1. **RichText (editor)** — `id: ckeditorformendix.RichText`

    - `content: EditableValue<string>` — the HTML attribute, two-way bound
    - `editability` handled via `content.readOnly` + `content.setValue()`
    - Toolbar config, enter mode, image handling, code highlighting, word count, oembed, and the **microflow-link**
      plugin
    - `onChange` / `onKeyPress` actions (`ActionValue`)

2. **RichTextViewer** — `id: ckeditorformendix.RichTextViewer`
    - `content: EditableValue<string>` (read-only render)
    - Renders stored HTML, rehydrates `a.mx-microflow-link` placeholders, wires click → microflow, rewrites image URLs,
      code highlighting, optional line clamp

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
-   Editor: a CKEditor 5 plugin `MendixLink` — schema node (inline element `mendixLink`), upcast/downcast converters, a
    balloon/dialog UI to pick a `functionName` from the configured list + set label/title/css.
-   Viewer: pure DOM pass over `dangerouslySetInnerHTML` output — find `a.mx-microflow-link`, read `data-mf` (or parse
    legacy `onclick`), attach a React-managed click handler that calls the matching `ActionValue.execute()`.

## Property mapping (old XML → new pluggable XML)

| Old key                                                                                                             | New                                                                 | Notes                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `messageString` (attribute String)                                                                                  | `content` (`attribute`, `EditableValue<string>`)                    |                                                            |
| `onKeyPressMicroflow` / `onChangeMicroflow` (microflow)                                                             | `onKeyPress` / `onChange` (`action`)                                |                                                            |
| `enterMode` / `shiftEnterMode` (enum P/BR/DIV)                                                                      | keep as enum; map to CKEditor 5 config                              | CKEditor 5 has no direct `shiftEnterMode`; document limits |
| `autoParagraph`, `enableSpellCheck`                                                                                 | keep as boolean                                                     |                                                            |
| `toolbar*` booleans + `useCustomToolbar` + `customToolbars` list                                                    | `preset` enum (basic/standard/full) + optional `customToolbar` list | simplify; CKEditor 5 toolbar item names differ             |
| `bodyCssClass`, `width`, `height`, `showLabel`, `fieldCaption`                                                      | keep                                                                | label via `fieldCaption` (`textTemplate`)                  |
| `maximizeOffset`, `showStatusBar`, `showToolbarCollapsed`                                                           | drop or map                                                         | CKEditor 5 UX differs                                      |
| `enableCodeHighlighting`                                                                                            | `codeBlock` boolean                                                 | CKEditor 5 `CodeBlock` plugin                              |
| `microflowLinks` list (`functionNames`, `mfName`)                                                                   | `microflowLinks` list (`linkName` string, `linkAction` action)      |                                                            |
| `imagePasteMode` (base64/upload), `imageentity`, `imageUploadMicroflow`, `imageconstraint`, `useImageStyleProperty` | `imageUpload` enum + `imageDatasource`/`imageUploadAction`          | defer to phase 2                                           |
| `countPlugin`, `countPluginMaxCount`                                                                                | `showCount` boolean + `maxCount` int                                | CKEditor 5 `WordCount`                                     |
| viewer `cutOffRules`                                                                                                | `maxLines` int                                                      | CSS line-clamp instead of dotdotdot                        |

## Phases

1. ✅ **Scaffold + build green** — npm-workspaces monorepo, both widget `.mpk`s build, shared unit tests + lint pass.
   Editor renders CKEditor 5 bound to `content` with read-only support and `onChange`/`onKeyPress` actions.
2. 🟡 **Microflow links** — `MendixLink` CKEditor plugin (editing converters + toolbar dropdown + command) and the
   viewer's click→action wiring are in; legacy `onclick` upcast + `migrateStoredValue` covered by tests. Still to do: a
   proper balloon UI for label/CSS/title editing (currently name-only), and round-trip tests against real stored data.
3. **Toolbar presets + enter mode + word count + code blocks** — presets wired; word-count UI element and enter-mode
   parity need finishing.
4. **Image handling** (base64 first, then upload via datasource/action) — not started.
5. **oembed / media embed, line clamp, polish, editor preview, docs, app-developer migration guide** — not started.

### Build/tooling notes (resolved during scaffold)

-   pwt resolved to **11.12.0** (Node ≥ 20; 11.13 needs Node 22 and this machine is on Node 24).
-   pwt's tsconfig base uses `jsx: "react-jsx"` + `noUnusedLocals` — do **not** `import { createElement }` in `.tsx`.
-   React 19 types: `useRef<T>()` needs an explicit initial arg (`useRef<T | undefined>(undefined)`).
-   `shared` is consumed by the widget bundlers as **compiled JS** (`dist/`), not raw TS — rollup's typescript plugin
    only compiles the widget's own `src/`.
-   `.eslintrc.js` must use `require.resolve(...)` for the pwt base config (npm-workspaces resolution).

## Known constraints / decisions

-   CKEditor 5 plugin API is completely different from CKEditor 4 — the old `plugin.js` and `dialogs/mendixlink.js` are
    design references only, not portable code.
-   CKEditor 5 ≥ v44 requires a `licenseKey` — use `'GPL'` (the widget and CKEditor 5 are both GPL-compatible;
    Apache-2.0 on this repo needs a licensing review before distribution — see below).
-   **Licensing**: current repo is Apache-2.0. CKEditor 5 open-source is GPL-2.0+. Bundling CKEditor 5 into a
    distributed widget means the widget must be GPL, or a commercial CKEditor license is needed. Flag for the maintainer
    before Marketplace release.
-   No inline `onclick` in stored HTML going forward (CSP + React). Legacy content is read-compatible but re-saved
    content is migrated to `data-mf`.

---

# 한국어 번역 (Korean translation)

# CKEditor for Mendix — Dojo → Pluggable Widget 재작성

브랜치: `react-ver`. 이 디렉터리(`pluggable/`)는 `@mendix/pluggable-widgets-tools`로 빌드하는 새 React + TypeScript
pluggable 위젯을 담고 있습니다. 구 Dojo 위젯(`../src/`)은 기능 동등성(parity)에 도달할 때까지 참고용으로 남겨 둡니다.

## 목표 스택

| 도구                              | 버전                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| React                             | ≥ 19 (peer, Mendix 클라이언트가 제공 — Mendix 11)                       |
| `@mendix/pluggable-widgets-tools` | ≥ 9, **11.x 권장**                                                      |
| TypeScript                        | pluggable-widgets-tools 11에 번들된 버전                                |
| 에디터                            | CKEditor 5 (`ckeditor5` + `@ckeditor/ckeditor5-react`), GPL 라이선스 키 |

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
   현재는 이름만), 실제 저장 데이터 대상 왕복(round-trip) 테스트.
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
