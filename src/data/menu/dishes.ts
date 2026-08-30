import type { Dish, LocalizedText } from './types'

/**
 * Every name, price, description and badge below is transcribed from the
 * printed DAON menu (the English/Polish edition, pages 2-22 of the source
 * scans). Where the print run lost word spacing — "Koreanseaweed riceroll
 * filledwith" — the spacing has been restored; the wording is unchanged.
 *
 * Korean copy is intentionally absent: the Korean edition of the menu has not
 * been supplied yet, so text resolution falls back to English for `ko`. Adding
 * it later means filling in the `ko` field on each entry, nothing else.
 */

const bbqServing: LocalizedText = {
  en: 'Fresh wrap vegetables, crispy chili, and garlic balance the richness of the meat. Served with spicy-sweet ssamjang, sesame oil sauce, and a special sauce for various flavor options.',
  pl: 'Świeże warzywa, chrupiące papryczki i czosnek równoważą tłustość mięsa. Podawane z pikantno-słodkim ssamjang, sosem sezamowym i specjalnym sosem dla różnych wariantów smaku.',
}

const cutletSet: LocalizedText = {
  en: 'Served with daily side dishes such as salad, fruit, and more alongside the main dish.',
  pl: 'Podawane z codziennymi przystawkami, takimi jak sałatka, owoce i inne, obok dania głównego.',
}

const mild: LocalizedText = { en: 'Mild', pl: 'Łagodny' }
const spicy: LocalizedText = { en: 'Spicy', pl: 'Ostry' }
const sweet: LocalizedText = { en: 'Sweet', pl: 'Słodki' }
const fried: LocalizedText = { en: 'Fried', pl: 'Smażony' }
const pork: LocalizedText = { en: 'Pork', pl: 'Wieprzowina' }
const chicken: LocalizedText = { en: 'Chicken', pl: 'Kurczak' }
const tofu: LocalizedText = { en: 'Tofu', pl: 'Tofu' }
const seafood: LocalizedText = { en: 'Seafood', pl: 'Owoce morza' }
const beef: LocalizedText = { en: 'Beef', pl: 'Wołowina' }
const smallPortion: LocalizedText = { en: 'Small portion', pl: 'Mała porcja' }
const largePortion: LocalizedText = { en: 'Large portion', pl: 'Duża porcja' }

