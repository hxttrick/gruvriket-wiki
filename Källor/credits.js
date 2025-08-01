const container = document.getElementById("credits-container");
const creditList = document.getElementById("credit-list");

function getImageSrc(username) {
  if (!username || typeof username !== "string") return "https://minotar.net/helm/Steve/100.png";
  return `https://minotar.net/helm/${encodeURIComponent(username)}/100.png`;
}

function loadCredits() {
  container.innerHTML = "";
  if (creditList) creditList.innerHTML = "";

  db.collection("credits").orderBy("order").get().then(snapshot => {
    const sections = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!sections[data.section]) sections[data.section] = [];
      sections[data.section].push({ id: doc.id, ...data });
    });

    for (const section in sections) {
      const sectionHeader = document.createElement("h2");
      sectionHeader.textContent = section;
      sectionHeader.className = "credits-section-header";
      container.appendChild(sectionHeader);

      const row = document.createElement("div");
      row.className = "credits-row";

      sections[section].forEach(data => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
          <div class="item-image">
            <img src="${getImageSrc(data.image)}" alt="${data.name}">
          </div>
          <div class="item-info">
            <div class="item-name">${data.name}</div>
            <div class="item-flavor">${data.role}</div>
            <div class="item-stats">${data.info}</div>
          </div>
        `;
        row.appendChild(card);

        if (creditList) {
          const item = document.createElement("div");
          item.className = "draggable-item";
          item.setAttribute("draggable", true);
          item.setAttribute("data-id", data.id);

          item.innerHTML = `
            <div class="drag-header">
              <span class="drag-handle">☰</span>
              <strong>${data.name}</strong>
              <button class="edit-item">Edit</button>
              <button onclick="deleteCredit('${data.id}')">Delete</button>
            </div>
            <div class="edit-fields" style="display:none;">
              <label>Namn på person</label><input class="edit-name" value="${data.name}">
              <label>Roll (under namnet)</label><input class="edit-role" value="${data.role}">
              <label>Vad de gjort</label><input class="edit-info" value="${data.info}">
              <label>Minecraft användarnamn</label><input class="edit-image" value="${data.image}">
              <label>Kategori</label><input class="edit-section" value="${data.section}">
              <button class="save-edit">Save</button>
            </div>
          `;

          item.querySelector(".edit-item").onclick = () => {
            const fields = item.querySelector(".edit-fields");
            fields.style.display = fields.style.display === "none" ? "block" : "none";
          };

          item.querySelector(".save-edit").onclick = () => {
            const updates = {
              name: item.querySelector(".edit-name").value,
              role: item.querySelector(".edit-role").value,
              info: item.querySelector(".edit-info").value,
              image: item.querySelector(".edit-image").value,
              section: item.querySelector(".edit-section").value
            };
            db.collection("credits").doc(data.id).update(updates).then(loadCredits);
          };

          creditList.appendChild(item);
        }
      });

      container.appendChild(row);
    }

    if (creditList) enableDragAndDrop();
  });
}

function deleteCredit(id) {
  db.collection("credits").doc(id).delete().then(loadCredits);
}

function enableDragAndDrop() {
  const list = document.getElementById("credit-list");
  let dragSrcEl = null;
  const placeholder = document.createElement("div");
  placeholder.className = "drag-placeholder";

  const items = [...list.querySelectorAll(".draggable-item")];
  items.forEach(item => {
    item.addEventListener("dragstart", () => {
      dragSrcEl = item;
      item.classList.add("dragging");
      placeholder.style.height = `${item.offsetHeight}px`;
    });

    item.addEventListener("dragend", () => {
      dragSrcEl.classList.remove("dragging");
      placeholder.remove();
      dragSrcEl = null;
    });

    item.addEventListener("dragover", e => {
      e.preventDefault();
      const rect = item.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      list.insertBefore(placeholder, before ? item : item.nextSibling);
    });

    item.addEventListener("drop", e => {
      e.preventDefault();
      if (dragSrcEl && placeholder.parentNode) {
        list.insertBefore(dragSrcEl, placeholder);
        placeholder.remove();
        updateCreditOrder();
      }
    });
  });
}

function updateCreditOrder() {
  const list = document.getElementById("credit-list");
  [...list.children].forEach((child, i) => {
    const id = child.getAttribute("data-id");
    if (id) {
      db.collection("credits").doc(id).update({ order: i });
    }
  });
  loadCredits();
}

function setupAdminPanel() {
  const form = document.getElementById("add-credit-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = {
      name: document.getElementById("credit-name").value,
      role: document.getElementById("credit-role").value,
      info: document.getElementById("credit-info").value,
      image: document.getElementById("credit-image").value,
      section: document.getElementById("credit-section").value,
      order: Date.now()
    };
    db.collection("credits").add(data).then(() => {
      loadCredits();
      form.reset();
    });
  });
}

setupAdminPanel();
loadCredits();
