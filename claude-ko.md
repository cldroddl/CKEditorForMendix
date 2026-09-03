# CLAUDE.md (한글)

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.
(원본: [`CLAUDE.md`](./CLAUDE.md) — 영어)

## 이 저장소는 무엇인가

`generator-mendix`로 생성된(~2016년경) Mendix **Dojo/Dijit** 위젯 패키지로, 위젯 두 개를 담고 있습니다.

- `CKEditorForMendix` — WYSIWYG 에디터
- `CKEditorViewerForMendix` — 링크를 마이크로플로우 트리거로 재작성하는 읽기 전용 뷰어

직접 작성한 소스는 딱 두 파일만 의미 있습니다: `src/CKEditorForMendix/widget/CKEditorForMendix.js` 와
`CKEditorViewerForMendix.js`. `src/CKEditorForMendix/widget/lib/` 아래는 전부 **vendoring**(CKEditor 4.10.0, jQuery,
플러그인)이라, 에디터 동작을 바꾸려면 그 vendoring 파일(예: `lib/config.js`, `lib/build-config.js`)이나 커스텀
`mendixlink` 플러그인을 수정해야 합니다.

## 명령

스크립트는 Gulp 3 을 실행합니다 (`node ./node_modules/gulp/bin/gulp <task>`):

| 명령 | 효과 |
| --- | --- |
| `npm run dev` | `src/**/*` 감시, `.mpk` 재빌드, 테스트 프로젝트 배포 폴더로 JS 복사 |
| `npm run build` | `src/**/*` 를 `CKEditorForMendix.mpk` 로 압축 → `test/widgets/` 와 `dist/` (먼저 `clean` 실행) |
| `npm run version -- -n <version>` | `src/package.xml` 과 `package.json` 의 버전 올리기 |
| `npm run icon [--file ./icon.png]` | 위젯 `.xml` 에 넣을 base64 `<icon>` 문자열 출력 |
| `npm run lint` | 직접 작성한 위젯 JS 두 파일에 jshint(`.jshintrc`) 실행 |

**테스트 러너도 CI도 없습니다.** `test/` 는 Mendix 7 테스트 *프로젝트*이지 유닛 테스트 스위트가 아님 — 수동 테스트만.

## 코드 스타일 (위젯 JS)

ES5 전용 — `"use strict"`, AMD `define([...])`, TypeScript/Babel/JSX 없음. 강제 규칙(`.jshintrc` 기준):

- 큰따옴표, 엄격 동등 비교(`===`), 4칸 들여쓰기
- jQuery 는 `.noConflict(true)` 로 로드해 위젯 로컬 `$` 로 사용

## 저장소 규칙

- `master` 에서 브랜치를 따고 PR 을 열 것 — `master` 에 직접 커밋 금지.
- **재빌드된 `.mpk` 파일을 스테이징하지 말 것.** `dist/CKEditorForMendix.mpk`, `test/widgets/*.mpk`, 루트
  `Test.mpk` 는 커밋된 산출물이지만 릴리스 시에만 의도적으로 갱신하며, 기능 커밋에는 포함하지 않음.
- `origin` 은 fork `github.com/cldroddl/CKEditorForMendix`.

## Pluggable 위젯 재작성 (`pluggable/`)

React 재작성(`react-ver`, `ckeditor4-react` 브랜치)은 **지원하지 않는 위젯 문법을 제외하고는 기존 CKEditorForMendix
위젯의 인터페이스(`src/CKEditorForMendix/CKEditorForMendix.xml`, `CKEditorViewerForMendix.xml`)와 동일하게 작성한다.**

- 동일한 property `key`, `<caption>`, `<category>` / property group, 순서, `defaultValue`.
- 동일한 `<enumerationValue>` key 와 라벨.
- 동일한 object-list property (`microflowLinks`, `customToolbars`) 와 그 하위 property.

새 스키마가 옛 구성을 정말로 표현할 수 없는 경우에만 벗어난다 (예: CKEditor 5 고유 개념, `type="microflow"` →
`type="action"`, deprecated 속성). 벗어나야 할 때도 앱 개발자에게 보이는 caption/category 는 그대로 유지해 Mendix
스튜디오에서 위젯 모습이 같도록 한다.

## 주의점 (Gotchas)

- `npm install` 은 GitHub tarball 의존성(`widgetbuilder-gulp-helper`)을 받음 — 네트워크 접근 필요.
- `settings/ckeditorformendix.mws` 와 `package.json` 의 `paths.testProjectFolder` 에는 이전 작성자 머신의 낡은 값이
  들어 있음 — 무시할 것.