export const dishes: Dish[] = [
  // 한상차림 · Korean Table Set
  {
    id: 'jeyuk-bokkeum',
    no: 1,
    categoryId: 'hansang',
    name: { en: 'Jeyuk Bokkeum' },
    description: {
      en: 'Spicy stir-fried pork with vegetables.',
      pl: 'Wieprzowina smażona na ostro z warzywami.',
    },
    price: 60,
    photo: '01',
    featured: true,
  },
  {
    id: 'cheese-dakgalbi',
    no: 2,
    categoryId: 'hansang',
    name: { en: 'Cheese Dakgalbi' },
    description: {
      en: 'Spicy stir-fried chicken with melted cheese.',
      pl: 'Pikantny smażony kurczak z serem.',
    },
    price: 60,
    photo: '02',
    featured: true,
  },
  {
    id: 'bulgogi',
    no: 3,
    categoryId: 'hansang',
    name: { en: 'Bulgogi' },
    description: {
      en: 'Marinated and stir-fried beef in Korean sauce.',
      pl: 'Marynowana i smażona wołowina w koreańskim sosie.',
    },
    price: 70,
    photo: '03',
    featured: true,
  },
  {
    id: 'braised-beef-short-ribs',
    no: 4,
    categoryId: 'hansang',
    name: { en: 'Braised Beef Short Ribs' },
    description: {
      en: 'Braised beef short ribs in soy-based sauce.',
      pl: 'Duszone żeberka wołowe w sosie sojowym.',
    },
    price: 70,
    photo: '04',
  },
  {
    id: 'dwaeji-bulgogi',
    no: 5,
    categoryId: 'hansang',
    name: { en: 'Dwaeji bulgogi' },
    description: {
      en: 'A dish of stir-fried pork marinated in a sweet and salty sauce.',
      pl: 'Marynowana wieprzowina w słodko-słonym sosie.',
    },
    price: 60,
    photo: '05',
  },
  {
    id: 'grilled-mackerel',
    no: 6,
    categoryId: 'hansang',
    name: { en: 'Grilled mackerel' },
    description: {
      en: 'A popular Korean dish featuring fresh mackerel seasoned and grilled until the skin is crispy and the meat is tender and flavorful.',
      pl: 'Koreańskie danie ze świeżej makreli, przyprawionej i grillowanej, z chrupiącą skórką, a mięsem soczystym i aromatycznym.',
    },
    price: 70,
    photo: '06',
  },

  // 수제라면 · Handmade Ramen
  {
    id: 'ramen-pork',
    no: null,
    categoryId: 'ramyeon',
    name: { en: 'Pork', pl: 'Wieprzowina' },
    description: {
      en: 'Ramen with pork, vegetables and rich broth.',
      pl: 'Ramen z wieprzowiną, warzywami i aromatycznym bulionem.',
    },
    options: [
      { no: 7, price: 50, label: mild },
      { no: 8, price: 55, label: spicy },
    ],
    photo: '07',
    featured: true,
  },
  {
    id: 'ramen-beef',
    no: null,
    categoryId: 'ramyeon',
    name: { en: 'Beef', pl: 'Wołowina' },
    description: {
      en: 'Ramen with beef, vegetables and rich broth.',
      pl: 'Ramen z wołowiną, warzywami i aromatycznym bulionem.',
    },
    options: [
      { no: 9, price: 55, label: mild },
      { no: 10, price: 60, label: spicy },
    ],
    photo: '09',
  },
  {
    id: 'ramen-chicken',
    no: null,
    categoryId: 'ramyeon',
    name: { en: 'Chicken', pl: 'Kurczak' },
    description: {
      en: 'Ramen with chicken, vegetables and savory broth.',
      pl: 'Ramen z kurczakiem, warzywami i aromatycznym bulionem.',
    },
    options: [
      { no: 11, price: 50, label: mild },
      { no: 12, price: 55, label: spicy },
    ],
    photo: '11',
  },

  // 중식세트 · Chinese-Korean Sets
  {
    id: 'jajangmyeon-tangsuyuk',
    no: null,
    categoryId: 'jungsik',
    name: { en: 'Jajangmyeoun & Tangsuyuk' },
    description: {
      en: 'Delight the rich, savory flavors of jajangmeon, featuring silky noodles coated in a deep black bean sauce, paired with crispy Tang Suyuk, choose from tender pork, chicken or tofu served with a sweet and tangy sauce for a perfect contrast of flavors and textures.',
      pl: 'Rozkoszuj się bogatym, wyrazistym smakiem jjajangmyeon — jedwabiste kluski w głębokim sosie z czarnej fasoli. Podawane z chrupiącym tangsuyuk — do wyboru delikatna wieprzowina, kurczak lub tofu w słodko-kwaśnym sosie, tworząc idealne połączenie smaków i tekstur.',
    },
    options: [
      { no: 13, price: 65, label: pork },
      { no: 14, price: 65, label: chicken },
      { no: 15, price: 62, label: tofu },
    ],
    photo: '13',
  },
  {
    id: 'jjamppong-tangsuyuk',
    no: null,
    categoryId: 'jungsik',
    name: { en: 'Jjamppong & Tangsuyuk' },
    description: {
      en: 'Spicy seafood noodle soup with fresh seafood, vegetables, and meat in a rich broth, served with crispy sweet and sour pork (pork, chicken, or tofu).',
      pl: 'Pikantna zupa z makaronem i owocami morza w aromatycznym bulionie, podawana z chrupiącym mięsem w sosie słodko-kwaśnym (wieprzowina, kurczak lub tofu).',
    },
    options: [
      { no: 16, price: 75, label: pork },
      { no: 17, price: 75, label: chicken },
      { no: 18, price: 72, label: tofu },
    ],
    photo: '16',
    tags: ['mildAvailable'],
  },

  // 김밥 · Kimbap
  {
    id: 'basic-kimbap',
    no: 19,
    categoryId: 'kimbap',
    name: { en: 'Basic kimbap' },
    description: {
      en: 'Kimbap looks similar to Japanese sushi, but it differs in ingredients and preparation. It is a dish that embodies the unique taste and culture of Korea.',
      pl: 'Kimbap wygląda podobnie do japońskiego sushi, ale różni się składnikami i sposobem przygotowania. To potrawa, która zawiera w sobie wyjątkowy smak i kulturę Korei.',
    },
    price: 40,
    photo: '19',
    tags: ['vegetarian'],
  },
  {
    id: 'tuna-kimbap',
    no: 20,
    categoryId: 'kimbap',
    name: { en: 'Tuna Kimbap' },
    description: {
      en: 'A Korean seaweed rice roll filled with tuna and vegetables.',
      pl: 'Koreańska rolka z ryżem, tuńczykiem i warzywami.',
    },
    price: 50,
    photo: '20',
  },
  {
    id: 'bulgogi-kimbap',
    no: 21,
    categoryId: 'kimbap',
    name: { en: 'Bulgogi Kimbap' },
    description: {
      en: 'Korean seaweed rice roll filled with marinated beef (bulgogi) and vegetables.',
      pl: 'Koreańska rolka z ryżem, marynowaną wołowiną bulgogi i warzywami.',
    },
    price: 50,
    photo: '21',
  },
  {
    id: 'jeyuk-kimbap',
    no: 22,
    categoryId: 'kimbap',
    name: { en: 'Jeyuk Kimbap' },
    description: {
      en: 'Korean seaweed rice roll filled with spicy stir-fried pork and vegetables.',
      pl: 'Koreańska rolka z ryżu i wodorostów wypełniona pikantną, smażoną wieprzowiną i warzywami.',
    },
    price: 50,
    photo: '22',
  },
  {
    id: 'shrimp-tempura-kimbap',
    no: 23,
    categoryId: 'kimbap',
    name: { en: 'Shrimp Tempura Kimbap' },
    description: {
      en: 'Korean seaweed rice roll filled with crispy shrimp tempura and vegetables.',
      pl: 'Koreańska rolka z ryżem, chrupiącą krewetką w tempurze i warzywami.',
    },
    price: 55,
    photo: '23',
  },
  {
    id: 'chicken-cheese-kimbap',
    no: 24,
    categoryId: 'kimbap',
    name: { en: 'Chicken & Cheese Kimbap' },
    description: {
      en: 'Korean seaweed rice roll filled with chicken, melted cheese, and vegetables.',
      pl: 'Koreańska rolka z ryżem, kurczakiem, serem i warzywami.',
    },
    price: 55,
    photo: '24',
  },

  // 추천메뉴 · Chef's Recommendations
  {
    id: 'tangchu-galbi',
    no: null,
    categoryId: 'chucheon',
    name: { en: 'Tangchu galbi' },
    description: {
      en: 'Succulent marinated pork short ribs, grilled to perfection for a smoky, caramelized flavor.',
      pl: 'Marynowane żeberka wieprzowe z grilla o dymnym, karmelizowanym smaku.',
    },
    options: [
      { no: 32, price: 85, label: pork },
      { no: 33, price: 85, label: chicken },
      { no: 34, price: 85, label: tofu },
    ],
    photo: '32',
  },
  {
    id: 'kkanpunggi',
    no: null,
    categoryId: 'chucheon',
    name: { en: 'Kkanpunggi' },
    description: {
      en: 'Crispy fried chicken stir-fried with garlic, chili, and vegetables in a spicy-sour sauce.',
      pl: 'Chrupiący smażony kurczak z czosnkiem, papryką i warzywami w pikantno-kwaśnym sosie.',
    },
    options: [
      { no: 35, price: 85, label: pork },
      { no: 36, price: 85, label: chicken },
      { no: 37, price: 85, label: tofu },
    ],
    photo: '35',
  },
  {
    id: 'korean-fried-chicken',
    no: null,
    categoryId: 'chucheon',
    name: { en: 'Kfc — Korean fried chicken' },
    description: {
      en: 'Indulge in the irresistible crunch of Korean fried chicken glazed with your favorite sauce.',
      pl: 'Rozkoszuj się nieodpartą chrupkością koreańskiego smażonego kurczaka, polanego Twoim ulubionym sosem.',
    },
    options: [
      { no: 38, price: 85, label: fried },
      { no: 39, price: 85, label: spicy },
      { no: 40, price: 85, label: sweet },
      { no: 41, price: 85, label: { en: 'Fried / Spicy', pl: 'Smażony / Ostry' } },
      { no: 42, price: 85, label: { en: 'Fried / Sweet', pl: 'Smażony / Słodki' } },
      { no: 43, price: 85, label: { en: 'Spicy / Sweet', pl: 'Ostry / Słodki' } },
    ],
    photo: '38',
    tags: ['extraSpicy'],
    featured: true,
  },

  // 바베큐 · Korean BBQ
  {
    id: 'samgyeobsal',
    no: 44,
    categoryId: 'bbq',
    name: { en: 'Samgyeobsal' },
    description: bbqServing,
    price: 65,
    portion: '200g',
    photo: '44',
    featured: true,
  },
  {
    id: 'dwaejimogsal',
    no: 45,
    categoryId: 'bbq',
    name: { en: 'Dwaejimogsal' },
    description: bbqServing,
    price: 65,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'jowls-skinless',
    no: 46,
    categoryId: 'bbq',
    name: { en: 'Jowls skinless' },
    description: bbqServing,
    price: 70,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'dwaeji-galbi',
    no: 47,
    categoryId: 'bbq',
    name: { en: 'Dwaeji Galbi' },
    description: bbqServing,
    price: 75,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'sliced-pork-belly',
    no: 48,
    categoryId: 'bbq',
    name: { en: 'Sliced Pork Belly' },
    description: bbqServing,
    price: 70,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'assorted-pork',
    no: 49,
    categoryId: 'bbq',
    name: { en: 'Assorted Pork' },
    description: bbqServing,
    price: 300,
    portion: '1000g',
    photo: '44',
    tags: ['sharing'],
  },
  {
    id: 'bulgoggie-bbq',
    no: 50,
    categoryId: 'bbq',
    name: { en: 'Bulgoggie B.B.Q' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'brisket',
    no: 51,
    categoryId: 'bbq',
    name: { en: 'Brisket' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'boneless-short-rib',
    no: 52,
    categoryId: 'bbq',
    name: { en: 'Boneless ShortRib' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'rib-eye',
    no: 53,
    categoryId: 'bbq',
    name: { en: 'Rib Eye' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'la-style-galbi',
    no: 54,
    categoryId: 'bbq',
    name: { en: 'LA-style Galbi' },
    description: bbqServing,
    price: 120,
    portion: '180g',
    photo: '50',
    featured: true,
  },
  {
    id: 'assorted-beef',
    no: 55,
    categoryId: 'bbq',
    name: { en: 'Assorted Beef' },
    description: bbqServing,
    price: 450,
    portion: '800g',
    photo: '50',
    tags: ['sharing'],
  },

  // 여름메뉴 · Summer Menu
  {
    id: 'buckwheat-soba',
    no: 56,
    categoryId: 'yeoreum',
    name: { en: 'Buckwheat Soba' },
    description: {
      en: 'Buckwheat soba noodles, known for their nutty flavor and chewy texture, often served with dipping sauce or in broth.',
      pl: 'Makaron soba z gryki, znany z orzechowego smaku i sprężystej konsystencji, podawany z sosem do maczania lub w bulionie.',
    },
    price: 50,
    photo: '56',
    tags: ['vegetarian'],
  },
  {
    id: 'bibim-soba',
    no: 57,
    categoryId: 'yeoreum',
    name: { en: 'Bibim Soba' },
    description: {
      en: 'Cold buckwheat noodles mixed with fresh vegetables and spicy, tangy sauce.',
      pl: 'Zimny makaron gryczany wymieszany ze świeżymi warzywami i pikantnym, kwaśnym sosem.',
    },
    price: 50,
    photo: '57',
    tags: ['vegetarian'],
  },
  {
    id: 'kalguksu',
    no: null,
    categoryId: 'yeoreum',
    name: { en: 'Kalguksu' },
    description: {
      en: "Kalguksu is a Korean noodle dish made with knife-cut noodles served in a broth. It's a rich noodle dish with a rich broth and a variety of vegetables, creating a rich, flavorful dish.",
      pl: 'Kalguksu to koreańskie danie z makaronem, przygotowywane z makaronu krojonego nożem, podawanego w bulionie. To bogate danie z makaronem, podawane z bogatym bulionem i różnorodnymi warzywami, tworzące bogate, aromatyczne danie.',
    },
    options: [
      { no: 58, price: 60, label: seafood },
      { no: 59, price: 50, label: { en: 'Kimchi', pl: 'Kimchi' } },
    ],
    photo: '58',
    tags: ['vegetarian'],
  },

  // 식사메뉴 · Meals & Stews
  {
    id: 'kimchi-jjigae',
    no: 60,
    categoryId: 'siksa',
    name: { en: 'Kimchi-jjigae' },
    description: {
      en: 'Spicy Korean stew with kimchi, pork and tofu.',
      pl: 'Pikantna zupa koreańska z kimchi, wieprzowiną i tofu.',
    },
    price: 60,
    photo: '60',
    featured: true,
  },
  {
    id: 'doenjang-jjigae',
    no: null,
    categoryId: 'siksa',
    name: { en: 'Doenjang-jjigae' },
    description: {
      en: 'Korean soybean paste stew with tofu and vegetables.',
      pl: 'Koreańska zupa z pastą sojową, tofu i warzywami.',
    },
    options: [
      { no: 61, price: 63, label: seafood },
      { no: 62, price: 70, label: beef },
    ],
    photo: '61',
  },
  {
    id: 'sundubu-jjigae',
    no: null,
    categoryId: 'siksa',
    name: { en: 'Sundubu-Jjigae' },
    description: {
      en: 'Spicy Korean stew with seafood, silken tofu and vegetables.',
      pl: 'Pikantna koreańska zupa z owocami morza, delikatnym tofu i warzywami.',
    },
    options: [
      { no: 63, price: 63, label: seafood },
      { no: 64, price: 70, label: beef },
    ],
    photo: '63',
    tags: ['mildAvailable'],
  },

  // 전골메뉴 · Hot Pots
  {
    id: 'kkochge-odeng-tang',
    no: 65,
    categoryId: 'jeongol',
    name: { en: 'Kkochge odeng-tang' },
    description: {
      en: 'Spicy Korean soup with crab, fish cakes and vegetables.',
      pl: 'Pikantna koreańska zupa z krabem, klopsikami rybnymi i warzywami.',
    },
    price: 140,
    serves: '3-4',
    photo: '65',
    tags: ['sharing'],
  },
  {
    id: 'budae-jeongol',
    no: 66,
    categoryId: 'jeongol',
    name: { en: 'Budae Jeongol' },
    description: {
      en: 'Spicy Korean hot pot with sausages, ham, kimchi, tofu and noodles.',
      pl: 'Pikantny koreański kociołek z kiełbaskami, szynką, kimchi, tofu i makaronem.',
    },
    price: 160,
    serves: '3-4',
    photo: '66',
    tags: ['sharing'],
    featured: true,
  },
  {
    id: 'kimchi-jeongol',
    no: 67,
    categoryId: 'jeongol',
    name: { en: 'Kimchi Jeongol' },
    description: {
      en: 'Spicy Korean stew made with aged kimchi, pork and tofu.',
      pl: 'Pikantna koreańska zupa z dojrzałym kimchi, wieprzowiną i tofu.',
    },
    price: 140,
    serves: '3-4',
    photo: '67',
    tags: ['sharing'],
  },
  {
    id: 'chadoldoenjang-jeongol',
    no: 68,
    categoryId: 'jeongol',
    name: { en: 'Chadoldoenjang jeongol' },
    description: {
      en: 'Hot pot with beef brisket and doenjang (soybean paste) broth.',
      pl: 'Gorący garnek z wołowiną i aromatycznym sojowym bulionem.',
    },
    price: 160,
    serves: '3-4',
    photo: '68',
    tags: ['sharing'],
  },
  {
    id: 'jjamppong-tang',
    no: 69,
    categoryId: 'jeongol',
    name: { en: 'Jjamppong-tang' },
    description: {
      en: 'Spicy Korean seafood soup with noodles and vegetables.',
      pl: 'Pikantna koreańska zupa z owocami morza, makaronem i warzywami.',
    },
    price: 165,
    serves: '3-4',
    photo: '69',
    tags: ['sharing', 'mildAvailable'],
  },
  {
    id: 'dumpling-tofu-jeongol',
    no: 70,
    categoryId: 'jeongol',
    name: { en: 'Dumpling tofu jeongol' },
    description: {
      en: 'Korean hot pot with dumplings, tofu, mushrooms, and vegetables.',
      pl: 'Koreański kociołek z pierożkami, tofu, grzybami i warzywami.',
    },
    price: 165,
    serves: '3-4',
    photo: '70',
    tags: ['sharing'],
  },
  {
    id: 'haemul-sundubu-jeongol',
    no: 71,
    categoryId: 'jeongol',
    name: { en: 'Haemul sundubu jeongol' },
    description: {
      en: 'Korean hot pot with seafood, silken tofu, vegetables, and a spicy broth.',
      pl: 'Koreański kociołek z owocami morza, delikatnym tofu i warzywami w pikantnym bulionie.',
    },
    price: 165,
    serves: '3-4',
    photo: '71',
    tags: ['sharing', 'mildAvailable'],
  },
  {
    id: 'ox-knee-jeongol',
    no: 72,
    categoryId: 'jeongol',
    name: { en: 'Ox Knee Jeongol' },
    description: {
      en: 'Korean hot pot with ox knee, noodles, and vegetables in a clear, rich broth.',
      pl: 'Delikatny koreański kociołek z kolanem wołowym, makaronem i warzywami w klarownym bulionie.',
    },
    price: 180,
    serves: '3-4',
    photo: '72',
    tags: ['sharing'],
  },
  {
    id: 'haemul-tang',
    no: 73,
    categoryId: 'jeongol',
    name: { en: 'Haemul tang' },
    description: {
      en: 'A spicy dish of shrimp, crab, squid, mussels and other seafood, served with various vegetables.',
      pl: 'Pikantna potrawa z krewetek, krabów, kałamarnic, małży i innych owoców morza, podana z różnymi warzywami.',
    },
    price: 260,
    serves: '3-4',
    photo: '73',
    tags: ['sharing'],
  },

  // 안주류 · Anju
  {
    id: 'jokbal',
    no: 74,
    categoryId: 'anju',
    name: { en: 'Jokbal' },
    description: {
      en: 'Braised pork leg in soy-based sauce, served with salad and condiments.',
      pl: 'Gotowana noga wieprzowa w sosie sojowym, podawana z sałatką i dodatkami.',
    },
    price: 90,
    photo: '74',
    featured: true,
  },
  {
    id: 'tofu-kimchi',
    no: 75,
    categoryId: 'anju',
    name: { en: 'Tofu Kimchi' },
    description: {
      en: 'Warm tofu served with stir-fried kimchi and pork.',
      pl: 'Ciepłe tofu podawane z podsmażanym kimchi i wieprzowiną.',
    },
    price: 90,
    photo: '75',
  },
  {
    id: 'tang-suyuk',
    no: null,
    categoryId: 'anju',
    name: { en: 'Tang suyuk' },
    description: {
      en: 'Pork fried with sweet and sour sauce.',
      pl: 'Wieprzowina smażona w sosie słodko-kwaśnym.',
    },
    options: [
      { no: 76, price: 85, label: smallPortion },
      { no: 77, price: 125, label: largePortion },
    ],
    photo: '76',
  },
  {
    id: 'jokbal-naengchae',
    no: 78,
    categoryId: 'anju',
    name: { en: 'Jokbal-naengchae' },
    description: {
      en: 'Cold pork salad with vegetables and a tangy Korean mustard dressing.',
      pl: 'Sałatka z zimną wieprzowiną i warzywami w koreańskim stylu.',
    },
    price: 125,
    photo: '78',
  },
  {
    id: 'seasoned-whelk-salad',
    no: 79,
    categoryId: 'anju',
    name: { en: 'Seasoned Whelk Salad' },
    description: {
      en: 'Thin noodles mixed with sea snails and vegetables in a spicy sauce.',
      pl: 'Koreański makaron z owocami morza (golbaengi), warzywami i pikantnym sosem.',
    },
    price: 185,
    photo: '79',
  },
  {
    id: 'haemuljjim',
    no: 80,
    categoryId: 'anju',
    name: { en: 'Haemuljjim' },
    description: {
      en: 'Korean-style spicy braised seafood with vegetables.',
      pl: 'Koreańskie pikantne duszone owoce morza z warzywami.',
    },
    price: 260,
    photo: '80',
  },
  {
    id: 'wang-gyelanmal-i',
    no: 81,
    categoryId: 'anju',
    name: { en: 'Wang gyelanmal-i' },
    description: {
      en: 'Korean rolled egg omelette.',
      pl: 'Delikatny i puszysty omlet, zwijany warstwowo, często z dodatkiem warzyw. Podawany pokrojony na porcje.',
    },
    price: 75,
    photo: '81',
  },
  {
    id: 'haemul-pajeon',
    no: 82,
    categoryId: 'anju',
    name: { en: 'Haemul Pajeon' },
    description: {
      en: 'Korean savory pancake with seafood and green onions.',
      pl: 'Koreański wytrawny naleśnik z owocami morza i z cebulą dymką.',
    },
    price: 70,
    photo: '82',
    featured: true,
  },
  {
    id: 'chicken-kimchijeon',
    no: 83,
    categoryId: 'anju',
    name: { en: 'Chicken-Kimchijeon' },
    description: {
      en: 'Korean savory pancake made with kimchi and chicken, crispy on the outside and tender on the inside.',
      pl: 'Koreański wytrawny naleśnik z kimchi i kurczakiem, chrupiący z zewnątrz i delikatny w środku.',
    },
    price: 60,
    photo: '83',
  },

  // Menu rezerwacji · Reservation Menu
  {
    id: 'mukeunji-samgyeopsal-jjim',
    no: 84,
    categoryId: 'rezerwacja',
    name: { en: 'Mukeunji samgyeopsal jjim' },
    description: {
      en: 'Braised pork belly with aged kimchi in a spicy sauce.',
      pl: 'Duszony boczek wieprzowy z dojrzałym kimchi w pikantnym sosie.',
    },
    price: 260,
    serves: '3-4',
    photo: '84',
    tags: ['sharing'],
  },
  {
    id: 'bossam',
    no: null,
    categoryId: 'rezerwacja',
    name: { en: 'Bossam' },
    description: {
      en: 'Boiled pork served with various wraps and dipping sauces.',
      pl: 'Gotowana wieprzowina podawana z różnymi rodzajami zawijanych liści i sosami.',
    },
    options: [
      { no: 85, price: 130, label: smallPortion },
      { no: 86, price: 160, label: largePortion },
    ],
    photo: '85',
  },
  {
    id: 'jjim-dalg',
    no: 87,
    categoryId: 'rezerwacja',
    name: { en: 'Jjim-dalg' },
    description: {
      en: 'A representative Korean chicken dish, with a sweet and salty yet light sauce made with a mild soy sauce seasoning, that permeates all the ingredients, including the chicken, and the meat is very tender because the chicken is cooked over a high heat for a long time.',
      pl: 'Typowe koreańskie danie z kurczaka, podawane w słodko-słonym, a jednocześnie lekkim sosie z dodatkiem łagodnego sosu sojowego, który przenika wszystkie składniki, łącznie z kurczakiem. Mięso jest bardzo delikatne, ponieważ kurczak jest długo gotowany na dużym ogniu.',
    },
    price: 180,
    serves: '3-4',
    photo: '87',
    tags: ['sharing'],
  },
  {
    id: 'yangjangp',
    no: 88,
    categoryId: 'rezerwacja',
    name: { en: 'Yangjangp' },
    description: {
      en: 'Korean cold salad made with a variety of vegetables, seafood, and meat, served with a tangy dipping sauce.',
      pl: 'Koreańska zimna sałatka z różnych warzyw, owoców morza i mięsa, podawana z kwaśnym sosem.',
    },
    price: 300,
    serves: '3-4',
    photo: '88',
    tags: ['sharing'],
  },
  {
    id: 'olijuulleog',
    no: 89,
    categoryId: 'rezerwacja',
    name: { en: 'Olijuulleog' },
    description: {
      en: 'Spicy Korean stir-fried duck dish, marinated and cooked with vegetables.',
      pl: 'Pikantna koreańska potrawa z kaczką smażoną z warzywami w marynacie.',
    },
    price: 370,
    serves: '3-4',
    photo: '89',
    tags: ['sharing'],
  },
  {
    id: 'gamja-tang',
    no: 90,
    categoryId: 'rezerwacja',
    name: { en: 'Gamja tang' },
    description: {
      en: 'Gamjatang is a thick, spicy Korean soup made with pork backbone, potatoes, ground perilla seeds, red peppers, green onions, and garlic. The soup is rich in ingredients and the burdock root adds a savory flavor that becomes even more pronounced as it simmers.',
      pl: 'Gamjatang to gęsta, pikantna koreańska zupa z kręgosłupa wieprzowego, ziemniaków, mielonych nasion pachnotki, czerwonej papryki, dymki i czosnku. Zupa jest bogata w składniki, a korzeń łopianu dodaje jej pikantnego smaku, który staje się jeszcze bardziej wyrazisty podczas gotowania.',
    },
    price: 180,
    serves: '3-4',
    photo: '90',
    tags: ['sharing'],
  },

  // Menu dla dzieci · Kids Menu
  {
    id: 'handmade-pork-cutlet-set',
    no: 91,
    categoryId: 'dzieci',
    name: { en: 'Handmade Pork Cutlet Set Menu' },
    description: cutletSet,
    price: 45,
    photo: '91',
  },
  {
    id: 'handmade-chicken-cutlet-set',
    no: 92,
    categoryId: 'dzieci',
    name: { en: 'Handmade Chicken Cutlet Set Menu' },
    description: cutletSet,
    price: 45,
    photo: '92',
  },

  // 특선메뉴 · Special Menu
  {
    id: 'iron-plate-corn-cheese',
    no: 93,
    categoryId: 'teukseon',
    name: { en: 'Iron Plate Corn Cheese' },
    description: {
      en: 'A sizzling dish of sweet corn and butter mayonnaise, corn topped with cheese. A convenient dish with a sweet, salty, and creamy flavor.',
      pl: 'Skrzące danie ze słodkiej kukurydzy z majonezem maślanym, kukurydza posypana serem. Wygodne danie o słodko-słonym i kremowym smaku.',
    },
    price: 35,
    photo: '93',
  },
  {
    id: 'bulgogi-jap-chae',
    no: 94,
    categoryId: 'teukseon',
    name: { en: 'Bulgogi Jap-chae' },
    description: {
      en: "Japchae is a traditional Korean dish made by stir-frying sweet potato noodles with various vegetables. It's seasoned with soy sauce, sesame oil, and sugar, imparting a subtle sweetness and savory flavor, and then served with traditional Korean bulgogi.",
      pl: 'Japchae to tradycyjne koreańskie danie przyrządzane z makaronu ze słodkich ziemniaków smażonego z różnymi warzywami. Doprawia się je sosem sojowym, olejem sezamowym i cukrem, nadając im subtelną słodycz i wytrawny smak, a następnie podaje z tradycyjnym koreańskim bulgogi.',
    },
    price: 75,
    photo: '94',
    featured: true,
  },
  {
    id: 'guo-bao-rou',
    no: 95,
    categoryId: 'teukseon',
    name: { en: 'Guo Bao Rou' },
    description: {
      en: 'A Korean twist on a Chinese dish made by coating thinly sliced pork in starch batter, frying it until crispy, and then serving it with a sweet and sour sauce.',
      pl: 'Koreańska wersja chińskiego dania, przyrządzanego z cienkich plasterków wieprzowiny panierowanych w cieście skrobiowym, smażonych do uzyskania chrupkości, a następnie podawanych z sosem słodko-kwaśnym.',
    },
    price: 90,
    photo: '95',
  },
  {
    id: 'yurin-gi',
    no: 96,
    categoryId: 'teukseon',
    name: { en: 'Yurin-gi' },
    description: {
      en: 'Yurin-gi is a Korean twist on the Chinese stir-fry dish. It features crispy fried chicken topped with fresh, crunchy vegetables (such as onion, ginger, paprika, etc.) and topped with a sweet and sour soy sauce.',
      pl: 'Yurin-gi to koreańska wersja chińskiego dania stir-fry. Składa się z chrupiącego smażonego kurczaka z dodatkiem świeżych, chrupiących warzyw (takich jak cebula, imbir, papryka itp.) i polanego słodko-kwaśnym sosem sojowym.',
    },
    price: 90,
    photo: '96',
  },
  {
    id: 'zicoba-chicken',
    no: 97,
    categoryId: 'teukseon',
    name: { en: 'Zicoba Chicken' },
    description: {
      en: 'Roasted chicken is then simmered for a long time with a sweet and spicy sauce and tteokbokki rice cakes, creating a flavorful chicken dish.',
      pl: 'Pieczonego kurczaka gotuje się przez długi czas w słodko-pikantnym sosie z ryżowymi ciastkami tteokbokki, tworząc pełne smaku danie z kurczaka.',
    },
    price: 90,
    photo: '97',
  },
  {
    id: 'beef-bulgogi-hot-pot',
    no: 98,
    categoryId: 'teukseon',
    name: { en: 'Beef Bulgogi Hot Pot' },
    description: {
      en: 'Tender beef bulgogi simmered with vegetables in a savory broth, served in a hot stone pot.',
      pl: 'Delikatne wołowe bulgogi duszone z warzywami w aromatycznym bulionie, podawane w gorącym kamionkowym garnku.',
    },
    price: 70,
    photo: '98',
  },
]

export const dishesByCategory = (categoryId: string): Dish[] =>
  dishes.filter((dish) => dish.categoryId === categoryId)

export const featuredDishes = (): Dish[] => dishes.filter((dish) => dish.featured)

export const findDish = (id: string): Dish | undefined =>
  dishes.find((dish) => dish.id === id)

/** Lowest price of a dish, whether it is fixed or split across options. */
export const dishFromPrice = (dish: Dish): number =>
  dish.price ?? Math.min(...(dish.options ?? []).map((option) => option.price))
