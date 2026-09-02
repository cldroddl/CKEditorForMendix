# CKEditor for Mendix — pluggable widgets (React + CKEditor 4)

**Branch `ckeditor4-react`** — the CKEditor **4.22.0** variant of the rewrite (`react-ver` is the CKEditor 5 variant).
Same shared package, viewer widget, workspace, and build tooling; only the editor engine differs.

Why: CKEditor 4.22.0 is tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1, so it can be used in a proprietary Mendix app with no
licence key — unlike CKEditor 5 (GPL + mandatory key). Trade-off: CKEditor 4 open source is EOL since June 2023 (no
security patches). See [`MIGRATION.md`](./MIGRATION.md) for the full rationale, property mapping, and wire format.

The editor is **not bundled** — `ckeditor.js` (4.22.0 "standard-all") is loaded at runtime from
`https://cdn.ckeditor.com/4.22.0/standard-all/ckeditor.js` by default, or from the URL set in the widget's **Editor
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

### Dev server / test project

`packages/*/package.json` → `config.projectPath` points at `../../tests/testProject`, which is not committed. To use
`npm run dev:*`, create a Mendix test app there (or change the path) — it is only needed for the live-reload dev server,
not for `build`.

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

에디터는 **번들하지 않습니다** — `ckeditor.js`(4.22.0 "standard-all")를 런타임에 로드합니다.
기본값은 `https://cdn.ckeditor.com/4.22.0/standard-all/ckeditor.js`이고, 위젯의 **"Editor script URL"** 속성으로 변경할 수 있습니다.
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

### 개발 서버 / 테스트 프로젝트

`packages/*/package.json`의 `config.projectPath`가 커밋되지 않은 `../../tests/testProject`를 가리킵니다.
`npm run dev:*`를 쓰려면 그 위치에 Mendix 테스트 앱을 만들거나 경로를 바꾸세요.
라이브 리로드 개발 서버에만 필요하고 `build`에는 불필요합니다.

## 현재 상태

Phase 1(스캐폴드 + 빌드 성공)과 Phase 2(microflow 링크)의 핵심이 완료되었습니다.
미이식: 코드 스니펫 / 글자 수 세기("full" CKEditor 빌드 필요), 이미지 처리, 자체 호스팅 에셋 번들링. `MIGRATION.md` 참고.

## 라이선스 노트

CKEditor **4.22.0**은 GPL-2.0 / LGPL-2.1 / MPL-1.1 3중 라이선스입니다 (`node_modules/ckeditor4/package.json`에서 확인).
LGPL/MPL 하에서 라이선스 키 없이 비공개 Mendix 앱에 포함 가능하므로 `rich-text`는 `Apache-2.0`를 유지합니다.
단 4.22.0은 EOL이라 보안 패치가 없습니다.
`4.23.0+`("CKEditor 4 LTS")는 유료/상용이므로, 이 브랜치에서 4.22.0을 넘겨 업그레이드하지 마세요.
