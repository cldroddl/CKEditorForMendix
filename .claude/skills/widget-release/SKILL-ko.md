# widget-release (한글)

(원본: [`SKILL.md`](./SKILL.md) — 영어. Claude Code가 실제로 읽는 것은 `SKILL.md`이며, 이 파일은 번역 참고용입니다.)

- **name:** widget-release
- **description:** CKEditorForMendix 위젯의 새 릴리스를 만든다 — 버전을 올리고, `.mpk`를 다시 빌드하고, 버전이 박힌 파일들을 갱신한다. 사용자만 트리거 가능(`disable-model-invocation: true`); 새 버전을 인자로 받는다 (예: `/widget-release 2.5.3`).

---

위젯의 새 버전을 릴리스합니다. 대상 버전은 `$ARGUMENTS`입니다 (semver, 예: `2.5.3`). 인자가 없거나 `MAJOR.MINOR.PATCH` 형식이 아니면, 다른 작업을 하기 전에 먼저 물어봅니다.

단계:

1. **사전 조건**
   - 작업 트리가 깨끗함 (`git status --porcelain`). 아니면 중단하고 보고.
   - `master`가 아닌 릴리스 브랜치에 있어야 함 (CLAUDE.md에 따라 변경은 PR로). `master`에 있으면 먼저 `release/$ARGUMENTS`를 생성.
   - `node_modules/`가 존재. 없으면 `npm install` 실행 (`widgetbuilder-gulp-helper` GitHub tarball 때문에 네트워크 필요).

2. **버전 올리기**
   - `npm run version -- -n $ARGUMENTS` 실행.
   - `src/package.xml`과 `package.json`이 갱신되었는지 확인.
   - `src/CKEditorForMendix/CKEditorForMendix.xml`과 `CKEditorViewerForMendix.xml`에 하드코딩된 버전 문자열이 있는지 확인하고, 있으면 갱신.
   - `README.md`에 버전이 언급되어 있으면 갱신.

3. **빌드**
   - `npm run build` 실행.
   - `dist/CKEditorForMendix.mpk`와 `test/widgets/CKEditorForMendix.mpk`가 다시 생성되었는지 확인 (타임스탬프 확인).

4. **의도적으로 스테이징**
   - 버전 파일들과 다시 빌드된 `.mpk` 산출물을 스테이징 (릴리스는 `.mpk` 파일을 커밋하는 유일한 경우 — CLAUDE.md 참고).
   - 사용자에게 `git diff --cached --stat`과 `.mpk`가 아닌 파일들의 전체 diff를 보여줌.

5. **인계**
   - 사용자가 말하기 전까지 커밋하거나 푸시하지 않음.
   - 배포는 `dist/CKEditorForMendix.mpk`를 Mendix Marketplace에 수동 업로드하는 것임을 사용자에게 상기시킴.
