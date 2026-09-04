# 프로젝트 구조 설명 (한글)

이 문서는 이 저장소를 처음 보는 사람을 위해 프로그램이 어떻게 구성돼 있는지 설명합니다.
Mendix 위젯 개발을 몰라도 읽을 수 있도록 배경부터 정리합니다.

> 이 문서는 `ckeditor4-react` 브랜치 기준입니다. 브랜치별 차이는 아래 "브랜치" 절 참고.

---

## 1. 한눈에

이 저장소는 **Mendix 앱에 넣는 리치 텍스트(HTML) 편집기 위젯**입니다. 위젯은 두 개가 한 쌍입니다.

| 위젯                              | 하는 일                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **에디터** (Rich Text / CKEditor) | 사용자가 굵게·목록·표·이미지 등을 넣어 글을 쓰고, 결과를 HTML 문자열로 Mendix 속성(attribute)에 저장                |
| **뷰어** (Rich Text Viewer)       | 저장된 HTML을 읽기 전용으로 화면에 렌더. 본문 안의 특수 링크를 클릭하면 마이크로플로우(서버/클라이언트 로직)를 실행 |

원래 이 위젯은 2016년경 **Dojo/Dijit**(Mendix의 옛 프론트엔드 프레임워크)로 만들어졌고, CKEditor 4 엔진을 통째로 저장소에 넣어(vendoring) 썼습니다. 지금은 이걸 **React 기반 "pluggable 위젯"**으로 다시 쓰는 중이며, 그 새 코드가 `pluggable/` 폴더에 있습니다.

---

## 2. 배경 지식 (Mendix 위젯이란)

-   **Mendix**: 로우코드 앱 개발 플랫폼. 앱 개발자는 "Studio Pro"라는 툴에서 화면·데이터모델·로직을 시각적으로 만듭니다.
-   **위젯**: 화면에 놓는 UI 부품. Mendix 기본 부품(입력창, 버튼 등) 외에, 직접 만들어 배포하는 게 **커스텀 위젯**이고 `.mpk` 파일 하나로 패키징됩니다.
-   **pluggable 위젯**: Mendix가 2020년쯤 도입한 현대적 위젯 방식. **React 컴포넌트**로 작성하고, 위젯의 설정 항목은 **XML 파일**로 선언합니다. 빌드하면 `.mpk`가 나옵니다.
-   **속성(attribute) / 마이크로플로우(microflow) / 나노플로우(nanoflow)**:
    -   속성 = 엔티티(DB 테이블)의 컬럼. 이 위젯은 `String` 속성 하나에 HTML을 통째로 저장합니다.
    -   마이크로플로우 = 서버에서 도는 로직(비주얼 프로그래밍). 나노플로우 = 브라우저에서 도는 로직.
    -   이 위젯의 "마이크로플로우 링크" 기능 = 본문에 `<a>` 링크를 심어두고, 뷰어에서 그 링크 클릭 시 지정한 마이크로플로우/나노플로우를 실행.
-   **pwt** = `@mendix/pluggable-widgets-tools`. pluggable 위젯 공식 빌드 도구(내부적으로 Rollup, TypeScript, Jest를 씀). 이 저장소는 11.12 버전을 씁니다.

---

## 3. 저장소 최상위 레이아웃

```
CKEditorForMendix/
├── src/                  레거시(Dojo) 위젯 소스 — 이 저장소의 "원본"
│   └── CKEditorForMendix/
│       ├── CKEditorForMendix.xml        에디터 위젯 정의(속성 40여 개)
│       ├── CKEditorViewerForMendix.xml  뷰어 위젯 정의
│       └── widget/
│           ├── CKEditorForMendix.js         손으로 쓴 유일한 코드 (ES5, ~26KB)
│           ├── CKEditorViewerForMendix.js   손으로 쓴 유일한 코드 (ES5, ~6KB)
│           └── lib/                          CKEditor 4.10.0 + jQuery + 플러그인 (전부 vendoring, 손대지 않음)
├── Gulpfile.js           레거시 빌드 (Gulp 3 — src/를 zip으로 묶어 .mpk 생성)
├── dist/ , test/ , Test.mpk   레거시 빌드 산출물·테스트용 Mendix 7 프로젝트
├── xsd/ , settings/ , assets/
│
├── pluggable/            ★ React 재작성 (지금 작업 중인 곳)
│   └── structure.md          (이 문서)
│
├── CLAUDE.md / claude-ko.md      Claude Code용 저장소 가이드
└── README.md / README-ko.md
```

