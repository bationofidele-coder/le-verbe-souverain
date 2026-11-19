// ===== Le Verbe Souverain · v15 · le contenu du coach =====
// Méthodes, compétences, planning de la semaine et banques de secours (si Claude ne répond pas).
window.V15C = (function () {
"use strict";

// ---------------------------------------------------------------------
// LES QUATRE MÉTHODES DE PRISE DE PAROLE
// ---------------------------------------------------------------------
const M = {
  prep: {
    t: "PREP", long: "Position · Raison · Exemple · Position", sec: 60,
    use: "Répondre en une minute : question piège, réunion, « Pourquoi vous ? ».",
    parts: [
      ["Position", "Votre réponse, en une phrase, dès la première seconde.", "« Ma position est claire : … »"],
      ["Raison", "Une seule raison, la plus forte.", "« Pourquoi ? Parce que… »"],
      ["Exemple", "Un fait concret : un chiffre, un lieu, un nom.", "« Par exemple, à … »"],
      ["Position", "La position redite, plus forte, avec ce que vous demandez.", "« C’est pourquoi… »"]
    ],
    end: "Finissez sur la position, jamais sur l’exemple. Puis silence.",
    lit: "Barbara Minto, « Le principe de la pyramide » (1987) : la conclusion d’abord. L’auditoire retient surtout le début et la fin (effet de primauté et de récence, Murdock, 1962)."
  },
  psa: {
    t: "Problème · Solution · Action", long: "Accroche · Problème · Causes · Solution · Vision · Appel", sec: 90,
    use: "Plaider et mobiliser : bailleurs, élus, communautés, comités.",
    parts: [
      ["Accroche", "Un chiffre ou une image qui frappe.", "« Chaque matin… »"],
      ["Problème", "Le constat et ce qu’il coûte aux gens.", "« Le problème est simple : … »"],
      ["Causes", "Deux causes, pas plus.", "« Pourquoi ? D’abord… ensuite… »"],
      ["Solution", "Ce que vous proposez : concret et chiffré.", "« Notre réponse : … »"],
      ["Vision", "Ce qui change si l’on agit.", "« Imaginez… »"],
      ["Appel", "Une demande précise : qui, quoi, quand.", "« Je vous demande… »"]
    ],
    end: "Terminez par une demande précise et datée. Jamais par « merci de votre attention ».",
    lit: "Alan Monroe (université Purdue, 1935) : la séquence motivée (attention, besoin, solution, vision, action) reste la structure de plaidoyer la plus enseignée."
  },
  recit: {
    t: "Le récit en 5 temps", long: "Situation · Déclencheur · Obstacle · Choix · Leçon", sec: 90,
    use: "Émouvoir et prouver par le vécu : ouverture, témoignage, « Parlez-moi d’un échec ».",
    parts: [
      ["Situation", "Où, quand, qui. Un détail que l’on voit.", "« Juillet 2019, à … »"],
      ["Déclencheur", "Ce qui arrive, soudain.", "« Et puis, un matin… »"],
      ["Obstacle", "La difficulté, la tension.", "« Le problème, c’est que… »"],
      ["Choix", "Ce que vous décidez et faites.", "« Alors j’ai décidé de… »"],
      ["Leçon", "Une phrase à retenir, reliée à votre public.", "« Ce jour-là, j’ai compris que… »"]
    ],
    end: "La leçon en une phrase, puis le lien avec ceux qui vous écoutent.",
    lit: "Green et Brock (2000) : plus l’auditoire est « transporté » par un récit, plus ses opinions bougent dans le sens de l’histoire. Structure issue de la pyramide de Freytag (1863)."
  },
  tas: {
    t: "Thèse · Antithèse · Synthèse", long: "Question · Thèse · Antithèse · Synthèse · Conclusion", sec: 90,
    use: "Débattre, négocier, répondre à un contradicteur.",
    parts: [
      ["Question", "Le débat posé en une question.", "« Faut-il… ? »"],
      ["Thèse", "Le premier point de vue, avec son meilleur argument.", "« D’un côté… »"],
      ["Antithèse", "L’objection la plus forte, dite honnêtement.", "« Certes… mais… »"],
      ["Synthèse", "Votre position, qui dépasse les deux.", "« En réalité, la vraie question est… »"],
      ["Conclusion", "Position nette et ouverture.", "« C’est pourquoi… »"]
    ],
    end: "Ne restez pas au milieu : la synthèse tranche.",
    lit: "Méta-analyses d’Allen (1991) et d’O’Keefe (1999) : un message qui expose l’objection puis la réfute convainc davantage qu’un message à sens unique."
  }
};
// L'entretien d'embauche : chaque question appelle une méthode
const ENTRETIEN = [
  { q: "Présentez-vous.", m: "ppf", t: "Présent · Passé · Futur", sec: 90, parts: [["Présent", "Qui vous êtes, votre poste, un résultat chiffré.", "« Je suis agronome, et j’ai… »"], ["Passé", "Deux étapes qui expliquent votre parcours.", "« Avant cela… »"], ["Futur", "Pourquoi ce poste est la suite logique.", "« Aujourd’hui, je veux… »"]], end: "Finissez sur le poste visé, pas sur le passé." },
  { q: "Pourquoi vous, et personne d’autre ?", m: "prep" },
  { q: "Pourquoi avez-vous postulé ?", m: "psa", t: "Leur défi · Mon apport · Mes 90 jours", sec: 75, parts: [["Leur défi", "Le défi de l’organisation, montré que vous l’avez compris.", "« Votre programme doit… »"], ["Mon apport", "Ce que vous apportez de rare, avec une preuve.", "« J’apporte… La preuve : … »"], ["Mes 90 jours", "Ce que vous ferez concrètement en arrivant.", "« Dans mes trois premiers mois… »"]], end: "Terminez par votre envie, en une phrase." },
  { q: "Parlez-moi d’un échec.", m: "recit" },
  { q: "Vous manquez d’expérience dans ce domaine.", m: "tas" },
  { q: "Quel est votre principal défaut ?", m: "tas" }
];
const ENTRETIEN_LIT = "Les entretiens structurés prédisent mieux la réussite que les entretiens libres (Schmidt et Hunter, 1998) : le recruteur attend une réponse structurée et des preuves. La méthode STAR (Situation, Tâche, Action, Résultat) est la version recruteur du récit.";

// ---------------------------------------------------------------------
// LES COMPÉTENCES (blocs de 6 minutes)
// ---------------------------------------------------------------------
const SK = {
  methode: { t: "MÉTHODE", ic: "🏛️", c: "pensee" },
  entretien: { t: "ENTRETIEN", ic: "💼", c: "confiance" },
  memoire: { t: "MÉMOIRE", ic: "🧠", c: "memoire", lit: "Dresler et al., Neuron (2017) : six semaines d’entraînement à la méthode des lieux ont fait passer des débutants de 26 à 62 mots retenus, avec des effets encore visibles quatre mois plus tard." },
  vocab: { t: "VOCABULAIRE", ic: "📜", c: "vocab", lit: "Roediger et Karpicke, Psychological Science (2006) : se tester sur un mot le grave bien mieux que le relire. Chaque mot reviendra donc en rappel dans les séances suivantes." },
  culture: { t: "CULTURE GÉNÉRALE", ic: "🌍", c: "culture", lit: "Effet de génération (Slamecka et Graf, 1978) : on retient mieux ce que l’on reformule avec ses propres mots. D’où le récit, le quiz, puis votre explication." },
  corps: { t: "CORPS ET REGARD", ic: "🧍🏾", c: "corps", lit: "Goldin-Meadow et Alibali, Annual Review of Psychology (2013) : les gestes ne décorent pas la parole, ils aident à penser et à se faire comprendre." },
  nego: { t: "NÉGOCIATION", ic: "🤝", c: "nego", lit: "Fisher et Ury, « Getting to Yes » (Harvard, 1981) : séparer les personnes du problème, négocier sur les intérêts et non sur les positions, inventer des options, s’appuyer sur des critères objectifs." },
  voix: { t: "VOIX ET SILENCES", ic: "🎙️", c: "verbal", lit: "Niebuhr et al., Computers in Human Behavior (2016) : les orateurs jugés charismatiques varient davantage leur hauteur de voix et marquent des pauses nettes." },
  impro: { t: "IMPROVISATION", ic: "⚡", c: "impro", lit: "Improviser n’est pas inventer sans plan : c’est appliquer un plan simple très vite. L’idée maîtresse d’abord, puis trois points (principe de la pyramide, Minto)." },
  attention: { t: "ATTENTION", ic: "🎯", c: "concentration", lit: "Tâche n-back (Jaeggi et al., PNAS, 2008) : elle entraîne la mémoire de travail. Les méta-analyses (Melby-Lervåg et Hulme, 2013 et 2016) montrent surtout des progrès sur des tâches proches : on l’utilise ici comme échauffement de la concentration, sans promesse miracle." },
  trac: { t: "TRAC SOUS PRESSION", ic: "🔥", c: "pression", lit: "Brooks, Journal of Experimental Psychology (2014) : se dire « je suis enthousiaste » plutôt que « je me calme » améliore la performance à l’oral. Balban et al., Cell Reports Medicine (2023) : le soupir physiologique (double inspiration, longue expiration) apaise vite." },
  rappel: { t: "RAPPEL DE LA SEMAINE", ic: "🔁", c: "memoire", lit: "Effet de test (Roediger et Karpicke, 2006) et répétition espacée : retrouver de mémoire, à quelques jours d’intervalle, est la façon la plus sûre de retenir." }
};
// Le planning de la semaine : une méthode et deux compétences par séance
const WEEK_PLAN = {
  1: [["methode", "prep"], ["memoire"], ["vocab"]],
  2: [["methode", "psa"], ["corps"], ["culture"]],
  3: [["methode", "recit"], ["nego"], ["voix"]],
  4: [["methode", "tas"], ["impro"], ["attention"]],
  5: [["entretien"], ["trac"], ["rappel"]]
};

// ---------------------------------------------------------------------
// SUJETS ET GUIDES DE SECOURS (Claude les génère d'ordinaire)
// ---------------------------------------------------------------------
const SUBJ = {
  prep: [
    { s: "Faut-il investir d’abord dans les semences locales plutôt que dans les engrais importés ?", g: ["Oui : les semences locales d’abord, car elles rendent les paysans souverains.", "Elles résistent mieux à la sécheresse et ne créent aucune dépendance.", "À Kaffrine, en 2021, les variétés locales ont tenu quand les hybrides ont brûlé.", "C’est pourquoi je demande que la moitié du budget intrants aille aux semences locales."] },
    { s: "Les jeunes du Sahel doivent-ils rester à la terre ?", g: ["Oui, à condition que la terre les paie.", "L’agriculture emploie la majorité des actifs, mais rapporte trop peu.", "Une coopérative de jeunes à Louga a doublé son revenu en transformant son oignon sur place.", "C’est pourquoi il faut financer la transformation, pas seulement la production."] },
    { s: "L’aide humanitaire entretient-elle la dépendance ?", g: ["Elle l’entretient quand elle dure sans plan de sortie.", "Une aide sans date de fin remplace l’État au lieu de le renforcer.", "Les programmes de cash qui financent les marchés locaux ont, eux, relancé l’économie des villages.", "C’est pourquoi toute aide doit annoncer, dès le premier jour, comment elle s’arrête."] },
    { s: "Faut-il enseigner dans les langues nationales à l’école primaire ?", g: ["Oui, au moins les trois premières années.", "Un enfant apprend à lire plus vite dans la langue qu’il parle.", "Les classes bilingues en wolof et en français obtiennent de meilleurs résultats en lecture.", "C’est pourquoi je plaide pour un primaire bilingue partout."] }
  ],
  psa: [
    { s: "Convaincre un bailleur de financer des forages solaires dans 10 villages", g: ["Six kilomètres : la distance que des femmes de ces villages parcourent chaque matin pour l’eau.", "Le manque d’eau prive les filles d’école et les champs d’irrigation.", "Les pompes diesel coûtent trop cher, et personne n’est formé à les entretenir.", "Dix forages solaires, entretenus par des comités formés : 180 000 euros.", "Dans deux ans, les filles à l’école et deux récoltes par an.", "Je vous demande de valider ce financement avant la fin du trimestre."] },
    { s: "Mobiliser une commune contre le gaspillage après récolte", g: ["Un tiers de la récolte de mangues pourrit avant d’être vendu.", "Les familles perdent leur revenu, les marchés manquent de produits.", "Pas de séchage, pas de stockage, des pistes impraticables.", "Trois séchoirs solaires gérés par les femmes, et un groupement de vente.", "Imaginez nos mangues séchées vendues à Dakar toute l’année.", "Je demande au conseil municipal de voter le terrain pour les séchoirs dès ce mois-ci."] },
    { s: "Plaider pour la cantine scolaire auprès d’un ministère", g: ["Un enfant sur quatre arrive à l’école le ventre vide.", "La faim fait chuter l’attention et pousse à l’abandon.", "Pas de budget stable, pas d’achat local.", "Des cantines approvisionnées par les producteurs du village.", "Des enfants qui apprennent, des paysans qui vendent.", "Je vous demande d’inscrire cette ligne dans la loi de finances."] },
    { s: "Lever des fonds pour former 200 jeunes aux métiers de l’agroécologie", g: ["200 jeunes, 200 départs évités vers la mer.", "Sans formation ni terre, ils partent.", "Les formations sont loin, chères, et sans accès au crédit.", "Six mois de formation pratique et un kit de démarrage.", "Des fermes rentables, tenues par des jeunes qui restent.", "Je vous demande 50 000 euros d’ici juin."] }
  ],
  recit: [
    { s: "Le jour où un projet a failli échouer", g: ["Juillet, dans un village du bassin arachidier, sous 42 degrés.", "Un matin, le comité de gestion annonce qu’il se retire du projet.", "Sans lui, plus de forage, et le bailleur menace de tout arrêter.", "J’ai passé deux jours à écouter chaque famille, sans rien proposer.", "J’ai compris qu’un projet appartient à ceux qui l’entretiennent, pas à ceux qui le financent."] },
    { s: "Une rencontre qui a changé votre regard", g: ["Une coopérative de femmes, à l’ombre d’un manguier.", "Leur présidente me demande : « Vous venez nous aider ou nous écouter ? »", "J’avais un plan tout prêt, et elle avait raison de le contester.", "J’ai rangé mon plan et j’ai posé des questions pendant une heure.", "Depuis, je commence toujours par écouter avant de proposer."] },
    { s: "Votre première prise de parole difficile", g: ["Une salle de bailleurs, à Dakar, trente personnes.", "On m’annonce que je dois présenter à la place de mon chef, dans dix minutes.", "Je n’avais ni support ni préparation.", "J’ai choisi une seule idée et un seul chiffre, et je m’y suis tenu.", "Ce jour-là, j’ai compris que la clarté vaut mieux que l’exhaustivité."] },
    { s: "Un échec qui vous a appris quelque chose", g: ["Mon premier projet de maraîchage, il y a quelques années.", "La récolte est magnifique, puis les prix s’effondrent au marché.", "Personne n’avait prévu la vente : nous avions tout misé sur la production.", "J’ai reconstruit le projet en partant du marché, pas du champ.", "Un projet agricole commence par l’acheteur."] }
  ],
  tas: [
    { s: "Faut-il interdire l’exportation des céréales en période de crise ?", g: ["Faut-il fermer les frontières aux céréales quand les prix flambent ?", "D’un côté, interdire protège les consommateurs pauvres à court terme.", "Certes, mais cela décourage les producteurs et fait fuir les commerçants.", "En réalité, la vraie question est de stocker, pas d’interdire : des réserves de sécurité publiques.", "C’est pourquoi je défends des stocks régionaux plutôt que des interdictions."] },
    { s: "Les ONG doivent-elles se retirer au profit de l’État ?", g: ["Les ONG doivent-elles laisser la place ?", "D’un côté, elles comblent des vides que l’État ne couvre pas.", "Mais elles peuvent aussi affaiblir l’État en attirant ses meilleurs cadres.", "La vraie réponse : des ONG qui transfèrent, avec un calendrier de passation.", "C’est pourquoi chaque projet devrait finir dans un service public."] },
    { s: "La croissance suffit-elle à vaincre la pauvreté ?", g: ["La croissance fait-elle reculer la pauvreté ?", "D’un côté, aucun pays n’a vaincu la pauvreté sans croissance.", "Mais une croissance qui ne crée pas d’emplois laisse les campagnes de côté.", "La vraie question est de savoir où va la croissance : l’agriculture réduit davantage la pauvreté.", "C’est pourquoi je plaide pour une croissance tirée par l’agriculture."] },
    { s: "Le numérique est-il une chance pour les paysans ?", g: ["Le téléphone peut-il changer la vie d’un paysan ?", "D’un côté, il donne les prix du marché et la météo en temps réel.", "Certes, mais sans réseau, sans électricité et sans formation, il creuse l’écart.", "En réalité, le numérique n’aide que s’il passe par les coopératives.", "C’est pourquoi il faut équiper les groupements avant les individus."] }
  ]
};
// Pour l'entretien, un poste de référence
const POSTE = "chef de projet sécurité alimentaire dans une organisation internationale";

// ---------------------------------------------------------------------
// VOCABULAIRE ENGAGÉ : des mots forts, à forte charge politique
// ---------------------------------------------------------------------
const WORDS = [
  ["incurie", "Négligence grave de ceux qui ont la charge d’agir.", "L’incurie des pouvoirs publics a laissé ces digues céder."],
  ["impéritie", "Incompétence de celui qui dirige.", "Cette crise n’est pas une fatalité : elle est le fruit de l’impéritie."],
  ["prévarication", "Faute grave d’un responsable qui trahit sa charge.", "Détourner l’aide alimentaire est une prévarication."],
  ["concussion", "Fait, pour un agent public, d’exiger ou de percevoir ce qui n’est pas dû.", "Les péages illégaux sur les routes du bétail relèvent de la concussion."],
  ["gabegie", "Gaspillage dû au désordre et à une mauvaise gestion.", "Pendant que des enfants ont faim, la gabegie continue dans les ministères."],
  ["prébende", "Revenu attaché à une fonction, obtenu sans mérite.", "Un poste n’est pas une prébende : c’est une responsabilité."],
  ["sinécure", "Fonction rémunérée qui n’exige presque aucun travail.", "La présidence de ce comité ne doit pas devenir une sinécure."],
  ["népotisme", "Fait de favoriser ses proches dans l’attribution des postes.", "Le népotisme ruine la confiance dans nos institutions."],
  ["kleptocratie", "Régime où les dirigeants pillent les ressources publiques.", "Aucun développement ne survit à la kleptocratie."],
  ["ploutocratie", "Gouvernement où le pouvoir appartient aux plus riches.", "Une démocratie qui n’écoute que les riches devient une ploutocratie."],
  ["démagogie", "Art de flatter les foules pour obtenir leur faveur.", "Promettre la gratuité de tout, c’est de la démagogie."],
  ["forfaiture", "Trahison grave d’un devoir par un détenteur de l’autorité.", "Brader la terre des paysans serait une forfaiture."],
  ["spoliation", "Fait de dépouiller quelqu’un de ses biens par la force ou la ruse.", "L’accaparement des terres est une spoliation silencieuse."],
  ["paupérisation", "Appauvrissement progressif d’une population.", "La paupérisation des campagnes nourrit l’exode."],
  ["déréliction", "Sentiment d’abandon total, de solitude morale.", "Ces villages vivent dans la déréliction, loin de tout service public."],
  ["vassalisation", "Fait de réduire un pays à la dépendance d’un autre.", "La dépendance alimentaire est une forme de vassalisation."],
  ["inféodation", "Soumission totale à une puissance ou à un intérêt.", "Notre recherche agricole ne doit souffrir d’aucune inféodation."],
  ["souveraineté", "Pouvoir de décider par soi-même, sans tutelle.", "La souveraineté alimentaire commence dans nos champs."],
  ["émancipation", "Fait de se libérer d’une domination ou d’une dépendance.", "L’émancipation des femmes rurales passe par l’accès à la terre."],
  ["insoumission", "Refus d’obéir à une autorité jugée injuste.", "L’insoumission face à la fatalité est le début du progrès."],
  ["abnégation", "Sacrifice de son intérêt au profit d’une cause.", "Ces agents de santé travaillent avec une abnégation admirable."],
  ["probité", "Honnêteté scrupuleuse dans ses devoirs.", "La probité n’est pas une option pour qui gère l’argent public."],
  ["intégrité", "Qualité de celui qui ne se laisse pas corrompre.", "L’intégrité d’un dirigeant se voit quand personne ne regarde."],
  ["magnanimité", "Grandeur d’âme, générosité envers l’adversaire.", "La victoire appelle la magnanimité, pas la revanche."],
  ["intransigeance", "Refus de tout compromis.", "Sur la sécurité des enfants, je revendique mon intransigeance."],
  ["inaliénable", "Qui ne peut être cédé ni retiré.", "Le droit à l’alimentation est inaliénable."],
  ["imprescriptible", "Que le temps n’efface pas.", "Le droit des peuples à disposer d’eux-mêmes est imprescriptible."],
  ["intangible", "Qui ne doit pas être touché, modifié.", "Le principe de transparence est intangible."],
  ["indéfectible", "Qui ne peut cesser ni faillir.", "Mon engagement auprès des paysans est indéfectible."],
  ["irréfragable", "Qu’on ne peut contester ni réfuter.", "Les chiffres de la malnutrition sont une preuve irréfragable."],
  ["exhorter", "Pousser vivement quelqu’un à agir.", "J’exhorte chaque élu à visiter ces villages avant de voter."],
  ["fustiger", "Critiquer avec une grande sévérité.", "Il faut fustiger l’indifférence autant que la corruption."],
  ["vilipender", "Dénoncer publiquement avec mépris.", "On vilipende souvent les paysans au lieu de les écouter."],
  ["pourfendre", "Attaquer vigoureusement une idée ou une injustice.", "Je pourfendrai cette idée que la faim serait une fatalité."],
  ["galvaniser", "Remplir d’énergie et d’enthousiasme.", "Un discours juste peut galvaniser tout un village."],
  ["haranguer", "S’adresser à une foule avec force pour l’entraîner.", "Il ne s’agit pas de haranguer, mais de convaincre."],
  ["réquisitoire", "Discours qui accuse et énumère des torts.", "Ce rapport est un réquisitoire contre l’inaction."],
  ["plaidoyer", "Discours ou action pour défendre une cause.", "Mon plaidoyer tient en une phrase : nourrir avant de reconstruire."],
  ["anathème", "Condamnation solennelle, rejet sans appel.", "Jeter l’anathème sur les migrants ne règle rien."],
  ["panégyrique", "Discours à la louange de quelqu’un.", "Je ne viens pas faire le panégyrique du projet, mais son bilan."],
  ["philippique", "Discours violent contre une personne.", "Sa philippique contre la corruption a marqué l’assemblée."],
  ["tribun", "Orateur qui défend la cause du peuple avec éloquence.", "Il faut des tribuns pour porter la voix des campagnes."],
  ["sédition", "Révolte contre l’autorité établie.", "La misère prolongée est le terreau de la sédition."],
  ["atermoiement", "Fait de remettre une décision à plus tard.", "Chaque atermoiement coûte une saison de récolte."],
  ["tergiversation", "Hésitation pour éviter de décider.", "Assez de tergiversations : il faut voter ce budget."],
  ["palinodie", "Changement d’opinion soudain et peu glorieux.", "Ces palinodies successives ont ruiné la crédibilité du ministère."],
  ["pusillanimité", "Manque de courage, peur des responsabilités.", "Face à la crise, la pusillanimité est une faute."],
  ["veulerie", "Lâcheté, absence de volonté.", "Se taire devant l’injustice, c’est de la veulerie."],
  ["obscurantisme", "Opposition à la diffusion du savoir.", "Fermer les écoles, c’est choisir l’obscurantisme."],
  ["ostracisme", "Exclusion d’une personne ou d’un groupe.", "L’ostracisme dont souffrent les éleveurs nourrit les conflits."],
  ["opprobre", "Honte publique, déshonneur.", "Couvrir la fraude, c’est s’exposer à l’opprobre."],
  ["mansuétude", "Indulgence, bonté envers les fautes d’autrui.", "La mansuétude n’exclut pas la justice."],
  ["exaction", "Abus de pouvoir, acte de violence ou d’extorsion.", "Les exactions contre les civils doivent être documentées."],
  ["incorruptible", "Qu’on ne peut acheter ni détourner de son devoir.", "Nous avons besoin d’agents incorruptibles aux frontières."],
  ["subsidiarité", "Principe selon lequel une décision se prend au plus près des personnes concernées.", "La subsidiarité, c’est laisser le village décider de son forage."],
  ["résilience", "Capacité à surmonter un choc et à se reconstruire.", "La résilience ne se décrète pas : elle se finance."],
  ["dessein", "Projet réfléchi, grande intention.", "Nous avons un dessein : une Afrique qui se nourrit elle-même."],
  ["sacerdoce", "Fonction vécue comme une mission exigeante.", "Servir l’intérêt général est un sacerdoce."],
  ["consubstantiel", "Inséparable, qui fait partie de la nature même.", "La paix est consubstantielle à la sécurité alimentaire."],
  ["dévoiement", "Fait de détourner quelque chose de son but.", "Le dévoiement de l’aide alimente la défiance."],
  ["jusqu’au-boutisme", "Attitude de ceux qui vont jusqu’à l’extrême sans compromis.", "Le jusqu’au-boutisme des deux camps a bloqué l’accord."],
  ["pragmatisme", "Attitude qui privilégie l’efficacité concrète.", "Le pragmatisme n’est pas le renoncement aux principes."],
  ["volontarisme", "Conviction que la volonté peut changer le cours des choses.", "Il faut du volontarisme politique pour irriguer le Sahel."],
  ["équité", "Justice qui tient compte de la situation de chacun.", "L’équité exige de donner plus à ceux qui ont moins."],
  ["redevabilité", "Obligation de rendre des comptes sur ses actes.", "La redevabilité envers les communautés est notre première règle."]
];

// ---------------------------------------------------------------------
// CULTURE GÉNÉRALE : un thème, trois faits, un quiz
// ---------------------------------------------------------------------
const CULT = [
  { t: "Les accords de Bretton Woods (1944)", r: "En juillet 1944, 44 pays se réunissent à Bretton Woods, aux États-Unis, pour reconstruire l’économie mondiale après la guerre. Ils créent le Fonds monétaire international et la Banque mondiale. Les monnaies sont rattachées au dollar, lui-même convertible en or à 35 dollars l’once. Ce système tient jusqu’en 1971, quand le président Nixon suspend la convertibilité du dollar en or. Ces deux institutions pèsent encore aujourd’hui sur les politiques économiques de l’Afrique.", f: ["1944 : 44 pays, création du FMI et de la Banque mondiale.", "Le dollar convertible en or à 35 dollars l’once.", "Fin de la convertibilité en 1971."], q: [["Quelles institutions naissent à Bretton Woods ?", ["Le FMI et la Banque mondiale", "L’ONU et l’OMC", "L’OTAN et l’UE"], 0], ["Quand la convertibilité du dollar en or est-elle suspendue ?", ["1958", "1971", "1989"], 1], ["Combien de pays sont réunis ?", ["12", "44", "120"], 1]], why: "Comprendre pourquoi le FMI et la Banque mondiale pèsent sur les politiques agricoles et budgétaires africaines." },
  { t: "1960, l’année de l’Afrique", r: "En 1960, dix-sept pays africains accèdent à l’indépendance, dont le Sénégal, le Mali, le Niger, le Burkina Faso (alors Haute-Volta) et le Nigeria. Le Sénégal et le Soudan français forment d’abord la Fédération du Mali, qui éclate en août 1960. Cette vague d’indépendances transforme l’Assemblée générale des Nations unies et ouvre le débat sur la souveraineté économique, toujours actuel.", f: ["17 pays africains indépendants en 1960.", "La Fédération du Mali (Sénégal et Soudan français) éclate en août 1960.", "La question de la souveraineté économique reste posée."], q: [["Combien de pays africains deviennent indépendants en 1960 ?", ["5", "17", "30"], 1], ["Quels territoires formaient la Fédération du Mali ?", ["Sénégal et Soudan français", "Niger et Tchad", "Guinée et Côte d’Ivoire"], 0], ["Comment s’appelait le Burkina Faso en 1960 ?", ["Dahomey", "Haute-Volta", "Oubangui-Chari"], 1]], why: "Situer les débats d’aujourd’hui sur la souveraineté dans leur histoire." },
  { t: "La révolution verte", r: "Dans les années 1960, des variétés de blé et de riz à haut rendement, l’irrigation et les engrais font exploser la production en Inde et au Mexique. L’agronome américain Norman Borlaug, l’un de ses pères, reçoit le prix Nobel de la paix en 1970. Mais l’Afrique subsaharienne en a peu profité : peu d’irrigation, des cultures différentes, des marchés fragiles. Et ses effets sur les sols et l’eau sont aujourd’hui discutés.", f: ["Variétés à haut rendement, irrigation et engrais, années 1960.", "Norman Borlaug, prix Nobel de la paix en 1970.", "L’Afrique subsaharienne en a peu bénéficié."], q: [["Quel prix Norman Borlaug a-t-il reçu ?", ["Nobel de la paix", "Nobel d’économie", "Prix Pulitzer"], 0], ["Où la révolution verte a-t-elle surtout réussi ?", ["Afrique subsaharienne", "Inde et Mexique", "Europe du Nord"], 1], ["Quel en est un effet discuté aujourd’hui ?", ["L’usure des sols et de l’eau", "La baisse des rendements en Inde", "La fin de l’irrigation"], 0]], why: "Argumenter sur le modèle agricole à défendre au Sahel." },
  { t: "Les Objectifs de développement durable", r: "En septembre 2015, les 193 États membres des Nations unies adoptent 17 Objectifs de développement durable, à atteindre d’ici 2030. Ils succèdent aux Objectifs du millénaire. L’objectif 2, « Faim zéro », vise à éliminer la faim et à promouvoir une agriculture durable. Les bilans des Nations unies montrent que le monde est en retard sur la plupart des cibles, notamment sur la faim.", f: ["2015 : 17 objectifs, horizon 2030.", "Objectif 2 : Faim zéro.", "Le monde est en retard sur la plupart des cibles."], q: [["Combien y a-t-il d’ODD ?", ["8", "17", "25"], 1], ["Quel est l’objectif 2 ?", ["Éducation de qualité", "Faim zéro", "Égalité entre les sexes"], 1], ["Quelle est l’échéance des ODD ?", ["2025", "2030", "2050"], 1]], why: "Parler le langage des bailleurs et des organisations internationales." },
  { t: "Le franc CFA", r: "Le franc CFA est créé en 1945. Il est utilisé aujourd’hui par quatorze pays d’Afrique de l’Ouest et d’Afrique centrale, en deux zones distinctes. Il a une parité fixe avec l’euro : un euro vaut 655,957 francs CFA. En 2019, une réforme est annoncée pour l’Afrique de l’Ouest : changement de nom prévu en « eco » et fin du dépôt de la moitié des réserves au Trésor français. Le débat entre stabilité monétaire et souveraineté reste vif.", f: ["Créé en 1945, utilisé par 14 pays.", "1 euro = 655,957 francs CFA.", "Réforme annoncée en 2019 : vers l’eco."], q: [["Combien vaut un euro en francs CFA ?", ["500", "655,957", "1 000"], 1], ["En quelle année le franc CFA est-il créé ?", ["1945", "1960", "1994"], 0], ["Quel nom est prévu pour la monnaie ouest-africaine réformée ?", ["l’afro", "l’eco", "le sahel"], 1]], why: "Prendre position sur la souveraineté monétaire avec des faits exacts." },
  { t: "L’Accord de Paris sur le climat (2015)", r: "En décembre 2015, lors de la COP21, presque tous les pays du monde s’engagent à contenir le réchauffement nettement en dessous de 2 degrés, et à poursuivre les efforts pour le limiter à 1,5 degré. Chaque pays présente ses propres engagements, revus tous les cinq ans. Les pays riches s’étaient engagés à mobiliser 100 milliards de dollars par an pour les pays en développement. Le Sahel, qui émet très peu, subit parmi les plus fortes hausses de température.", f: ["COP21, décembre 2015.", "Objectif : bien en dessous de 2 degrés, viser 1,5 degré.", "Engagement de 100 milliards de dollars par an pour les pays en développement."], q: [["Lors de quelle COP l’accord est-il signé ?", ["COP15", "COP21", "COP27"], 1], ["Quel est l’objectif le plus ambitieux ?", ["1,5 degré", "3 degrés", "0,5 degré"], 0], ["Tous les combien d’années les engagements sont-ils revus ?", ["2 ans", "5 ans", "10 ans"], 1]], why: "Défendre la justice climatique pour le Sahel." },
  { t: "Le plan Marshall", r: "Le 5 juin 1947, à Harvard, le secrétaire d’État américain George Marshall propose d’aider l’Europe ruinée par la guerre. De 1948 à 1952, environ 13 milliards de dollars sont versés à seize pays européens. L’aide finance la reconstruction, mais impose aussi une coopération entre les bénéficiaires. On cite souvent ce plan quand on réclame un « plan Marshall pour l’Afrique ».", f: ["Discours de George Marshall, 5 juin 1947.", "Environ 13 milliards de dollars, 1948-1952.", "Une aide conditionnée à la coopération entre pays."], q: [["Où George Marshall annonce-t-il son plan ?", ["À Harvard", "À Paris", "À l’ONU"], 0], ["Sur quelle période l’aide est-elle versée ?", ["1945-1947", "1948-1952", "1960-1970"], 1], ["Quel montant environ ?", ["1 milliard", "13 milliards", "130 milliards"], 1]], why: "Savoir répondre quand quelqu’un réclame un « plan Marshall pour l’Afrique »." },
  { t: "La Déclaration universelle des droits de l’homme", r: "Le 10 décembre 1948, à Paris, au palais de Chaillot, l’Assemblée générale des Nations unies adopte la Déclaration universelle des droits de l’homme. Le juriste français René Cassin et Eleanor Roosevelt jouent un rôle majeur dans sa rédaction. Son article 25 reconnaît à chacun le droit à un niveau de vie suffisant, notamment pour l’alimentation. C’est le fondement du droit à l’alimentation.", f: ["10 décembre 1948, palais de Chaillot, Paris.", "René Cassin et Eleanor Roosevelt.", "Article 25 : droit à un niveau de vie suffisant, dont l’alimentation."], q: [["Où la Déclaration est-elle adoptée ?", ["À New York", "À Paris", "À Genève"], 1], ["Quel juriste français y a contribué ?", ["René Cassin", "Jean Monnet", "Robert Schuman"], 0], ["Quel article fonde le droit à l’alimentation ?", ["Article 1", "Article 25", "Article 50"], 1]], why: "Ancrer un plaidoyer dans le droit international." },
  { t: "La Grande Muraille verte", r: "Lancée en 2007 par l’Union africaine, la Grande Muraille verte vise à restaurer les terres dégradées sur une bande d’environ 8 000 kilomètres, du Sénégal à Djibouti, à travers une dizaine de pays du Sahel. L’objectif est de restaurer 100 millions d’hectares d’ici 2030. Le bilan publié en 2020 a montré que les progrès restaient très en deçà de cet objectif, faute de financements et de suivi.", f: ["Lancée en 2007 par l’Union africaine.", "Environ 8 000 km, du Sénégal à Djibouti.", "Objectif : 100 millions d’hectares restaurés d’ici 2030."], q: [["Qui lance la Grande Muraille verte ?", ["L’Union africaine", "La Banque mondiale", "La FAO seule"], 0], ["Quelle longueur environ ?", ["800 km", "8 000 km", "80 000 km"], 1], ["Quel objectif d’ici 2030 ?", ["100 millions d’hectares restaurés", "1 milliard d’arbres plantés en Europe", "10 barrages"], 0]], why: "Parler d’un projet phare du Sahel avec précision, y compris ses limites." },
  { t: "La CEDEAO et l’Alliance des États du Sahel", r: "La Communauté économique des États de l’Afrique de l’Ouest est créée en 1975 par le traité de Lagos, pour favoriser l’intégration économique et la libre circulation. En 2023, le Mali, le Burkina Faso et le Niger forment l’Alliance des États du Sahel. En janvier 2024, ils annoncent leur retrait de la CEDEAO, devenu effectif en janvier 2025. Cette rupture pose la question de la libre circulation des personnes et des marchandises dans la région.", f: ["CEDEAO créée en 1975 (traité de Lagos).", "Alliance des États du Sahel : Mali, Burkina Faso, Niger (2023).", "Retrait de la CEDEAO effectif en janvier 2025."], q: [["Par quel traité naît la CEDEAO ?", ["Traité de Lagos", "Traité de Rome", "Traité d’Abuja"], 0], ["Quels pays forment l’AES ?", ["Mali, Burkina Faso, Niger", "Sénégal, Gambie, Guinée", "Tchad, Cameroun, Niger"], 0], ["Quand le retrait devient-il effectif ?", ["Janvier 2025", "Janvier 2020", "Il n’a pas eu lieu"], 0]], why: "Comprendre les recompositions régionales qui touchent vos projets." }
];

// ---------------------------------------------------------------------
// MÉMOIRE : mots concrets à placer dans la maison (méthode des lieux)
// ---------------------------------------------------------------------
const NOUNS = ["baobab", "pirogue", "tambour", "calebasse", "lanterne", "clé", "tracteur", "mangue", "horloge", "drapeau", "chameau", "parapluie", "marmite", "violon", "bicyclette", "éléphant", "couronne", "échelle", "miroir", "pastèque", "fourmi", "trompette", "boussole", "cactus", "ballon", "sabre", "panier", "hibou", "locomotive", "piano", "bougie", "crocodile", "chapeau", "ancre", "tortue", "guitare", "fusée", "oignon", "cloche", "zèbre", "valise", "plume", "volcan", "girafe", "cadenas", "tapis", "abeille", "phare", "ciseaux", "noix de coco", "taureau", "harpe", "igloo", "loupe", "mouton", "boomerang", "seau", "perroquet", "sablier", "tente", "aigle", "marteau", "papaye", "requin", "chaise", "soleil", "tambourin", "puits", "lion", "dromadaire"];
const ROOMS = ["la porte d’entrée", "le salon", "la cuisine", "la chambre", "la salle de bain", "la cour", "le toit", "le couloir", "le garage", "le jardin", "la terrasse", "le bureau"];

// ---------------------------------------------------------------------
// VOIX ET SILENCES : extraits annotés. « / » = pause courte, « // » = pause longue, *mot* = accent
// ---------------------------------------------------------------------
const VOICE = [
  { a: "Victor Hugo, Discours sur la misère, Assemblée nationale, 1849", x: "Je ne suis pas, messieurs, / de ceux qui croient qu’on peut supprimer la souffrance en ce monde ; // la souffrance est une loi divine ; / mais je suis de ceux qui pensent et qui affirment / qu’on peut *détruire* la misère." },
  { a: "Jean Jaurès, Discours à la jeunesse, Albi, 1903", x: "Le courage, / c’est de chercher la *vérité* / et de la *dire* ; // c’est de ne pas subir la loi du mensonge triomphant qui passe." },
  { a: "Charles de Gaulle, Appel du 18 juin 1940", x: "Quoi qu’il arrive, / la flamme de la résistance française / ne doit pas s’éteindre // et *ne s’éteindra pas*." },
  { a: "Aimé Césaire, Discours sur le colonialisme, 1950", x: "Une civilisation qui s’avère *incapable* / de résoudre les problèmes que suscite son fonctionnement / est une civilisation *décadente*." },
  { a: "Texte d’entraînement (plaidoyer)", x: "Six kilomètres. // C’est la distance qu’une mère parcourt, / chaque matin, / pour de l’eau. // Nous pouvons la ramener à *zéro*. / Pas dans dix ans. / *Cette année*." },
  { a: "Texte d’entraînement (engagement)", x: "On nous dit que la faim est une *fatalité*. // C’est faux. / La faim est une *décision* : / celle de ne pas investir dans ceux qui nous nourrissent." }
];

// ---------------------------------------------------------------------
// NÉGOCIATION : scénarios (l'interlocuteur est joué par Claude ; répliques de secours)
// ---------------------------------------------------------------------
const NEGO = [
  { ctx: "Un bailleur annonce une baisse de 30 % du budget de votre projet d’irrigation.", who: "Mme Diallo, chargée de programme du bailleur", goal: "Garder les forages des 10 villages, quitte à réduire autre chose.", hidden: "Elle doit montrer à son siège des résultats chiffrés rapides.", lines: ["Je suis désolée, mais le siège impose une baisse de 30 %. Je n’ai aucune marge.", "Je comprends, mais mon siège veut des résultats visibles avant la fin de l’année.", "Si vous me garantissez des indicateurs trimestriels, je peux défendre une partie du budget."] },
  { ctx: "Le chef de village refuse que le forage soit installé sur le terrain prévu.", who: "Le chef de village", goal: "Obtenir un terrain accessible à tous, avant la saison sèche.", hidden: "Il craint que le terrain choisi donne du pouvoir à une famille rivale.", lines: ["Ce terrain-là, ce n’est pas possible. Cherchez ailleurs.", "Vous, les projets, vous décidez tout depuis Dakar.", "Si le comité de l’eau représente toutes les familles, on peut en reparler."] },
  { ctx: "Un ministère veut repousser de six mois la validation de votre programme.", who: "Le directeur de cabinet", goal: "Une validation avant la prochaine saison des pluies.", hidden: "Il veut que le ministre puisse annoncer le programme lui-même.", lines: ["Six mois, c’est le minimum. Le ministre a d’autres priorités.", "Ces programmes, on en voit passer beaucoup. Qu’est-ce qui fait l’urgence ?", "Si le ministre pouvait lancer le programme lors de sa tournée, ce serait différent."] },
  { ctx: "Un recruteur vous propose un salaire inférieur de 20 % à vos attentes.", who: "La responsable des ressources humaines", goal: "Un salaire juste, ou des contreparties équivalentes.", hidden: "La grille est rigide, mais les primes et la formation sont négociables.", lines: ["C’est notre grille. Je ne peux pas aller au-delà.", "Tous les candidats acceptent cette grille, vous savez.", "Je pourrais regarder du côté de la prime de terrain et du budget formation."] },
  { ctx: "Un partenaire veut son logo en grand sur tout le matériel du projet.", who: "Le représentant de l’entreprise partenaire", goal: "Garder la communauté au centre, sans perdre le partenaire.", hidden: "Il doit justifier son investissement auprès de sa direction.", lines: ["Nous finançons 40 % : notre logo doit être partout.", "Sans visibilité, ma direction ne renouvellera pas.", "Un reportage sur les résultats, avec notre nom, pourrait aussi convenir."] }
];

// ---------------------------------------------------------------------
// CORPS ET REGARD, IMPROVISATION, QUESTIONS SOUS PRESSION
// ---------------------------------------------------------------------
const CORPS = [
  ["Ancrage", "Pieds à la largeur du bassin, poids sur les deux jambes. Vous ne bougez plus les pieds."],
  ["Le cadre", "Les mains vivent entre la taille et les épaules. Au repos : mains jointes à hauteur du nombril."],
  ["Trois gestes", "Compter sur les doigts (un, deux, trois). Paumes ouvertes vers le haut pour inclure. Main qui tranche pour une décision."],
  ["Le regard", "Une phrase, un regard : finissez chaque phrase les yeux dans l’objectif."]
];
const CORPS_SUBJ = ["Pourquoi l’eau est la première infrastructure", "Ce que le Sahel peut apprendre au monde", "Le métier d’agronome expliqué à un enfant de dix ans", "Trois raisons de croire en la jeunesse africaine", "Ce que j’attends d’un leader", "La terre, un bien commun ou une marchandise ?", "Pourquoi je crois à la coopérative", "Ce que la faim coûte à une nation", "Le marché de mon quartier, miroir du pays", "Pourquoi la parole publique est un devoir", "L’arbre qui m’a appris la patience", "Ce que je dirais au président en une minute"];
const IMPRO = ["La pluie", "Le téléphone portable", "Le baobab", "La confiance", "Le marché", "L’argent", "La frontière", "Le silence", "La route", "L’école", "Le pain", "La lenteur", "Le courage", "La nuit", "L’héritage", "Le football", "Le sable", "Le pouvoir", "La patience", "L’avenir"];
const HOSTILE = ["Votre projet a coûté cher pour peu de résultats. Pourquoi continuer ?", "Vous êtes trop jeune pour diriger cette équipe, non ?", "Les ONG vivent de la misère qu’elles prétendent combattre. Qu’en dites-vous ?", "Pourquoi devrait-on vous croire, cette fois ?", "Vous n’avez jamais cultivé un champ de votre vie, si ?", "Votre chiffre est faux. D’où le sortez-vous ?", "Franchement, qu’avez-vous accompli de concret ?", "Pourquoi ne pas laisser faire le marché ?"];

return { M, ENTRETIEN, ENTRETIEN_LIT, SK, WEEK_PLAN, SUBJ, POSTE, WORDS, CULT, NOUNS, ROOMS, VOICE, NEGO, CORPS, CORPS_SUBJ, IMPRO, HOSTILE };
})();
