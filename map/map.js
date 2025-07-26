///////////////////////////////////////////////////////////

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

///////////////////////////////////////////////////////////

const MARKERS = new Map(); // id: { element, x, y }

const WORLD_TOP_LEFT = { x: 1488, z: 2095 }
const WORLD_BOTTOM_RIGHT = { x: 2255, z: 2894 }

let scale;
let minScale;
let maxScale = 8;

let offsetX = 0;
let offsetY = 0;

let isDragging = false;
let dragStart = { x: 0, y: 0 };

const mapImage = new Image();
mapImage.src = "../assets/gruvriket_map.png"
mapImage.onload = () => {
  scale = canvas.height / mapImage.height;
  minScale = scale;

  offsetX = (canvas.width - mapImage.width * scale) / 2;
  
  drawMap();
}

///////////////////////////////////////////////////////////

function drawMap() {
  clearCanvas();
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.drawImage(mapImage, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  updateAllMarkers();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#3a211d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function addMarker(id, x, y, imgUrl) {
  if (MARKERS.has(id)) return console.warn("Marker already exists.");

  const marker = document.querySelector("#example-marker").cloneNode(true);
  marker.id = id;

  const layer = document.querySelector("#marker-layer")
  layer.appendChild(marker);

  if (imgUrl) {
    const icon = marker.querySelector(".marker-icon");
    icon.src = imgUrl;
    icon.classList.remove("hidden");
  }

  MARKERS.set(id, { element: marker, x, y });
  updateMarkerPosition(id);

  return marker;
}

function updateMarkerPosition(id) {
  const marker = MARKERS.get(id);
  if (!marker) return;

  const screenX = marker.x * scale + offsetX;
  const screenY = marker.y * scale + offsetY;

  marker.element.style.left = screenX + "px";
  marker.element.style.top = screenY + "px";
}

function updateAllMarkers() {
  MARKERS.forEach((marker, id) => updateMarkerPosition(id));
}

function moveMarker(id, x, y) {
  const marker = MARKERS.get(id);
  if (!marker) return console.warn("Marker not found.");
  marker.x = x;
  marker.y = y;
  updateMarkerPosition(id);
}

function removeMarker(id) {
  const marker = MARKERS.get(id);
  if (!marker) return console.warn("Marker not found.");
  marker.element.remove();
  MARKERS.delete(id);
}

function worldToMapPixelCoords(x, y, z) {
  if (!z) z = y;

  const worldWidth = WORLD_BOTTOM_RIGHT.x - WORLD_TOP_LEFT.x;
  const worldHeight = WORLD_BOTTOM_RIGHT.z - WORLD_TOP_LEFT.z + 1;

  const relX = (x - WORLD_TOP_LEFT.x) / worldWidth;
  const relZ = (z - WORLD_TOP_LEFT.z) / worldHeight;

  const imageX = relX * mapImage.width;
  const imageY = relZ * mapImage.height;

  return { x: imageX, y: imageY };
}

///////////////////////////////////////////////////////////

canvas.addEventListener('wheel', event => {
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;

  const prevScale = scale;

  scale += event.deltaY > 0 ? -.2 : .2;

  scale = clamp(scale, minScale, maxScale);

  const zoomFactor = scale / prevScale;
  offsetX = mouseX - (mouseX - offsetX) * zoomFactor;
  offsetY = mouseY - (mouseY - offsetY) * zoomFactor;

  drawMap();
});

canvas.addEventListener('mousedown', event => {
  isDragging = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = "default";
});

canvas.addEventListener('mousemove', event => {
  if (!isDragging) return;

  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;

  offsetX += dx;
  offsetY += dy;

  drawMap();
});

new ResizeObserver(() => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawMap();
}).observe(canvas);

///////////////////////////////////////////////////////////