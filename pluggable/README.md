# CKEditor for Mendix — pluggable widgets (React + CKEditor 5)

React/TypeScript rewrite of the legacy Dojo `CKEditorForMendix` widgets, built with `@mendix/pluggable-widgets-tools`.
See [`MIGRATION.md`](./MIGRATION.md) for the plan, property mapping, and the microflow-link wire format.

## Layout (npm workspaces)

| Package                     | What                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared`           | Framework-agnostic logic: microflow-link parsing/serialization, image-URL resolution, toolbar presets, the `RichTextView` renderer. Plain `tsc` build → `dist/`. |
| `packages/rich-text`        | The **editor** widget (`ckeditorformendix.richtext.RichText`). CKEditor 5 + the `MendixLink` plugin.                                                             |
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

Phase 1 (scaffold + green build) and the core of phase 2 (microflow links) are in place. Not yet ported: image
upload/base64 handling, media embed polish, line-clamp tuning, full toolbar-preset parity, editor character-count UI.
See `MIGRATION.md`.

## Licensing note

CKEditor 5 open source is GPL-2.0+. The `rich-text` package is marked `GPL-2.0-or-later` and starts CKEditor with
`licenseKey: "GPL"`. The original repo is Apache-2.0 — resolve this (commercial CKEditor license, or accept GPL for the
editor widget) before any Marketplace release.

---

# 한국어 설명

레거시 Dojo `CKEditorForMendix` 위젯의 React/TypeScript 재작성으로, `@mendix/pluggable-widgets-tools`로 빌드합니다.
계획·속성 매핑·microflow-link wire 형식은 [`MIGRATION.md`](./MIGRATION.md) 참고.

이 브랜치(`react-ver`)는 **CKEditor 5** 변형입니다. CKEditor 4.22.0 변형은 `ckeditor4-react` 브랜치에 있습니다.

## 구성 (npm workspaces)

| 패키지                      | 내용                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/shared`           | 프레임워크 비의존 로직: microflow-link 파싱/직렬화, 이미지 URL 해석, 툴바 프리셋, `RichTextView` 렌더러. `tsc` 빌드 → `dist/`. |
| `packages/rich-text`        | **에디터** 위젯 (`ckeditorformendix.richtext.RichText`). CKEditor 5 + `MendixLink` 플러그인.                                   |
| `packages/rich-text-viewer` | **뷰어** 위젯 (`ckeditorformendix.richtextviewer.RichTextViewer`). 저장된 HTML 렌더, 클릭 시 microflow 링크 실행.              |

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
미이식: 이미지 업로드/base64 처리, media embed 다듬기, line-clamp 튜닝, 툴바 프리셋 완전 대응, 에디터 글자 수 UI. `MIGRATION.md` 참고.

## 라이선스 노트

CKEditor 5 오픈소스는 GPL-2.0+입니다. `rich-text` 패키지는 `GPL-2.0-or-later`로 표시하고 `licenseKey: "GPL"`로 CKEditor를 구동합니다.
원본 저장소는 Apache-2.0이므로, Marketplace 배포 전에 이 충돌을 해결해야 합니다 (상용 CKEditor 라이선스 구매, 또는 에디터 위젯의 GPL 수용).
사내 전용 사용은 배포에 해당하지 않아 GPL 카피레프트가 트리거되지 않습니다 — 자세한 내용은 별도 논의 참고.
