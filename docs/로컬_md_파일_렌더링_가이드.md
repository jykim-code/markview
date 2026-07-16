# 로컬 .md 파일, 더블클릭만으로 바로 읽기

PDF처럼 .md 파일을 더블클릭하면 브라우저에서 바로 렌더링된 문서를 볼 수 있습니다.
Markview 확장 프로그램을 설치하고 아래 설정을 완료하면 됩니다.

---

## 준비물

- Chrome 또는 Edge 브라우저
- Markview 확장 프로그램 (`extension/dist` 폴더)

---

## Step 1. 확장 프로그램 설치

1. Chrome이면 주소창에 `chrome://extensions`, Edge이면 `edge://extensions` 입력
2. 오른쪽 상단 **개발자 모드** 토글 ON
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. `extension/dist` 폴더 선택

---

## Step 2. 파일 URL 액세스 허용

설치된 Markview 확장의 **세부정보**를 클릭한 후, **파일 URL에 대한 액세스 허용** 토글을 켭니다.

> 이 설정이 없으면 로컬 파일을 읽을 수 없어 안내 페이지가 표시됩니다.

---

## Step 3. .md 파일 기본 앱을 브라우저로 설정

### Windows

아무 `.md` 파일에서 우클릭 → **연결 프로그램** → **다른 앱 선택**

목록에서 Chrome 또는 Edge를 선택하고 **"항상 이 앱 사용"** 체크 후 확인.

목록에 안 보이면 **"이 PC에서 다른 앱 찾기"** 클릭 후 직접 경로 입력:

| 브라우저 | 경로 |
|---------|------|
| Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Edge | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |

### macOS

아무 `.md` 파일에서 우클릭(또는 두 손가락 클릭) → **정보 가져오기**

**다음으로 열기** 항목에서 Chrome 또는 Edge 선택 → **모두 변경** 클릭.

목록에 안 보이면 드롭다운에서 **기타...** 선택 후 응용 프로그램 폴더에서 직접 선택:

| 브라우저 | 경로 |
|---------|------|
| Chrome | `/Applications/Google Chrome.app` |
| Edge | `/Applications/Microsoft Edge.app` |

---

## 이제 사용해보세요

파일 탐색기(Windows) 또는 Finder(macOS)에서 `.md` 파일을 **더블클릭**하면 브라우저가 열리면서 markview에서 바로 렌더링된 문서가 표시됩니다.

목차 탐색, 편집, URL 공유까지 모두 사용할 수 있습니다.

> **참고:** 파일 내용은 markview 서버에 업로드되어 고유 URL(`/v/slug`)이 생성됩니다.
> 주소창의 URL을 복사하면 다른 사람과 바로 공유할 수 있습니다.
