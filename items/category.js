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

  db.collection("itemsinfo").where("category", "==", categoryId).get().then(snapshot => {
    snapshot.forEach(doc => {
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
        </div>
      `;

      container.appendChild(card);

      if (adminList) {
        const itemDiv = document.createElement("div");
        itemDiv.style.border = "1px solid #333";
        itemDiv.style.padding = "10px";
        itemDiv.style.marginBottom = "12px";

        itemDiv.innerHTML = `
          <strong>${data.name}</strong><br>
          <small>${data.flavor || ""}</small><br>
          <button style="margin-top:6px;" onclick="deleteItem('${doc.id}')">Delete</button>
        `;

        adminList.appendChild(itemDiv);
      }
    });
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
    Object.assign(data, extraFields);
    db.collection(collection).add(data).then(() => {
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

const categoryId = getQueryParam("id");
if (categoryId) {
  setupAdminPanel(
    loadItems,
    "add-item-form",
    ["item-name", "item-image", "item-rarity", "item-flavor", "item-stats"],
    "itemsinfo",
    { category: categoryId }
  );
  loadItems();
}
