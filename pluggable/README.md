# CKEditor for Mendix — pluggable widgets (React + CKEditor 4)

**Branch `ckeditor4-react`** — the CKEditor **4.22.0** variant of the rewrite (`react-ver` is the CKEditor 5 variant).
Same shared package, viewer widget, workspace, and build tooling; only the editor engine differs.

Why: CKEditor 4.22.0 is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1, so it can be used in a proprietary Mendix app with no
licence key — unlike CKEditor 5 (GPL + mandatory key). Trade-off: CKEditor 4 open source is EOL since June 2023 (no
security patches). See [`MIGRATION.md`](./MIGRATION.md) for the full rationale, property mapping, and wire format.

The editor is **not bundled** — `ckeditor.js` (4.22.0 "full-all") is loaded at runtime from
`https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js` by default, or from the URL set in the widget's **Editor
script URL** property (host `node_modules/ckeditor4/` inside your app for offline use). `.mpk` is ~52 KB.

## Layout (npm workspaces)

| Package                     | What                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared`           | Framework-agnostic logic: microflow-link parsing/serialization, image-URL resolution, toolbar presets, the `RichTextView` renderer. Plain `tsc` build → `dist/`. |
| `packages/rich-text`        | The **editor** widget (`ckeditorformendix.richtext.RichText`). CKEditor 4.22.0 (runtime `<script>`) + the `mendixlink` plugin (`src/ckeditor4/`).                |
| `packages/rich-text-viewer` | The **viewer** widget (`ckeditorformendix.richtextviewer.RichTextViewer`). Renders stored HTML, executes microflow links on click.                               |

## Commands

Run from `pluggable/`:

```bash
npm install
npm run build            # build shared, then both widget .mpk files
npm test                 # shared unit tests
npm run lint             # prettier + eslint across packages

