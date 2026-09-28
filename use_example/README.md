# snap3d-viewer 최소 사용 예시

이 폴더 하나면 끝이에요. `index.html` 안에 있는 3D 렌더러 관련 코드는
캔버스 하나, 스크립트 태그 두 줄, JS 세 줄이 전부입니다:

```html
<canvas id="canvas" style="width: 600px; height: 600px;"></canvas>

<script src="https://teo646.github.io/snap3d-viewer/dist/viewer.js"></script>
<script>
  const canvas = document.getElementById('canvas');
  const viewer = new Snap3dViewer(canvas, './bundle/tile01.snap3d');
  viewer.start();
</script>
```

## 실행 방법

`index.html`을 더블클릭해서 `file://`로 열면 안 돼요 — 브라우저가 번들 파일들을
`fetch`로 불러오는데, `file://`에서는 이게 막혀 있어요. 아무 정적 서버로 열어야
합니다.

이 폴더(`use_example/`)로 이동한 뒤:

```sh
python3 -m http.server 8000
```

그리고 브라우저에서 `http://localhost:8000` 을 열면 돼요.

(Node가 있다면 `npx serve` 같은 다른 정적 서버를 써도 됩니다.)

## 다른 번들로 바꾸기

`bundle/` 폴더를 다른 `.snap3d` 폴더로 통째로 교체하고, `index.html`의
`new Snap3dViewer(canvas, './bundle/...')` 경로만 그 폴더 이름에 맞게 고치면 됩니다.
