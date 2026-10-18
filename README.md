# 🏈 NFL Swapper

Jeu de **match-3** (façon Bejeweled / Candy Crush) sur le thème du football américain, en HTML5/Canvas pur
(aucune dépendance côté jeu), format portrait mobile.

- **Web / iOS** : GitHub Pages, installable comme application (PWA, jouable hors ligne).
- **Android** : APK autonome construit avec Capacitor.

> Jeu fan-made **non officiel**, sans lien avec la NFL ni ses franchises. Les logos restent la propriété
> de leurs détenteurs respectifs (voir « Logos et droits » plus bas).

## Contenu

| Élément | Thème NFL |
|---|---|
| Joyaux | 6 logos d'équipes choisis dans les réglages (32 disponibles, l'ordre compte) |
| Dalles dorées | **Gazon doré** à nettoyer en faisant des alignements dessus |
| Pierres reliques | **Sacs de plaquage** (1 ou 2 coups), détruits par un alignement adjacent |
| Match 4 | **Long Pass** : efface la ligne ou la colonne |
| Match en T / L | **Blitz** : explosion 3×3 |
| Match 5 | **Hail Mary** : éclairs sur toutes les pièces d'une équipe ; avec un spécial, transforme toute l'équipe en spéciaux |
| Combos de spéciaux | Croix, 3 lignes + 3 colonnes, 5×5, Hail Mary ×2 = plateau entier |
| Bonus Time | **Two-Minute Drill** : chaque coup restant devient un spécial qui explose (TAP TO SKIP) |
| Écran CLEAR | Médaillon **TOUCHDOWN**, 1 à 3 étoiles, NEW BEST, pièces, récompenses, fermeture en iris |
| Booster | **Drapeau rouge** : retire une pièce (3 offerts, puis 60 pièces) ; 3 emplacements verrouillés |

Autres éléments :
- page de garde ;
- **100 niveaux** répartis en 10 saisons, qui se débloquent un par un, avec un boss tous les 10 niveaux.
  Les niveaux 1 à 10 sont faits main. Les niveaux 11 à 100 viennent d'un générateur à graine fixe
  (identiques pour tout le monde), dont le nombre de coups a été calibré par un bot ;
- record et étoiles sauvegardés pour chaque niveau (localStorage) ;
- indice automatique après 12 s d'inactivité ;
- tutoriels interactifs avec main animée (niveaux 1, 4 et 5) ;
- « Temps mort +3 coups » sur l'écran d'objectifs ;
- **FLAAAG !** sur un échange illégal ;
- **Delay of Game** : au-delà de 35 s sans jouer, un coup en moins (désactivable dans les réglages) ;
- +5 coups contre des pièces en cas d'échec ;
- récompense quotidienne et jauge cadeau.

**Audio** : musique de fanfare de stade et bruitages, tous **générés en temps réel** (Web Audio) :
sifflet d'arbitre, foule, corne de brume, choc de casques, cuivres. Aucun fichier audio, donc aucun souci de droits.

Musique d'accueil optionnelle : si `www/assets/audio/accueil.mp3` existe, elle joue en boucle sur les menus.
Ce fichier est exclu du dépôt (`.gitignore`) : la version en ligne et l'APK de la release utilisent la
fanfare procédurale, seul un APK compilé en local l'embarque.

## Arborescence

```
www/                 le jeu (publié tel quel sur GitHub Pages et embarqué dans l'APK)
  js/data.js         équipes + niveaux (formes, objectifs, tutoriels)
  js/grid.js         gestionnaire de grille (gravité, remplissage, mélange, coups possibles)
  js/matcher.js      détecteur de matchs (alignements, T/L, choix du spécial)
  js/game.js         contrôleur de niveau (entrées, cascades, spéciaux, bonus, fin)
  js/renderer.js     rendu canvas (stade, plateau, pièces, effets)
  js/fx.js           tweens + particules / rayons / éclairs / secousses
  js/audio.js        musique et bruitages procéduraux
  js/ui.js           écrans, HUD, popups, transitions
  js/storage.js      sauvegarde
  assets/logos/      32 logos découpés (tools/crop_logos.py)
tools/               scripts de découpe des logos, d'icônes et de patch Android
.github/workflows/   déploiement Pages + build APK
```

## Lancer en local

```bash
npm run serve
```

Puis ouvrir http://localhost:8137. Un double-clic sur `www/index.html` fonctionne aussi, sans mode hors ligne.

## Publier

- **Web** : pousser sur `main`. Dans *Settings → Pages*, choisir *Source : GitHub Actions*.
  Le jeu sera servi sur `https://<user>.github.io/nfl-swapper/`. Sur iPhone : Safari → Partager → *Sur l'écran d'accueil*.
- **APK** : créer un tag (`git tag v1.0.0 && git push --tags`). Le workflow attache `nfl-swapper.apk`
  à la Release. Il peut aussi être lancé à la main depuis l'onglet *Actions*.
- **APK en local** (JDK 17 et SDK Android 34 requis) :
  ```bash
  npm install
  npm run android:init
  npm run android:build
  ```
  Le fichier produit est `android/app/build/outputs/apk/debug/app-debug.apk`.

L'APK est une version *debug*, signée avec la clé de debug. Il s'installe en autorisant les sources inconnues.
Une publication sur le Play Store demanderait une signature *release* et ne serait de toute façon pas
acceptée avec les logos officiels.

## Logos et droits

Les logos sont des marques déposées. Les 32 fichiers sont découpés depuis une photo éditoriale.
Les publier sur un dépôt public expose à une demande de retrait (DMCA ou marque) : c'est rare pour un
projet fan non commercial, mais possible.

Le jeu propose un mode **« Casques dessinés »** : des casques génériques aux couleurs de chaque équipe,
dessinés par le code. Pour une version publique sans aucun risque, il suffit de supprimer
`www/assets/logos/`. Le jeu bascule alors automatiquement sur les casques.

## Prompts pour images optionnelles (Gemini / ChatGPT)

Le jeu dessine tout lui-même, mais ces visuels peuvent remplacer les versions vectorielles.

1. **Fond de stade (1080×1920)** :
   « Vertical 9:16 mobile game background, American football stadium at night seen from the field,
   bright floodlights with lens flare, packed crowd in the stands with camera flashes, green turf with
   white yard lines in the lower two thirds, slightly blurred, cinematic, vibrant, no text, no logos,
   no people in the foreground. »
2. **Le coach de l'écran d'objectifs (PNG transparent, 512×640)** :
   « Cartoon mobile-game mascot, friendly American football head coach, red cap, headset, navy polo,
   holding a clipboard with X and O play diagrams, pointing forward, confident smile, bold outlines,
   vibrant colors, full body, transparent background, no text, no team logos. »
3. **Médaillon TOUCHDOWN (PNG transparent, 512×512)** :
   « Shiny golden medal badge for a mobile game victory screen, American football in the center,
   laurel wreath, red ribbon banner across the bottom left empty for text, glossy 3D, transparent
   background, no text. »