npm run dev:editor       # pluggable-widgets-tools dev server for the editor widget
npm run dev:viewer       # …for the viewer widget
```

`shared` must be built before the widgets (its `dist/` is what the widget bundlers consume). `npm run build` /
`npm install` (via its `prepare` script) both do this.

Widget `.mpk` output lands in `packages/<widget>/dist/<version>/`.

### Testing in a Mendix app

`@mendix/pluggable-widgets-tools` (**pwt**) — the widget build toolchain used by every `npm run` script here — has no
test-project auto-provisioning; create the app yourself. `packages/*/package.json` → `config.projectPath` points at
`../../tests/testProject` (gitignored). If a Mendix project exists there, `npm run dev:*` copies the built widget into
it and live-reloads; `build` does not need it.

**1. Create the app** — Mendix Studio Pro **11.6+** (React client + React 19; older versions show the widgets as
"cannot be used"). New app → _Blank Web App_ → save at `pluggable/tests/testProject/` (or elsewhere + edit
`config.projectPath`).

**2. Domain model + page**

-   Persistable entity `Test` with attribute `Content` (String, unlimited).
-   Microflow `ACT_Open`: Create `Test` → Show page `Home_Web` with it as context. Set as the app's home / a button.
-   `Home_Web`: a Data view (context `Test`) containing the **Rich Text (CKEditor)** widget, `Content attribute` bound to
    `Test.Content`. Add the **Rich Text Viewer (CKEditor)** below it, bound to the same attribute, to see the round trip.
-   Both widgets are `needsEntityContext="true"` — they must sit inside a Data view / List view, never on a bare page.

**3. Microflow links** — nanoflows `NF_Alpha`, `NF_Beta` (each: Show message). On **Rich Text** → _Microflow links_ add
`{ Link Name: "Alpha" }`. On **Rich Text Viewer** → _Microflow links_ add `{ Link Name: "Alpha", Microflow Name: NF_Alpha }`.
To exercise the multi-instance fix, drop a second Rich Text in the same Data view with a different list (`"Beta"`) and
confirm each editor's "Insert a Mendix microflow link" dialog shows its own list.

**4. Get the widgets in** — either:

-   `cd pluggable && npm run dev:editor` (and/or `dev:viewer`) — with `config.projectPath` set, pwt copies the build to
    `tests/testProject/deployment/web/widgets/` + `tests/testProject/widgets/` and watches for changes, **or**
-   `npm run build`, then copy `packages/*/dist/<version>/*.mpk` into `<project>/widgets/` and in Studio Pro:
    right-click the app → **Update widgets**.

**5. Run** — F5 in Studio Pro (App Settings → Runtime → _React client_ enabled, the 11.x default).

#### Alternative: scaffolding with `mxcli`

`tests/testProject/mdlsource/setup.mdl` is an [`mxcli`](https://www.npmjs.com/package/@mendix/mxcli) script that
recreates the entity, `DS_Test` microflow, `NAV_LinkClicked` nanoflow, `TestPage_Web` page (two Data views: `editorA` +
`viewer1`, and `editorB`) and navigation. Run it against a fresh _Blank Web App_ with:

```
mxcli -p tests/testProject/testProject.mpr exec tests/testProject/mdlsource/setup.mdl
```

Caveats with `mxcli` v0.16.0 (all handled in Studio Pro afterwards; the header comment in `setup.mdl` has the full
checklist):

-   **Widget object-list properties can't be written from MDL.** `microflowlink` / `customtoolbar` blocks inside a
    `pluggablewidget` are rejected by the parser (`check` and `exec` both) — they only come out of `DESCRIBE`, one-way. So
    the _Microflow links_ list entries in step 3 must be added by hand in Studio Pro.
-   **`CE0463` "The definition of this widget has changed"** on every widget after `exec` — `mxcli` places pluggable
    widgets without Studio Pro's template BSON. Clear it once with **App → Update all widgets**.
-   `mxcli` may auto-seed one empty _Microflow links_ row, which trips the editor's "Link Name is required" check at
    runtime — delete it or give it a name.
-   `mxcli` MDL has no _Show message_ activity, so `NAV_LinkClicked` uses _Log message_; swap in _Show message_ /
    _Show page_ in Studio Pro if you want the click to be louder.

Do **not** reuse the legacy `../test/Test.mpr` — it is a Mendix 7 project, incompatible with these widgets.

## Status

Phase 1 (scaffold + green build) and the core of phase 2 (microflow links) are in place. Not yet ported: code snippet /
character count (need a "full" CKEditor build), image handling, self-hosted asset bundling. See `MIGRATION.md`.

## Licensing note

CKEditor **4.22.0** is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1 (confirmed in `node_modules/ckeditor4/package.json`).
Under LGPL/MPL it can ship inside a proprietary Mendix app with no licence key, so `rich-text` stays `Apache-2.0`. But
4.22.0 is EOL — no security patches. `4.23.0+` ("CKEditor 4 LTS") is paid/commercial; do not upgrade past 4.22.0 on this
branch.

---

# 한국어 설명

**브랜치 `ckeditor4-react`** — 재작성의 **CKEditor 4.22.0 변형**입니다 (`react-ver`가 CKEditor 5 변형).
shared 패키지·뷰어 위젯·워크스페이스·빌드 도구는 동일하고 **에디터 엔진만** 다릅니다.

이유: CKEditor 4.22.0은 GPL-2.0 / LGPL-2.1 / MPL-1.1 3중 라이선스라, 라이선스 키 없이 비공개(프로프라이어터리) Mendix 앱에서 사용 가능합니다 — CKEditor 5(GPL + 의무 키)와 다릅니다.
대가: CKEditor 4 오픈소스는 2023년 6월 EOL(보안 패치 없음).
전체 근거·속성 매핑·wire 형식은 [`MIGRATION.md`](./MIGRATION.md) 참고.

에디터는 **번들하지 않습니다** — `ckeditor.js`(4.22.0 "full-all")를 런타임에 로드합니다.
기본값은 `https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js`이고, 위젯의 **"Editor script URL"** 속성으로 변경할 수 있습니다.
오프라인 환경은 `node_modules/ckeditor4/`를 앱 안에 복사해 사용하세요. `.mpk`는 약 52KB입니다.

## 구성 (npm workspaces)

| 패키지                      | 내용                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared`           | 프레임워크 비의존 로직: microflow-link 파싱/직렬화, 이미지 URL 해석, 툴바 프리셋, `RichTextView` 렌더러. `tsc` 빌드 → `dist/`.          |
| `packages/rich-text`        | **에디터** 위젯 (`ckeditorformendix.richtext.RichText`). CKEditor 4.22.0(런타임 `<script>`) + `mendixlink` 플러그인 (`src/ckeditor4/`). |
| `packages/rich-text-viewer` | **뷰어** 위젯 (`ckeditorformendix.richtextviewer.RichTextViewer`). 저장된 HTML 렌더, 클릭 시 microflow 링크 실행.                       |

## 명령 (`pluggable/`에서 실행)

```bash
npm install
npm run build            # shared 빌드 후 두 위젯 .mpk 생성
npm test                 # shared 유닛 테스트
npm run lint             # prettier + eslint (전체 패키지)

npm run dev:editor       # 에디터 위젯 개발 서버 (pluggable-widgets-tools)
npm run dev:viewer       # 뷰어 위젯 개발 서버
```

`shared`는 위젯보다 먼저 빌드되어야 합니다 (위젯 번들러가 `dist/`를 소비).
`npm run build` / `npm install`(`prepare` 스크립트)이 이를 처리합니다.
위젯 `.mpk` 출력물은 `packages/<widget>/dist/<version>/`에 생성됩니다.

### Mendix 앱에서 테스트하기

`@mendix/pluggable-widgets-tools`(이하 **pwt**) — 여기의 모든 `npm run` 스크립트가 쓰는 위젯 빌드 툴체인 — 에는
테스트 프로젝트 자동 생성 기능이 없어서 직접 만들어야 합니다. `packages/*/package.json`의 `config.projectPath`가
`../../tests/testProject`(gitignore됨)를 가리킵니다. 거기에 Mendix 프로젝트가 있으면 `npm run dev:*`가 빌드된
위젯을 복사하고 라이브 리로드합니다. `build`에는 불필요합니다.

**1. 앱 생성** — Mendix Studio Pro **11.6 이상** (React 클라이언트 + React 19; 그 미만에서는 위젯이 "사용 불가"로
표시됨). New app → _Blank Web App_ → `pluggable/tests/testProject/`에 저장 (다른 곳이면 `config.projectPath` 수정).

**2. 도메인 모델 + 페이지**

-   지속형 엔티티 `Test` + `Content` (String, unlimited)
-   마이크로플로우 `ACT_Open`: `Test` 생성 → `Home_Web` 페이지를 컨텍스트와 함께 표시. 홈페이지 또는 버튼에 연결
-   `Home_Web`: Data view(컨텍스트 `Test`) 안에 **Rich Text (CKEditor)** 위젯, `Content attribute` = `Test.Content`.
    그 아래에 **Rich Text Viewer (CKEditor)**를 같은 attribute에 바인딩해 왕복 확인
-   두 위젯 모두 `needsEntityContext="true"` — 반드시 Data view / List view 안에 배치 (빈 페이지 직접 배치 불가)

**3. Microflow links** — 나노플로우 `NF_Alpha`, `NF_Beta` (각각 Show message). **Rich Text** → *Microflow links*에
`{ Link Name: "Alpha" }` 추가, **Rich Text Viewer** → *Microflow links*에 `{ Link Name: "Alpha", Microflow Name: NF_Alpha }`
추가. 다중 인스턴스 수정 확인: 같은 Data view에 Rich Text 하나 더 넣고 목록을 다르게(`"Beta"`) → 각 에디터의
"Insert a Mendix microflow link" 다이얼로그가 자기 목록을 보여주는지 확인

**4. 위젯 넣기** — 둘 중 하나:

-   `cd pluggable && npm run dev:editor` (그리고/또는 `dev:viewer`) — `config.projectPath` 설정 시 pwt가 빌드본을
    `tests/testProject/deployment/web/widgets/` + `tests/testProject/widgets/`로 복사하고 변경을 감시, **또는**
-   `npm run build` 후 `packages/*/dist/<version>/*.mpk`를 `<project>/widgets/`에 복사 → Studio Pro에서 앱 우클릭 →
    **Update widgets**

**5. 실행** — Studio Pro에서 F5 (App Settings → Runtime → _React client_ 활성, 11.x 기본값)

#### 대안: `mxcli`로 스캐폴딩

`tests/testProject/mdlsource/setup.mdl`은 엔티티, `DS_Test` 마이크로플로우, `NAV_LinkClicked` 나노플로우,
`TestPage_Web` 페이지(Data view 2개: `editorA` + `viewer1`, 그리고 `editorB`), 내비게이션을 재생성하는
[`mxcli`](https://www.npmjs.com/package/@mendix/mxcli) 스크립트입니다. 새 *Blank Web App*에 대해 실행:

```
mxcli -p tests/testProject/testProject.mpr exec tests/testProject/mdlsource/setup.mdl
```

`mxcli` v0.16.0 제약 (실행 후 Studio Pro에서 처리; 전체 체크리스트는 `setup.mdl` 헤더 주석에 있음):

-   **위젯 오브젝트 리스트 속성은 MDL로 못 씀.** `pluggablewidget` 안의 `microflowlink` / `customtoolbar` 블록은
    파서가 거부함(`check`·`exec` 둘 다) — `DESCRIBE`로만 한쪽 방향 출력됨. 따라서 3단계의 _Microflow links_ 목록
    항목은 Studio Pro에서 직접 추가해야 함.
-   `exec` 후 모든 위젯에 **`CE0463` "The definition of this widget has changed"** — `mxcli`가 Studio Pro 템플릿 BSON
    없이 배치하기 때문. **App → Update all widgets** 한 번으로 해소.
-   `mxcli`가 빈 _Microflow links_ 행 하나를 자동 시드할 수 있는데, 이게 런타임에서 에디터의 "Link Name is required"
    검사를 유발함 — 삭제하거나 이름을 넣을 것.
-   `mxcli` MDL에는 _Show message_ 액티비티가 없어 `NAV_LinkClicked`는 *Log message*를 씀; 클릭을 더 눈에 띄게
    하려면 Studio Pro에서 _Show message_ / *Show page*로 교체.

레거시 `../test/Test.mpr`는 **재사용 금지** — Mendix 7 프로젝트라 이 위젯과 호환되지 않습니다.

## 현재 상태

Phase 1(스캐폴드 + 빌드 성공)과 Phase 2(microflow 링크)의 핵심이 완료되었습니다.
미이식: 코드 스니펫 / 글자 수 세기("full" CKEditor 빌드 필요), 이미지 처리, 자체 호스팅 에셋 번들링. `MIGRATION.md` 참고.

## 라이선스 노트

CKEditor **4.22.0**은 GPL-2.0 / LGPL-2.1 / MPL-1.1 3중 라이선스입니다 (`node_modules/ckeditor4/package.json`에서 확인).
LGPL/MPL 하에서 라이선스 키 없이 비공개 Mendix 앱에 포함 가능하므로 `rich-text`는 `Apache-2.0`를 유지합니다.
단 4.22.0은 EOL이라 보안 패치가 없습니다.
`4.23.0+`("CKEditor 4 LTS")는 유료/상용이므로, 이 브랜치에서 4.22.0을 넘겨 업그레이드하지 마세요.
