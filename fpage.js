const loginBtn = document.getElementById("show-login-btn");
const adminBtn = document.getElementById("open-admin-panel");
const loginWrapper = document.getElementById("login-panel-wrapper");
const adminWrapper = document.getElementById("admin-panel-wrapper");

const firebaseConfig = {
  apiKey: "AIzaSyBImRk-6VfPZB_kISi-pwdUAdUo1z3aZ0A",
  authDomain: "gruvriketwiki.firebaseapp.com",
  projectId: "gruvriketwiki",
  storageBucket: "gruvriketwiki.appspot.com",
  messagingSenderId: "926051664418",
  appId: "1:926051664418:web:9c903d84815b9e5538c07b"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase already initialized:", e);
}

const db = firebase.firestore();
const auth = firebase.auth();

function getImageSrc(path) {
  if (path.startsWith("http")) return path;
  return "../assets/" + path.replace(/^\/+/, "");
}

function loadCategories() {
  const container = document.getElementById("cards-container");
  const adminList = document.getElementById("category-list");
  container.innerHTML = "";
  if (adminList) adminList.innerHTML = "";

  db.collection("categories").orderBy("order", "asc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();

      const card = document.createElement("a");
      card.className = "card";
      card.href = data.link || "#";
      card.innerHTML = `
        <img src="${getImageSrc(data.image)}" alt="${data.title}" draggable="false">
        <div class="card-content">
          <div class="card-title">${data.title}</div>
        </div>
      `;
      container.appendChild(card);

      if (adminList) {
        const row = document.createElement("div");
        row.classList.add("draggable-item");
        row.setAttribute("draggable", "true");
        row.dataset.id = doc.id;
        row.style.border = "1px solid #333";
        row.style.padding = "10px";
        row.style.marginBottom = "12px";
        row.style.cursor = "grab";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const label = document.createElement("strong");
        label.textContent = data.title;

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "▼ Redigera";
        toggleBtn.style.marginLeft = "8px";
        toggleBtn.style.cursor = "pointer";

        const content = document.createElement("div");
        content.style.display = "none";
        content.style.marginTop = "10px";

        toggleBtn.onclick = () => {
          content.style.display = content.style.display === "none" ? "block" : "none";
          toggleBtn.textContent = content.style.display === "block" ? "▲ Dölj" : "▼ Redigera";
        };

        const editForm = document.createElement("form");
editForm.innerHTML = `
  <input type="text" placeholder="Namn på Kategori" value="${data.title}" style="margin-bottom: 4px; display: block; width: 100%;" />
  <input type="text" placeholder="URL eller filnamn *placeholder.png*" value="${data.image}" style="margin-bottom: 4px; display: block; width: 100%;" />
  <input type="text" placeholder="Länk till Kategori" value="${data.link}" style="margin-bottom: 4px; display: block; width: 100%;" />
  <button type="submit" style="margin-top: 4px;">Spara</button>
`;

        editForm.addEventListener("submit", e => {
  e.preventDefault();
  const [titleInput, imageInput, linkInput, tagsInput] = editForm.querySelectorAll("input");
  const title = titleInput.value.trim();
  const image = imageInput.value.trim();
  const link = linkInput.value.trim();
  const searchIndex = [title.toLowerCase()];

  db.collection("categories").doc(doc.id).update({
    title,
    image,
    link,
    searchIndex
  }).then(() => {
    loadCategories();
  });
});


        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Radera";
        removeBtn.style.marginTop = "6px";
        removeBtn.style.padding = "4px 8px";
        removeBtn.style.cursor = "pointer";
        removeBtn.onclick = () => {
          db.collection("categories").doc(doc.id).delete().then(() => {
            loadCategories();
          });
        };

        content.appendChild(editForm);
        content.appendChild(removeBtn);

        header.appendChild(label);
        header.appendChild(toggleBtn);

        row.appendChild(header);
        row.appendChild(content);
        adminList.appendChild(row);
      }
    });

    if (adminList) enableCategoryReordering(); // ensure it's called after DOM update
  }).catch(err => {
    console.error("Failed to load categories:", err);
  });
}

function enableCategoryReordering() {
  const list = document.getElementById("category-list");
  let dragged;
  const placeholder = document.createElement("div");
  placeholder.className = "drag-placeholder";

  list.addEventListener("dragstart", (e) => {
    if (!e.target.classList.contains("draggable-item")) return;
    dragged = e.target;
    e.target.classList.add("dragging");
    setTimeout(() => {
      e.target.style.display = "none";
    }, 0);
  });

  list.addEventListener("dragend", (e) => {
    if (dragged) {
      dragged.classList.remove("dragging");
      dragged.style.display = "";
    }
    placeholder.remove();
    dragged = null;
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = [...list.children].find(el => {
      const box = el.getBoundingClientRect();
      return e.clientY < box.top + box.height / 2;
    });

    if (afterElement && afterElement !== placeholder) {
      list.insertBefore(placeholder, afterElement);
    } else if (!list.contains(placeholder)) {
      list.appendChild(placeholder);
    }
  });

  list.addEventListener("drop", async () => {
    if (placeholder && dragged) {
      list.insertBefore(dragged, placeholder);
      placeholder.remove();
    }

    const newOrder = Array.from(list.children).map((el, index) => ({
      id: el.dataset.id,
      order: index
    }));

    const batch = db.batch();
    newOrder.forEach(item => {
      const ref = db.collection("categories").doc(item.id);
      batch.update(ref, { order: item.order });
    });

    await batch.commit();
    loadCategories();
  });
}


