const cardsData = [
  {
    title: "Card One",
    text: "This is the first card.",
    image: "https://via.placeholder.com/300x160"
  },
  {
    title: "Card Two",
    text: "This is the second card.",
    image: "https://via.placeholder.com/300x160"
  },
  {
    title: "Card Three",
    text: "This is the third card.",
    image: "https://via.placeholder.com/300x160"
  }
];

const container = document.getElementById("cards-container");

cardsData.forEach(data => {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="${data.image}" alt="${data.title}">
    <div class="card-content">
      <div class="card-title">${data.title}</div>
      <div class="card-text">${data.text}</div>
    </div>
  `;
  container.appendChild(card);
});
