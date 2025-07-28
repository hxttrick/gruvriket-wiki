//////////////////////////////////////////////////////////////////
/*               Hattens spaghetti (don't judge)                */
/* EJ approved av slem (han skulle antagligen fått hjärtattack) */
//////////////////////////////////////////////////////////////////

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

//////////////////////////////////////////////////////////////////

const MARKERS = new Map(); // id: { element, x, y }

const WORLD_TOP_LEFT = { x: 1488, z: 2095 }
const WORLD_BOTTOM_RIGHT = { x: 2255, z: 2894 }

let scale;
let minScale;
let maxScale = 8;

let initialZoom = 1;

let offsetX = 0;
let offsetY = 0;

let isDragging = false;
let dragStart = { x: 0, y: 0 };

let pinchStartDist = null;

const mapImage = new Image();
mapImage.src = "../assets/gruvriket_map.png"
mapImage.onload = () => {
  scale = canvas.width / mapImage.width;
  minScale = scale;

  offsetX = (canvas.width - mapImage.width * scale) / 2;
  offsetY = (canvas.height - mapImage.height * scale) / 2;

  drawMap();
  zoomAtPoint(initialZoom, canvas.width / 2, canvas.height / 2);
};

async function loadMarkers() {

}

//////////////////////////////////////////////////////////////////

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

function clampOffset() {
  const mapWidth = mapImage.width * scale;
  const mapHeight = mapImage.height * scale;

  const minX = Math.min(0, canvas.width - mapWidth);
  const minY = Math.min(0, canvas.height - mapHeight);
  const maxX = 0;
  const maxY = 0;

  offsetX = clamp(offsetX, minX, maxX);
  offsetY = clamp(offsetY, minY, maxY);
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

//////////////////////////////////////////////////////////////////

canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -.2 : .2;
  zoomAtPoint(delta, event.offsetX, event.offsetY);
}, { passive: false } );

function zoomAtPoint(zoomDelta, centerX, centerY) {
  const prevScale = scale;

  scale += zoomDelta;
  scale = clamp(scale, minScale, maxScale);

  const zoomFactor = scale / prevScale;

  offsetX = centerX - (centerX - offsetX) * zoomFactor;
  offsetY = centerY - (centerY - offsetY) * zoomFactor;

  clampOffset();
  drawMap();
}

canvas.addEventListener('mousedown', event => {
  isDragging = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  document.body.style.cursor = "grabbing";
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.cursor = "default";
});

document.addEventListener('mousemove', event => {
  if (!isDragging) return;

  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;

  dragStart.x = event.clientX;
  dragStart.y = event.clientY;

  offsetX += dx;
  offsetY += dy;

  clampOffset();
  drawMap();
});

canvas.addEventListener("touchstart", event => {
  if (event.touches.length === 1) {
    // Start panning
    isDragging = true;
    dragStart.x = event.touches[0].clientX;
    dragStart.y = event.touches[0].clientY;
  } else if (event.touches.length === 2) {
    // Start zooming
    isDragging = false;
    pinchStartDist = getTouchDistance(event.touches[0], event.touches[1]);
  }
}, { passive: false });

canvas.addEventListener("touchmove", event => {
  if (event.touches.length === 1 && isDragging) {
    // Panning
    const touch = event.touches[0];

    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;

    dragStart.x = touch.clientX;
    dragStart.y = touch.clientY;

    offsetX += dx;
    offsetY += dy;

    clampOffset();
    drawMap();

  } else if (event.touches.length === 2 && pinchStartDist !== null) {
    // Zooming
    const newDist = getTouchDistance(event.touches[0], event.touches[1]);
    const delta = (newDist - pinchStartDist) * 0.005; // adjust zoom sensitivity
    pinchStartDist = newDist;

    const rect = canvas.getBoundingClientRect();
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;

    zoomAtPoint(delta, centerX, centerY);
  }

  event.preventDefault();

}, { passive: false });

canvas.addEventListener("touchend", event => {
  if (event.touches.length === 0) {
    isDragging = false;
    pinchStartDist = null;
  }
}, { passive: false });

function getTouchDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.hypot(dx, dy);
}


const container = document.getElementById('map-container');
new ResizeObserver(() => {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  clampOffset();
  drawMap();
}).observe(container);

//////////////////////////////////////////////////////////////////