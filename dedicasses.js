// ---------- PSEUDO VALIDATION & UTIL ----------
const PSEUDO_MIN = 3;
const PSEUDO_MAX = 20;

// autorise: lettres, chiffres, espaces simples, -, _
const PSEUDO_ALLOWED_RE = /^[A-Za-z0-9 _-]+$/;
const EMOJI_RE = /[\p{Emoji}\u200D]/u; // tentative de détection d'emoji (ES2018+)
const REPEATED_CHAR_RE = /(.)\1{6,}/; // 7+ times same char

function cleanPseudo(s) {
  let t = String(s || "").trim();
  // collapse multiple spaces into one
  t = t.replace(/\s+/g, " ");
  // remove leading/trailing non-printable
  t = t.replace(/^\s+|\s+$/g, "");
  // capitaliser la première lettre (optionnel)
  if (t.length) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

function isPseudoFormatValid(pseudo) {
  if (!pseudo) return { ok: false, reason: "Pseudo vide" };
  if (pseudo.length < PSEUDO_MIN) return { ok: false, reason: `Pseudo trop court (${PSEUDO_MIN} caractères min)` };
  if (pseudo.length > PSEUDO_MAX) return { ok: false, reason: `Pseudo trop long (${PSEUDO_MAX} caractères max)` };
  if (EMOJI_RE.test(pseudo)) return { ok: false, reason: "Les emoji ne sont pas autorisés dans le pseudo" };
  if (!PSEUDO_ALLOWED_RE.test(pseudo)) return { ok: false, reason: "Caractères autorisés : lettres, chiffres, espace, - et _" };
  if (REPEATED_CHAR_RE.test(pseudo)) return { ok: false, reason: "Pseudo contenant répétitions suspectes" };
  if (containsUrlOrEmail(pseudo)) return { ok: false, reason: "Les liens et emails ne sont pas autorisés dans le pseudo" };
  if (hasBlacklistedWord(pseudo)) return { ok: false, reason: "Pseudo contenant mot interdit" };
  return { ok: true };
}

// Vérifie soft-uniqueness dans la DB : retourne Promise<boolean>
// true = existe déjà
function pseudoExistsInDb(pseudo) {
  if (!db) return Promise.resolve(false);
  // normalize for check: lowercase and trim
  const key = pseudo.toLowerCase();
  return db.ref("dedicaces").orderByChild("nom_lower").equalTo(key).limitToFirst(1).once("value")
    .then(snap => !!snap.exists())
    .catch(() => false);
}

// Si tu n'as pas d'index nom_lower, on peut scanner (moins optimal):
// return db.ref("dedicaces").once("value").then(snap => { ... })

// ---------- Mise à jour push helper pour inclure nom_lower ----------
function pushDedicaceToFirebase(payload) {
  if (!db) return Promise.reject(new Error("Firebase non initialisé"));
  // add a lowercase index for easier checks (and set DB rules accordingly)
  payload.nom_lower = payload.nom.toLowerCase();
  const refPath = moderationEnabled ? "dedicaces_pending" : "dedicaces";
  return db.ref(refPath).push(payload);
}

// ---------- Exemple d'utilisation dans ton handler existant ----------
// Remplace la portion de submission où tu fais validateDedicace par ce bloc asynchrone

dedicaceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nomRaw = nomInput ? nomInput.value : "";
  const msgRaw = msgInput ? msgInput.value : "";

  const nomClean = cleanPseudo(nomRaw);
  const vMsg = validateDedicace(null, msgRaw); // adapte ta fonction validateDedicace pour accepter null nom
  if (!vMsg.ok) { alert(vMsg.reason); return; }

  const vPseudo = isPseudoFormatValid(nomClean);
  if (!vPseudo.ok) { alert(vPseudo.reason); return; }

  // check uniqueness soft
  const exists = await pseudoExistsInDb(nomClean);
  if (exists) {
    alert("Ce pseudo est déjà utilisé. Merci d'en choisir un autre ou d'ajouter un chiffre.");
    return;
  }

  // ready to push
  const payload = { nom: nomClean, message: vMsg.message || vMsg.msg || vMsg.message, date: Date.now() };
  pushDedicaceToFirebase(payload)
    .then(() => {
      // succès UI
      localStorage.setItem("dedicaceDate", new Date().toISOString().split("T")[0]);
      dedicaceForm.reset();
      if (charCountEl) charCountEl.textContent = `${MAX_MESSAGE_CHARS} caractères restants`;
      showLocalDedicace(payload);
    })
    .catch(err => { console.error(err); alert("Erreur lors de l'envoi."); });
});
