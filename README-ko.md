# CKEditor for Mendix (한글)

(원본: [`README.md`](./README.md) — 영어)

이 [위젯](https://appstore.home.mendix.com/link/app/1715/Mendix/CKEditor-For-Mendix)은 CKEditor의 전체 버전(full version)을 제공하며, HTML 출력 안에 마이크로플로우 링크를 만들 수 있는 버튼이 추가되어 있습니다.

![test](https://github.com/mendix/CKEditorForMendix/raw/master/assets/mendix_button.png)

현재 [CKEditor 버전](http://ckeditor.com/whatsnew): 4.10.0

## 기여하기

이 저장소에 기여하는 방법은 [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)를 참고하세요.

## 대표적인 사용 시나리오

엔티티 속성(attribute)에 대해 전체 WYSIWYG 에디터를 추가할 때 이 위젯을 사용합니다. 이 버전은 클릭 시 마이크로플로우를 실행할 수 있는 링크를 HTML에 추가하는 기능을 갖고 있습니다.

## 설명

CKEditor 위젯에는 CKEditor 뷰어가 함께 제공됩니다. 이 뷰어는 링크를 마이크로플로우 링크로 다시 포맷하는 기능을 활성화합니다.

- 뷰어는 HTML 코드를 가져올 엔티티와 속성이 필요합니다.
- 링크를 버튼 형태 또는 그냥 텍스트로 스타일링할 수 있습니다.
- CKEditor 위젯 안에서 Mendix 링크 버튼으로 삽입할 수 있는 라벨(label)을 설정합니다.
- 이 라벨들은 뷰어에서 마이크로플로우를 실행하도록 설정할 수 있습니다.
- 마이크로플로우는 뷰어 위젯으로부터 엔티티를 전달받습니다.

### 에디터 전체 모습 예시

![test](https://github.com/mendix/CKEditorForMendix/raw/master/assets/ckeditor.png)

### Mendix에서의 최종 결과 예시

![test](https://github.com/mendix/CKEditorForMendix/raw/master/assets/example_result.png)

### 버튼을 클릭하는 모습 예시

![test](https://github.com/mendix/CKEditorForMendix/raw/master/assets/microflow_executed.png)

## 이미지

CKEditor는 이미지를 처리하는 두 가지 모드를 제공합니다.

- base64 문자열로 붙여넣기 ([인라인 이미지](https://en.wikipedia.org/wiki/Data_URI_scheme))
- Mendix로 업로드

이 모드는 Modeler의 위젯 설정에서 'Images' 탭으로 지정할 수 있습니다.

![images](https://github.com/mendix/CKEditorForMendix/raw/master/assets/images.png)

### 'Upload' 모드

- 엔티티가 System.Image를 상속받는지 확인하세요. 참조(reference)를 사용할 수도 있으며, 그 경우 컨텍스트가 업로드된 이미지에 대한 참조를 설정합니다.
- CKEditor에서 ![imagebrowser](https://github.com/mendix/CKEditorForMendix/raw/master/assets/imagebrowser.png) 를 클릭하면 열리는 Image browser에서 이미지에 XPath 제약(constraint)을 걸 수 있습니다. 이 Image browser는 Mode를 'Upload'로 설정하고 엔티티를 추가한 경우에만 활성화됩니다.
- 업로드는 탐색기(예: Windows 탐색기)에서 이미지를 에디터로 직접 드래그할 때만 동작합니다 (브라우저 동작 불일치 때문에 복사 + 붙여넣기는 동작하지 않습니다).

## 동작(Behaviour)

이 위젯에는 CKEditor의 기본 동작으로 설정할 수 있는 몇 가지 옵션이 있습니다.

![behaviour](https://github.com/mendix/CKEditorForMendix/raw/master/assets/behaviour.png)

- Entermode: Enter 키를 눌렀을 때의 에디터 기본 동작. 기본값은 Paragraph입니다.
- Shift-Entermode: Shift + Enter를 눌렀을 때의 에디터 기본 동작. 예를 들어 Word에서 목록 작업 중 목록 항목에 줄을 추가할 때 Shift+Enter를 씁니다. 기본값은 BR입니다.
- Autoparagraph: true로 두는 것을 권장합니다. CKEditor에서 끌 수 있지만 권장하지 않습니다.

## 임베딩(Embedding)

이 위젯은 동영상 임베딩을 지원합니다. ![imagebrowser](https://github.com/mendix/CKEditorForMendix/raw/master/assets/oembed.png) 를 클릭해 사용할 수 있습니다. 동영상 URL(예: YouTube 또는 Vimeo)을 입력하면 자동으로 임베드 코드를 생성합니다. 지원 범위에 대한 자세한 내용은 [플러그인 페이지](http://ckeditor.com/addon/oembed)를 참고하세요.
