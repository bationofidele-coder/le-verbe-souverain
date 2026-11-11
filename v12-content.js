// ===== Le Verbe Souverain · v12 · contenus pédagogiques =====
// Consignes complètes (quoi, pourquoi, comment, exemple), charpente du discours, vidéos françaises, bibliothèque.
window.V12C = (function () {
"use strict";

// ---------- La charpente souveraine : rappelée avant chaque prise de parole ----------
const STRUCTURE = {
  t: "La charpente souveraine",
  steps: [
    ["L’accroche", "Une question, un chiffre ou une image. Puis une seconde de silence."],
    ["L’annonce", "Votre idée maîtresse en une phrase, et le plan en trois points, comptés sur les doigts."],
    ["Le développement", "Trois points, chacun avec une preuve : un chiffre, un exemple vécu ou un témoignage."],
    ["La chute", "Une phrase courte que l’on peut répéter. Puis silence : ne reprenez pas la parole."]
  ],
  say: "Rappel de la charpente souveraine, à garder pour toute prise de parole. Un : l’accroche, une question, un chiffre ou une image, puis une seconde de silence. Deux : l’annonce, votre idée maîtresse en une phrase, et trois points comptés sur les doigts. Trois : le développement, un point, une preuve, et ainsi de suite. Quatre : la chute, une phrase courte que l’on retient, puis le silence.",
  ex: {
    ouvrir: "Exemple : « Six kilomètres. C’est la distance qu’une mère de Kayes parcourt chaque matin pour de l’eau. » Silence. « Je suis agronome, et je défends une idée : la sécurité alimentaire se gagne au village. Trois raisons : la terre, l’eau, la confiance. » Puis les trois points, et la chute : « L’eau d’abord. Tout le reste suit. »",
    argumenter: "Exemple en PREP : « Position : investir dans l’agriculture familiale est le meilleur placement du Sahel. Raison : elle nourrit sept personnes sur dix. Exemple : à Kaffrine, deux cent quarante femmes ont doublé leurs rendements en trois saisons. Position, plus forte : si l’on veut la paix, on finance les champs. »",
    raconter: "Exemple en cinq temps : « Situation : juillet, Kaffrine, un puits à sec. Déclencheur : les femmes refusent de partir. Obstacle : le bailleur veut arrêter. Choix : nous avons proposé un forage à moitié prix, financé par la coopérative. Leçon : ce sont les gens qui tiennent un projet, pas le budget. »",
    negocier: "Exemple : « Je comprends la contrainte du siège. Qu’est-ce qui, pour vous, doit absolument être préservé ? Si je vous suis, c’est le calendrier. Alors je propose deux options : un report des activités secondaires, ou un cofinancement communal. Dans les deux cas, les familles gardent l’essentiel. »",
    improviser: "Exemple : « La patience est une force. » Silence. « Trois preuves : le baobab met dix ans à donner, la coopérative met trois saisons à doubler, et moi, trente jours à poser ma voix. » Chute : « La patience n’attend pas : elle prépare. »"
  }
};

// ---------- Consignes complètes : ce que je fais, pourquoi, comment, exemple ----------
const C = {
  meteo: { what: "Votre trac, de zéro à dix.", why: "On le mesure maintenant et à la fin : le chemin parcouru se voit en chiffres.", how: "Une seule touche, sans réfléchir." },
  souffle: { what: "Respiration guidée, debout.", why: "Une voix posée part du ventre ; le calme se construit avant de parler.", how: "Inspirez par le nez sur cinq temps, expirez par la bouche sur cinq temps, en suivant le cercle. Une main sur le ventre : c’est elle qui bouge, pas les épaules." },
  forge: { what: "La Forge : des phrases d’articulation.", why: "Les consonnes nettes, P, T, K, donnent de l’autorité à chaque mot. C’est le crayon de l’orateur.", how: "Pour chaque phrase : écoutez le modèle, puis, au top, répétez-la trois fois : lentement, normalement, puis vite et net. Exagérez les consonnes. Je mesure la netteté par la transcription.", ex: "Exemple : « Trois gros rats gris » : d’abord lent, « Trois… gros… rats… gris », puis normal, puis rapide sans avaler le « gr »." },
  mots3: { what: "Trois mots nouveaux.", why: "Un orateur convainc avec le mot juste. Trois mots par jour, c’est quinze par semaine.", how: "Écoutez chaque mot et sa définition. Puis, au top, dites une phrase complète qui l’emploie, dans votre contexte professionnel. Placez-en au moins un dans votre prise de parole : la transcription le vérifiera.", ex: "Exemple avec « aplomb » : « Il a répondu au bailleur avec un aplomb tranquille. »" },
  empan: { what: "L’empan de mémoire.", why: "Parler sans notes demande une mémoire de travail entraînée : c’est elle qui porte votre plan.", how: "Des mots vont défiler. Reliez-les en une histoire absurde, puis, au top, récitez-les dans l’ordre.", ex: "Exemple : baobab, pirogue, tambour : « Un baobab monte dans une pirogue en jouant du tambour. »" },
  video: { what: "Une courte vidéo de maître, en français.", why: "Voir un spécialiste faire, puis le dire avec vos mots : c’est ainsi que la technique s’installe.", how: "Regardez la vidéo. Puis, au top, dites en trente secondes ce que vous retenez et comment vous l’appliquerez dans votre prise tout à l’heure." },
  prescrit: { what: "Votre exercice ciblé.", why: "Il vise la cause de votre point faible, mesuré sur vos dernières prises, juste avant la prise filmée.", how: "Écoutez la consigne de l’exercice. Au top, faites-le à voix haute. Je l’enregistre et je l’évalue au débrief." },
  prise1: { what: "La prise de parole filmée du jour.", why: "C’est le cœur de la séance : tout ce qui précède sert ce moment.", how: "Écoutez le sujet et la technique du jour, puis la charpente. Au top, parlez à l’objectif, debout, pieds ancrés. Le minuteur vous indique le temps visé ; je coupe vingt secondes après." },
  prise2: { what: "Deuxième prise, même sujet.", why: "On progresse en refaisant tout de suite avec un seul conseil en tête.", how: "Appliquez un seul conseil : celui de votre priorité de la semaine. Rien d’autre ne change." },
  question: { what: "La question piège.", why: "Garder le calme et la structure sous la pression, c’est la marque d’un maître.", how: "Écoutez la question. Au top : reconnaissez-la, respirez trois secondes, recadrez, répondez en trois points, concluez. Jamais de « euh » : un silence à la place.", ex: "Exemple : « Votre parcours est varié : savez-vous ce que vous voulez ? » Réponse : « Question légitime. » Silence. « Mon fil rouge n’a jamais changé : la sécurité alimentaire. Trois terrains, un seul objectif. »" },
  sim: { what: "La négociation.", why: "Négocier sur les intérêts, pas sur les positions : c’est ce qui préserve l’accord et la relation.", how: "Écoutez votre interlocutrice et ses relances. Au top, répondez en une seule prise de deux minutes : reconnaître sa contrainte, poser une question ouverte, reformuler, proposer deux options, défendre l’essentiel, préserver la relation." },
  roulette: { what: "La roulette d’improvisation.", why: "Improviser vite avec une charpente, c’est ne plus jamais être pris de court.", how: "Trois sujets tirés au sort. Pour chacun : quelques secondes de préparation, puis au top, parlez. Idée maîtresse d’abord, trois points, chute." },
  debrief: { what: "Le débrief de votre coach.", why: "Trois à cinq minutes pour entendre vos erreurs, vos points faibles, la correction et la marche à suivre.", how: "Écoutez. Vous pourrez réécouter, et revoir chaque prise annotée dans la vidéothèque." },
  bilan: { what: "Le bilan.", why: "On mesure, on compare au début, on fixe la priorité de demain.", how: "Votre trac maintenant, puis votre diagnostic." }
};

// ---------- Les exercices ciblés, expliqués ----------
const DRILL = {
  relais: { what: "Le relais du silence.", why: "Chaque « euh » affaiblit l’autorité ; un silence la renforce.", how: "Une minute sur votre métier. À chaque envie de dire « euh », fermez la bouche, inspirez, puis continuez. Le silence remplace l’hésitation.", ex: "« Notre projet couvre trois communes… » silence « …et chacune a son comité. »" },
  avant: { what: "L’idée maîtresse d’abord.", why: "Un auditoire décroche s’il ne sait pas où l’on va.", how: "Pensez votre idée maîtresse en silence, puis dites-la en premier, en une phrase. Ensuite seulement, les raisons.", ex: "« Il faut financer les champs, pas les camions. Pourquoi ? Trois raisons… »" },
  metronome: { what: "Le métronome.", why: "Un débit régulier rassure ; les pauses donnent du poids.", how: "À chaque bip, une phrase complète. Puis respirez jusqu’au bip suivant. Ni plus vite, ni plus lent.", ex: "Bip. « La coopérative a doublé ses rendements. » Respiration. Bip. « En trois saisons. »" },
  intensites: { what: "Les trois intensités.", why: "Une voix qui varie tient l’attention ; une voix plate endort.", how: "Dites la même phrase en murmure, puis en conversation, puis comme à la tribune, sans crier : le son vient du ventre.", ex: "« Nous ne lâcherons pas les familles », trois fois, trois intensités." },
  ancrage: { what: "Ancrage et gestes au cadre.", why: "Un corps immobile donne de la crédibilité ; les mains qui parlent donnent de la vie.", how: "Pieds à la largeur du bassin, immobiles. Seules les mains bougent, entre la taille et les épaules. Parlez une minute de votre projet.", ex: "Comptez vos trois points sur les doigts, à hauteur de poitrine." },
  regard: { what: "Le regard qui finit la phrase.", why: "L’auditoire se sent inclus quand le regard reste.", how: "Terminez chaque phrase les yeux dans l’objectif. Pensez en regardant l’objectif, puis parlez.", ex: "« Ce que je vous propose… » regard tenu « …tient en un mot : confiance. »" },
  ouvertures: { what: "Trois ouvertures.", why: "Les dix premières secondes décident de l’écoute.", how: "Le même sujet, ouvert trois fois : une question, un chiffre, une image. Dix secondes chacune, puis une seconde de silence.", ex: "Question : « Savez-vous combien coûte un puits à sec ? » Chiffre : « Six kilomètres chaque matin. » Image : « Une calebasse vide sur une tête d’enfant. »" },
  prep: { what: "La charpente PREP.", why: "Position, raison, exemple, position : la structure la plus robuste pour convaincre en une minute.", how: "Annoncez votre position. Donnez une raison. Un exemple concret. Puis la position, plus forte.", ex: "« Il faut investir dans les semences locales. Parce qu’elles résistent à la sécheresse. À Kaffrine, elles ont tenu quand les hybrides ont brûlé. Oui, il faut investir dans les semences locales. »" },
  entonnoir: { what: "L’entonnoir.", why: "Savoir dire la même chose en soixante, trente, puis dix secondes, c’est savoir hiérarchiser.", how: "Votre projet en soixante secondes. Puis en trente. Puis en dix. À chaque fois, gardez l’essentiel.", ex: "Dix secondes : « Nous aidons trois communes à produire leur nourriture. Résultat : plus deux récoltes par an. »" },
  motimpose: { what: "Les mots imposés.", why: "Placer un mot précis au bon moment, c’est la maîtrise du lexique.", how: "Trois mots imposés. Parlez une minute en les employant tous, justement.", ex: "Avec « aplomb, sobriété, exorde » : « Mon exorde sera sobre, et mon aplomb fera le reste. »" },
  recit5: { what: "Le récit en cinq temps.", why: "Une histoire bien menée prouve mieux qu’un argument.", how: "Situation, déclencheur, obstacle, votre choix, une seule leçon à la fin. Au présent, avec un détail que l’on voit.", ex: "« Juillet, Kaffrine, un puits à sec. Les femmes refusent de partir… »" },
  objections: { what: "Certes, cependant, c’est pourquoi.", why: "La concession désarme ; la conséquence emporte.", how: "Face à une objection : « Certes… » reconnaissez. « Cependant… » apportez le fait. « C’est pourquoi… » concluez.", ex: "« Certes, les projets durent trois ans. Cependant, les coopératives qu’ils créent durent vingt ans. C’est pourquoi nous formons avant de financer. »" },
  interets: { what: "La question ouverte.", why: "On ne négocie pas sur la position de l’autre, mais sur ce qu’il protège.", how: "Face à une position, ne proposez rien : posez une question ouverte qui révèle l’intérêt. Puis reformulez.", ex: "« Qu’est-ce qui vous inquiète le plus dans ce calendrier ? » puis « Si je vous suis, c’est le rapport au siège. »" },
  recadrage: { what: "Le recadrage du trac.", why: "Le trac et l’enthousiasme ont la même chimie : seule l’étiquette change.", how: "Trois souffles lents. Puis dites à voix haute : « Je suis enthousiaste. » Puis votre première phrase.", ex: "« Je suis enthousiaste. Bonjour à tous, six kilomètres… »" },
  palais: { what: "Le palais de mémoire.", why: "Trois idées rangées dans trois pièces ne se perdent jamais.", how: "Placez vos trois idées dans trois pièces de votre maison. Parcourez-les en parlant.", ex: "Entrée : la terre. Salon : l’eau. Cuisine : la confiance." },
  rapide: { what: "Le démarrage rapide.", why: "Trois secondes pour commencer : c’est le réflexe de l’improvisateur.", how: "Au top, trois secondes, puis parlez trente secondes sur le sujet donné. Idée maîtresse d’abord.", ex: "Sujet : le marché de votre quartier. « Le marché, c’est la bourse du village. Trois preuves… »" },
  humour: { what: "L’erreur racontée avec le sourire.", why: "L’humour sur soi crée la proximité sans perdre l’autorité.", how: "Racontez une erreur vraie, en trente secondes, en terminant par ce qu’elle vous a appris.", ex: "« J’ai présenté un budget en dollars à un ministre qui comptait en francs. Depuis, je commence par la monnaie. »" },
  ecoute: { what: "La restitution fidèle.", why: "Écouter, c’est pouvoir redire les faits dans l’ordre.", how: "Écoutez le texte, puis redites les trois faits, dans l’ordre, sans ajouter.", ex: "« Deux cent quarante femmes, trois saisons, rendements doublés. »" }
};

// ---------- Vidéos françaises, vérifiées, classées par jour ----------
// day 1 ouvrir/structure, 2 argumenter, 3 raconter, 4 relation/négociation, 5 arène/confiance/corps
const VIDEOS = [
  { id: "x9asd81UmIc", t: "Oser parler en public", who: "Bertrand Périer", min: 4, day: 5, why: "Parler en public se travaille comme un instrument ; un mot nouveau par jour.", q: "Quelle est la première mission que donne Bertrand Périer ?" },
  { id: "PwIfCRbVKY0", t: "La communication non verbale", who: "Bertrand Périer", min: 5, day: 5, why: "Posture, regard, gestes, silence : plus de la moitié du message passe par le corps.", q: "Que retenez-vous sur le regard et le silence ?" },
  { id: "j9bxkxLtZBE", t: "Gérer son trac", who: "Bertrand Périer", min: 5, day: 5, why: "Le trac est normal ; la visualisation et la respiration l’apprivoisent.", q: "Quelle technique allez-vous utiliser avant votre prochaine prise ?" },
  { id: "mPvcBSHIo04", t: "Structurer son discours", who: "Bertrand Périer", min: 5, day: 1, why: "Capter, raconter, argumenter, réfuter, conclure : la structure rassure et convainc.", q: "Redites les cinq étapes de la structure." },
  { id: "VPLgoY0hqmc", t: "Apprendre à improviser", who: "Bertrand Périer", min: 5, day: 5, why: "L’improvisation naît d’une préparation ; la parole doit naître dans l’instant.", q: "Comment improviser sans dire n’importe quoi ?" },
  { id: "ciPxDfg4mxk", t: "Prendre la parole en réunion", who: "Bertrand Périer", min: 4, day: 4, why: "Préparer, ne jamais quitter une réunion sans avoir parlé, accrocher dès la première phrase.", q: "Que ferez-vous à votre prochaine réunion ?" },
  { id: "zsLnoxl3kL0", t: "Argumenter son discours", who: "Bertrand Périer", min: 4, day: 2, why: "Trouver des arguments dans toutes les rubriques, les formuler, bannir les tics.", q: "Quelle méthode pour trouver des arguments ?" },
  { id: "UTz_IqqhbAg", t: "« La parole est un sport de combat »", who: "Bertrand Périer, TV5 Monde", min: 6, day: 1, why: "Structurer et fluidifier sa parole : l’essentiel en six minutes.", q: "Quel conseil appliquerez-vous dès aujourd’hui ?" },
  { id: "u-fWSoBNf8o", t: "Les pouvoirs de la rhétorique", who: "Clément Viktorovitch, TEDx", min: 11, day: 2, to: "6:00", why: "Ce que la rhétorique peut faire, et pourquoi la maîtriser protège.", q: "En quoi la rhétorique est-elle un pouvoir ?" },
  { id: "zdchnvrLOMU", t: "La rhétorique du « mais »", who: "Clément Viktorovitch", min: 4, day: 2, why: "Comment une conjonction inverse le poids d’une phrase.", q: "Donnez un exemple de « mais » qui retourne une idée." },
  { id: "2hn57xFz-90", t: "La rhétorique de François Hollande", who: "Clément Viktorovitch", min: 8, day: 4, to: "5:00", why: "Analyse d’une parole publique : ce qui marche, ce qui échoue.", q: "Quel procédé avez-vous repéré ?" },
  { id: "I2UxeEUzs54", t: "La rhétorique d’Orelsan", who: "Clément Viktorovitch", min: 5, day: 3, why: "Un texte rhétorique analysé : images, rythme, anaphores.", q: "Quelle figure de style retenez-vous ?" },
  { id: "IiDybHUTeMo", t: "La prise de parole pour les débutants", who: "Clément Bergon", min: 7, day: 5, why: "Cinq conseils : supports, voix, posture, regard.", q: "Lequel des cinq conseils vous manque le plus ?" },
  { id: "9zRL5wLHTeA", t: "Comment commencer un discours", who: "Clément Bergon", min: 7, day: 1, why: "Sept façons d’accrocher dès la première phrase.", q: "Quelle accroche choisirez-vous pour votre prise ?" },
  { id: "D_s8zkxhOIM", t: "Le plan du discours en cinq parties", who: "Aguere", min: 8, day: 1, why: "Exorde, narration, argumentation, réfutation, péroraison.", q: "Que met-on dans la péroraison ?" },
  { id: "DvJ3UzREdOc", t: "Les habitudes avant de parler", who: "Aguere", min: 8, day: 5, why: "Un rituel de préparation : structure, cohérence cardiaque, articulation, énergie, silence.", q: "Quel sera votre rituel ?" },
  { id: "GNFVIX2B7XI", t: "Le silence dans le discours", who: "Aguere", min: 9, day: 1, why: "Cinq usages du silence : avant, après, pour souligner, ralentir, structurer.", q: "Où placerez-vous un silence dans votre prise ?" },
  { id: "RNalJpVleMI", t: "Structurer ses pensées sur le moment", who: "Laetitia Valstar", min: 17, day: 2, to: "12:00", why: "Trois structures pour parler clair sous pression : règle de trois, PREP, les trois W.", q: "Décrivez la méthode PREP avec vos mots." },
  { id: "aKhhDDVzRl0", t: "Parler avec plus de confiance", who: "Laetitia Valstar", min: 14, day: 5, to: "10:00", why: "Pauses, règle des trois secondes, voix variée, bon début.", q: "Quel secret allez-vous tester ?" },
  { id: "2A6fTm009fo", t: "Gestes et posture pour parler en public", who: "Laetitia Valstar", min: 13, day: 5, to: "9:00", why: "Posture ouverte, contact visuel, gestes utiles, visage.", q: "Qu’allez-vous changer dans votre posture ?" },
  { id: "VTeb5Ygz5G4", t: "Le pouvoir du silence", who: "Laetitia Valstar", min: 26, day: 3, to: "10:00", why: "Le silence crée l’autorité et la connexion.", q: "Pourquoi avons-nous peur du silence ?" },
  { id: "yDzKRFn0Oko", t: "Cinq habitudes pour être plus éloquent", who: "Laetitia Valstar", min: 21, day: 2, to: "12:00", why: "Miroir vocal, lexique, cadre de clarté, pause de deux secondes, drill quotidien.", q: "Quelle habitude adopterez-vous cette semaine ?" },
  { id: "2E_Kx-MBlEA", t: "Les six règles pour avoir confiance en soi", who: "Sally, TEDx Bruxelles", min: 15, day: 5, to: "10:00", why: "Développement personnel : la confiance se construit par des règles simples.", q: "Quelle règle vous parle le plus ?" },
  { id: "wi0AswO93I4", t: "Avoir confiance en soi : six faits scientifiques", who: "David Laroche", min: 8, day: 5, why: "Ce que la science dit de la confiance, et comment la bâtir.", q: "Quel fait vous a surpris ?" },
  { id: "GjF5n_RzbVI", t: "Travailler son estime de soi", who: "Christophe André", min: 8, day: 4, why: "Être en paix avec soi pour se tourner vers les autres.", q: "Quelle est la différence entre estime et confiance ?" },
  { id: "xmiVS6xKMzM", t: "Maîtriser sa voix : la respiration", who: "Abyale Nan Nguema, Grand Oral", min: 2, day: 1, why: "Deux minutes d’exercice de souffle pour poser la voix.", q: "Refaites l’exercice en l’expliquant." },
  { id: "fixbdn-TGqE", t: "Comment améliorer sa diction", who: "Jean Sommer", min: 1, day: 1, why: "Une astuce de trente secondes pour une élocution nette.", q: "Quelle est l’astuce ?" },
  { id: "ZeOtxDaSCYA", t: "L’exercice du bouchon", who: "Jean Sommer", min: 1, day: 3, why: "Muscler les consonnes, mordre les voyelles.", q: "Essayez l’exercice et décrivez l’effet." },
  { id: "LYUP8_S_Os4", t: "Dix clés pour être un orateur éloquent", who: "Jean Sommer", min: 1, day: 2, why: "Dix repères en une minute.", q: "Citez trois des dix clés." },
  { id: "4ZU4Y3PrxoA", t: "Trois conseils pour bien respirer et mieux parler", who: "Jean Sommer", min: 5, day: 3, why: "Reprendre le contrôle du souffle pour libérer la parole.", q: "Quel conseil sur la respiration retenez-vous ?" },
  { id: "Tv2KZc79kn0", t: "Où placer ses mains", who: "Sophie Dussart", min: 2, day: 4, why: "Deux minutes pour savoir quoi faire de ses mains.", q: "Où mettrez-vous vos mains désormais ?" },
  { id: "Ayu_cwwu-Ts", t: "Les six gestes à faire", who: "Nicolas Mel", min: 4, day: 3, why: "Une typologie des gestes utiles à l’oral.", q: "Nommez deux gestes utiles." },
  { id: "21nT07TXnUM", t: "Préparer un discours en cinq minutes", who: "Nicolas Mel", min: 4, day: 2, why: "Une méthode rapide de préparation.", q: "Quelles sont les étapes de la préparation rapide ?" },
  { id: "FdA3PAPZLzY", t: "Comment faire un storytelling", who: "Nicolas Mel", min: 5, day: 3, why: "Les ressorts d’une histoire qui tient l’auditoire.", q: "Quel est l’ingrédient clé d’une histoire ?" },
  { id: "0WxPkhch8W4", t: "La posture de l’orateur", who: "Loïc Filibert", min: 4, day: 4, why: "L’ancrage, fondation de la voix.", q: "Décrivez la posture d’ancrage." },
  { id: "rO46_mv8hdw", t: "Six conseils d’un ex-négociateur du RAID", who: "Brut", min: 4, day: 4, why: "Négocier sans crier : écoute, calme, reformulation.", q: "Quel conseil du négociateur appliquerez-vous ?" },
  { id: "YFb-_rhe3Us", t: "Négocier sans céder : la méthode Harvard", who: "Katana", min: 16, day: 4, to: "9:00", why: "La négociation raisonnée : intérêts, options, critères.", q: "Que signifie négocier sur les intérêts ?" },
  { id: "8XYBrucdhWU", t: "L’art de la négociation au quotidien", who: "Technique de vente", min: 13, day: 4, to: "8:00", why: "Préparer, questionner, créer des points d’accord.", q: "Qu’est-ce qu’une question calibrée ?" },
  { id: "GY7BORINTJE", t: "La puissance du silence", who: "Amélie Blanckaert, TEDx Chantilly", min: 16, day: 1, to: "8:00", why: "Le silence, clé des discours qui ont marqué l’histoire.", q: "Quel discours célèbre est cité, et pourquoi ?" },
  { id: "cZzb_20vc3E", t: "Gérer le trac avant de parler", who: "Christine Morlet", min: 5, day: 3, why: "La respiration abdominale en quatre temps, dix minutes avant.", q: "Redites les quatre temps de la respiration." }
];
function videoFor(week, day) {
  const pool = VIDEOS.filter(v => v.day === day); if (!pool.length) return VIDEOS[0];
  return pool[(week - 1) % pool.length];
}

// ---------- Bibliothèque : les meilleures ressources, du monde entier ----------
const BIBLIO = [
  { k: "Fondations", items: [
    ["Aristote, Rhétorique", "Ethos, logos, pathos : les trois piliers de toute persuasion, toujours valables."],
    ["Cicéron, De l’orateur", "Les cinq canons : inventer, disposer, formuler, mémoriser, dire."],
    ["Bertrand Périer, La parole est un sport de combat", "La méthode d’Eloquentia : préparation, structure, corps, trac."],
    ["Clément Viktorovitch, Le pouvoir rhétorique", "Convaincre et décrypter : figures, cadrages, pièges."]
  ] },
  { k: "Structure et récit", items: [
    ["Chris Anderson, TED Talks", "Une idée, un fil, une chute : comment les meilleures conférences sont construites."],
    ["Carmine Gallo, Talk Like TED", "Les ressorts communs des discours qui marquent : émotion, nouveauté, mémorabilité."],
    ["Marshall Ganz, Public Narrative", "Histoire de soi, histoire de nous, histoire du moment : le récit qui engage."]
  ] },
  { k: "Voix et corps", items: [
    ["Jean Sommer, La voix du leader (chaîne YouTube)", "Diction, souffle, projection : exercices courts et concrets."],
    ["Amy Cuddy, Presence", "Le corps influence l’esprit : posture et confiance."]
  ] },
  { k: "Négociation et questions difficiles", items: [
    ["Fisher et Ury, Comment réussir une négociation", "La négociation raisonnée : intérêts, options, critères objectifs, meilleure solution de repli."],
    ["Chris Voss, Ne coupez jamais la poire en deux", "L’écoute tactique, l’étiquetage, les questions calibrées."],
    ["La technique du pont (bridging)", "Reconnaître, faire le pont, communiquer : répondre sans esquiver."]
  ] },
  { k: "Confiance et discipline", items: [
    ["Christophe André, Imparfaits, libres et heureux", "L’estime de soi, sans complaisance ni dureté."],
    ["Anders Ericsson, Peak", "La pratique délibérée : mesurer, corriger, répéter. Le principe de cette application."]
  ] }
];

return { STRUCTURE, C, DRILL, VIDEOS, videoFor, BIBLIO };
})();
