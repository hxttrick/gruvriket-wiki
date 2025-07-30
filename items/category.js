function getImageSrc(path) {
  if (path.startsWith("http")) return path;
  return "../assets/" + path.replace(/^\/+/, "");
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
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
      snapshot.forEach((doc, index) => {
        const data = doc.data();

        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
          <div class="item-image">
            <img src="${getImageSrc(data.image)}" alt="${data.name}" draggable="false">
          </div>
          <div class="item-info">
            <img src="${getImageSrc(data.rarity)}" class="rarity-image" alt="rarity">
            <div class="item-name">${data.name}</div>
            <div class="item-flavor">${data.flavor || ""}</div>
            <div class="item-stats">${data.stats || ""}</div>
            <div class="item-tags">
              ${(data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(" ")}
            </div>
          </div>
        `;
        container.appendChild(card);

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
  <input type="text" class="edit-name" value="${data.name || ""}" placeholder="Item Name" />

  <label>Image URL or filename</label>
  <input type="text" class="edit-image" value="${data.image || ""}" placeholder="e.g., sword.png" />

  <label>Rarity Image</label>
  <input type="text" class="edit-rarity" value="${data.rarity || ""}" placeholder="e.g., rare.png" />

  <label>Flavor Text</label>
  <input type="text" class="edit-flavor" value="${data.flavor || ""}" placeholder="Optional flavor text..." />

  <label>Stats or Description</label>
  <textarea class="edit-stats" placeholder="Item stats or lore...">${data.stats || ""}</textarea>

  <label>Tags (comma-separated)</label>
  <input type="text" class="edit-tags" value="${(data.tags || []).join(", ")}" placeholder="e.g., rare, magic" />

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
              stats: itemDiv.querySelector(".edit-stats").value,
              tags: itemDiv.querySelector(".edit-tags").value.split(",").map(t => t.trim()).filter(Boolean),
            };
            db.collection("itemsinfo").doc(doc.id).update(updates).then(loadItems);
          };

          adminList.appendChild(itemDiv);
        }
      });

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
    item.addEventListener("dragstart", (e) => {
      dragSrcEl = item;
      item.classList.add("dragging");
      placeholder.style.height = `${item.offsetHeight}px`;
    });

    item.addEventListener("dragend", () => {
      if (dragSrcEl) dragSrcEl.classList.remove("dragging");
      placeholder.remove();
      dragSrcEl = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const before = offset < rect.height / 2;
      if (before) {
        list.insertBefore(placeholder, item);
      } else {
        list.insertBefore(placeholder, item.nextSibling);
      }
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragSrcEl && placeholder.parentNode) {
        list.insertBefore(dragSrcEl, placeholder);
        placeholder.remove();
        updateItemOrder();
      }
    });
  });

  placeholder.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  placeholder.addEventListener("drop", (e) => {
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
    if (id) {
      db.collection("itemsinfo").doc(id).update({ order: i });
    }
  });
  loadItems();
}

const categoryId = getQueryParam("id");

if (categoryId) {
  setupAdminPanel(
    loadItems,
    "add-item-form",
    ["item-name", "item-image", "item-rarity", "item-flavor", "item-stats", "item-tags"],
    "itemsinfo",
    { category: categoryId }
  );
  loadItems();
}
