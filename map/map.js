///////////////////////////////////////////////////////////

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

///////////////////////////////////////////////////////////

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
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3a211d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function addMarker(id, x, y, imgUrl) {
    const marker = document.querySelector("#example-marker").cloneNode(true);
    marker.id = id;
    marker.style.left = x + "px";
    marker.style.top = y + "px";

    const layer = document.querySelector("#marker-layer")
    layer.appendChild(marker);

    if (imgUrl == null) return marker;

    const icon = marker.querySelector(".marker-icon");
    icon.src = imgUrl;
    icon.classList.remove("hidden");

    return marker;
}

function moveMarker(id, x, y) {
    const marker = document.querySelector(`.marker#${id}`);
    marker.style.left = x + "px";
    marker.style.top = y + "px";
}

///////////////////////////////////////////////////////////

canvas.addEventListener('wheel', event => {
    console.log(event)

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