레거시 부분(`src/`, `Gulpfile.js`, `dist/`, `test/`)은 동결 상태입니다. 관심 대상은 `pluggable/`입니다.

### 브랜치

| 브랜치            | 내용                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `master`          | 레거시 Dojo 위젯 (CKEditor 4.10.0)                                                             |
| `react-ver`       | React 재작성 — **CKEditor 5** 기반 (활발히 개발 중이나 GPL + 라이선스 키 필요)                 |
| `ckeditor4-react` | React 재작성 — **CKEditor 4.22.0** 기반 (오픈소스 3중 라이선스, 키 불필요). **이 문서의 기준** |

두 재작성 브랜치는 같은 목표(레거시 위젯의 인터페이스를 최대한 그대로 재현)를 CKEditor 5 / CKEditor 4로 각각 시도합니다.

---

## 4. `pluggable/` 상세 구조

npm **workspaces 모노레포**입니다. 패키지 3개:

```
pluggable/
├── package.json              workspaces: [packages/shared, packages/rich-text, packages/rich-text-viewer]
├── tsconfig.base.json        공통 TS 설정 (target ES2020, jsx: react-jsx, strict)
├── .prettierrc.json          코드 포맷 규칙
├── MIGRATION.md              레거시 → 재작성 매핑, 남은 작업(Phases), 결정 필요 항목
├── README.md                 빌드·테스트·테스트 프로젝트 셋업 방법 (EN + KO)
│
├── packages/
│   ├── shared/               에디터·뷰어가 공유하는 순수 로직 (React 위젯 아님)
│   ├── rich-text/            에디터 위젯   → ckeditorformendix.RichText.mpk
│   └── rich-text-viewer/     뷰어 위젯     → ckeditorformendix.RichTextViewer.mpk
│
└── tests/                    로컬 Mendix 테스트 앱 (아래 8절)
```

### 4.1 `packages/shared` — 공유 로직

React 위젯이 아니라 일반 TS 라이브러리입니다. `tsc`로 `dist/`에 컴파일되고, 다른 두 패키지가 컴파일된 JS를 가져다 씁니다.

| 파일                                   | 역할                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/microflowLinks.ts`                | 마이크로플로우 링크의 HTML 표현을 만들고/읽고, 레거시 형식(`onclick="..."`)을 새 형식(`data-mf="..."`)으로 변환(`migrateStoredValue`)  |
| `src/RichTextView.tsx`                 | 저장된 HTML을 렌더하는 React 컴포넌트. `dangerouslySetInnerHTML` 사용, 코드 하이라이팅, 링크 클릭 → 액션 실행 배선. **뷰어가 이걸 씀** |
| `src/imageUrls.ts`                     | 이미지 GUID → 실제 파일 URL 해석                                                                                                       |
| `src/toolbarPresets.ts`                | CKEditor **5**용 헬퍼 — 이 브랜치(CK4)에선 안 씀. `react-ver`와 코드를 공유하느라 남아 있음                                            |
| `src/index.ts`                         | 위 모듈들을 재노출                                                                                                                     |
| `src/__tests__/microflowLinks.spec.ts` | Jest 유닛 테스트 (7개, 통과)                                                                                                           |

### 4.2 `packages/rich-text` — 에디터 위젯

```
src/
├── RichText.xml               위젯 설정 정의 (속성 40여 개, 레거시 인터페이스 그대로)
├── RichText.tsx               ★ 위젯 진입점. Mendix 속성 → <Editor> props 매핑
├── components/
│   └── Editor.tsx             ★ React ↔ CKEditor 4 래퍼 (CKEDITOR.replace 호출, 정리, 이벤트)
├── ckeditor4/                 CKEditor 4 관련 코드 (전부 TypeScript)
│   ├── loadCKEditor.ts        ckeditor.js를 CDN/URL에서 1회 로드, 전역 window.CKEDITOR 관리
│   ├── mendixLinkPlugin.ts    "Insert Mendix microflow link" 커스텀 플러그인 (버튼+메뉴+다이얼로그)
│   ├── pasteBase64Plugin.ts   이미지 base64 붙여넣기 플러그인
│   └── buildToolbar.ts        14개 toolbar* 불리언 + customToolbars → CKEditor config 변환
├── RichText.editorConfig.ts   Studio Pro 설정 화면 로직 (속성 숨김/표시, 유효성 검사)
├── RichText.editorPreview.tsx Studio Pro 디자인 모드 미리보기
├── ui/RichText.css
└── package.xml                .mpk 매니페스트 (clientModule 이름 = ckeditorformendix.richtext.RichText)
```

-   **CKEditor 4 엔진은 `.mpk`에 없습니다.** 런타임에 `https://cdn.ckeditor.com/4.22.0/full-all/ckeditor.js`(또는
    `editorScriptUrl` 속성에 지정한 자체 호스팅 URL)에서 `<script>`로 로드. (번들하는 방식은 시도했다가 Windows
    재배포 파일 잠금 문제로 되돌림 — `MIGRATION.md` phase 6.)
