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
          const [titleInput, imageInput, linkInput] = editForm.querySelectorAll("input");
          db.collection("categories").doc(doc.id).update({
            title: titleInput.value.trim(),
            image: imageInput.value.trim(),
            link: linkInput.value.trim()
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
  const title = document.getElementById("category-title").value;
  const image = document.getElementById("category-image").value;
  const link = document.getElementById("category-link").value;

  db.collection("categories").orderBy("order", "desc").limit(1).get().then(snapshot => {
    const maxOrder = snapshot.empty ? 0 : (snapshot.docs[0].data().order || 0) + 1;
    db.collection("categories").add({ title, image, link, order: maxOrder }).then(() => {
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

loadCategories();
