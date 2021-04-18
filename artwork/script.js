const input = new THREE.Vector2(-1, -1);
const vectorZero = new THREE.Vector3();
const subdivisions = [1, 6, 8];
const debug = false;
let iteration = 0;

function zoomCamera(camera, zoom) {
  camera.position.x = 1 * zoom;
  camera.position.y = 0.75 * zoom;
  camera.position.z = 1 * zoom;
  camera.lookAt(vectorZero);
}

const renderer = new THREE.WebGLRenderer({
  stencil: false,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.debug.checkShaderErrors = debug;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);
if (debug) {
  scene.add(new THREE.AxesHelper(), new THREE.GridHelper(10, 10));
}

const preset = [
  { movementSpeed: 0.02 },
  { movementSpeed: 0.05 },
  { movementSpeed: 0.07 },
];

const cameras = {
  dev: new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  ),
  main: new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  ),
};

zoomCamera(cameras.dev, 10);
zoomCamera(cameras.main, 50);

const controls = new THREE.OrbitControls(cameras.dev, renderer.domElement);
controls.enabled = debug;

const ambientLight = new THREE.AmbientLight(0xb1b1b1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const urls = [
  "assets/pos-x.jpg",
  "assets/neg-x.jpg",
  "assets/pos-y.jpg",
  "assets/neg-y.jpg",
  "assets/pos-z.jpg",
  "assets/neg-z.jpg",
];
const cubemap = new THREE.CubeTextureLoader().load(urls);

const skyboxMaterial = new THREE.MeshBasicMaterial({
  envMap: cubemap,
  depthWrite: false,
  side: THREE.BackSide,
});

const skybox = new THREE.Mesh(
  new THREE.BoxBufferGeometry(1000, 1000, 1000),
  skyboxMaterial
);

const iceMaterial = new THREE.MeshLambertMaterial({
  color: 0xcccccc,
  envMap: cubemap,
  side: THREE.DoubleSide,
});

let iceMesh;
function generateMesh(value) {
  if (iceMesh instanceof THREE.Mesh) {
    scene.remove(iceMesh);
  }
  iteration = value;
  subdivision = subdivisions[iteration];

  const noiseValues = [0.35, 0.2, 0.1];
  let geometry = new THREE.IcosahedronGeometry(50, subdivision);
  geometry = THREE.BufferGeometryUtils.mergeVertices(geometry);

  const total = value + 1;
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    for (let j = 0; j < total; j++) {
      const noise = noiseValues[j] / (j + 1);
      const scalar = 1 + Math.random() * noise;
      const x = geometry.attributes.position.getX(i) * scalar;
      const y = geometry.attributes.position.getY(i) * scalar;
      const z = geometry.attributes.position.getZ(i) * scalar;
      geometry.attributes.position.setX(i, x);
      geometry.attributes.position.setY(i, y);
      geometry.attributes.position.setZ(i, z);
    }
  }
  geometry = geometry.toNonIndexed();
  geometry.computeVertexNormals();
  iceMesh = new THREE.Mesh(geometry, iceMaterial);
  scene.add(iceMesh);
}

generateMesh(1);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  cameras.dev.aspect = width / height;
  cameras.main.aspect = width / height;
  cameras.dev.updateProjectionMatrix();
  cameras.main.updateProjectionMatrix();
  renderer.setSize(width, height);
}

let count = iteration;

function updateMesh() {
  count++;
  generateMesh(count % 3);
  startTimer();
}

function onTimeout() {
  updateMesh();
}

let timer;
function startTimer() {
  clearTimeout(timer);
  timer = setTimeout(onTimeout, 60 * 1000);
}

function onMouseMove(event) {
  input.x = (event.clientX / window.innerWidth) * 2 - 1;
  input.y = (event.clientY / window.innerHeight) * 2 - 1;
  startTimer();
}

function onTouchMove(event) {
  input.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
  input.y = (event.touches[0].pageY / window.innerHeight) * 2 - 1;
  startTimer();
}

function render() {
  requestAnimationFrame(render);

  if (iceMesh instanceof THREE.Mesh) {
    iceMesh.rotation.x += 0.1 * (input.x * preset[0].movementSpeed);
    iceMesh.rotation.y += 0.1 * (input.y * preset[0].movementSpeed);
    iceMesh.rotation.z += 0.1 * (input.y * preset[0].movementSpeed);
  }

  renderer.render(scene, cameras.main);
}

renderer.domElement.addEventListener("mousemove", onMouseMove);
renderer.domElement.addEventListener("touchmove", onTouchMove);
renderer.domElement.addEventListener("click", updateMesh);
window.addEventListener("resize", resize);

startTimer();
render();