-   `editorScriptUrl`이 비어 있으면 CDN 사용. 오프라인이면 "full-all" 빌드를 앱 `resources/`에 두고 그 URL 지정.
-   한 페이지에 에디터가 여러 개 있어도 `ckeditor.js`는 한 번만 로드되고, 인스턴스별로 `CKEDITOR.replace(element, config)`에 설정을 따로 넘깁니다.

### 4.3 `packages/rich-text-viewer` — 뷰어 위젯

```
src/
├── RichTextViewer.xml           위젯 설정 (messageString, microflowLinks[이름+마이크로플로우], cutOffRules)
├── RichTextViewer.tsx           ★ 진입점. 저장 HTML을 migrateStoredValue로 변환 후 <RichTextView>로 렌더
├── RichTextViewer.editorConfig.ts
├── RichTextViewer.editorPreview.tsx
├── ui/RichTextViewer.css
└── package.xml
```

뷰어는 **CKEditor를 전혀 쓰지 않습니다.** `shared`의 `RichTextView`로 HTML을 그리고, `microflowLinks` 설정에 따라 본문 링크 클릭을 마이크로플로우 실행으로 연결할 뿐입니다.

---

## 5. 데이터 흐름

```
[Mendix 엔티티]  Test.Content : String(unlimited)   ← HTML 문자열 한 덩어리
      │
      │  Data view가 위젯에 속성을 바인딩
      ▼
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  에디터 위젯 (RichText)      │        │  뷰어 위젯 (RichTextViewer)   │
│                             │        │                              │
│  RichText.tsx               │        │  RichTextViewer.tsx          │
│    messageString.value ──┐  │        │    messageString.value       │
│                          ▼  │        │        │                     │
│  Editor.tsx                  │       │        ▼ migrateStoredValue  │
│    CKEDITOR.replace(...)     │       │    RichTextView (shared)     │
│    사용자 편집               │       │      HTML 렌더               │
│        │ onChange/onBlur     │       │      링크 클릭 →             │
│        ▼                     │       │        mfName.execute()     │
│  messageString.setValue(html)│      │           │                  │
└─────────────────────────────┘        └───────────┼──────────────────┘
      │                                            ▼
      ▼                                   [마이크로플로우 / 나노플로우 실행]
[다시 DB에 저장]
```

-   에디터에서 "Insert Mendix link"로 링크를 넣으면 본문에 `<a class="mx-microflow-link" data-mf="링크이름" href="#">`가 삽입됩니다.
-   뷰어의 `microflowLinks` 설정에서 그 "링크이름"을 실제 마이크로플로우에 연결해두면, 뷰어에서 클릭 시 실행됩니다.
-   에디터 쪽 `microflowLinks`는 **이름만** 선언(어떤 링크를 삽입 가능하게 할지). 실제 연결은 뷰어 책임 — 레거시 설계 그대로입니다.

---

## 6. 빌드와 산출물

