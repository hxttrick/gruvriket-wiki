const emojiMap = {
":gem:": "../assets/emotes/adelsten.png",
":mat:": "../assets/emotes/atbart.png",
":rodutrop:": "../assets/emotes/bad_prefix.png",
":skold:": "../assets/emotes/defense.png",
":gronutrop:": "../assets/emotes/good_prefix.png",
":karta:": "../assets/emotes/info.png",
":mynt:": "../assets/emotes/mynt.png",
":pilbage:": "../assets/emotes/pilbage.png",
":hastighet:": "../assets/emotes/sidearrow.png",
":uppdrag:": "../assets/emotes/uppdrag.png",
":pil:": "../assets/emotes/arrow_velocity.png",
":skada:": "../assets/emotes/attack_damage.png",
":stamina:": "../assets/emotes/stamina.png",
":artefakt:": "../assets/emotes/artefakt.png",
":attackspeed:": "../assets/emotes/attack_speed.png",
":CD:": "../assets/emotes/cooldown.png",
":skalle:": "../assets/emotes/dungeon.png",
":HP:": "../assets/emotes/hearts.png",
":magi:": "../assets/emotes/magiskt.png",
":orangeutrop:": "../assets/emotes/neutral_prefix.png",
":bag:": "../assets/emotes/ryggsack.png",
":ring:": "../assets/emotes/tillbehor.png",
":atlas:": "../assets/emotes/atlas.png",
":vagsten:": "../assets/emotes/vagsten.png",
":tra:": "../assets/sprites/material/tra.png",
":skarva:": "../assets/sprites/material/skarva.png",
":sten:": "../assets/sprites/material/sten.png"

};

function parseEmojis(text) {
  if (!text) return "";
  return text
    .replace(/\r?\n|\r/g, " ")                   
    .replace(/\s+/g, " ")                         
    .replace(/:\w+:/g, match => {
      const src = emojiMap[match];
      return src ? `<img src="${src}" alt="${match}" class="inline-emoji">` : match;
    });
}