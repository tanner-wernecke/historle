import { useState, useEffect, useCallback, useRef } from "react";

// ── Puzzle loading ──────────────────────────────────────────────────────────
// Puzzles are pre-generated nightly by the GitHub Action and stored as
// public/puzzles/YYYY-MM-DD.json. The frontend just fetches today's file.

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Fallback puzzle shown if today's generated file isn't available yet
// (e.g. first deploy before the Action has run)
const FALLBACK_PUZZLES = [
  {
    chronicle: { events: [
      { id: 1, text: "Qin Shi Huang unifies China, becomes first emperor", year: -221 },
      { id: 2, text: "Roman Colosseum completed under Emperor Titus", year: 80 },
      { id: 3, text: "Genghis Khan unites Mongol tribes and begins conquest", year: 1206 },
      { id: 4, text: "Gutenberg prints first Bible with movable type", year: 1455 },
      { id: 5, text: "American Declaration of Independence signed", year: 1776 },
    ]},
    eracle: { clues: ["A great wall was begun by a dynasty to repel northern invaders","It stretches across a vast frontier in East Asia","The Ming dynasty greatly expanded and fortified this structure"], answer_year: 1368, event_name: "Ming Dynasty begins Great Wall expansion", explanation: "The Ming Dynasty, beginning in 1368, undertook the most ambitious construction of the Great Wall, transforming it into the iconic brick-and-stone structure known today." },
    borderle: { empire_name: "Mongol Empire", time_period: "at its peak in 1279 AD", clues: ["The largest contiguous land empire in history","Originated on the steppes of Central Asia","Founded by a ruler known for uniting nomadic tribes","Stretched from the Pacific Ocean to Eastern Europe","Its founder's name means 'Universal Ruler'"], fun_fact: "At its peak, the Mongol Empire covered over 24 million square kilometers and ruled roughly a quarter of the world's population.", options: ["Mongol Empire","Ottoman Empire","Tang Dynasty","Timurid Empire","Khwarazmian Empire","Yuan Dynasty"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Alexander the Great defeats Persia at Gaugamela", year: -331 },
      { id: 2, text: "Muhammad receives first revelation in Mecca", year: 610 },
      { id: 3, text: "Black Death reaches Europe via Crimean ports", year: 1347 },
      { id: 4, text: "Columbus makes first contact with the Americas", year: 1492 },
      { id: 5, text: "French Revolution begins with storming of Bastille", year: 1789 },
    ]},
    eracle: { clues: ["A monumental structure was built to honor the dead in a desert land","Workers numbering in the tens of thousands toiled for decades","It remains one of the Seven Wonders of the Ancient World"], answer_year: -2560, event_name: "Great Pyramid of Giza completed", explanation: "The Great Pyramid of Giza, built for Pharaoh Khufu around 2560 BCE, stood as the world's tallest man-made structure for over 3,800 years." },
    borderle: { empire_name: "Roman Empire", time_period: "at its peak under Trajan in 117 AD", clues: ["Centered on a city famously built on seven hills","Its legal system forms the basis of many modern laws","At its height it encircled an entire inland sea","Its legions used a distinctive rectangular shield called the scutum","Julius Caesar was one of its most famous leaders"], fun_fact: "At its height, the Roman Empire had a population of approximately 70 million people — about 21% of the world's total population at the time.", options: ["Roman Empire","Byzantine Empire","Carthaginian Empire","Macedonian Empire","Parthian Empire","Sassanid Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Ashoka converts to Buddhism after Kalinga War", year: -260 },
      { id: 2, text: "Viking Leif Eriksson reaches North America", year: 1000 },
      { id: 3, text: "Ottoman Turks conquer Constantinople", year: 1453 },
      { id: 4, text: "Galileo publishes support for Copernican heliocentrism", year: 1632 },
      { id: 5, text: "Wright Brothers achieve first powered flight at Kitty Hawk", year: 1903 },
    ]},
    eracle: { clues: ["An island nation's powerful navy defeated a much larger fleet","The battle took place in Asian waters in the early 20th century","It was the first time an Asian power defeated a European one in modern warfare"], answer_year: 1905, event_name: "Battle of Tsushima — Japan defeats Russia", explanation: "Japan's decisive naval victory over Russia at Tsushima in 1905 shocked the world and signaled the rise of Japan as a major world power." },
    borderle: { empire_name: "Ottoman Empire", time_period: "at its peak in the 16th century", clues: ["Controlled territory across three continents for over 600 years","Founded by a dynasty of Turkic rulers in Anatolia","Captured a great Christian city in 1453, ending an ancient empire","Its ruler held the title of Caliph and Sultan","It bordered the Habsburg Empire to the west and Persia to the east"], fun_fact: "The Ottoman Empire lasted from 1299 to 1922, making it one of the longest-lasting empires in history at over 600 years.", options: ["Ottoman Empire","Safavid Empire","Mamluk Sultanate","Byzantine Empire","Timurid Empire","Mughal Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Socrates executed by hemlock in Athens", year: -399 },
      { id: 2, text: "Justinian I codifies Roman law in Corpus Juris Civilis", year: 529 },
      { id: 3, text: "Aztec capital Tenochtitlan founded in Lake Texcoco", year: 1325 },
      { id: 4, text: "Isaac Newton publishes laws of motion and gravity", year: 1687 },
      { id: 5, text: "Meiji Restoration ends Japanese feudalism", year: 1868 },
    ]},
    eracle: { clues: ["A rebellion of enslaved people shook an ancient republic","The leader was a gladiator who had escaped from a training school","His army swelled to over 70,000 before being defeated"], answer_year: -73, event_name: "Spartacus leads slave revolt against Rome", explanation: "Spartacus led a massive slave uprising against the Roman Republic from 73–71 BCE, becoming one of history's most famous symbols of resistance against oppression." },
    borderle: { empire_name: "Mughal Empire", time_period: "under Akbar the Great in the late 16th century", clues: ["A Muslim dynasty that ruled over a predominantly Hindu population","Located on the Indian subcontinent","Famous for commissioning exquisite architectural monuments","One of its emperors built a white marble mausoleum for his wife","Founded by a descendant of both Timur and Genghis Khan"], fun_fact: "At its peak, the Mughal Empire produced about 25% of the world's GDP, making it one of the wealthiest empires in history.", options: ["Mughal Empire","Delhi Sultanate","Maratha Empire","Vijayanagara Empire","Safavid Empire","Bengal Sultanate"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Hannibal crosses the Alps to invade Italy", year: -218 },
      { id: 2, text: "Tang Dynasty founded, ushering golden age in China", year: 618 },
      { id: 3, text: "Magna Carta signed by King John at Runnymede", year: 1215 },
      { id: 4, text: "Haiti becomes first Black republic after revolution", year: 1804 },
      { id: 5, text: "Russian Revolution ends Romanov dynasty", year: 1917 },
    ]},
    eracle: { clues: ["A great trading empire in West Africa controlled the gold-salt trade","Its ruler famously made a pilgrimage that flooded Mediterranean markets with gold","It spanned the Niger River basin and Saharan trade routes"], answer_year: 1324, event_name: "Mansa Musa's pilgrimage to Mecca", explanation: "Mansa Musa of the Mali Empire made his legendary pilgrimage to Mecca in 1324, distributing so much gold along the way that he caused inflation across North Africa and the Middle East." },
    borderle: { empire_name: "Mali Empire", time_period: "under Mansa Musa in the 14th century", clues: ["A powerful empire in the West African Sahel region","Controlled key trans-Saharan trade routes for gold and salt","Its most famous city was a center of Islamic learning","Its ruler was reputedly the wealthiest person who ever lived","Timbuktu was one of its great cultural capitals"], fun_fact: "Mansa Musa's Mali Empire was so wealthy that his pilgrimage to Mecca reportedly depressed gold prices across the Mediterranean for a decade.", options: ["Mali Empire","Songhai Empire","Ghana Empire","Kanem-Bornu Empire","Benin Kingdom","Ashanti Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Battle of Marathon — Greeks repel Persian invasion", year: -490 },
      { id: 2, text: "Norse settlers establish first Greenland colony", year: 985 },
      { id: 3, text: "Zheng He begins voyages across Indian Ocean", year: 1405 },
      { id: 4, text: "American Civil War ends, slavery abolished", year: 1865 },
      { id: 5, text: "First atomic bomb dropped on Hiroshima", year: 1945 },
    ]},
    eracle: { clues: ["A massive earthquake and tsunami destroyed a European city in minutes","The city had been a wealthy capital of a colonial trading empire","The disaster shocked Enlightenment thinkers and inspired philosophical debate"], answer_year: 1755, event_name: "Lisbon earthquake and tsunami", explanation: "The 1755 Lisbon earthquake, one of the deadliest in European history, killed up to 100,000 people and shook the philosophical foundations of Enlightenment optimism." },
    borderle: { empire_name: "Inca Empire", time_period: "at its peak in the early 16th century", clues: ["A civilization built in high-altitude mountain terrain","Located along the western coast of South America","Used an elaborate road system and knotted cords for record-keeping","Worshipped the sun god Inti and built temples in his honor","Conquered by Spanish forces led by Francisco Pizarro"], fun_fact: "The Inca road system stretched over 40,000 kilometers — longer than the circumference of the Earth — built without wheeled vehicles or iron tools.", options: ["Inca Empire","Aztec Empire","Maya civilization","Chimu Empire","Tiwanaku Empire","Muisca Confederation"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Julius Caesar assassinated on the Ides of March", year: -44 },
      { id: 2, text: "Emperor Charlemagne crowned by Pope Leo III", year: 800 },
      { id: 3, text: "Spanish Inquisition established by Ferdinand and Isabella", year: 1478 },
      { id: 4, text: "Napoleon defeated at Waterloo, exiled to St. Helena", year: 1815 },
      { id: 5, text: "Berlin Wall falls, Cold War begins to end", year: 1989 },
    ]},
    eracle: { clues: ["A plague swept through Eurasia killing vast swaths of the population","It arrived in Europe via trade routes from the East","It killed between 30 and 60 percent of Europe's population"], answer_year: 1347, event_name: "Black Death reaches Europe", explanation: "The Black Death arrived in Europe in 1347 and over the following years killed an estimated 30–60% of Europe's population, one of the deadliest pandemics in human history." },
    borderle: { empire_name: "Byzantine Empire", time_period: "under Justinian I in the 6th century", clues: ["A continuation of the Roman Empire in its eastern half","Its capital city straddled Europe and Asia","Preserved Greco-Roman knowledge through the European Dark Ages","Renowned for its gold coin and its mosaic art","Fell to Ottoman forces in 1453 after over a thousand years"], fun_fact: "The Byzantine Empire lasted over 1,000 years — from 476 AD to 1453 — making it one of the longest-lived empires in history.", options: ["Byzantine Empire","Ottoman Empire","Holy Roman Empire","Latin Empire","Sassanid Empire","Seljuk Sultanate"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Library of Alexandria founded under Ptolemy I", year: -283 },
      { id: 2, text: "Prophet Muhammad's hijra from Mecca to Medina", year: 622 },
      { id: 3, text: "Joan of Arc leads French forces at Orléans", year: 1429 },
      { id: 4, text: "Steam engine patented by James Watt, sparks industrialization", year: 1769 },
      { id: 5, text: "DNA double helix structure discovered by Watson and Crick", year: 1953 },
    ]},
    eracle: { clues: ["An explorer landed on a Caribbean island, beginning a transformative encounter","He believed he had reached the East Indies","His voyage was funded by the Spanish crown"], answer_year: 1492, event_name: "Columbus reaches the Americas", explanation: "Columbus's 1492 landing in the Caribbean initiated sustained contact between Europe and the Americas, permanently transforming both worlds." },
    borderle: { empire_name: "Aztec Empire", time_period: "under Moctezuma II in the early 16th century", clues: ["An empire built on an island city in the middle of a lake","Located in central Mesoamerica","Practiced ritual sacrifice to appease their sun god Huitzilopochtli","Collected tribute from dozens of conquered peoples","Destroyed by Spanish conquistadors and their indigenous allies"], fun_fact: "Tenochtitlan, the Aztec capital, had a population of over 200,000 — larger than any European city at the time — and featured aqueducts, causeways, and floating gardens.", options: ["Aztec Empire","Inca Empire","Maya civilization","Toltec Empire","Zapotec civilization","Olmec civilization"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Buddha achieves enlightenment under Bodhi tree", year: -528 },
      { id: 2, text: "First Crusade captures Jerusalem from Seljuk Turks", year: 1099 },
      { id: 3, text: "Martin Luther nails 95 Theses to Wittenberg church door", year: 1517 },
      { id: 4, text: "Charles Darwin publishes On the Origin of Species", year: 1859 },
      { id: 5, text: "Nelson Mandela elected South Africa's first Black president", year: 1994 },
    ]},
    eracle: { clues: ["A small group of ships completed a circumnavigation of the globe","The expedition departed from a European Atlantic port","Only one of five original ships returned, but it was the first to circle the Earth"], answer_year: 1522, event_name: "Magellan-Elcano completes first circumnavigation", explanation: "The Magellan-Elcano expedition completed the first circumnavigation of the Earth in 1522, proving definitively that the world was round and far larger than previously thought." },
    borderle: { empire_name: "Persian Achaemenid Empire", time_period: "under Darius the Great around 500 BCE", clues: ["The first truly multicultural empire in the ancient world","Stretched from Egypt and Greece to modern-day Pakistan","Famous for its Royal Road and efficient postal system","Rulers used the title 'King of Kings'","Fought a famous series of wars against the Greek city-states"], fun_fact: "The Achaemenid Persian Empire was the largest empire in ancient history, covering approximately 5.5 million square kilometers at its height.", options: ["Persian Achaemenid Empire","Assyrian Empire","Babylonian Empire","Macedonian Empire","Parthian Empire","Lydian Kingdom"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Confucius begins teaching his moral philosophy in China", year: -500 },
      { id: 2, text: "Silk Road trade routes established under Han Dynasty", year: -130 },
      { id: 3, text: "Peter the Great founds Saint Petersburg as Russia's new capital", year: 1703 },
      { id: 4, text: "Suez Canal opens, connecting Red Sea and Mediterranean", year: 1869 },
      { id: 5, text: "India gains independence from British rule", year: 1947 },
    ]},
    eracle: { clues: ["A massive construction project connected two great oceans","It was built across a narrow strip of land in the tropics","The US took over the project after a French attempt failed"], answer_year: 1914, event_name: "Panama Canal opens", explanation: "The Panama Canal opened in 1914, connecting the Atlantic and Pacific Oceans and transforming global trade by eliminating the need to sail around South America." },
    borderle: { empire_name: "British Empire", time_period: "at its peak in the early 20th century", clues: ["At its height it controlled roughly a quarter of the world's land surface","Based on an island nation in northwestern Europe","Pioneered industrial revolution technologies","Colonized territories on every inhabited continent","Its vast reach inspired the phrase 'the sun never sets on it'"], fun_fact: "At its peak in 1920, the British Empire covered 35.5 million square kilometers — about 24% of the Earth's total land area.", options: ["British Empire","French Colonial Empire","Spanish Empire","Dutch Empire","Portuguese Empire","Russian Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Cyrus the Great founds Persian Achaemenid Empire", year: -550 },
      { id: 2, text: "Vikings sack the monastery at Lindisfarne", year: 793 },
      { id: 3, text: "Portuguese explorer Vasco da Gama reaches India by sea", year: 1498 },
      { id: 4, text: "French and Indian War ends, Britain dominates North America", year: 1763 },
      { id: 5, text: "World War I armistice signed, ending four years of war", year: 1918 },
    ]},
    eracle: { clues: ["A city-state defeated its rival after a long siege using a clever deception","The trick involved a large wooden animal left as a supposed gift","This story was told in one of the greatest epic poems of antiquity"], answer_year: -1184, event_name: "Fall of Troy (traditional date)", explanation: "The traditional date for the fall of Troy is 1184 BCE, when according to legend the Greeks used a wooden horse to sneak soldiers inside the city walls, immortalized in Homer's Iliad." },
    borderle: { empire_name: "Han Dynasty", time_period: "under Emperor Wu around 100 BCE", clues: ["A dynasty whose name is still used to describe China's majority ethnic group","Established one of history's greatest trade networks through Central Asia","Invented paper, the seismograph, and the iron plough","Bordered the Xiongnu nomads to the north","Lasted over 400 years and rivaled Rome in power and sophistication"], fun_fact: "The Han Dynasty's population of roughly 60 million rivaled the Roman Empire at the same time, making the two the twin superpowers of the ancient world.", options: ["Han Dynasty","Tang Dynasty","Qin Dynasty","Zhou Dynasty","Song Dynasty","Ming Dynasty"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Attila the Hun invades Western Roman Empire", year: 450 },
      { id: 2, text: "Saladin recaptures Jerusalem from Crusaders", year: 1187 },
      { id: 3, text: "Shakespeare writes Hamlet in London", year: 1601 },
      { id: 4, text: "Karl Marx and Engels publish The Communist Manifesto", year: 1848 },
      { id: 5, text: "Human Genome Project completed, mapping all human DNA", year: 2003 },
    ]},
    eracle: { clues: ["A naval engagement determined control of the Mediterranean world","It pitted the forces of two Roman political rivals against each other","The losing side included an Egyptian queen famous for her political alliances"], answer_year: -31, event_name: "Battle of Actium", explanation: "The Battle of Actium in 31 BCE saw Octavian defeat the combined forces of Mark Antony and Cleopatra, ending the Roman Republic and establishing the Roman Empire." },
    borderle: { empire_name: "Umayyad Caliphate", time_period: "at its peak around 720 AD", clues: ["The second of the four great Islamic caliphates","At its height it was the largest empire the world had ever seen","Stretched from the Iberian Peninsula to Central Asia","Its capital was in a city on the Orontes River in modern Syria","Defeated at the Battle of Tours by Charles Martel in 732"], fun_fact: "The Umayyad Caliphate at its greatest extent covered over 11 million square kilometers, making it the largest empire in history up to that point.", options: ["Umayyad Caliphate","Abbasid Caliphate","Fatimid Caliphate","Rashidun Caliphate","Ottoman Empire","Seljuk Sultanate"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Homer composes the Iliad and Odyssey (traditional date)", year: -750 },
      { id: 2, text: "Crusaders sack Constantinople during Fourth Crusade", year: 1204 },
      { id: 3, text: "Thirty Years War devastates Central Europe", year: 1618 },
      { id: 4, text: "Unification of Germany under Otto von Bismarck", year: 1871 },
      { id: 5, text: "Soviet Union launches Sputnik, first artificial satellite", year: 1957 },
    ]},
    eracle: { clues: ["A religious reformer nailed a list of objections to a church door in Germany","He was called before a Diet to recant his writings","His actions split Western Christianity into two branches"], answer_year: 1517, event_name: "Martin Luther posts his 95 Theses", explanation: "Martin Luther's 95 Theses in 1517, challenging papal authority and indulgences, sparked the Protestant Reformation and permanently divided Western Christianity." },
    borderle: { empire_name: "Spanish Empire", time_period: "at its peak in the 17th century", clues: ["The first global empire, with colonies on every inhabited continent","Based on the Iberian Peninsula in southwestern Europe","Funded by vast silver mines in the Americas","Its armada famously failed to invade England in 1588","Colonized most of Central and South America"], fun_fact: "At its height, the Spanish Empire encompassed about 13 million square kilometers and generated roughly 80% of the world's silver supply from its American mines.", options: ["Spanish Empire","Portuguese Empire","British Empire","French Colonial Empire","Holy Roman Empire","Dutch Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "King Hammurabi of Babylon creates first written law code", year: -1754 },
      { id: 2, text: "William the Conqueror defeats Harold at Battle of Hastings", year: 1066 },
      { id: 3, text: "Vasco da Gama rounds Cape of Good Hope on first voyage", year: 1497 },
      { id: 4, text: "Napoleon crowns himself Emperor of France", year: 1804 },
      { id: 5, text: "Cold War begins as Iron Curtain divides Europe", year: 1947 },
    ]},
    eracle: { clues: ["A long conflict between two major European powers defined a century","It involved battles from India to North America to Europe","It ended with one nation gaining dominance over the other's colonial empire"], answer_year: 1756, event_name: "Seven Years' War begins", explanation: "The Seven Years' War (1756–1763) was the first truly global conflict, fought across five continents, resulting in Britain becoming the world's dominant colonial power." },
    borderle: { empire_name: "Maurya Empire", time_period: "under Ashoka the Great around 250 BCE", clues: ["The first empire to unite most of the Indian subcontinent","Its greatest ruler converted to Buddhism after a bloody war","Located on the Indian subcontinent","Founded by a general after Alexander the Great's withdrawal from India","Famous for its polished sandstone pillar edicts found across South Asia"], fun_fact: "Ashoka renounced violence after the bloody Kalinga War and spread Buddhism across Asia through missionaries, edicts, and diplomacy.", options: ["Maurya Empire","Gupta Empire","Mughal Empire","Vijayanagara Empire","Kushan Empire","Satavahana Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Construction of Stonehenge begins in Neolithic Britain", year: -3000 },
      { id: 2, text: "First Olympic Games held at Olympia, Greece", year: -776 },
      { id: 3, text: "Johannes Kepler publishes laws of planetary motion", year: 1609 },
      { id: 4, text: "Opium Wars open Chinese ports to Western trade", year: 1839 },
      { id: 5, text: "Internet becomes publicly accessible with World Wide Web", year: 1991 },
    ]},
    eracle: { clues: ["A fleet of warships set out to conquer an island nation and was destroyed by weather","The sending nation was a major Catholic European power","The defender's victory made them the world's leading naval power"], answer_year: 1588, event_name: "Defeat of the Spanish Armada", explanation: "The defeat of the Spanish Armada in 1588, helped by storms and English fireships, ended Spain's attempt to invade England and began the decline of Spanish naval supremacy." },
    borderle: { empire_name: "Gupta Empire", time_period: "during the Golden Age around 400 AD", clues: ["Considered a golden age of Indian civilization","Produced major advances in mathematics, astronomy, and medicine","Located in the northern Indian subcontinent","Scholars here invented the concept of zero and the decimal system","Known for its classical art and the dramatist Kalidasa"], fun_fact: "Gupta-era mathematicians invented the numeral system now used worldwide, including the concept of zero — arguably the most important mathematical innovation in history.", options: ["Gupta Empire","Maurya Empire","Kushan Empire","Chola Empire","Satavahana Empire","Pallava Kingdom"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Athens defeats Persia at Battle of Salamis", year: -480 },
      { id: 2, text: "Charlemagne's empire divided among three grandsons", year: 843 },
      { id: 3, text: "Machu Picchu constructed by Inca ruler Pachacuti", year: 1450 },
      { id: 4, text: "First successful telegraph message sent by Samuel Morse", year: 1844 },
      { id: 5, text: "United Nations founded in San Francisco", year: 1945 },
    ]},
    eracle: { clues: ["A great medieval empire in sub-Saharan Africa controlled trans-Saharan gold trade","It collapsed partly due to a Moroccan invasion across the Sahara","Its scholars produced famous manuscripts now preserved in Timbuktu"], answer_year: 1591, event_name: "Moroccan invasion ends Songhai Empire", explanation: "The Songhai Empire collapsed in 1591 when a Moroccan army equipped with firearms crossed the Sahara and defeated the Songhai forces at Tondibi." },
    borderle: { empire_name: "Khmer Empire", time_period: "at its peak in the 12th century", clues: ["A Hindu-Buddhist empire in mainland Southeast Asia","Built some of the world's most spectacular temple complexes","Controlled the rich agricultural plains around a great lake","Its capital was home to possibly one million people in the 12th century","Its greatest temple is the largest religious monument ever built"], fun_fact: "Angkor Wat, built by the Khmer Empire in the 12th century, is the world's largest religious monument, covering over 400 acres.", options: ["Khmer Empire","Majapahit Empire","Pagan Kingdom","Ayutthaya Kingdom","Champa Kingdom","Srivijaya Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Egyptian pharaoh Ramesses II signs world's first peace treaty", year: -1259 },
      { id: 2, text: "Islamic scholars translate Greek texts at House of Wisdom", year: 830 },
      { id: 3, text: "Henry VIII breaks with Rome, creates Church of England", year: 1534 },
      { id: 4, text: "Emancipation Proclamation frees enslaved people in Confederacy", year: 1863 },
      { id: 5, text: "Chernobyl nuclear disaster in Soviet Ukraine", year: 1986 },
    ]},
    eracle: { clues: ["A conflict began when a duke was assassinated in a Balkan city","Within weeks, most of Europe was engulfed in war due to entangled alliances","The war lasted four years and killed approximately 20 million people"], answer_year: 1914, event_name: "Assassination of Franz Ferdinand starts WWI", explanation: "The assassination of Archduke Franz Ferdinand in Sarajevo on June 28, 1914 triggered a chain of alliance obligations that plunged Europe into the First World War." },
    borderle: { empire_name: "Safavid Empire", time_period: "under Shah Abbas I around 1600 AD", clues: ["A Shia Muslim dynasty that defined modern Iranian identity","Located on the Iranian plateau, between the Ottoman and Mughal empires","Its capital Isfahan was renowned as one of the world's most beautiful cities","Made Shia Islam the official state religion, still Iran's religion today","Fought a series of wars against the Sunni Ottoman Empire to its west"], fun_fact: "Shah Abbas I's capital Isfahan was so magnificent that the Persian saying 'Isfahan is half the world' became a popular proverb among travelers of the era.", options: ["Safavid Empire","Timurid Empire","Ilkhanate","Ottoman Empire","Buyid dynasty","Ghaznavid Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Pharaoh Akhenaten introduces monotheistic worship in Egypt", year: -1353 },
      { id: 2, text: "Battle of Tours stops Muslim expansion into Western Europe", year: 732 },
      { id: 3, text: "Portuguese begin Atlantic slave trade from West Africa", year: 1444 },
      { id: 4, text: "Treaty of Versailles signed, formally ending World War I", year: 1919 },
      { id: 5, text: "Rwanda Genocide kills approximately 800,000 people", year: 1994 },
    ]},
    eracle: { clues: ["An enslaved woman helped hundreds escape to freedom via secret networks","She used a network of safe houses called the Underground Railroad","She returned south many times at great personal risk to free others"], answer_year: 1849, event_name: "Harriet Tubman escapes slavery", explanation: "Harriet Tubman escaped slavery in 1849 and went on to make 13 rescue missions, freeing approximately 70 enslaved people, becoming one of history's most courageous freedom fighters." },
    borderle: { empire_name: "Ashanti Empire", time_period: "at its peak in the 18th–19th centuries", clues: ["A powerful West African empire known for its sophisticated political structure","Located in the forest zone of modern-day Ghana","Its king sat on a sacred golden stool representing the soul of the nation","Resisted British colonization in a series of Anglo-Ashanti Wars","Famous for its woven kente cloth and elaborate gold jewelry"], fun_fact: "The Ashanti Golden Stool was so sacred that even the king was not allowed to sit on it — it represented the soul of the entire Ashanti nation.", options: ["Ashanti Empire","Dahomey Kingdom","Benin Kingdom","Mali Empire","Songhai Empire","Oyo Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Phoenicians develop the first alphabetic writing system", year: -1050 },
      { id: 2, text: "Norman invasion of England — William defeats Harold at Hastings", year: 1066 },
      { id: 3, text: "Newton formulates his law of universal gravitation", year: 1666 },
      { id: 4, text: "First successful powered airplane flight by Wright Brothers", year: 1903 },
      { id: 5, text: "End of World War II in Europe (V-E Day)", year: 1945 },
    ]},
    eracle: { clues: ["A philosopher was tried by his city for corrupting the youth and impiety","He refused to flee and accepted the death sentence","His student's writings are our main source for his life and ideas"], answer_year: -399, event_name: "Trial and execution of Socrates", explanation: "Socrates was tried and executed by Athens in 399 BCE, choosing death over exile — an event that profoundly shaped Western philosophy." },
    borderle: { empire_name: "Zulu Kingdom", time_period: "under Shaka Zulu in the early 19th century", clues: ["A military kingdom in southern Africa that revolutionized African warfare","Founded by a leader who transformed a small clan into a regional power","Famous for its disciplined regiments called impi","Located in the modern-day South African province bearing its name","Famously defeated a British army at the Battle of Isandlwana in 1879"], fun_fact: "Shaka Zulu transformed a small clan of 1,500 people into a military powerhouse of 250,000 within twelve years through revolutionary tactics.", options: ["Zulu Kingdom","Ndebele Kingdom","Swazi Kingdom","Sotho Kingdom","Xhosa Kingdom","Mthethwa chiefdom"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Hammurabi of Babylon conquers Mesopotamia and codifies law", year: -1763 },
      { id: 2, text: "Byzantine Emperor Justinian reconquers parts of Western Rome", year: 533 },
      { id: 3, text: "Thirty Years War ends with Peace of Westphalia", year: 1648 },
      { id: 4, text: "Japan attacks Pearl Harbor, USA enters World War II", year: 1941 },
      { id: 5, text: "Nelson Mandela walks free after 27 years in prison", year: 1990 },
    ]},
    eracle: { clues: ["A long-running colonial war ended with a former colony gaining independence","The struggle involved guerrilla warfare against a European power","The victorious general later became a founding father and longtime leader"], answer_year: 1962, event_name: "Algerian Independence from France", explanation: "Algeria gained independence from France in 1962 after a brutal eight-year war, one of the most significant anti-colonial conflicts of the 20th century." },
    borderle: { empire_name: "Ethiopian Empire", time_period: "under Emperor Menelik II around 1900", clues: ["The only African nation to successfully resist European colonization at its peak","Located in the Horn of Africa on the continent's highland plateau","Its capital was founded by its famous emperor in the late 19th century","Defeated an invading Italian army at a famous battle in 1896","Claimed descent from the biblical King Solomon and the Queen of Sheba"], fun_fact: "Ethiopia's victory over Italy at the Battle of Adwa in 1896 was the first decisive defeat of a European colonial army by an African nation, inspiring anti-colonial movements worldwide.", options: ["Ethiopian Empire","Egyptian Khedivate","Mahdist Sudan","Ashanti Empire","Zulu Kingdom","Sokoto Caliphate"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Alexander the Great conquers Persian Empire", year: -330 },
      { id: 2, text: "Angkor Wat temple complex completed by Khmer king", year: 1150 },
      { id: 3, text: "William Harvey discovers circulation of blood", year: 1628 },
      { id: 4, text: "Opening of Japan — Commodore Perry forces trade agreement", year: 1854 },
      { id: 5, text: "Moon landing — Neil Armstrong walks on the Moon", year: 1969 },
    ]},
    eracle: { clues: ["A famous trade route connected China to the Mediterranean for over a millennium","It carried silk westward and glassware and gold eastward","It also spread religions, diseases, and technologies across Eurasia"], answer_year: -130, event_name: "Silk Road established under Han Emperor Wu", explanation: "Emperor Wu of the Han Dynasty established the Silk Road around 130 BCE, creating trade routes connecting China to Central Asia, Persia, and eventually the Roman Empire." },
    borderle: { empire_name: "Carthaginian Empire", time_period: "at its peak around 250 BCE", clues: ["A Mediterranean maritime empire founded by Phoenician colonists","Based in North Africa near modern-day Tunis","Fought three great wars against an Italian power for Mediterranean dominance","Its most famous general crossed the Alps with war elephants","Eventually destroyed by Rome, with the city famously 'salted'"], fun_fact: "Hannibal's crossing of the Alps with 37 war elephants in 218 BCE is one of history's most audacious military maneuvers — he then won several stunning victories on Italian soil.", options: ["Carthaginian Empire","Numidian Kingdom","Ptolemaic Egypt","Seleucid Empire","Syracuse","Phoenician city-states"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "First evidence of writing appears in Mesopotamia (cuneiform)", year: -3200 },
      { id: 2, text: "Justinian's plague kills millions across Byzantine Empire", year: 541 },
      { id: 3, text: "Moctezuma II meets Hernán Cortés in Tenochtitlan", year: 1519 },
      { id: 4, text: "Panama Canal construction begins under US management", year: 1904 },
      { id: 5, text: "Iran hostage crisis begins as revolutionaries seize US embassy", year: 1979 },
    ]},
    eracle: { clues: ["A global pandemic spread from a war-torn region across all continents","It killed more people than World War I itself","It disproportionately killed young adults aged 20 to 40"], answer_year: 1918, event_name: "Spanish Flu pandemic begins", explanation: "The 1918 Spanish Flu pandemic infected an estimated 500 million people and killed between 50 and 100 million — more than died in World War I — in just two years." },
    borderle: { empire_name: "Japanese Empire", time_period: "at its greatest extent in 1942", clues: ["An island nation in East Asia that rapidly industrialized in the 19th century","Defeated Russia in a naval battle in 1905, shocking the world","Built an empire across the Pacific and East Asian mainland","Its surprise attack on a US naval base brought America into World War II","Surrendered after two atomic bombs were dropped on its cities"], fun_fact: "Japan's Meiji Restoration transformed the country from a feudal society to an industrialized empire in just a few decades — the fastest modernization of any nation in history.", options: ["Japanese Empire","Tang Dynasty China","Korean Joseon Dynasty","Qing Dynasty","Nguyen Vietnam","Republic of China"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Founding of Rome (traditional date)", year: -753 },
      { id: 2, text: "Mongols destroy the Khwarazmian Empire in Central Asia", year: 1220 },
      { id: 3, text: "English Civil War begins between Parliament and King Charles", year: 1642 },
      { id: 4, text: "Trans-Siberian Railway completed, linking Russia's coasts", year: 1905 },
      { id: 5, text: "Partition of India creates Pakistan as independent state", year: 1947 },
    ]},
    eracle: { clues: ["A European empire fought a war against its own colonists in Asia","The colonists declared independence and established a republic","The country fought the same imperial power twice in this century"], answer_year: 1945, event_name: "Vietnamese Declaration of Independence", explanation: "Ho Chi Minh declared Vietnamese independence in 1945 after Japanese occupation ended, beginning a long struggle against French colonial restoration and later American intervention." },
    borderle: { empire_name: "Abbasid Caliphate", time_period: "during the Islamic Golden Age around 900 AD", clues: ["Its capital, the 'City of Peace', was founded on the Tigris River","Presided over a golden age of science, medicine, and philosophy","Translated and preserved Greek knowledge that Europe had lost","Destroyed by Mongol forces under Hulagu Khan in 1258","Al-Khwarizmi, who invented algebra, worked in its famous library"], fun_fact: "The Abbasid Caliphate's House of Wisdom in Baghdad became the world's greatest center of learning, where scholars translated texts from Greek, Persian, and Sanskrit into Arabic.", options: ["Abbasid Caliphate","Umayyad Caliphate","Fatimid Caliphate","Byzantine Empire","Sassanid Empire","Buyid dynasty"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Construction of the Parthenon begins on the Athenian Acropolis", year: -447 },
      { id: 2, text: "Genghis Khan dies, empire divided among sons", year: 1227 },
      { id: 3, text: "English East India Company founded by royal charter", year: 1600 },
      { id: 4, text: "Abolition of slavery in the British Empire", year: 1833 },
      { id: 5, text: "Collapse of the Soviet Union, end of Cold War", year: 1991 },
    ]},
    eracle: { clues: ["A pilgrims' ship sailed to a new land seeking religious freedom","They landed farther north than intended and faced a brutal first winter","Their autumn feast with indigenous people became a national holiday"], answer_year: 1620, event_name: "Mayflower Pilgrims land at Plymouth", explanation: "The Mayflower Pilgrims landed at Plymouth in 1620 and their subsequent harvest feast with the Wampanoag people inspired the American Thanksgiving tradition." },
    borderle: { empire_name: "Majapahit Empire", time_period: "at its peak under Hayam Wuruk in the 14th century", clues: ["A Hindu-Buddhist empire that dominated maritime Southeast Asia","Based on the main island of modern Indonesia","Its prime minister wrote a famous epic poem listing all its vassal states","Controlled trade routes from China to India across Southeast Asian seas","Its influence extended across the Indonesian archipelago and beyond"], fun_fact: "Majapahit's chief minister Gajah Mada swore an oath not to eat spiced food until he had unified all of Southeast Asia under Majapahit rule — a vow celebrated in Indonesian history.", options: ["Majapahit Empire","Srivijaya Empire","Khmer Empire","Sailendra dynasty","Singhasari Kingdom","Champa Kingdom"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Thucydides writes History of the Peloponnesian War", year: -404 },
      { id: 2, text: "Harun al-Rashid rules Abbasid Caliphate in Baghdad", year: 786 },
      { id: 3, text: "Magellan-Elcano expedition completes first circumnavigation", year: 1522 },
      { id: 4, text: "Charles Dickens publishes Oliver Twist, exposing poverty", year: 1837 },
      { id: 5, text: "Soviet Union dissolves, Cold War ends", year: 1991 },
    ]},
    eracle: { clues: ["A canal was constructed to connect two major world seas","Its construction required years of labor through one of the world's driest regions","Its opening transformed global shipping by eliminating a long detour"], answer_year: 1869, event_name: "Suez Canal opens", explanation: "The Suez Canal opened in 1869, connecting the Mediterranean and Red Seas and dramatically reducing travel time between Europe and Asia by eliminating the need to sail around Africa." },
    borderle: { empire_name: "Timurid Empire", time_period: "under Timur (Tamerlane) around 1400 AD", clues: ["Founded by a conqueror who claimed descent from Genghis Khan","Centered in Central Asia, between Persia and China","Its ruler sacked Delhi, Baghdad, and Damascus at different times","Its capital Samarkand became a center of Islamic art and architecture","Its rulers were great patrons of art, architecture, and astronomy"], fun_fact: "Timur's conquests caused the deaths of an estimated 17 million people — about 5% of the world's population — making him one of history's most destructive conquerors.", options: ["Timurid Empire","Mongol Empire","Ilkhanate","Chagatai Khanate","Golden Horde","Safavid Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Zhou Dynasty collapses into Warring States Period in China", year: -475 },
      { id: 2, text: "Normans complete conquest of England after Hastings", year: 1070 },
      { id: 3, text: "Copernicus publishes heliocentric model of solar system", year: 1543 },
      { id: 4, text: "American Civil War begins at Fort Sumter", year: 1861 },
      { id: 5, text: "First human heart transplant performed in Cape Town", year: 1967 },
    ]},
    eracle: { clues: ["An empire's capital fell to invaders after a prolonged siege","The city had been the center of Christianity in the East for over a millennium","Its fall marked the end of the medieval period for many historians"], answer_year: 1453, event_name: "Fall of Constantinople to the Ottomans", explanation: "The Ottoman conquest of Constantinople in 1453 ended the Byzantine Empire and is traditionally marked as the end of the Middle Ages and the beginning of the early modern period." },
    borderle: { empire_name: "Chola Empire", time_period: "at its peak under Rajendra Chola in the 11th century", clues: ["A maritime empire that projected power across the Indian Ocean","Based in the southern tip of the Indian subcontinent","Sent a naval expedition that raided kingdoms as far as Southeast Asia","Famous for its magnificent bronze sculptures of Hindu deities","Its navy defeated the Srivijaya Empire to control Indian Ocean trade"], fun_fact: "The Chola Empire's navy launched one of the most distant naval raids in medieval history, attacking Srivijaya in modern-day Indonesia and the Malay Peninsula.", options: ["Chola Empire","Pallava Kingdom","Vijayanagara Empire","Pandya Kingdom","Rashtrakuta dynasty","Chalukya Empire"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Cleopatra becomes co-ruler of Egypt with father Ptolemy XII", year: -52 },
      { id: 2, text: "Songhai Empire reaches its greatest extent under Askia Mohammed", year: 1493 },
      { id: 3, text: "Galileo Galilei born in Pisa, Italy", year: 1564 },
      { id: 4, text: "Apollo 11 lands on the Moon", year: 1969 },
      { id: 5, text: "World Wide Web invented by Tim Berners-Lee at CERN", year: 1989 },
    ]},
    eracle: { clues: ["A powerful maritime empire controlled the straits between two major seas","Based on an island in Southeast Asia","Grew wealthy by taxing all trade passing through its waters","A major center for Buddhist learning and pilgrimage","Its exact capital location was disputed by historians for centuries"], answer_year: 670, event_name: "Srivijaya Empire rises to power", explanation: "Srivijaya, based in Sumatra, rose to power around 670 CE and controlled the Strait of Malacca for centuries, becoming a crucial node in Indian Ocean trade and Buddhist learning." },
    borderle: { empire_name: "Srivijaya Empire", time_period: "at its peak in the 7th–9th centuries", clues: ["A maritime empire that controlled the straits between two major seas","Based on an island in Southeast Asia","Grew wealthy by taxing all trade passing through its waters","A major center for Buddhist learning and pilgrimage","Its exact capital location was disputed by historians for centuries"], fun_fact: "Srivijaya controlled the Strait of Malacca for centuries, making it one of the most strategically important empires in maritime history and a crucial node in Indian Ocean trade.", options: ["Srivijaya Empire","Majapahit Empire","Khmer Empire","Champa Kingdom","Pagan Kingdom","Ayutthaya Kingdom"] }
  },
  {
    chronicle: { events: [
      { id: 1, text: "Moses leads Israelites out of Egypt (traditional date)", year: -1250 },
      { id: 2, text: "Byzantine Emperor Heraclius defeats Persian Empire", year: 628 },
      { id: 3, text: "Aztec Empire falls to Hernán Cortés and his allies", year: 1521 },
      { id: 4, text: "Italian unification complete, Kingdom of Italy proclaimed", year: 1861 },
      { id: 5, text: "Apollo 11 Moon landing", year: 1969 },
    ]},
    eracle: { clues: ["A revolutionary document declared all men created equal","It was issued during a conflict between colonists and their parent nation","Signed in Philadelphia in a summer month"], answer_year: 1776, event_name: "US Declaration of Independence", explanation: "The Declaration of Independence, adopted on July 4, 1776, announced the thirteen American colonies' separation from Britain and established enduring principles of democratic governance." },
    borderle: { empire_name: "Songhai Empire", time_period: "under Askia the Great in the early 16th century", clues: ["The largest empire in African history by some measures","Located along the Niger River in West Africa","Inherited the Mali Empire's role as controller of trans-Saharan trade","Its city Timbuktu was a world center of Islamic scholarship","Fell to Moroccan musketeers despite having a much larger army"], fun_fact: "The University of Timbuktu in the Songhai Empire housed between 25,000 and 700,000 manuscripts and attracted scholars from across the Islamic world.", options: ["Songhai Empire","Mali Empire","Ghana Empire","Kanem-Bornu Empire","Ashanti Empire","Ethiopian Empire"] }
  },
];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function getTodaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getFallbackPuzzle() {
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return FALLBACK_PUZZLES[(d.getFullYear() * 1000 + dayOfYear) % FALLBACK_PUZZLES.length];
}