function setAdminView(active) {
  const isLoggedIn = !!auth.currentUser;
  loginBtn.style.display = isLoggedIn ? "none" : "inline-block";
  adminBtn.style.display = active ? "inline-block" : "none";
  loginWrapper.style.display = "none";
  adminWrapper.style.display = "none";
}

function checkAdminByUID() {
  const user = auth.currentUser;
  if (!user) return setAdminView(false);

  db.collection("admins").doc(user.uid).get().then(doc => {
    setAdminView(doc.exists);
  }).catch(() => setAdminView(false));
}

auth.onAuthStateChanged(user => {
  if (user) {
    checkAdminByUID();
  } else {
    setAdminView(false);
  }
});

loginBtn.addEventListener("click", () => {
  loginWrapper.style.display = "block";
});

document.getElementById("close-login-modal").addEventListener("click", () => {
  loginWrapper.style.display = "none";
});

document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password).then(() => {
    checkAdminByUID();
    loginWrapper.style.display = "none";
  }).catch(() => {
    alert("Login failed");
    loginWrapper.style.display = "none";
    loginBtn.style.display = "inline-block";
  });
});

adminBtn.addEventListener("click", () => {
  adminWrapper.style.display = "block";
});

document.getElementById("close-admin-modal").addEventListener("click", () => {
  adminWrapper.style.display = "none";
});

document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s => s.style.display = "none");
    tab.classList.add("active");
    const section = document.getElementById(`admin-tab-${tab.dataset.tab}`);
    if (section) section.style.display = "block";
  });
});

document.getElementById("add-category-form").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("category-title").value.trim();
  const image = document.getElementById("category-image").value.trim();
  const link = document.getElementById("category-link").value.trim();
  const tags = document.getElementById("category-tags").value.trim().toLowerCase().split(",").map(tag => tag.trim()).filter(Boolean);
  const searchIndex = [title.toLowerCase(), ...tags];

  db.collection("categories").orderBy("order", "desc").limit(1).get().then(snapshot => {
    const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0) + 1;
    db.collection("categories").add({ title, image, link, tags, searchIndex, order: maxOrder }).then(() => {
      loadCategories();
      document.getElementById("add-category-form").reset();
    });
  });
});

document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut().then(() => {
    loginBtn.style.display = "inline-block";
    adminBtn.style.display = "none";
    loginWrapper.style.display = "none";
    adminWrapper.style.display = "none";
  });
});
const searchInput = document.getElementById("global-search");
const searchModal = document.getElementById("search-modal");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim().toLowerCase();
  searchModal.innerHTML = "";
  if (!query) {
    searchModal.style.display = "none";
    return;
  }

  try {
    const [itemsSnap, metaSnap] = await Promise.all([
      db.collection("itemsinfo").get(),
      db.collection("categoryMeta").get()
    ]);

    const categoryMetaMap = {};
    metaSnap.forEach(doc => {
      const data = doc.data();
      categoryMetaMap[doc.id] = data.displayName || doc.id;
    });

    const matches = [];
    itemsSnap.forEach(doc => {
      const data = doc.data();
      if (
        data.name?.toLowerCase().includes(query) ||
        data.flavor?.toLowerCase().includes(query) ||
        (data.tags || []).some(tag => tag.toLowerCase().includes(query))
      ) {
        matches.push({ id: doc.id, ...data });
      }
    });

    if (matches.length === 0) {
      searchModal.style.display = "none";
      return;
    }

    matches.forEach(match => {
      const categoryId = match.category;
      const displayName = categoryMetaMap[categoryId] || "Okänd kategori";

      const result = document.createElement("div");
      result.className = "search-result";
      result.style.display = "flex";
      result.style.justifyContent = "space-between";
      result.style.alignItems = "center";
      result.style.imageRendering = "pixelated";

      const textContainer = document.createElement("div");
      textContainer.innerHTML = `
        <div class="search-result-title" style="font-weight: bold;">${match.name}</div>
        <div class="search-result-category" style="font-size: 0.85em; color: #666;">${displayName}</div>
      `;

      const image = document.createElement("img");
      image.src = getImageSrc(match.image || "");
      image.alt = match.name;
      image.style.width = "40px";
      image.style.height = "40px";
      image.style.objectFit = "contain";
      image.style.marginLeft = "10px";

      result.appendChild(textContainer);
      result.appendChild(image);

      result.onclick = () => {
        const link = `/kategori/index.html?id=${categoryId}`;
        window.location.href = link;
      };

      searchModal.appendChild(result);
    });

    searchModal.style.display = "block";
  } catch (err) {
    console.error("Search failed:", err);
    searchModal.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    searchModal.style.display = "none";
  }
});
    const serverIP = "mc.gruvriket.se";

    fetch(`https://api.mcsrvstat.us/2/${serverIP}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("motd").innerText = data.motd?.clean?.join(" ") || "N/A";
        document.getElementById("players").innerText = data.players
          ? `${data.players.online} / ${data.players.max}`
          : "N/A";
      })
      .catch(err => {
        document.getElementById("motd").innerText = "Error";
        document.getElementById("players").innerText = "Error";
        console.error(err);
      });

loadCategories();
