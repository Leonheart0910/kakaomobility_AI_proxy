# kakaomobility_AI_proxy

Naver의 STT API를 위한 프록시 서버입니다.

## 요구 사항

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

## 설치

1.  이 저장소를 복제합니다 (아직 없는 경우):

    ```bash
    git clone <repository_url>
    cd kakaomobility_AI_proxy
    ```

2.  의존성을 설치합니다:
    ```bash
    npm install
    ```

## 구성

1.  프로젝트의 루트 디렉토리에 `.env` 파일을 생성합니다.

2.  `.env` 파일에 다음 환경 변수를 추가합니다:

    ```env
    # Naver Cloud Platform에서 발급받은 클라이언트 ID
    NAVER_CLIENT_ID=your_naver_client_id

    # Naver Cloud Platform에서 발급받은 클라이언트 시크릿
    NAVER_CLIENT_SECRET=your_naver_client_secret

    # (선택 사항) API에 접근할 수 있는 허용된 오리진 (기본값: *)
    # 예: ALLOWED_ORIGIN=http://localhost:8080
    ALLOWED_ORIGIN=*

    # (선택 사항) 서버를 실행할 포트 (기본값: 3000)
    PORT=3000
    ```

    `your_naver_client_id`와 `your_naver_client_secret`를 Naver Cloud Platform에서 발급받은 정보로 교체해야 합니다.

## 애플리케이션 실행

서버를 시작하려면 다음 명령을 실행합니다:

```bash
npm start
```

서버는 `http://localhost:3000` (또는 구성한 포트)에서 실행됩니다.

## API 엔드포인트

### `POST /api/stt`

음성을 텍스트로 변환합니다.

- **메서드**: `POST`
- **Content-Type**: `multipart/form-data`
- **쿼리 매개변수**:
  - `language`: 언어 (`Kor`, `Eng`, `Jpn`, `Chn`). 기본값은 `Kor`입니다.
- **폼 데이터**:
  - `audio`: 변환할 오디오 파일.

### `GET /api/audio/list`

업로드된 오디오 파일 목록을 가져옵니다.

- **메서드**: `GET`

### `DELETE /api/audio/:filename`

특정 오디오 파일을 삭제합니다.

- **메서드**: `DELETE`
- **URL 매개변수**:
  - `filename`: 삭제할 파일 이름.

### `GET /health`

서버 상태를 확인합니다.

- **메서드**: `GET`