function todayString() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtYear(y) { return y < 0 ? `${Math.abs(y)} BCE` : String(y); }
function chronicleScore(a) { return [1000,700,400,100][Math.min(a-1,3)]; }
function eracleScore(d) { if(d===0)return 1000; if(d<=5)return 900; if(d<=10)return 800; if(d<=25)return 600; if(d<=50)return 400; if(d<=100)return 200; return 50; }
function borderleScore(a) { return [1000,800,600,400,200,50][Math.min(a-1,5)]; }

function ShareModal({ scores, onClose }) {
  const [copied, setCopied] = useState(false);
  const total = scores.reduce((a,b)=>a+b,0);
  const medal = total>=2500?"🥇":total>=1800?"🥈":total>=1000?"🥉":"📜";
  const label = total>=2500?"Historian Supreme":total>=1800?"Accomplished Scholar":total>=1000?"Apprentice Archivist":"Curious Student";
  const bar = s => "█".repeat(Math.round(s/200)) + "░".repeat(5-Math.round(s/200));
  const text = `📜 Historle — ${todayString()}\n${medal} ${label} — ${total}/3000\n\n📅 Chronicle  ${bar(scores[0])} ${scores[0]}\n🎯 Eracle     ${bar(scores[1])} ${scores[1]}\n🗺️ Borderle   ${bar(scores[2])} ${scores[2]}\n\nPlay at historle.game`;
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share your result</div>
        <pre className="share-pre">{text}</pre>
        <button className="copy-btn" onClick={copy}>{copied?"✓ Copied!":"Copy to clipboard"}</button>
      </div>
    </div>
  );
}

