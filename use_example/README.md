# snap3d-viewer 최소 사용 예시

`index.html` 하나면 끝이에요. 3D 렌더러 관련 코드는 캔버스 하나, 스크립트 태그
두 줄, JS 세 줄이 전부입니다:

```html
<canvas id="canvas" style="width: 600px; height: 600px;"></canvas>

<script src="https://teo646.github.io/snap3d-viewer/dist/viewer.js"></script>
<script>
  const canvas = document.getElementById('canvas');
  const bundle = 'https://teo646.github.io/snap3d-multisite/assets/bundles/tile01.snap3d';
  const viewer = new Snap3dViewer(canvas, bundle);
  viewer.start();
</script>
```

## 실행 방법

`index.html`을 그냥 더블클릭해서 열면 됩니다. 번들을 로컬 파일이 아니라
`https://teo646.github.io/...`에 이미 배포된 사이트에서 직접 가져오기 때문에
정적 서버를 따로 띄울 필요가 없어요. GitHub Pages가 모든 파일에
`Access-Control-Allow-Origin: *`를 붙여서 서빙하기 때문에, `file://`로 연
페이지에서도 그 주소로의 요청은 CORS에 막히지 않습니다.

(인터넷 연결이 필요하고, `snap3d-multisite` 사이트가 그 경로에 계속 배포되어
있어야 동작해요 - 번들 경로를 나중에 바꾸면 이 예시도 같이 고쳐야 합니다.)

## 다른 번들로 바꾸기

`index.html`의 `bundle` 변수를 다른 `.snap3d` 번들의 URL로 바꾸면 됩니다 -
배포된 사이트의 것이든, 직접 호스팅한 것이든 상관없어요.
