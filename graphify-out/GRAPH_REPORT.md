# Graph Report - carnet-de-voyage-git  (2026-11-06)

## Corpus Check
- 53 files · ~809,062 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .webmanifest 1, .css 1)

## Summary
- 2670 nodes · 6413 edges · 83 communities (78 shown, 5 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 552 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5cf43114`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 21_nurserie.js
- 29_aventure.js
- 45_equipage.js
- 27_tresors.js
- 17_regions.js
- 43_mysteres.js
- 44_monde.js
- 07_poi.js
- 38_quetes.js
- 36_familles.js
- 19_style.js
- 26_voyageurs.js
- 14_reves.js
- 06_map.js
- 05_logic_a.js
- 22_marche.js
- 41_expedition.js
- 47_usages.js
- 48_progression.js
- 20_collection.js
- 49_foyer3d.js
- 18_boutique.js
- 31_foyer.js
- 01_draw_chars.js
- 32_compagnons.js
- 23_objets.js
- 09_logic_b.js
- 10_ui.js
- 24_tuto.js
- 28_economie.js
- 37_commerce.js
- 33_boutique.js
- 46_quetes_modes.js
- 30_butin.js
- 12_jeu.js
- 16_live.js
- 42_fideles.js
- 25_trajet.js
- 03_data.js
- 40_foyer.js
- bqState
- 08_goal.js
- 34_aventure_anim.js
- drawChar
- renderPanel
- cmRecipesHTML
- 39_icones.js
- bqStock
- 04_poidata.js
- renderTournoi
- btSources
- ecoState
- btEnrich
- cmPaint
- collect
- bqOrderCard
- BQS
- btIdentity
- czLayerHTML
- showHaul
- ecoPending
- czSceneHTML
- colorsOf
- face
- mixHex
- 11_anim.js
- bqPass
- ecoActive
- ecoGive
- bqNewOrder
- ecoMenuHTML
- cmState
- loginModal
- smooth
- btInfo
- cmDefiEnd
- confetti
- btNorm
- Carnet de voyage
- README.md
- 02_geo_data.js
- 13_bus.js

## God Nodes (most connected - your core abstractions)
1. `bqState()` - 31 edges
2. `eqCall()` - 29 edges
3. `drawChar()` - 26 edges
4. `nsState()` - 26 edges
5. `ecoState()` - 26 edges
6. `avRender()` - 26 edges
7. `usCall()` - 26 edges
8. `qtCall()` - 25 edges
9. `eqState()` - 23 edges
10. `renderPanel()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `tzHaulDecorate()` --indirect_call--> `esc()`  [INFERRED]
  src/27_tresors.js → src/05_logic_a.js
- `myHaulHTML()` --indirect_call--> `esc()`  [INFERRED]
  src/43_mysteres.js → src/05_logic_a.js
- `wdHaulHTML()` --indirect_call--> `esc()`  [INFERRED]
  src/44_monde.js → src/05_logic_a.js
- `buildMap()` --indirect_call--> `refreshPOIs()`  [INFERRED]
  src/06_map.js → src/07_poi.js
- `qmRewardPop()` --indirect_call--> `reduceMotion()`  [INFERRED]
  src/46_quetes_modes.js → src/12_jeu.js

## Import Cycles
- None detected.

## Communities (83 total, 5 thin omitted)

### Community 0 - "21_nurserie.js"
Cohesion: 0.05
Nodes (87): NS_ART, NS_BAIT_HINT, NS_BAITS, NS_COUV, NS_COUV_ART(), NS_ECLORE, NS_EGG_P, NS_ENCLOS (+79 more)

### Community 1 - "29_aventure.js"
Cohesion: 0.05
Nodes (86): AV_BIOME_NAME, AV_BY, AV_CHIP_IC, AV_CHIP_S, AV_FORCE, AV_FX_IC, AV_HOW, AV_HOW_BONUS (+78 more)

### Community 2 - "45_equipage.js"
Cohesion: 0.08
Nodes (79): EQ_AMI, EQ_CITIES, EQ_CLI, EQ_CT, EQ_K, EQ_KIND, EQ_PM, EQ_PM2 (+71 more)

### Community 3 - "27_tresors.js"
Cohesion: 0.07
Nodes (78): openTresors(), renderTresors(), TZ, TZ_BY, TZ_CLIENTS, TZ_GLY, TZ_KIND, TZ_LEGACY_ITEM (+70 more)

### Community 4 - "17_regions.js"
Cohesion: 0.05
Nodes (76): give(), originOf(), regionAt(), regionGo(), REGIONS, renderRegions(), RG, RG_DE (+68 more)

### Community 5 - "43_mysteres.js"
Cohesion: 0.07
Nodes (71): MY_BLESS, MY_COINS, MY_DIRS, MY_G, MY_GUARDS, MY_M, MY_MAPS, MY_R (+63 more)

### Community 6 - "44_monde.js"
Cohesion: 0.07
Nodes (70): WD_EK, WD_EU, WD_EVK, WD_K, WD_M, WD_MOM, WD_TRW, WD_Z (+62 more)

### Community 7 - "07_poi.js"
Cohesion: 0.05
Nodes (66): BLDG_COLORS, boxFeat(), CAMP_FIELD, CAMP_N, campClassify(), campPOIs(), campSave(), campStore() (+58 more)

### Community 8 - "38_quetes.js"
Cohesion: 0.08
Nodes (69): QT_BY, QT_CONT, QT_DEFIS, QT_SDIF, QT_SRC, QT_STORIES, QT_Z, qtAdvance() (+61 more)

### Community 9 - "36_familles.js"
Cohesion: 0.07
Nodes (70): FAM, FAM_CHEST_BY, FAM_EXC, FAM_GEM_BY, FAM_GEMS, FAM_HIDE, FAM_IDS, FAM_KEY_BY (+62 more)

### Community 10 - "19_style.js"
Cohesion: 0.07
Nodes (64): openCompagnons(), renderCompagnons(), renderContest(), renderTalents(), renderWardrobe(), ST_CR, ST_DYE_LINE, ST_DYES (+56 more)

### Community 11 - "26_voyageurs.js"
Cohesion: 0.08
Nodes (65): VY_COL, VY_ORDER, VY_PORT, VY_REGC, VY_SPOTS, VY_STYLE, VY_TC, vyActive() (+57 more)

### Community 12 - "14_reves.js"
Cohesion: 0.08
Nodes (60): announceGains(), catLabel(), claimDream(), curDream(), DREAM_BUILD_NAMES, DREAM_DECOS, DREAM_GIFT_SVG, DREAM_GLYPH (+52 more)

### Community 13 - "06_map.js"
Cohesion: 0.06
Nodes (58): arcCoords(), buildMap(), buildOverlay(), buildPoiFilter(), choosePlace(), cityEls, compOverlay(), CV_ROOF (+50 more)

### Community 14 - "05_logic_a.js"
Cohesion: 0.06
Nodes (51): addXP(), bump(), colGot(), collections(), colReward(), colTierReached(), comfort(), comfortBonus() (+43 more)

### Community 15 - "22_marche.js"
Cohesion: 0.08
Nodes (57): MK_ARROW(), MK_CATS, MK_PEOPLE, MK_RAR_F, MK_RW, MK_SLOTS, MK_SP_BASE, MK_SUF (+49 more)

### Community 16 - "41_expedition.js"
Cohesion: 0.09
Nodes (58): XP_G, XP_GBY, XP_GEAR, XP_GRAR, XP_GSCENE, XP_LV, XP_P, XP_PLACES (+50 more)

### Community 17 - "47_usages.js"
Cohesion: 0.07
Nodes (57): US_ACTS, US_BASE, US_BASE_NAMES, US_CAP, US_FORM, US_K, US_MAIN_ORDER, US_SETS (+49 more)

### Community 18 - "48_progression.js"
Cohesion: 0.09
Nodes (57): PG_B, PG_BY, PG_LV_RANK, PG_MAT, PG_MAT_GIFT, PG_PAL, PG_POW, PG_PTS (+49 more)

### Community 19 - "20_collection.js"
Cohesion: 0.07
Nodes (55): actionSig(), addComp(), buildChar(), CHAR_TPL, COMP_FROM, compCard(), compE(), compIds() (+47 more)

### Community 20 - "49_foyer3d.js"
Cohesion: 0.09
Nodes (54): F3_FLOOR_ONLY, F3_LV, F3_POST, F3_SLOT, F3_SLOTS, F3_WALLS, F3_WANDER, F3_WNAME (+46 more)

### Community 21 - "18_boutique.js"
Cohesion: 0.06
Nodes (48): BQ_CAT, BQ_CLIENTS, BQ_EASY_CRAFT, BQ_GEN, BQ_GEN_SHOP, BQ_ICONS, BQ_LEVELS, BQ_LOOK (+40 more)

### Community 22 - "31_foyer.js"
Cohesion: 0.10
Nodes (48): FY_EFF, FY_EXPR, FY_IC, FY_KIND, FY_LOVED(), FY_PHOTO_EFF, FY_ROOM_ART, FY_ROOM_NAME (+40 more)

### Community 23 - "01_draw_chars.js"
Cohesion: 0.04
Nodes (34): ALL_PATS, CHARS, EARS, EGG_SPOTS, EYES, FOODS, HEAD_SPOTS, IC (+26 more)

### Community 24 - "32_compagnons.js"
Cohesion: 0.08
Nodes (46): CP_BR, CP_DEX, CP_EFF, CP_GEN, CP_ICO, CP_SP, CP_TIER_GOAL, CP_WEAR (+38 more)

### Community 25 - "23_objets.js"
Cohesion: 0.10
Nodes (42): OB_ALIAS, OB_FAM_ALIAS, OB_FAM_EMPTY, OB_FNS, OB_GROUPS, OB_IC, OB_K, OB_PCT (+34 more)

### Community 26 - "09_logic_b.js"
Cohesion: 0.10
Nodes (39): autoChoice(), autoResolve(), CAT_LABEL, CHOICES, choiceTag(), compTemper(), decorArt(), eventPlace() (+31 more)

### Community 27 - "10_ui.js"
Cohesion: 0.09
Nodes (38): bqSubSafe(), canCraft(), eligible(), getSub(), ingCount(), isTestMode(), itemActs(), itemUses() (+30 more)

### Community 28 - "24_tuto.js"
Cohesion: 0.11
Nodes (32): $q(), st_prefBelow(), TU_IDX, TU_STEPS, tuBackToOrder(), tuBuild(), tuCheckDest(), tuE() (+24 more)

### Community 29 - "28_economie.js"
Cohesion: 0.07
Nodes (29): D_(), ECO_CAPC, ECO_CAPS, ECO_DUR_RES, ECO_EV, ECO_EVENTS, ECO_EXCH, ECO_EXCL (+21 more)

### Community 30 - "37_commerce.js"
Cohesion: 0.07
Nodes (31): CM_ADV, CM_ANIM, CM_FAM0, CM_LINES, CM_R, CM_RAW, CM_RW_KIND, CM_TIER (+23 more)

### Community 31 - "33_boutique.js"
Cohesion: 0.11
Nodes (30): openBoutique(), b2(), B2_HEART, B2_OLD_DECOS, B2_QO, b2Auc(), b2AucHTML(), b2AucPaint() (+22 more)

### Community 32 - "46_quetes_modes.js"
Cohesion: 0.12
Nodes (28): QM_BY, QM_DF, QM_HTML, QM_MODES, QM_VIT, qmCall(), qmCard(), qmCharC (+20 more)

### Community 33 - "30_butin.js"
Cohesion: 0.07
Nodes (28): BT_CAT_SUBS, BT_FR, BT_FRMAP, BT_GO, BT_IC, BT_ISO_ALIAS, BT_LISTS, BT_LOC_KEYS (+20 more)

### Community 34 - "12_jeu.js"
Cohesion: 0.10
Nodes (18): ACH, achPop(), checkLogin(), claimGift(), claimTier(), dayNum(), _evCache, EVENTS (+10 more)

### Community 35 - "16_live.js"
Cohesion: 0.13
Nodes (25): FOG_RAMP, fogWeight(), initVisited(), LIVE_KIND, liveAgo(), liveAskText(), liveFindHTML(), liveIcon() (+17 more)

### Community 36 - "42_fideles.js"
Cohesion: 0.16
Nodes (27): CF_GO, CF_PERKS, CF_SEEDS, cfActive(), cfAllActive(), cfCall(), cfCardHTML(), cfClientsHTML() (+19 more)

### Community 37 - "25_trajet.js"
Cohesion: 0.13
Nodes (22): homeObj(), kmBetween(), tripPlanMs(), tripRoundMs(), closeSheet(), TRJ_ICO, TRJ_SHORT, trjClock() (+14 more)

### Community 38 - "03_data.js"
Cohesion: 0.08
Nodes (24): ANIMALS, DURS, FOOD_TASTE, HELPS, HOMES, HOUSE_SLOTS, ING, LOOT (+16 more)

### Community 39 - "40_foyer.js"
Cohesion: 0.20
Nodes (23): FW_J, FW_JOBS, FW_SVG, fwCatchUp(), fwCmF(), fwCmGap(), fwGardenX(), fwHome() (+15 more)

### Community 40 - "bqState"
Cohesion: 0.21
Nodes (23): addRep(), BQC(), bqCheckReady(), bqDeliver(), bqGo(), bqLevelOf(), bqLevelUp(), bqLv() (+15 more)

### Community 41 - "08_goal.js"
Cohesion: 0.14
Nodes (16): carnetHTML(), CHAPTERS, claimChapter(), EUROPE, foundIn(), GOAL_ICON, goalData(), goalState() (+8 more)

### Community 42 - "34_aventure_anim.js"
Cohesion: 0.11
Nodes (13): AX, AX_BIOME, AX_CRIT, AX_GROUND, AX_RULES, AX_SKY, axActFor(), axCritter() (+5 more)

### Community 43 - "drawChar"
Cohesion: 0.27
Nodes (21): arms(), auraOf(), backItems(), bellyOf(), capsule(), drawChar(), footCol(), geo() (+13 more)

### Community 44 - "renderPanel"
Cohesion: 0.16
Nodes (21): boot(), loop(), craft(), houseSVG(), hudTeam(), openSheet(), placeInHouse(), reactionPopup() (+13 more)

### Community 45 - "cmRecipesHTML"
Cohesion: 0.17
Nodes (21): cmAnimSVG(), cmBuyGap(), cmCanIng(), cmDefiP(), cmDur(), cmEnvieList(), cmEnvieOf(), cmHave() (+13 more)

### Community 46 - "39_icones.js"
Cohesion: 0.17
Nodes (18): iBone(), iC(), ICO, ICO_RULES, _icoCache, iCream(), iCup(), iE() (+10 more)

### Community 47 - "bqStock"
Cohesion: 0.15
Nodes (19): BQ_PER(), bqArticle(), bqArticle0(), bqBuy(), bqCheapF(), bqChoicePending(), bqFly(), bqFX() (+11 more)

### Community 48 - "04_poidata.js"
Cohesion: 0.12
Nodes (16): ARBRES, BOIS_N, CHAMP_N, FERME_N, NOMS, OSM_CAT, POI_CATS, POI_GLYPH (+8 more)

### Community 49 - "renderTournoi"
Cohesion: 0.22
Nodes (17): ecoDuelShow(), ecoField(), ecoHash(), ecoOppPortrait(), ecoPresentBonus(), ecoRng(), ecoRoundOpen(), ecoStandings() (+9 more)

### Community 50 - "btSources"
Cohesion: 0.17
Nodes (16): btBest(), btCatL(), btFreeComp(), btGoCountry(), btGoPlace(), btGoSub(), btGoZone(), btIco() (+8 more)

### Community 51 - "ecoState"
Cohesion: 0.21
Nodes (15): ecoCapsuleSVG(), ecoDoPull(), ecoExchange(), ecoExLeft(), ecoMachineSVG(), ecoPrizeLabel(), ecoPrizePool(), ecoPull() (+7 more)

### Community 52 - "btEnrich"
Cohesion: 0.19
Nodes (15): btCardHTML(), btEnrich(), btFreshPick(), btLocalItem(), btMood(), btPlaceRef(), btPoolOf(), btRecentList() (+7 more)

### Community 53 - "cmPaint"
Cohesion: 0.19
Nodes (14): cmAccept(), cmOnComptoir(), cmPaint(), cmSell(), czAfter(), czBusy(), czFxFrom(), czGhost() (+6 more)

### Community 54 - "collect"
Cohesion: 0.24
Nodes (11): collect(), kmExact(), startTrip(), weightedType(), mdGroups(), mdGuessPlace(), mdKey(), mdRegionOf() (+3 more)

### Community 55 - "bqOrderCard"
Cohesion: 0.22
Nodes (13): bqAllocate(), bqCompSVG(), bqIsBait(), bqItemOf(), bqMatch(), bqOrderCard(), bqPetTake(), bqRarity() (+5 more)

### Community 56 - "BQS"
Cohesion: 0.26
Nodes (13): bqChooseOpen(), bqChooseRender(), bqEggSVG(), bqEmblem(), bqFacadeSVG(), bqFacadeURI(), bqNextSlot(), bqOpenShop() (+5 more)

### Community 57 - "btIdentity"
Cohesion: 0.23
Nodes (13): btCatalog(), btCatOf(), btCol(), btDe(), btDef(), btFlav(), btHash(), btIdentity() (+5 more)

### Community 58 - "czLayerHTML"
Cohesion: 0.23
Nodes (13): cmIcon(), cmItem(), czActive(), czGest(), czLayerHTML(), czMakeHTML(), czPetsHTML(), czSeenNew() (+5 more)

### Community 59 - "showHaul"
Cohesion: 0.21
Nodes (12): achDone(), achHTML(), achReady(), checkAch(), checkTiers(), claimAch(), haulCard(), layoutJeuBar() (+4 more)

### Community 60 - "ecoPending"
Cohesion: 0.24
Nodes (12): ecoAddTickets(), ecoBirthdays(), ecoClaim(), ecoDated(), ecoMonthDef(), ecoMonthGift(), ecoMonthKey(), ecoPending() (+4 more)

### Community 61 - "czSceneHTML"
Cohesion: 0.29
Nodes (12): czBackSVG(), czForeSVG(), czFrontSVG(), czSceneHTML(), czStation(), czSteam(), czSunHTML(), czSW() (+4 more)

### Community 62 - "colorsOf"
Cohesion: 0.20
Nodes (10): charModel(), colorsOf(), compLookDefault(), geneLabel(), geneRarity(), hexRGB(), lookOf(), lumHex() (+2 more)

### Community 63 - "face"
Cohesion: 0.22
Nodes (10): drawEgg(), eggMotif(), eyeOpen(), face(), heartD(), patBody(), patHead(), shineOf() (+2 more)

### Community 64 - "mixHex"
Cohesion: 0.31
Nodes (10): inheritSpecial(), mixGenes(), mixHex(), mutate(), patColFor(), pick(), randomGenes(), rarityW() (+2 more)

### Community 65 - "11_anim.js"
Cohesion: 0.33
Nodes (7): burst(), hop(), idle(), lineFor(), react(), say(), setMood()

### Community 66 - "bqPass"
Cohesion: 0.20
Nodes (10): bqCatFor(), bqHome(), bqPass(), bqPassBuy(), bqPassSlot(), bqPoiOK(), bqRegionsFor(), bqReqWhere() (+2 more)

### Community 67 - "ecoActive"
Cohesion: 0.24
Nodes (10): ecoActive(), ecoCap(), ecoDailyFace(), ecoGo(), ecoMachineDot(), ecoOn(), ecoOpenCap(), ecoOpenEvent() (+2 more)

### Community 68 - "ecoGive"
Cohesion: 0.29
Nodes (10): ecoBuyEv(), ecoEgg(), ecoEvEggGenes(), ecoEvItem(), ecoGive(), ecoPalGenes(), ecoRecOwned(), ecoResName() (+2 more)

### Community 69 - "bqNewOrder"
Cohesion: 0.31
Nodes (9): bqCraftOK(), bqFitDef(), bqFitReq(), bqGenFor(), bqGenShop(), bqNewOrder(), bqPick(), bqShopSubs() (+1 more)

### Community 70 - "ecoMenuHTML"
Cohesion: 0.42
Nodes (9): ecoDate(), ecoDaysLeft(), ecoEventCard(), ecoEvState(), ecoIconSVG(), ecoMachIcon(), ecoMenuHTML(), ecoRenderEvent() (+1 more)

### Community 71 - "cmState"
Cohesion: 0.33
Nodes (9): cmComptoir(), cmDefiOpen(), cmFinish(), cmGrant(), cmState(), cmTickKitchen(), czBodyHTML(), czPaintBody() (+1 more)

### Community 72 - "loginModal"
Cohesion: 0.32
Nodes (8): evColor(), eventModal(), evIcon(), GIFT(), goEvent(), loginModal(), rewardCell(), todayEvent()

### Community 73 - "smooth"
Cohesion: 0.29
Nodes (7): banditMask(), bez(), flipperPath(), headPath(), MARKS(), plume(), smooth()

### Community 74 - "btInfo"
Cohesion: 0.29
Nodes (7): BT_GROUP(), btCountryData(), btHomeInfo(), btHomeRegion(), btHomeZone(), btInfo(), btSub()

### Community 75 - "cmDefiEnd"
Cohesion: 0.33
Nodes (6): cmDefiEnd(), cmDefiStop(), cmOrderCard(), cmOrdersHTML(), cmRwHTML(), cmStars()

### Community 76 - "confetti"
Cohesion: 0.50
Nodes (5): coinFX(), confetti(), flyCoins(), fxLayer(), reduceMotion()

### Community 77 - "btNorm"
Cohesion: 0.67
Nodes (4): btFlags(), btNorm(), btResultsHTML(), btSearch()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `collect()` connect `collect` to `30_butin.js`, `45_equipage.js`, `27_tresors.js`, `17_regions.js`, `43_mysteres.js`, `44_monde.js`, `38_quetes.js`, `41_expedition.js`, `47_usages.js`, `48_progression.js`, `49_foyer3d.js`, `09_logic_b.js`, `10_ui.js`, `24_tuto.js`, `28_economie.js`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `21_nurserie.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05396825396825397 - nodes in this community are weakly interconnected._
- **Why does `showHaul()` connect `showHaul` to `29_aventure.js`, `12_jeu.js`, `45_equipage.js`, `43_mysteres.js`, `44_monde.js`, `38_quetes.js`, `confetti`, `41_expedition.js`, `47_usages.js`, `49_foyer3d.js`, `23_objets.js`, `28_economie.js`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `29_aventure.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05054945054945055 - nodes in this community are weakly interconnected._
- **Why does `renderVoyage()` connect `10_ui.js` to `21_nurserie.js`, `29_aventure.js`, `12_jeu.js`, `16_live.js`, `27_tresors.js`, `25_trajet.js`, `43_mysteres.js`, `44_monde.js`, `45_equipage.js`, `renderPanel`, `41_expedition.js`, `09_logic_b.js`, `24_tuto.js`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `45_equipage.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07669703203056127 - nodes in this community are weakly interconnected._
- **Should `27_tresors.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0698584763625414 - nodes in this community are weakly interconnected._