function ChronicleRound({ data, onComplete }) {
  const [items, setItems] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [shake, setShake] = useState(false);
  const submitted = !!result;

  // Refs for touch drag state — we use refs so touch handlers
  // always see current values without needing re-renders mid-drag
  const touchDragIdx = useRef(null);
  const touchTargetIdx = useRef(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    const rng = seededRandom(getTodaySeed()+1);
    setItems([...data.events].sort(()=>rng()-0.5));
  }, [data]);

  const check = () => {
    const sorted=[...items].sort((a,b)=>a.year-b.year);
    const ok=items.every((x,i)=>x.id===sorted[i].id);
    const na=attempts+1; setAttempts(na);
    if(ok){setResult({win:true,score:chronicleScore(na)});}
    else if(na>=3){setResult({win:false,score:chronicleScore(na),correct:sorted});}
    else{setShake(true);setTimeout(()=>setShake(false),600);}
  };

  // ── Touch handlers ──────────────────────────────────────────
  const handleTouchStart = (e, i) => {
    touchDragIdx.current = i;
    touchTargetIdx.current = i;
    setDragIdx(i);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // prevent scroll while dragging
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const row = el.closest('[data-sortidx]');
    if (!row) return;
    const targetIdx = parseInt(row.dataset.sortidx, 10);
    if (isNaN(targetIdx) || targetIdx === touchTargetIdx.current) return;
    touchTargetIdx.current = targetIdx;
    const from = touchDragIdx.current;
    const next = [...itemsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    touchDragIdx.current = targetIdx;
    setItems(next);
    setDragIdx(targetIdx);
  };

  const handleTouchEnd = () => {
    touchDragIdx.current = null;
    touchTargetIdx.current = null;
    setDragIdx(null);
  };

  // ── Mouse drag handlers (desktop fallback) ──────────────────
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setItems(next);
    setDragIdx(i);
  };

  if(!items.length)return null;
  return (
    <div className="round-wrap">
      <div className="rh"><span className="rbadge">01</span><div><h2 className="rtitle">Chronicle</h2><p className="rsub">Drag events into chronological order</p></div></div>
      <div className={`clist ${shake?"shake":""}`}>
        {items.map((item,i)=>(
          <div
            key={item.id}
            data-sortidx={i}
            className={`citem ${dragIdx===i?"dragging":""}`}
            draggable
            onDragStart={()=>setDragIdx(i)}
            onDragOver={e=>handleDragOver(e,i)}
            onDrop={()=>setDragIdx(null)}
            onTouchStart={e=>handleTouchStart(e,i)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className="dhandle">⠿</span>
            <span className="etext">{item.text}</span>
            {submitted&&<span className="eyear">{fmtYear(item.year)}</span>}
          </div>
        ))}
      </div>
      {!submitted&&<div className="arow"><span className="aleft">{3-attempts} attempt{3-attempts!==1?"s":""} left</span><button className="btnp" onClick={check}>Check Order</button></div>}
      {submitted&&result&&(
        <div className={`rcard ${result.win?"win":"lose"}`}>
          <div className="ricon">{result.win?"🏆":"📜"}</div>
          <p className="rtext">{result.win?`Correct! Solved in ${attempts} attempt${attempts!==1?"s":""}.`:"The correct order was:"}</p>
          {!result.win&&result.correct&&<div className="clist2">{result.correct.map(e=><div key={e.id} className="ci2"><span>{fmtYear(e.year)}</span> — {e.text}</div>)}</div>}
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={()=>onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function EracleRound({ data, onComplete }) {
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [clueIdx, setClueIdx] = useState(0);
  const [result, setResult] = useState(null);
  const submitted = !!result;

  const submit = () => {
    const yr=parseInt(guess,10); if(isNaN(yr))return;
    const diff=Math.abs(yr-data.answer_year);
    const ng=[...guesses,{year:yr,diff}]; setGuesses(ng); setGuess("");
    if(diff===0||ng.length>=3){setResult({win:diff===0,diff,score:eracleScore(diff)});}
    else{setClueIdx(Math.min(clueIdx+1,data.clues.length-1));}
  };
  const heat=d=>d===0?"🎯":d<=5?"🔥":d<=25?"♨️":d<=100?"🌡️":"🧊";
  const dir=g=>g.year<data.answer_year?"→ later":"← earlier";

  return (
    <div className="round-wrap">
      <div className="rh"><span className="rbadge">02</span><div><h2 className="rtitle">Eracle</h2><p className="rsub">Guess the year of this historical event</p></div></div>
      <div className="clues">
        {data.clues.slice(0,submitted?data.clues.length:clueIdx+1).map((c,i)=>(
          <div key={i} className={`clue ${i===clueIdx&&!submitted?"clue-active":""}`}>
            <span className="cnum">Clue {i+1}</span><span>{c}</span>
          </div>
        ))}
      </div>
      {guesses.length>0&&<div className="ghist">{guesses.map((g,i)=><div key={i} className="grow"><span className="gyear">{fmtYear(g.year)}</span><span className="gdiff">{heat(g.diff)} {g.diff===0?"Exact!":g.diff+" yrs off ("+dir(g)+")"}</span></div>)}</div>}
      {!submitted&&<div className="eracle-row"><input type="number" className="yinput" placeholder="e.g. 1453 or -44 for BCE" value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/><button className="btnp" onClick={submit}>Guess</button></div>}
      {submitted&&result&&(
        <div className={`rcard ${result.win?"win":"lose"}`}>
          <div className="ricon">{result.win?"🎯":"📅"}</div>
          <p className="rtext">{result.win?"Perfect!":"The answer was "+fmtYear(data.answer_year)+"."}</p>
          <p className="ereveal">{data.event_name}</p>
          <p className="eexp">{data.explanation}</p>
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={()=>onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function BorderleRound({ data, onComplete }) {
  const [attempts, setAttempts] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const submitted = !!result;
  const [shuffled] = useState(()=>{ const rng=seededRandom(getTodaySeed()+99); return [...data.options].sort(()=>rng()-0.5); });

  const go = () => {
    if(!selected)return;
    const ok=selected===data.empire_name; const na=attempts+1;
    setAttempts(na); setGuessed(g=>[...g,selected]); setSelected(null);
    if(ok||na>=5)setResult({win:ok,score:borderleScore(na)});
  };

  const cluesV=Math.min(attempts+1,data.clues.length);
  const avail=shuffled.filter(o=>!guessed.includes(o));

  return (
    <div className="round-wrap">
      <div className="rh"><span className="rbadge">03</span><div><h2 className="rtitle">Borderle</h2><p className="rsub">Identify this historical empire or kingdom</p></div></div>
      <div className="bperiod"><span className="plabel">Time Period</span><span className="pval">{data.time_period}</span></div>
      <div className="clues">
        {data.clues.slice(0,cluesV).map((c,i)=>(
          <div key={i} className={`clue ${i===attempts&&!submitted?"clue-active":""}`}>
            <span className="cnum">Clue {i+1}</span><span>{c}</span>
          </div>
        ))}
      </div>
      {guessed.length>0&&<div className="wguesses">{guessed.map((g,i)=><span key={i} className={`wbadge ${g===data.empire_name?"cbadge":""}`}>{g}</span>)}</div>}
      {!submitted&&<>
        <div className="ogrid">{avail.map(o=><button key={o} className={`obtn ${selected===o?"sel":""}`} onClick={()=>setSelected(o===selected?null:o)}>{o}</button>)}</div>
        <div className="arow"><span className="aleft">{5-attempts} guess{5-attempts!==1?"es":""} left</span><button className="btnp" onClick={go} disabled={!selected}>Confirm Guess</button></div>
      </>}
      {submitted&&result&&(
        <div className={`rcard ${result.win?"win":"lose"}`}>
          <div className="ricon">{result.win?"🗺️":"🏚️"}</div>
          <p className="rtext">{result.win?"Correct!":"It was the "+data.empire_name+"."}</p>
          <p className="ereveal">{data.empire_name}</p>
          <p className="eexp">{data.fun_fact}</p>
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={()=>onComplete(result.score)}>See Results →</button>
        </div>
      )}
    </div>
  );
}

function FinalScore({ scores, onShare }) {
  const total=scores.reduce((a,b)=>a+b,0);
  const medal=total>=2500?"🥇":total>=1800?"🥈":total>=1000?"🥉":"📜";
  const label=total>=2500?"Historian Supreme":total>=1800?"Accomplished Scholar":total>=1000?"Apprentice Archivist":"Curious Student";
  useEffect(()=>{
    setTimeout(()=>{
      document.querySelectorAll(".sbar").forEach((b,i)=>{
        setTimeout(()=>{b.style.width=`${(scores[i]/1000)*100}%`;},i*150);
      });
    },100);
  },[]);
  return (
    <div className="final">
      <div className="fmedal">{medal}</div>
      <h2 className="ftitle">{label}</h2>
      <p className="fdate">{todayString()}</p>
      <div className="fscore"><span className="ftotal">{total}</span><span className="fmax"> / 3000</span></div>
      <div className="sbreakdown">
        {["Chronicle","Eracle","Borderle"].map((n,i)=>(
          <div key={n} className="srow">
            <span className="slabel">{n}</span>
            <div className="sbarwrap"><div className="sbar" style={{width:0}}/></div>
            <span className="spts">{scores[i]}</span>
          </div>
        ))}
      </div>
      <button className="sharebtn" onClick={onShare}>Share Result 📤</button>
      <p className="comeback">Come back tomorrow for a new puzzle!</p>
    </div>
  );
}

export default function Historle() {
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dateStr = getTodayDateString();
    fetch(`/puzzles/${dateStr}.json`)
      .then(r => {
        if (!r.ok) throw new Error('No puzzle for today yet');
        return r.json();
      })
      .then(data => { setPuzzle(data); setLoading(false); })
      .catch(() => {
        // Fall back to the baked-in puzzle bank
        setPuzzle(getFallbackPuzzle());
        setLoading(false);
      });
  }, []);

  const complete = useCallback(s=>{ setScores(p=>[...p,s]); setRound(r=>r+1); },[]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--ink:#1a1209;--parch:#f5edd8;--pd:#e8d9b8;--sep:#8b6914;--sepl:#c4952a;--rust:#9b3a1a;--sage:#3d5c3a;--gold:#c9942a;--sh:rgba(26,18,9,0.15);}
        body{background:var(--parch);}
        .app{min-height:100vh;background:var(--parch);color:var(--ink);font-family:'Crimson Pro',Georgia,serif;background-image:radial-gradient(ellipse at 20% 20%,rgba(139,105,20,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(155,58,26,0.06) 0%,transparent 60%);}
        .mast{text-align:center;padding:1.8rem 1rem 1.1rem;border-bottom:2px solid var(--sep);}
        .mast::before{content:'◆ ◆ ◆';display:block;font-size:0.6rem;letter-spacing:0.5em;color:var(--sepl);margin-bottom:0.35rem;}
        .mtitle{font-family:'Playfair Display',serif;font-size:clamp(2.4rem,7vw,3.8rem);font-weight:900;letter-spacing:-0.02em;line-height:1;}
        .mtitle span{color:var(--rust);}
        .msub{font-size:0.82rem;color:var(--sep);letter-spacing:0.15em;text-transform:uppercase;margin-top:0.25rem;font-style:italic;}
        .mdate{font-size:0.73rem;color:var(--sepl);margin-top:0.25rem;}
        .prog{display:flex;justify-content:center;gap:0.5rem;padding:0.7rem;border-bottom:1px solid var(--pd);}
        .pip{width:2rem;height:4px;border-radius:2px;background:var(--pd);transition:background 0.3s;}
        .pip.active{background:var(--gold);}
        .pip.done{background:var(--sage);}
        .main{max-width:640px;margin:0 auto;padding:1.8rem 1.1rem 4rem;}
        .round-wrap{animation:fs 0.4s ease;}
        @keyframes fs{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .rh{display:flex;align-items:flex-start;gap:0.9rem;margin-bottom:1.3rem;padding-bottom:0.9rem;border-bottom:1px solid var(--pd);}
        .rbadge{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--pd);line-height:1;flex-shrink:0;}
        .rtitle{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;line-height:1.1;}
        .rsub{color:var(--sep);font-style:italic;font-size:0.88rem;margin-top:0.15rem;}
        .clist{display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1.3rem;}
        .citem{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0.9rem;background:white;border:1.5px solid var(--pd);border-radius:4px;cursor:grab;user-select:none;touch-action:none;transition:transform 0.15s,box-shadow 0.15s,border-color 0.15s;}
        .citem:hover{border-color:var(--sepl);box-shadow:0 2px 6px var(--sh);}
        .citem.dragging{opacity:0.5;transform:scale(0.97);}
        .dhandle{color:var(--pd);font-size:1rem;flex-shrink:0;}
        .etext{flex:1;font-size:0.94rem;line-height:1.4;}
        .eyear{font-family:'Playfair Display',serif;font-weight:700;color:var(--sep);font-size:0.87rem;white-space:nowrap;}
        .shake{animation:shk 0.5s;}
        @keyframes shk{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .clues{display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1.1rem;}
        .clue{display:flex;gap:0.75rem;padding:0.65rem 0.9rem;background:rgba(139,105,20,0.05);border-left:3px solid var(--pd);border-radius:0 4px 4px 0;font-size:0.93rem;animation:fi 0.3s ease;}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .clue.clue-active{border-left-color:var(--gold);background:rgba(201,148,42,0.08);}
        .cnum{font-size:0.68rem;font-weight:600;letter-spacing:0.05em;color:var(--sepl);text-transform:uppercase;flex-shrink:0;padding-top:0.12rem;min-width:3.3rem;}
        .ghist{display:flex;flex-direction:column;gap:0.32rem;margin-bottom:0.9rem;}
        .grow{display:flex;align-items:center;gap:0.9rem;padding:0.4rem 0.75rem;background:var(--pd);border-radius:4px;}
        .gyear{font-family:'Playfair Display',serif;font-weight:700;font-size:0.97rem;min-width:4rem;}
        .gdiff{font-size:0.86rem;}
        .eracle-row{display:flex;gap:0.55rem;margin-bottom:0.9rem;}
        .yinput{flex:1;padding:0.65rem 0.9rem;font-family:'Crimson Pro',serif;font-size:1rem;border:1.5px solid var(--pd);border-radius:4px;background:white;color:var(--ink);outline:none;transition:border-color 0.2s;}
        .yinput:focus{border-color:var(--gold);}
        .bperiod{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.9rem;background:var(--ink);color:var(--parch);border-radius:4px;margin-bottom:1.1rem;}
        .plabel{font-size:0.63rem;text-transform:uppercase;letter-spacing:0.12em;opacity:0.6;}
        .pval{font-family:'Playfair Display',serif;font-weight:700;font-size:0.92rem;}
        .wguesses{display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.9rem;}
        .wbadge{padding:0.18rem 0.6rem;background:rgba(155,58,26,0.1);border:1px solid var(--rust);color:var(--rust);border-radius:20px;font-size:0.8rem;text-decoration:line-through;}
        .cbadge{background:rgba(61,92,58,0.1);border-color:var(--sage);color:var(--sage);text-decoration:none;}
        .ogrid{display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;margin-bottom:1.1rem;}
        .obtn{padding:0.65rem 0.75rem;background:white;border:1.5px solid var(--pd);border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.9rem;cursor:pointer;text-align:left;transition:all 0.15s;color:var(--ink);}
        .obtn:hover{border-color:var(--sepl);background:rgba(139,105,20,0.05);}
        .obtn.sel{border-color:var(--gold);background:rgba(201,148,42,0.1);font-weight:600;}
        .arow{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.9rem;}
        .aleft{font-style:italic;color:var(--sep);font-size:0.86rem;}
        .btnp{padding:0.62rem 1.3rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:background 0.2s;}
        .btnp:hover{background:#2d1f0e;}
        .btnp:disabled{background:var(--pd);color:var(--sep);cursor:not-allowed;}
        .btnn{padding:0.62rem 1.2rem;background:var(--sage);color:white;border:none;border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:0.9rem;transition:background 0.2s;}
        .btnn:hover{background:#2d4a2a;}
        .rcard{padding:1.3rem;border-radius:6px;border:2px solid;text-align:center;margin-top:0.9rem;animation:fs 0.35s ease;}
        .rcard.win{border-color:var(--sage);background:rgba(61,92,58,0.06);}
        .rcard.lose{border-color:var(--rust);background:rgba(155,58,26,0.05);}
        .ricon{font-size:2rem;margin-bottom:0.35rem;}
        .rtext{font-size:0.97rem;margin-bottom:0.25rem;}
        .ereveal{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;margin:0.35rem 0 0.25rem;}
        .eexp{font-size:0.9rem;color:var(--sep);font-style:italic;line-height:1.5;}
        .rscore{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;color:var(--gold);margin-top:0.55rem;}
        .clist2{text-align:left;margin:0.45rem 0;}
        .ci2{padding:0.25rem 0;font-size:0.86rem;border-bottom:1px solid var(--pd);}
        .ci2 span{font-family:'Playfair Display',serif;font-weight:700;color:var(--sep);margin-right:0.35rem;}
        .final{text-align:center;padding:0.8rem 0 2rem;animation:fs 0.5s ease;}
        .fmedal{font-size:4rem;margin-bottom:0.35rem;}
        .ftitle{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;margin-bottom:0.2rem;}
        .fdate{color:var(--sep);font-style:italic;margin-bottom:1.1rem;}
        .fscore{margin-bottom:1.6rem;}
        .ftotal{font-family:'Playfair Display',serif;font-size:3.2rem;font-weight:900;}
        .fmax{font-size:1.2rem;color:var(--sep);}
        .sbreakdown{display:flex;flex-direction:column;gap:0.65rem;margin-bottom:1.6rem;text-align:left;}
        .srow{display:flex;align-items:center;gap:0.75rem;}
        .slabel{width:5.2rem;font-size:0.86rem;font-weight:600;flex-shrink:0;}
        .sbarwrap{flex:1;height:8px;background:var(--pd);border-radius:4px;overflow:hidden;}
        .sbar{height:100%;background:var(--gold);border-radius:4px;transition:width 0.9s ease;}
        .spts{font-family:'Playfair Display',serif;font-weight:700;font-size:0.94rem;width:2.8rem;text-align:right;}
        .sharebtn{padding:0.7rem 1.9rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:1.1rem;transition:all 0.2s;letter-spacing:0.03em;}
        .sharebtn:hover{background:var(--rust);transform:translateY(-1px);}
        .comeback{font-style:italic;color:var(--sep);font-size:0.88rem;}
        .intro{text-align:center;padding:1.3rem 0;}
        .iorn{font-size:2.2rem;margin-bottom:0.7rem;}
        .ih{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:700;margin-bottom:0.5rem;}
        .ip{color:var(--sep);font-size:0.97rem;line-height:1.6;margin-bottom:0.4rem;}
        .rprev{display:flex;flex-direction:column;gap:0.5rem;margin:1.3rem 0;text-align:left;}
        .rpi{display:flex;align-items:center;gap:0.9rem;padding:0.7rem 0.9rem;background:rgba(139,105,20,0.06);border:1px solid var(--pd);border-radius:4px;}
        .rpin{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:900;color:var(--sepl);width:1.8rem;flex-shrink:0;}
        .rpii strong{display:block;font-weight:600;font-size:0.97rem;}
        .rpii small{color:var(--sep);font-style:italic;font-size:0.85rem;}
        .startbtn{padding:0.8rem 2rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;cursor:pointer;letter-spacing:0.05em;transition:all 0.2s;margin-top:0.7rem;}
        .startbtn:hover{background:var(--rust);transform:translateY(-1px);}
        .overlay{position:fixed;inset:0;background:rgba(26,18,9,0.65);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi 0.2s ease;padding:1rem;}
        .modal{background:var(--parch);border:2px solid var(--sep);border-radius:8px;padding:1.6rem;max-width:400px;width:100%;position:relative;animation:fs 0.25s ease;}
        .modal-close{position:absolute;top:0.7rem;right:0.7rem;background:none;border:none;font-size:1rem;cursor:pointer;color:var(--sep);padding:0.2rem 0.4rem;}
        .modal-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;margin-bottom:0.9rem;}
        .share-pre{font-family:'Crimson Pro',monospace;font-size:0.88rem;line-height:1.7;background:white;border:1px solid var(--pd);border-radius:4px;padding:0.9rem;margin-bottom:0.9rem;white-space:pre-wrap;color:var(--ink);}
        .copy-btn{width:100%;padding:0.7rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:0.97rem;font-weight:700;cursor:pointer;transition:background 0.2s;}
        .copy-btn:hover{background:var(--sage);}
      `}</style>
      <div className="app">
        <header className="mast">
          <h1 className="mtitle">Hist<span>o</span>rle</h1>
          <p className="msub">The Daily History Puzzle</p>
          <p className="mdate">{todayString()}</p>
        </header>
        {round>0&&round<4&&<div className="prog">{[1,2,3].map(n=><div key={n} className={`pip ${round===n?"active":round>n?"done":""}`}/>)}</div>}
        <main className="main">
          {loading&&(
            <div style={{textAlign:'center',padding:'4rem 0',color:'var(--sep)',fontStyle:'italic'}}>
              Consulting the archives…
            </div>
          )}
          {!loading&&round===0&&(
            <div className="intro">
              <div className="iorn">📜</div>
              <h2 className="ih">Today's Puzzle Awaits</h2>
              <p className="ip">Three rounds. Three ways to test your knowledge of world history.</p>
              <div className="rprev">
                {[{n:"I",name:"Chronicle",desc:"Arrange 5 events in chronological order"},{n:"II",name:"Eracle",desc:"Guess the year of a historical event"},{n:"III",name:"Borderle",desc:"Identify a historical empire from clues"}].map(r=>(
                  <div key={r.n} className="rpi"><span className="rpin">{r.n}</span><div className="rpii"><strong>{r.name}</strong><small>{r.desc}</small></div></div>
                ))}
              </div>
              <button className="startbtn" onClick={()=>setRound(1)}>Begin →</button>
            </div>
          )}
          {!loading&&round===1&&<ChronicleRound data={puzzle.chronicle} onComplete={complete}/>}
          {!loading&&round===2&&<EracleRound data={puzzle.eracle} onComplete={complete}/>}
          {!loading&&round===3&&<BorderleRound data={puzzle.borderle} onComplete={complete}/>}
          {!loading&&round===4&&<FinalScore scores={scores} onShare={()=>setShowShare(true)}/>}
        </main>
        {showShare&&<ShareModal scores={scores} onClose={()=>setShowShare(false)}/>}
      </div>
    </>
  );
}