```
소스 (TypeScript/TSX + XML)
      │  pwt (Rollup + TypeScript)  ← npm run build
      ▼
packages/<widget>/dist/<version>/
      ├── ckeditorformendix.RichText.mpk         ← 이게 Mendix에 넣는 최종 파일
      └── (mpk 내부)
          ├── RichText.xml               속성 정의
          ├── RichText.js                런타임 번들 (AMD 형식, 구 클라이언트용)
          ├── RichText.mjs               런타임 번들 (ES 모듈, 신 React 클라이언트용)
          ├── RichText.editorConfig.js   Studio Pro 설정 로직
          ├── RichText.editorPreview.js  Studio Pro 미리보기
          └── package.xml
```

-   **위젯 하나당 `.mpk` 하나.** 레거시는 한 `.mpk`에 에디터+뷰어를 같이 담았지만, pwt는 npm 패키지 = `.mpk` 1:1이라 파일이 두 개입니다. 앱에는 둘 다 임포트합니다.
-   `.mpk`는 작습니다 (에디터 ~64KB, 뷰어 ~26KB). CKEditor 엔진은 포함 안 됨 — 런타임에 CDN/URL에서 로드.
-   `RichText.js`(AMD) / `RichText.mjs`(ESM) **이중 출력**은 pwt가 자동으로 만듭니다. 소스가 아니라 빌드 결과물입니다.
-   `typings/RichTextProps.d.ts`는 `RichText.xml`에서 **자동 생성**되는 타입. `RichText.tsx`가 이걸 `props` 타입으로 씁니다. XML을 고치면 타입도 바뀝니다.

---

## 7. 개발 워크플로우

```bash
cd pluggable
npm install                # 3개 패키지 의존성 (네트워크 필요)

npm run build              # 3개 패키지 전부 빌드 → 각 dist/<version>/*.mpk
npm test                   # shared 유닛 테스트
npm run lint               # ESLint

npm run dev:editor         # 에디터 위젯 watch + 테스트 프로젝트로 자동 복사
npm run dev:viewer         # 뷰어 위젯 watch
```

-   `packages/*/package.json`의 `config.projectPath`가 `../../tests/testProject`를 가리킵니다. 거기에 Mendix 프로젝트가 있으면 `dev:*`가 빌드본을 그 프로젝트로 복사하고 감시합니다.

---

## 8. `pluggable/tests/` — 로컬 테스트 앱

pwt에는 테스트 프로젝트 자동 생성이 없어 직접 만들어야 합니다.

```
tests/
├── testProject/            Mendix 11.12 Blank Web App (커밋됨)
│   ├── mprcontents/ , testProject.mpr   Mendix 모델
│   ├── widgets/            스톡 위젯 + 우리 두 .mpk
│   ├── mdlsource/setup.mdl  ★ mxcli로 이 앱을 재생성하는 스크립트
│   │                          (엔티티 Test, DS_Test 마이크로플로우,
│   │                           NAV_LinkClicked 나노플로우, TestPage_Web 페이지)
│   └── .gitignore          표준 Mendix 제외 + 로컬 도구 제외
└── myTestProject/          손으로 만든 확인용 (gitignore, 커밋 안 함)
```

-   **mxcli** = Mendix가 낸 CLI. MDL(SQL 비슷한 텍스트 언어)로 Mendix 모델을 읽고 수정합니다. `setup.mdl`을 `mxcli exec`하면 테스트 페이지가 재생성됩니다.
-   상세: `pluggable/README.md`의 "Testing in a Mendix app" 참고.

---

## 9. 레거시 부분 (참고만)

`src/CKEditorForMendix/widget/`의 손으로 쓴 파일은 딱 두 개:
`CKEditorForMendix.js`(에디터), `CKEditorViewerForMendix.js`(뷰어). ES5 + AMD `define([...])` + Dojo `declare` 패턴이고, `lib/` 아래 CKEditor 4.10.0 · jQuery · 플러그인은 전부 서드파티라 손대지 않습니다. 빌드는 `Gulpfile.js`(Gulp 3)가 `src/`를 zip으로 묶는 게 전부입니다.

재작성(`pluggable/`)의 목표는 이 위젯의 **설정 인터페이스(속성 키·캡션·그룹·기본값)를 그대로 유지**하면서 내부를 React + TypeScript로 바꾸는 것입니다. 세부 매핑과 의도적으로 뺀 기능(oembed 등)은 `pluggable/MIGRATION.md`에 정리돼 있습니다.
