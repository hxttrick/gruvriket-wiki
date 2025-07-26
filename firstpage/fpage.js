const cardsData = [
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  {
    title: "Placeholder",
    image: "https://assets.originrealms.com/cdn-cgi/image/format=webp,quality=90,fit=scale-down,width=1920/2023/09/Blight_Guide.png",
    link: "#"
  },
  
];

const container = document.getElementById("cards-container");

cardsData.forEach(data => {
  const card = document.createElement("a");
  card.className = "card";
  card.href = data.link;
  card.innerHTML = `
    <img src="${data.image}" alt="${data.title}" draggable="false">
    <div class="card-content">
      <div class="card-title">${data.title}</div>
    </div>
  `;
  container.appendChild(card);
});
