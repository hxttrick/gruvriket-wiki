const loginBtn = document.getElementById("show-login-btn");
const adminBtn = document.getElementById("open-admin-panel");
const loginWrapper = document.getElementById("login-panel-wrapper");
const adminWrapper = document.getElementById("admin-panel-wrapper");

function getImageSrc(path) {
  if (path.startsWith("http")) return path;
  return "../assets/" + path.replace(/^\/+/, "");
}

function loadCategories() {
  const container = document.getElementById("cards-container");
  const adminList = document.getElementById("category-list");
  container.innerHTML = "";
  if (adminList) adminList.innerHTML = "";

  db.collection("categories").get().then(snapshot => {
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
        row.style.border = "1px solid #333";
        row.style.padding = "10px";
        row.style.marginBottom = "12px";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const label = document.createElement("strong");
        label.textContent = data.title;

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "▼ Edit";
        toggleBtn.style.marginLeft = "8px";
        toggleBtn.style.cursor = "pointer";

        const content = document.createElement("div");
        content.style.display = "none";
        content.style.marginTop = "10px";

        toggleBtn.onclick = () => {
          content.style.display = content.style.display === "none" ? "block" : "none";
          toggleBtn.textContent = content.style.display === "block" ? "▲ Hide" : "▼ Edit";
        };

        const editForm = document.createElement("form");
        editForm.innerHTML = `
          <input type="text" placeholder="Title" value="${data.title}" style="margin-bottom: 4px; display: block; width: 100%;" />
          <input type="text" placeholder="Image URL" value="${data.image}" style="margin-bottom: 4px; display: block; width: 100%;" />
          <input type="text" placeholder="Link URL" value="${data.link}" style="margin-bottom: 4px; display: block; width: 100%;" />
          <button type="submit" style="margin-top: 4px;">Save</button>
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
        removeBtn.textContent = "Delete";
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
  if (!user) {
    setAdminView(false);
    return;
  }

  db.collection("admins").doc(user.uid).get().then(doc => {
    if (doc.exists) {
      setAdminView(true);
    } else {
      setAdminView(false);
    }
  }).catch(() => {
    setAdminView(false);
  });
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

  db.collection("categories").add({ title, image, link }).then(() => {
    loadCategories();
    document.getElementById("add-category-form").reset();
  });
});

document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut().then(() => {
    setAdminView(false);
  });
});

loadCategories();
