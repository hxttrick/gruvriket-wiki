function getImageSrc(path) {
  if (path.startsWith("http")) return path;
  return "../assets/" + path.replace(/^\/+/, "");
}
function parseWikiLinks(text) {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

let currentItems = [];

function getSearchParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("search") || "";
}

function renderFilteredItems(query) {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";

  const filtered = currentItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    (item.flavor && item.flavor.toLowerCase().includes(query.toLowerCase())) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
  );

  filtered.forEach(data => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-image">
        <div class="img" style="background-image: url(${getImageSrc(data.image)})"></div>
      </div>
    `;

    const itemInfo = document.createElement("div");
    itemInfo.className = "item-info";

    const rarity = document.createElement("img");
    rarity.className = "rarity-image";
    rarity.src = getImageSrc(data.rarity);
    rarity.alt = "rarity";

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = data.name;

    const flavor = document.createElement("div");
    flavor.className = "item-flavor";
    flavor.innerHTML = parseWikiLinks(parseEmojis(data.flavor || ""));

    const stats = document.createElement("div");
    stats.className = "item-stats";
    stats.innerHTML = parseWikiLinks(parseEmojis((data.stats || "").replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ")));

    const tags = document.createElement("div");
    tags.className = "item-tags";
    tags.innerHTML = (data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(" ");

    itemInfo.appendChild(rarity);
    itemInfo.appendChild(name);
    itemInfo.appendChild(flavor);
    itemInfo.appendChild(stats);
    itemInfo.appendChild(tags);

if (data.maplink) {
  const mapIcon = document.createElement("a");
  mapIcon.href = data.maplink;
  mapIcon.target = "_blank";
  mapIcon.rel = "noopener noreferrer";
  mapIcon.className = "map-icon";

  const mapImg = document.createElement("img");
  mapImg.src = "/assets/gruvriket_marker.png";
  mapImg.alt = "Map";
  mapImg.className = "map-icon-image";

  mapIcon.appendChild(mapImg);

  mapIcon.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  card.appendChild(mapIcon);
}
    card.appendChild(itemInfo);

if (data.details && data.details.trim()) {
  const description = document.createElement("div");
  description.className = "item-description";

  let short = data.details.slice(0, 80);
  const lastOpen = short.lastIndexOf("[");
  const lastClose = short.lastIndexOf("]");
  if (lastOpen > lastClose) {
    short = short.slice(0, lastOpen);
  }

  short = short.trim();
  const isTruncated = short.length < data.details.length;

  description.innerHTML = parseWikiLinks(parseEmojis(short + (isTruncated ? "..." : "")));
  card.appendChild(description);

  card.addEventListener("click", () => {
    openExpandedCard(data);
  });
}

    container.appendChild(card);
  });
}

function loadItems() {
  const categoryId = getQueryParam("id");
  const container = document.getElementById("cards-container");
  const adminList = document.getElementById("item-list");
  if (!categoryId || !container) return;

  container.innerHTML = "";
  if (adminList) adminList.innerHTML = "";

  db.collection("itemsinfo")
    .where("category", "==", categoryId)
    .orderBy("order")
    .get()
    .then(snapshot => {
      currentItems = [];
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        currentItems.push(data);

        if (adminList) {
          const itemDiv = document.createElement("div");
          itemDiv.className = "draggable-item";
          itemDiv.setAttribute("draggable", true);
          itemDiv.setAttribute("data-id", doc.id);

          itemDiv.innerHTML = `
            <div class="drag-header">
              <span class="drag-handle">☰</span>
              <strong>${data.name}</strong>
              <button class="edit-item">Edit</button>
              <button onclick="deleteItem('${doc.id}')">Delete</button>
            </div>
            <div class="edit-fields" style="display: none; margin-top: 10px;">
              <label>Name</label>
              <input type="text" class="edit-name" value="${data.name || ""}" />
              <label>Image</label>
              <input type="text" class="edit-image" value="${data.image || ""}" />
              <label>Rarity</label>
              <input type="text" class="edit-rarity" value="${data.rarity || ""}" />
              <label>Flavor Text</label>
              <input type="text" class="edit-flavor" value="${data.flavor || ""}" />
              <label>Stats</label>
              <textarea class="edit-stats">${data.stats || ""}</textarea>
              <label>Tags (comma-separated)</label>
              <input type="text" class="edit-tags" value="${(data.tags || []).join(", ")}" />
              <label>Details (expandable section)</label>
              <textarea class="edit-details">${data.details || ""}</textarea>
              <label>Map Link</label>
              <input type="text" class="edit-maplink" value="${data.maplink || ""}" />
              <button class="save-edit">Save</button>
            </div>
          `;

          itemDiv.querySelector(".edit-item").onclick = () => {
            const fields = itemDiv.querySelector(".edit-fields");
            fields.style.display = fields.style.display === "none" ? "block" : "none";
          };

          itemDiv.querySelector(".save-edit").onclick = () => {
            const updates = {
              name: itemDiv.querySelector(".edit-name").value,
              image: itemDiv.querySelector(".edit-image").value,
              rarity: itemDiv.querySelector(".edit-rarity").value,
              flavor: itemDiv.querySelector(".edit-flavor").value,
              stats: itemDiv.querySelector(".edit-stats").value.trim().replace(/\s+/g, " "),
              tags: itemDiv.querySelector(".edit-tags").value.split(",").map(t => t.trim()).filter(Boolean),
              details: itemDiv.querySelector(".edit-details").value,
              maplink: itemDiv.querySelector(".edit-maplink").value
            };
            db.collection("itemsinfo").doc(doc.id).update(updates).then(loadItems);
          };

          adminList.appendChild(itemDiv);
        }
      });

      renderFilteredItems(document.getElementById("item-search")?.value || "");
      if (adminList) enableDragAndDrop();
    });
}

function setupAdminPanel(reloadFn, formId, fieldIds, collection, extraFields = {}) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = {};
    fieldIds.forEach(id => {
      const element = document.getElementById(id);
      data[id.replace("item-", "")] = element ? element.value : "";
    });
    data.tags = (data.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    Object.assign(data, extraFields);
    db.collection(collection).add({ ...data, order: Date.now() }).then(() => {
      reloadFn();
      form.reset();
    });
  });
}

function deleteItem(id) {
  db.collection("itemsinfo").doc(id).delete().then(() => {
    loadItems();
  });
}

function enableDragAndDrop() {
  const list = document.getElementById("item-list");
  if (!list) return;

  let dragSrcEl = null;
  let placeholder = document.createElement("div");
  placeholder.className = "drag-placeholder";

  const items = [...list.querySelectorAll(".draggable-item")];

  items.forEach(item => {
    item.addEventListener("dragstart", e => {
      dragSrcEl = item;
      item.classList.add("dragging");
      placeholder.style.height = `${item.offsetHeight}px`;
    });

    item.addEventListener("dragend", () => {
      if (dragSrcEl) dragSrcEl.classList.remove("dragging");
      placeholder.remove();
      dragSrcEl = null;
    });

    item.addEventListener("dragover", e => {
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const before = offset < rect.height / 2;
      if (before) list.insertBefore(placeholder, item);
      else list.insertBefore(placeholder, item.nextSibling);
    });

    item.addEventListener("drop", e => {
      e.preventDefault();
      if (dragSrcEl && placeholder.parentNode) {
        list.insertBefore(dragSrcEl, placeholder);
        placeholder.remove();
        updateItemOrder();
      }
    });
  });

  placeholder.addEventListener("dragover", e => {
    e.preventDefault();
  });

  placeholder.addEventListener("drop", e => {
    e.preventDefault();
    if (dragSrcEl && placeholder.parentNode) {
      list.insertBefore(dragSrcEl, placeholder);
      placeholder.remove();
      updateItemOrder();
    }
  });
}

function updateItemOrder() {
  const list = document.getElementById("item-list");
  [...list.children].forEach((child, i) => {
    const id = child.getAttribute("data-id");
    if (id) db.collection("itemsinfo").doc(id).update({ order: i });
  });
  loadItems();
}

const categoryId = getQueryParam("id");

if (categoryId) {
  setupAdminPanel(
    loadItems,
    "add-item-form",
    ["item-name", "item-image", "item-rarity", "item-flavor", "item-stats", "item-tags", "item-details", "item-maplink"],
    "itemsinfo",
    { category: categoryId }
  );
  loadItems();

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "item-search";
  searchInput.placeholder = "Hitta vad du letar efter i denna kategori...";
  searchInput.className = "search-input";
  document.querySelector(".main-content").insertBefore(searchInput, document.querySelector(".cards-wrapper"));

  searchInput.addEventListener("input", e => {
    renderFilteredItems(e.target.value);
  });
}

function openExpandedCard(data) {
  closeExpandedCard();

  const overlay = document.createElement("div");
  overlay.className = "expanded-card-overlay";

  const card = document.createElement("div");
  card.className = "expanded-card";

  card.innerHTML = `
    <div class="item-image">
      <div class="img" style="background-image: url(${getImageSrc(data.image)})"></div>
    </div>
    <div class="item-info">
      <img class="rarity-image" src="${getImageSrc(data.rarity)}" alt="rarity">
      <div class="item-name">${data.name}</div>
      <div class="item-flavor">${parseWikiLinks(parseEmojis(data.flavor || ""))}</div>
      <div class="item-stats">${parseWikiLinks(parseEmojis(data.stats || ""))}</div>
      <div class="item-tags">${(data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(" ")}</div>
      <div class="item-description">${parseWikiLinks(parseEmojis(data.details || ""))}</div>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeExpandedCard();
  });

  document.addEventListener("keydown", escHandler);
}

function closeExpandedCard() {
  const existing = document.querySelector(".expanded-card-overlay");
  if (existing) {
    existing.remove();
    document.removeEventListener("keydown", escHandler);
  }
}

function escHandler(e) {
  if (e.key === "Escape") {
    closeExpandedCard();
  }
}
