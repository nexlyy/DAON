import { allergensFor } from './allergens'
import type { Allergen } from './allergens'
import type { Dish, DishOption, LocalizedText } from './types'

/**
 * Transcribed from the two menu files the restaurant supplied:
 * "Eng and PL (2026.01.09)" and "Kor (2025.01.09)". Numbers, prices and badges
 * follow the English/Polish edition, which is the newer of the two.
 *
 * The Korean edition is not a translation — it tells where each dish comes
 * from — so `ko` carries its own text rather than a rendering of the English.
 *
 * A handful of entries disagree between the two files; they are marked with a
 * `sourceNote` comment above them and listed in the README.
 */

// Shared copy, printed identically under every dish in its group.
const bbqServing: LocalizedText = {
  en: 'Fresh wrap vegetables, crispy chili, and garlic balance the richness of the meat. Served with spicy-sweet ssamjang, sesame oil sauce, and a special sauce for various flavor options.',
  pl: 'Świeże warzywa, chrupiące papryczki i czosnek równoważą tłustość mięsa. Podawane z pikantno-słodkim ssamjang, sosem sezamowym i specjalnym sosem dla różnych wariantów smaku.',
  ko: '고기와 함께 제공되는 다양한 곁들임은 맛의 조화와 신선한 쌈채소는 고기의 느끼함을 잡아주고 상큼한 맛을 더해줍니다. 아삭아삭한 고추와 알싸한 마늘이 입맛을 돋우며, 깔끔한 야채스틱은 식감을 살려 줍니다. 또한, 매콤달콤한 쌈장, 고소한 참기름 소스, 그리고 특별한 소스가 함께 제공되어 각자의 취향에 맞게 다양하게 즐길 수 있습니다.',
}

const hansangServing: LocalizedText = {
  en: 'Served as a full table setting with wrap vegetables and sauces, rice and soup.',
  pl: 'Podawane jako pełny zestaw: warzywa do zawijania i sosy, ryż oraz zupa.',
  ko: '한상차림에는 야채쌈 과 소스 그리고 밥과 탕이 함께 서비스합니다.',
}

const setServing: LocalizedText = {
  en: 'Served with daily side dishes such as salad, fruit, and more alongside the main dish.',
  pl: 'Podawane z codziennymi przystawkami, takimi jak sałatka, owoce i inne, obok dania głównego.',
  ko: '메인요리와 함께 샐러드, 과일등 데일리 반찬이 함꼐 서비스합니다.',
}

// Option labels reused across dishes.
const mild: LocalizedText = { en: 'Mild', pl: 'Łagodny', ko: '기본맛' }
const spicy: LocalizedText = { en: 'Spicy', pl: 'Ostry', ko: '매운맛' }
const pork: LocalizedText = { en: 'Pork', pl: 'Wieprzowina', ko: '돼지고기' }
const chicken: LocalizedText = { en: 'Chicken', pl: 'Kurczak', ko: '닭고기' }
const beef: LocalizedText = { en: 'Beef', pl: 'Wołowina', ko: '소고기' }
const tofu: LocalizedText = { en: 'Tofu', pl: 'Tofu', ko: '두부' }
const seafood: LocalizedText = { en: 'Seafood', pl: 'Owoce morza', ko: '해물' }
const brisket: LocalizedText = { en: 'Brisket', pl: 'Mostek wołowy', ko: '차돌박이' }
const smallPortion: LocalizedText = { en: 'Small portion', pl: 'Mała porcja', ko: '소자' }
const largePortion: LocalizedText = { en: 'Large portion', pl: 'Duża porcja', ko: '대자' }

export const dishes: Dish[] = [
  // ─── 한상차림 · Korean Table Set ───────────────────────────────────────
  {
    id: 'jeyuk-bokkeum',
    no: 1,
    categoryId: 'hansang',
    name: { en: 'Jeyuk Bokkeum', pl: 'Jeyuk Bokkeum', ko: '제육볶음 한상정식' },
    description: {
      en: 'Spicy stir-fried pork with vegetables.',
      pl: 'Wieprzowina smażona na ostro z warzywami.',
      ko: hansangServing.ko,
    },
    price: 60,
    photo: '01',
    featured: true,
  },
  {
    id: 'cheese-dakgalbi',
    no: 2,
    categoryId: 'hansang',
    name: { en: 'Cheese Dakgalbi', pl: 'Cheese Dakgalbi', ko: '닭갈비 한상정식' },
    description: {
      en: 'Spicy stir-fried chicken with melted cheese.',
      pl: 'Pikantny smażony kurczak z serem.',
      ko: hansangServing.ko,
    },
    price: 60,
    photo: '02',
    featured: true,
  },
  {
    id: 'bulgogi',
    no: 3,
    categoryId: 'hansang',
    name: { en: 'Bulgogi', pl: 'Bulgogi', ko: '소불고기 한상정식' },
    description: {
      en: 'Marinated and stir-fried beef in Korean sauce.',
      pl: 'Marynowana i smażona wołowina w koreańskim sosie.',
      ko: hansangServing.ko,
    },
    price: 70,
    photo: '03',
    featured: true,
  },
  {
    id: 'braised-beef-short-ribs',
    no: 4,
    categoryId: 'hansang',
    name: { en: 'Braised Beef Short Ribs', pl: 'Duszone żeberka wołowe', ko: '소갈비찜 한상정식' },
    description: {
      en: 'Braised beef short ribs in soy-based sauce.',
      pl: 'Duszone żeberka wołowe w sosie sojowym.',
      ko: hansangServing.ko,
    },
    price: 70,
    photo: '04',
  },
  {
    id: 'dwaeji-bulgogi',
    no: 5,
    categoryId: 'hansang',
    name: { en: 'Dwaeji bulgogi', pl: 'Dwaeji bulgogi', ko: '돼지불고기 한상정식' },
    description: {
      en: 'A dish of stir-fried pork marinated in a sweet and salty sauce.',
      pl: 'Marynowana wieprzowina w słodko-słonym sosie.',
      ko: hansangServing.ko,
    },
    price: 60,
    photo: '05',
  },
  {
    id: 'grilled-mackerel',
    no: 6,
    categoryId: 'hansang',
    name: { en: 'Grilled mackerel', pl: 'Grillowana makrela', ko: '고등어구이 한상정식' },
    description: {
      en: 'A popular Korean dish featuring fresh mackerel seasoned and grilled until the skin is crispy and the meat is tender and flavorful.',
      pl: 'Koreańskie danie ze świeżej makreli, przyprawionej i grillowanej, z chrupiącą skórką, a mięsem soczystym i aromatycznym.',
      ko: hansangServing.ko,
    },
    price: 70,
    photo: '06',
  },

  // ─── 수제라면 · Handmade Ramen ────────────────────────────────────────
  {
    id: 'ramen-pork',
    no: null,
    categoryId: 'ramyeon',
    name: { en: 'Pork Ramen', pl: 'Ramen wieprzowy', ko: '돼지고기 라멘' },
    description: {
      en: 'Ramen with pork, vegetables and rich broth.',
      pl: 'Ramen z wieprzowiną, warzywami i aromatycznym bulionem.',
      ko: setServing.ko,
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
    name: { en: 'Beef Ramen', pl: 'Ramen wołowy', ko: '소고기 라멘' },
    description: {
      en: 'Ramen with beef, vegetables and rich broth.',
      pl: 'Ramen z wołowiną, warzywami i aromatycznym bulionem.',
      ko: setServing.ko,
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
    name: { en: 'Chicken Ramen', pl: 'Ramen z kurczakiem', ko: '닭고기 라멘' },
    description: {
      en: 'Ramen with chicken, vegetables and savory broth.',
      pl: 'Ramen z kurczakiem, warzywami i aromatycznym bulionem.',
      ko: setServing.ko,
    },
    options: [
      { no: 11, price: 50, label: mild },
      { no: 12, price: 55, label: spicy },
    ],
    photo: '11',
  },

  // ─── 중식세트 · Chinese-Korean Sets ───────────────────────────────────
  {
    id: 'jajangmyeon-tangsuyuk',
    no: null,
    categoryId: 'jungsik',
    name: {
      en: 'Jajangmyeoun & Tangsuyuk',
      pl: 'Jajangmyeoun & Tangsuyuk',
      ko: '짜장면 & 탕수육 세트',
    },
    description: {
      en: 'Delight the rich, savory flavors of jajangmeon, featuring silky noodles coated in a deep black bean sauce, paired with crispy Tang Suyuk, choose from tender pork, chicken or tofu served with a sweet and tangy sauce for a perfect contrast of flavors and textures.',
      pl: 'Rozkoszuj się bogatym, wyrazistym smakiem jjajangmyeon — jedwabiste kluski w głębokim sosie z czarnej fasoli. Podawane z chrupiącym tangsuyuk — do wyboru delikatna wieprzowina, kurczak lub tofu w słodko-kwaśnym sosie, tworząc idealne połączenie smaków i tekstur.',
      ko: '짜장면의 진하고 고소한 맛을 즐겨보세요. 부드러운 면발에 깊고 진한 춘장 소스가 잘 어우러집니다. 바삭한 탕수육과 함께 제공되며, 부드러운 돼지고기, 닭고기 또는 두부 중 선택할 수 있는 달콤하고 새콤한 소스가 풍미와 식감의 완벽한 조화를 이룹니다.',
    },
    options: [
      { no: 13, price: 65, label: { en: 'Pork', pl: 'Wieprzowina', ko: '돈등심' } },
      { no: 14, price: 65, label: { en: 'Chicken', pl: 'Kurczak', ko: '닭다리살' } },
      { no: 15, price: 62, label: tofu },
    ],
    photo: '13',
  },
  {
    id: 'jjamppong-tangsuyuk',
    no: null,
    categoryId: 'jungsik',
    name: { en: 'Jjamppong & Tangsuyuk', pl: 'Jjamppong & Tangsuyuk', ko: '짬뽕 & 탕수육 세트' },
    description: {
      en: 'Spicy seafood noodle soup with fresh seafood, vegetables, and meat in a rich broth, served with crispy sweet and sour pork (pork, chicken, or tofu).',
      pl: 'Pikantna zupa z makaronem i owocami morza w aromatycznym bulionie, podawana z chrupiącym mięsem w sosie słodko-kwaśnym (wieprzowina, kurczak lub tofu).',
      ko: '돼지고기와 각종 해산물이 들어간 매콤한 짬뽕 육수와 함께 바삭한 탕수육이 제공됩니다. 탕수육은 돼지고기, 닭고기 또는 두부 중 선택 가능하며, 달콤하고 새콤한 소스가 어우러져 완벽한 맛과 식감을 선사합니다.',
    },
    options: [
      { no: 16, price: 75, label: { en: 'Pork', pl: 'Wieprzowina', ko: '돈등심' } },
      { no: 17, price: 75, label: { en: 'Chicken', pl: 'Kurczak', ko: '닭다리살' } },
      { no: 18, price: 72, label: tofu },
    ],
    photo: '16',
    tags: ['mildAvailable'],
  },

  // ─── 김밥 · Kimbap ────────────────────────────────────────────────────
  {
    id: 'basic-kimbap',
    no: 19,
    categoryId: 'kimbap',
    name: { en: 'Basic kimbap', pl: 'Kimbap podstawowy', ko: '다온김밥' },
    description: {
      en: 'Kimbap looks similar to Japanese sushi, but it differs in ingredients and preparation. It is a dish that embodies the unique taste and culture of Korea.',
      pl: 'Kimbap wygląda podobnie do japońskiego sushi, ale różni się składnikami i sposobem przygotowania. To potrawa, która zawiera w sobie wyjątkowy smak i kulturę Korei.',
      ko: '김밥은 일본의 스시와 비슷해 보이지만, 재료와 조리법에서 차이가 있으며, 한국만의 독특한 맛과 문화가 담긴 음식입니다.',
    },
    price: 40,
    photo: '19',
    tags: ['vegetarian'],
  },
  {
    id: 'tuna-kimbap',
    no: 20,
    categoryId: 'kimbap',
    name: { en: 'Tuna Kimbap', pl: 'Kimbap z tuńczykiem', ko: '참치김밥' },
    description: {
      en: 'A Korean seaweed rice roll filled with tuna and vegetables.',
      pl: 'Koreańska rolka z ryżem, tuńczykiem i warzywami.',
      ko: '어릴 적 학교 앞 분식집에서 처음 먹은 참치김밥. 부드럽고 고소한 맛에 반해 친구들과 함께 단골 메뉴가 되었죠. 참치김밥이 없으면 모두 아쉬워하던 그때가 아직도 기억에 남아요!',
    },
    price: 50,
    photo: '20',
  },
  {
    id: 'bulgogi-kimbap',
    no: 21,
    categoryId: 'kimbap',
    name: { en: 'Bulgogi Kimbap', pl: 'Kimbap z bulgogi', ko: '불고기김밥' },
    description: {
      en: 'Korean seaweed rice roll filled with marinated beef (bulgogi) and vegetables.',
      pl: 'Koreańska rolka z ryżem, marynowaną wołowiną bulgogi i warzywami.',
      ko: '불고기김밥은 달콤하고 짭조름한 불고기를 김밥 속에 넣어 만든 한국식 간편 음식입니다. 20세기 후반부터 인기를 얻으며, 든든하고 맛있는 한 끼로 사랑받고 있습니다.',
    },
    price: 50,
    photo: '21',
  },
  {
    id: 'jeyuk-kimbap',
    no: 22,
    categoryId: 'kimbap',
    name: { en: 'Jeyuk Kimbap', pl: 'Kimbap z jeyuk', ko: '제육김밥' },
    description: {
      en: 'Korean seaweed rice roll filled with spicy stir-fried pork and vegetables.',
      pl: 'Koreańska rolka z ryżu i wodorostów wypełniona pikantną, smażoną wieprzowiną i warzywami.',
      ko: '제육볶음 김밥은 매콤한 제육볶음을 김밥 속에 넣어 만든 퓨전 메뉴로, 20세기 후반부터 인기를 끌기 시작했습니다. 학교 친구들 사이에서 도시락에 변화를 주려고 시도했다가 뜻밖의 맛 조화로 큰 사랑을 받게 된 특별한 간식이기도 합니다.',
    },
    price: 50,
    photo: '22',
  },
  {
    id: 'shrimp-tempura-kimbap',
    no: 23,
    categoryId: 'kimbap',
    name: { en: 'Shrimp Tempura Kimbap', pl: 'Kimbap z krewetką w tempurze', ko: '새우튀김 김밥' },
    description: {
      en: 'Korean seaweed rice roll filled with crispy shrimp tempura and vegetables.',
      pl: 'Koreańska rolka z ryżem, chrupiącą krewetką w tempurze i warzywami.',
      ko: '일본식 새우튀김(템푸라) 영향과 한국 김밥 문화가 만나 1990년대 이후 대중화되었으며, 간편하면서도 특별한 맛으로 사랑받고 있습니다. 한 번은 친구들과 소풍을 가던 중 새우튀김 김밥을 나눠 먹었는데, 바삭한 새우와 김밥의 조합이 너무 좋아 모두가 감탄하며 즐거운 추억을 만들었던 기억이 있습니다.',
    },
    price: 55,
    photo: '23',
  },
  {
    id: 'chicken-cheese-kimbap',
    no: 24,
    categoryId: 'kimbap',
    name: { en: 'Chicken & Cheese Kimbap', pl: 'Kimbap z kurczakiem i serem', ko: '치킨&치즈 김밥' },
    description: {
      en: 'Korean seaweed rice roll filled with chicken, melted cheese, and vegetables.',
      pl: 'Koreańska rolka z ryżem, kurczakiem, serem i warzywami.',
      ko: '최근 몇 년 사이 젊은 층 사이에서 인기를 끌면서, 간편한 한 끼 식사로 자리 잡았어요. 한 에피소드로는, 어느 친구가 치킨과 치즈를 좋아하는 친구들을 위해 특별히 만들어 간 김밥이 학교에서 큰 인기를 끌어, 곧장 단골 메뉴가 된 이야기가 있습니다.',
    },
    price: 55,
    photo: '24',
  },

  // ─── 추천메뉴 · Chef's Recommendations ────────────────────────────────
  {
    id: 'wang-gabitang',
    no: 25,
    categoryId: 'chucheon',
    name: { en: 'Wang gabitang', pl: 'Wang gabitang', ko: '왕 갈비탕' },
    description: {
      en: 'Hearty short rib soup, featuring fall-off-the-bone tender meat and a deeply flavorful broth.',
      pl: 'Treściwa zupa z delikatnymi żeberkami wołowymi i bogatym bulionem.',
      ko: '왕갈비탕은 소갈비를 푹 고아 진한 육수를 만든 한국의 전통 보양식입니다. ‘왕’이라는 뜻은 ‘크고 으뜸’이라는 의미로, 큼직한 갈비와 풍부한 맛을 자랑하는 고급 탕 요리입니다. 유래는 조선시대 왕실이나 양반가에서 몸보신을 위해 즐겨 먹던 갈비탕에서 비롯되었으며, 현대에는 대중화되어 명절이나 특별한 날에 즐기는 대표 보양식으로 자리 잡았습니다.',
    },
    price: 70,
    photo: '25',
  },
  {
    // sourceNote: the Korean edition lists these options as pork, chicken,
    // beef, tofu — a different order from the English/Polish edition used here.
    id: 'dolsot-bibimbap',
    no: null,
    categoryId: 'chucheon',
    name: {
      en: 'Dalsot — the stone bowl of rice',
      pl: 'Dalsot — ryż w kamiennej misie',
      ko: '돌솥비빔밥',
    },
    description: {
      en: 'Hearty stew, served bubbling hot in a stone pot for an unforgettable dining experience.',
      pl: 'Treściwy gulasz serwowany w gorącym kamiennym garnku dla niezapomnianych smakowych doznań.',
      ko: '비빔밥의 유래는 조선 시대까지 거슬러 올라가는데, 특히 농번기나 명절에 남은 재료들을 모아 한 그릇에 담아 먹으면서 시작된 것으로 알려져 있습니다. 각 지역과 가정에 따라 재료와 조리법이 다양하지만, ‘비빈다’는 뜻 그대로 여러 재료를 섞어 맛과 영양을 균형 있게 즐길 수 있는 한국을 대표하는 건강식입니다.',
    },
    options: [
      { no: 26, price: 60, label: beef },
      { no: 27, price: 60, label: pork },
      { no: 28, price: 60, label: chicken },
      { no: 29, price: 60, label: tofu },
    ],
    photo: '26',
    tags: ['vegetarian'],
  },
  {
    id: 'tteokbokki',
    no: null,
    categoryId: 'chucheon',
    name: { en: 'Tteokbokki', pl: 'Tteokbokki', ko: '떡볶이' },
    description: {
      en: 'Chewy rice cakes stir-fried in a sweet and spicy gochujang sauce.',
      pl: 'Koreańskie kluski ryżowe smażone w słodko-pikantnym sosie z pastą gochujang.',
      ko: '떡볶이의 유래는 조선 시대 궁중 음식인 ‘궁중 떡볶이’에서 시작되었으며, 당시에는 간장 양념으로 만든 담백한 맛이 주를 이루었습니다. 현재 우리가 즐기는 매운 고추장 떡볶이는 1950년대 서울의 한 분식집에서 개발되어 대중화되었고, 이후 길거리 음식으로 큰 인기를 끌게 되었습니다.',
    },
    options: [
      { no: 30, price: 50, label: { en: 'Cheese', pl: 'Ser', ko: '치즈' } },
      { no: 31, price: 60, label: { en: 'Bulgogi', pl: 'Wołowina', ko: '불고기' } },
    ],
    photo: '30',
  },
  {
    id: 'tangchu-galbi',
    no: null,
    categoryId: 'chucheon',
    name: { en: 'Tangchu galbi', pl: 'Tangchu galbi', ko: '탕추갈비' },
    description: {
      en: 'Succulent marinated pork short ribs, grilled to perfection for a smoky, caramelized flavor.',
      pl: 'Marynowane żeberka wieprzowe z grilla o dymnym, karmelizowanym smaku.',
      ko: '중국 요리인 ‘탕추육(糖醋肉)’에서 영향을 받았습니다. ‘탕추’는 ‘탕(탕수, 설탕)’과 ‘추(초, 식초)’의 합성어로, 달콤하면서도 새콤한 맛을 뜻합니다. 탕추 요리는 20세기 후반부터 대중화되어, 술안주나 반찬으로 인기를 끌고 있습니다. 중국식 탕수육과는 다르게 매콤한 맛이 가미되어 한국인의 입맛에 맞춘 한국식 퓨전 요리입니다.',
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
    name: { en: 'Kkanpunggi', pl: 'Kkanpunggi', ko: '깐풍기' },
    description: {
      en: 'Crispy fried chicken stir-fried with garlic, chili, and vegetables in a spicy-sour sauce.',
      pl: 'Chrupiący smażony kurczak z czosnkiem, papryką i warzywami w pikantno-kwaśnym sosie.',
      ko: '‘깐풍’은 중국어 ‘간펑(乾烹)’에서 유래했으며, ‘마른 볶음’ 또는 ‘마른 튀김’이라는 뜻입니다. 깐풍기는 원래 중국 산동 지방에서 시작된 요리로, 닭고기를 바삭하게 튀긴 후 매콤달콤한 소스를 버무려 내는 방식이 특징입니다. 한국에서는 1990년대부터 인기를 얻으면서 한국식으로 변형되어 매콤함을 강조한 버전이 많이 사랑받고 있습니다.',
    },
    options: [
      { no: 35, price: 85, label: pork },
      { no: 36, price: 85, label: chicken },
      { no: 37, price: 85, label: tofu },
    ],
    photo: '35',
  },
  {
    // sourceNote: the Korean edition names these 기본 / 양념 / 마늘간장
    // (plain, seasoned, garlic-soy) rather than fried / spicy / sweet.
    id: 'korean-fried-chicken',
    no: null,
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken',
      pl: 'Kfc — koreański smażony kurczak',
      ko: 'Kfc - 코리안 후라이드 치킨',
    },
    description: {
      en: 'Indulge in the irresistible crunch of Korean fried chicken glazed with your favorite sauce.',
      pl: 'Rozkoszuj się nieodpartą chrupkością koreańskiego smażonego kurczaka, polanego Twoim ulubionym sosem.',
      ko: '그냥 치킨이 아니라, 한류처럼 세계를 강타하는 바삭함! “한 입 먹으면 ‘어머, 이건 사랑이야!’” 치킨 한 조각에 한국인의 정성과 매운맛이 톡톡 터진다구요! 느끼할 틈 없는, 소스는 기본, 손가락까지 핥게 만드는 그 맛!',
    },
    options: [
      { no: 38, price: 85, label: { en: 'Fried', pl: 'Smażony', ko: '기본' } },
      { no: 39, price: 85, label: { en: 'Spicy', pl: 'Ostry', ko: '양념' } },
      { no: 40, price: 85, label: { en: 'Sweet', pl: 'Słodki', ko: '마늘간장' } },
      { no: 41, price: 85, label: { en: 'Fried / Spicy', pl: 'Smażony / Ostry', ko: '기본 / 양념' } },
      {
        no: 42,
        price: 85,
        label: { en: 'Fried / Sweet', pl: 'Smażony / Słodki', ko: '기본 / 마늘간장' },
      },
      {
        no: 43,
        price: 85,
        label: { en: 'Spicy / Sweet', pl: 'Ostry / Słodki', ko: '양념 / 마늘간장' },
      },
    ],
    photo: '38',
    tags: ['extraSpicy'],
    featured: true,
  },

  // ─── 바베큐 · Korean BBQ ──────────────────────────────────────────────
  {
    id: 'samgyeobsal',
    no: 44,
    categoryId: 'bbq',
    name: { en: 'Samgyeobsal', pl: 'Samgyeobsal', ko: '삼겹살' },
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
    name: { en: 'Dwaejimogsal', pl: 'Dwaejimogsal', ko: '돼지목살' },
    description: bbqServing,
    price: 65,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'jowls-skinless',
    no: 46,
    categoryId: 'bbq',
    name: { en: 'Jowls skinless', pl: 'Podgardle bez skóry', ko: '항정살' },
    description: bbqServing,
    price: 70,
    portion: '200g',
    photo: '44',
  },
  {
    // sourceNote: the Korean edition calls this 양념돼지목살 — marinated pork neck.
    id: 'dwaeji-galbi',
    no: 47,
    categoryId: 'bbq',
    name: { en: 'Dwaeji Galbi', pl: 'Dwaeji Galbi', ko: '양념돼지목살' },
    description: bbqServing,
    price: 75,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'sliced-pork-belly',
    no: 48,
    categoryId: 'bbq',
    name: { en: 'Sliced Pork Belly', pl: 'Boczek w plastrach', ko: '대패삼겹살' },
    description: bbqServing,
    price: 70,
    portion: '200g',
    photo: '44',
  },
  {
    id: 'assorted-pork',
    no: 49,
    categoryId: 'bbq',
    name: { en: 'Assorted Pork', pl: 'Wieprzowina mieszana', ko: '모둠구이' },
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
    name: { en: 'Bulgoggie B.B.Q', pl: 'Bulgoggie B.B.Q', ko: '소불고기' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'brisket',
    no: 51,
    categoryId: 'bbq',
    name: { en: 'Brisket', pl: 'Mostek wołowy', ko: '차돌박이' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    // sourceNote: the Korean edition calls this 양념 차돌박이 (marinated
    // brisket) and prices it at 105 PLN.
    id: 'boneless-short-rib',
    no: 52,
    categoryId: 'bbq',
    name: { en: 'Boneless ShortRib', pl: 'Żeberka bez kości', ko: '양념 차돌박이' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'rib-eye',
    no: 53,
    categoryId: 'bbq',
    name: { en: 'Rib Eye', pl: 'Rib Eye', ko: '꽃등심' },
    description: bbqServing,
    price: 100,
    portion: '150g',
    photo: '50',
  },
  {
    id: 'la-style-galbi',
    no: 54,
    categoryId: 'bbq',
    name: { en: 'LA-style Galbi', pl: 'Galbi w stylu LA', ko: 'LA갈비' },
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
    name: { en: 'Assorted Beef', pl: 'Wołowina mieszana', ko: '모둠구이' },
    description: bbqServing,
    price: 450,
    portion: '800g',
    photo: '50',
    tags: ['sharing'],
  },

  // ─── 여름메뉴 · Summer Menu ───────────────────────────────────────────
  {
    id: 'buckwheat-soba',
    no: 56,
    categoryId: 'yeoreum',
    name: { en: 'Buckwheat Soba', pl: 'Soba gryczana', ko: '냉소바' },
    description: {
      en: 'Buckwheat soba noodles, known for their nutty flavor and chewy texture, often served with dipping sauce or in broth.',
      pl: 'Makaron soba z gryki, znany z orzechowego smaku i sprężystej konsystencji, podawany z sosem do maczania lub w bulionie.',
      ko: '‘소바’가 메밀국수를 의미하며, 다양한 방식으로 조리되어 지역마다 특색 있는 소바 요리가 존재합니다. 한국에서도 메밀소바가 소개되어 건강식 및 다이어트 식품으로 인기를 얻고 있습니다.',
    },
    price: 50,
    photo: '56',
    tags: ['vegetarian'],
  },
  {
    id: 'bibim-soba',
    no: 57,
    categoryId: 'yeoreum',
    name: { en: 'Bibim Soba', pl: 'Bibim Soba', ko: '비빔소바' },
    description: {
      en: 'Cold buckwheat noodles mixed with fresh vegetables and a spicy, tangy sauce.',
      pl: 'Zimny makaron gryczany wymieszany ze świeżymi warzywami i pikantnym, kwaśnym sosem.',
      ko: '한국에서 고추장 양념과 함께 재해석한 음식입니다. 한국인의 입맛에 맞게 매운맛과 달콤함을 더해, 특히 여름철 시원하게 즐길 수 있는 별미로 자리 잡았습니다. 비빔국수와 소바의 결합으로 탄생한 퓨전 메뉴로, 건강하고 가벼운 한 끼 식사로 인기가 높습니다.',
    },
    price: 50,
    photo: '57',
    tags: ['vegetarian'],
  },
  {
    id: 'kalguksu',
    no: null,
    categoryId: 'yeoreum',
    name: { en: 'Kalguksu', pl: 'Kalguksu', ko: '칼국수' },
    description: {
      en: "Kalguksu is a Korean noodle dish made with knife-cut noodles served in a broth. It's a rich noodle dish with a rich broth and a variety of vegetables, creating a rich, flavorful dish.",
      pl: 'Kalguksu to koreańskie danie z makaronem, przygotowywane z makaronu krojonego nożem, podawanego w bulionie. To bogate danie z makaronem, podawane z bogatym bulionem i różnorodnymi warzywami, tworzące bogate, aromatyczne danie.',
      ko: '칼국수는 한국의 국수로, 칼로 썬 국수를 국물에 담은 탕면류 국수입니다. 진한 국물에 각종 야채가 가미되어 깊은 맛이 나는 면요리입니다.',
    },
    options: [
      { no: 58, price: 60, label: seafood },
      { no: 59, price: 50, label: { en: 'Kimchi', pl: 'Kimchi', ko: '김치' } },
    ],
    photo: '58',
    tags: ['vegetarian'],
  },

  // ─── 식사메뉴 · Meals & Stews ─────────────────────────────────────────
  {
    id: 'kimchi-jjigae',
    no: 60,
    categoryId: 'siksa',
    name: { en: 'Kimchi-jjigae', pl: 'Kimchi-jjigae', ko: '김치찌개' },
    description: {
      en: 'Spicy Korean stew with kimchi, pork and tofu.',
      pl: 'Pikantna zupa koreańska z kimchi, wieprzowiną i tofu.',
      ko: '어느 겨울날, 가족 모두가 바쁘고 지친 하루를 보냈을 때, 엄마가 뚝딱 만든 김치찌개 한 냄비가 식탁에 올려졌어요. 묵은 김치와 돼지고기가 어우러진 뜨끈한 찌개 한 숟갈에 모두의 얼굴에 미소가 번졌죠. 그때부터 우리 집 김치찌개는 ‘힘이 나는 마법의 음식’으로 불리게 되었답니다.',
    },
    price: 60,
    photo: '60',
    featured: true,
  },
  {
    id: 'doenjang-jjigae',
    no: null,
    categoryId: 'siksa',
    name: { en: 'Doenjang-jjigae', pl: 'Doenjang-jjigae', ko: '된장찌개' },
    description: {
      en: 'Korean soybean paste stew with tofu and vegetables.',
      pl: 'Koreańska zupa z pastą sojową, tofu i warzywami.',
      ko: '바쁜 하루를 보내고 집에 돌아왔을 때, 엄마가 끓여놓은 된장찌개의 구수한 냄새가 먼저 반겨줬어요. 피곤한 몸을 이끌고 먹은 한 숟갈에 마음까지 따뜻해지고 힘이 나는 느낌이었죠. 그날부터 된장찌개는 저에게 ‘집밥’과 ‘위로의 음식’으로 특별한 의미가 되었습니다.',
    },
    options: [
      { no: 61, price: 63, label: seafood },
      { no: 62, price: 70, label: brisket },
    ],
    photo: '61',
  },
  {
    id: 'sundubu-jjigae',
    no: null,
    categoryId: 'siksa',
    name: { en: 'Sundubu-Jjigae', pl: 'Sundubu-Jjigae', ko: '순두부찌개' },
    description: {
      en: 'Spicy Korean stew with seafood, silken tofu and vegetables.',
      pl: 'Pikantna koreańska zupa z owocami morza, delikatnym tofu i warzywami.',
      ko: '뜨끈한 국물에 부드러운 순두부가 입안에서 녹아내리는 그 맛에 모두 감탄하며 몸과 마음이 따뜻해지는 순간을 경험했답니다. 그날 이후, 순두부찌개는 저희 모임의 ‘겨울 필수 메뉴’가 되었어요.',
    },
    options: [
      { no: 63, price: 63, label: seafood },
      { no: 64, price: 70, label: brisket },
    ],
    photo: '63',
    tags: ['mildAvailable'],
  },

  // ─── 전골메뉴 · Hot Pots ──────────────────────────────────────────────
  {
    id: 'kkochge-odeng-tang',
    no: 65,
    categoryId: 'jeongol',
    name: { en: 'Kkochge odeng-tang', pl: 'Kkochge odeng-tang', ko: '꽃게 어묵탕' },
    description: {
      en: 'Spicy Korean soup with crab, fish cakes and vegetables.',
      pl: 'Pikantna koreańska zupa z krabem, klopsikami rybnymi i warzywami.',
      ko: '어묵탕과 꽃게탕이 결합된 형태로, 꽃게가 풍부한 해안 지역에서 자연스럽게 발전해 왔습니다. 지역별로 다양한 어묵을 만들어 사용하며, 꽃게와 함께 탕요리에 자주 활용됩니다. 바다의 신선함과 한국인의 따뜻한 식문화를 담은 음식으로 자리매김하고 있습니다.',
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
    name: { en: 'Budae Jeongol', pl: 'Budae Jeongol', ko: '부대전골' },
    description: {
      en: 'Spicy Korean hot pot with sausages, ham, kimchi, tofu and noodles.',
      pl: 'Pikantny koreański kociołek z kiełbaskami, szynką, kimchi, tofu i makaronem.',
      ko: '1950년대, 전쟁으로 인해 식량이 부족했던 시기에 미군부대에서 나온 햄, 소시지, 콘비프 등 다양한 가공육과 통조림 식품을 활용해 한국인들이 만든 요리가 바로 부대찌개입니다. 기존의 김치찌개에 미국식 재료가 더해져 탄생한 퓨전 음식으로, 얼큰하고 진한 맛이 특징이며, 당시 어려운 시절을 이겨내기 위한 창의적인 음식문화의 산물이기도 합니다.',
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
    name: { en: 'Kimchi Jeongol', pl: 'Kimchi Jeongol', ko: '김치전골' },
    description: {
      en: 'Spicy Korean stew made with aged kimchi, pork and tofu.',
      pl: 'Pikantna koreańska zupa z dojrzałym kimchi, wieprzowiną i tofu.',
      ko: '유래는 김치를 저장하고 먹는 과정에서 남은 묵은 김치를 활용하기 위해 개발된 음식으로, 김치찌개보다 재료가 다양하고 국물이 풍부한 점이 특징입니다. 김치전골은 특히 겨울철에 인기가 많아, 가족이나 친구들과 함께 나누며 따뜻한 식사를 즐기는 문화가 자리 잡았습니다.',
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
    name: {
      en: 'Chadoldoenjang jeongol',
      pl: 'Chadoldoenjang jeongol',
      ko: '차돌박이 된장전골',
    },
    description: {
      en: 'Hot pot with beef brisket and doenjang (soybean paste) broth.',
      pl: 'Gorący garnek z wołowiną i aromatycznym sojowym bulionem.',
      ko: '된장의 구수하고 진한 맛에 얇게 저민 차돌박이의 부드럽고 고소한 풍미가 어우러져 고급스러운 맛을 자랑합니다. 유래는 된장찌개와 전골 요리가 발달하면서 차돌박이를 넣어 풍미를 높인 변형으로, 최근 몇십 년간 인기를 얻으며 외식 메뉴로 자리 잡았습니다.',
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
    name: { en: 'Jjamppong-tang', pl: 'Jjamppong-tang', ko: '짬뽕탕' },
    description: {
      en: 'Spicy Korean seafood soup with noodles and vegetables.',
      pl: 'Pikantna koreańska zupa z owocami morza, makaronem i warzywami.',
      ko: '짬뽕은 중국 푸젠 지방에서 유래한 면 요리로, 다양한 해산물과 채소를 매운 국물에 끓여내는 음식입니다. 한국에서는 이를 바탕으로 국물이 진하고 매운 해산물 탕 요리로 변형되었으며, 각종 해산물과 고추, 마늘 등을 넣어 얼큰하고 깊은 맛을 냅니다. 특히 겨울철에 인기가 많아 따뜻하게 몸을 녹이는 음식으로 사랑받고 있습니다.',
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
    name: { en: 'Dumpling tofu jeongol', pl: 'Dumpling tofu jeongol', ko: '버섯두부전골' },
    description: {
      en: 'Korean hot pot with dumplings, tofu, mushrooms, and vegetables.',
      pl: 'Koreański kociołek z pierożkami, tofu, grzybami i warzywami.',
      ko: '여러 가지 재료를 국물과 함께 끓여내는 방식으로 오랜 역사를 가지고 있으며, 특히 버섯과 두부는 예로부터 한국 식문화에서 몸에 좋은 재료로 널리 활용되었습니다. 버섯두부전골은 이러한 전통을 바탕으로 현대에 와서 다양한 버섯 종류와 두부를 넣어 영양가를 높이고 맛을 살린 전골 요리로 발전하였습니다.',
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
    name: {
      en: 'Haemul sundubu jeongol',
      pl: 'Haemul sundubu jeongol',
      ko: '해물순두부 전골',
    },
    description: {
      en: 'Korean hot pot with seafood, silken tofu, vegetables, and a spicy broth.',
      pl: 'Koreański kociołek z owocami morza, delikatnym tofu i warzywami w pikantnym bulionie.',
      ko: '오래전부터 한국에서 사랑받아 온 대표적인 두부 요리인 만큼, 여기에 해산물을 더해 더욱 풍성하고 특별한 맛을 즐길 수 있도록 발전한 메뉴입니다. 특히 해산물이 풍부한 해안 지역을 중심으로 해물순두부전골이 인기를 얻었으며, 두부의 부드러움과 해산물의 신선함이 조화를 이루는 건강식으로 자리 잡았습니다.',
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
    name: { en: 'Ox Knee Jeongol', pl: 'Ox Knee Jeongol', ko: '도가니 전골' },
    description: {
      en: 'Korean hot pot with ox knee, noodles, and vegetables in a clear, rich broth.',
      pl: 'Delikatny koreański kociołek z kolanem wołowym, makaronem i warzywami w klarownym bulionie.',
      ko: '‘도가니’는 오랜 세월 동안 관절 건강에 좋은 보양식으로 알려져 왔으며, 특히 관절염이나 무릎 통증 완화에 효과가 있다고 믿어져 왔습니다. 도가니전골은 진한 뼈 육수의 깊은 맛과 부드러운 도가니 살코기가 어우러져, 영양과 맛을 모두 만족시키는 대표적인 보양식으로 자리 잡았습니다.',
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
    name: { en: 'Haemul tang', pl: 'Haemul tang', ko: '해물탕' },
    description: {
      en: 'A spicy dish of shrimp, crab, squid, mussels and other seafood, served with various vegetables.',
      pl: 'Pikantna potrawa z krewetek, krabów, kałamarnic, małży i innych owoców morza, podana z różnymi warzywami.',
      ko: '새우, 게, 오징어, 조개 등등 그 외 각종 해산물과 각종 야채들을 넣고 끓인 매콤한 탕 요리.',
    },
    price: 260,
    serves: '3-4',
    photo: '73',
    tags: ['sharing'],
  },

  // ─── 안주류 · Anju ────────────────────────────────────────────────────
  {
    id: 'jokbal',
    no: 74,
    categoryId: 'anju',
    name: { en: 'Jokbal', pl: 'Jokbal', ko: '족발' },
    description: {
      en: 'Braised pork leg in soy-based sauce, served with salad and condiments.',
      pl: 'Gotowana noga wieprzowa w sosie sojowym, podawana z sałatką i dodatkami.',
      ko: '족발의 유래는 조선시대까지 거슬러 올라가며, 특히 돼지 족을 오래 끓여 콜라겐이 풍부한 젤라틴 성분이 우러나오게 하여 건강식으로도 인기가 많았습니다. 근대 이후 서울과 경기 지역에서 전문 족발집이 생기면서 대중적인 음식으로 자리 잡았고, 지금은 전국적으로 사랑받는 대표적인 야식 및 술안주 메뉴입니다. 쌈채소와 새우젓, 마늘 등과 함께 즐기며, 풍성한 맛과 영양을 동시에 만족시키는 한국인의 인기 음식입니다.',
    },
    price: 90,
    photo: '74',
    featured: true,
  },
  {
    id: 'tofu-kimchi',
    no: 75,
    categoryId: 'anju',
    name: { en: 'Tofu Kimchi', pl: 'Tofu Kimchi', ko: '두부김치' },
    description: {
      en: 'Warm tofu served with stir-fried kimchi and pork.',
      pl: 'Ciepłe tofu podawane z podsmażanym kimchi i wieprzowiną.',
      ko: '유래는 김치가 주식으로 자리 잡은 조선시대부터 시작되었으며, 두부가 보급되면서 김치와 함께 건강하고 간단하게 즐길 수 있는 반찬으로 발전했습니다. 특히 김치의 매운맛과 두부의 부드러움이 어우러져 식감과 맛의 균형을 이루는 음식으로 사랑받아 왔습니다.',
    },
    price: 90,
    photo: '75',
  },
  {
    id: 'tang-suyuk',
    no: null,
    categoryId: 'anju',
    name: { en: 'Tang suyuk', pl: 'Tang suyuk', ko: '탕수육' },
    description: {
      en: 'Pork fried with sweet and sour sauce.',
      pl: 'Wieprzowina smażona w sosie słodko-kwaśnym.',
      ko: '바삭하게 튀겨진 돼지고기에 달콤새콤한 소스를 듬뿍 묻혀 한입 먹을 때마다 모두가 행복한 미소를 지었죠. 특히 동생이 소스를 조금이라도 덜 묻히면 “더 찍어!”라며 장난스럽게 말하던 기억이 아직도 생생해요. 탕수육은 단순한 음식 그 이상으로 가족과 함께하는 즐거운 추억을 떠올리게 하는 특별한 메뉴입니다.',
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
    name: { en: 'Jokbal-naengchae', pl: 'Jokbal-naengchae', ko: '족발냉채' },
    description: {
      en: 'Cold pork salad with vegetables and a tangy Korean mustard dressing.',
      pl: 'Sałatka z zimną wieprzowiną i warzywami w koreańskim stylu.',
      ko: '유래는 전통 족발 요리에서 발전했으며, 특히 무더운 여름철에 시원하고 상큼하게 먹을 수 있는 별미로 만들어졌습니다. 냉채 문화는 중국에서 유래했으나, 한국에서는 족발과 접목해 독특한 한국식 냉채 요리로 자리 잡았습니다.',
    },
    price: 125,
    photo: '78',
  },
  {
    id: 'seasoned-whelk-salad',
    no: 79,
    categoryId: 'anju',
    name: { en: 'Seasoned Whelk Salad', pl: 'Sałatka z golbaengi', ko: '골뱅이소면무침' },
    description: {
      en: 'Thin noodles mixed with sea snails and vegetables in a spicy sauce.',
      pl: 'Koreański makaron z owocami morza (golbaengi), warzywami i pikantnym sosem.',
      ko: '유래는 20세기 후반, 술안주 문화가 발달하면서 간단하고 맛있는 해산물 안주로 골뱅이와 소면을 함께 무쳐 먹기 시작한 데서 비롯되었습니다. 특히 골뱅이의 쫄깃한 식감과 소면의 부드러움, 매콤한 양념이 어우러져 대중적인 술안주로 자리 잡았습니다.',
    },
    price: 185,
    photo: '79',
  },
  {
    id: 'haemuljjim',
    no: 80,
    categoryId: 'anju',
    name: { en: 'Haemuljjim', pl: 'Haemuljjim', ko: '해물찜' },
    description: {
      en: 'Korean-style spicy braised seafood with vegetables.',
      pl: 'Koreańskie pikantne duszone owoce morza z warzywami.',
      ko: '유래는 해안가 지역에서 신선한 해산물을 손쉽게 조리하기 위해 찜 요리법을 활용한 데서 비롯되었으며, 지역별로 다양한 해산물과 양념을 사용해 발전해 왔습니다. 특히 경상도와 전라도 지방에서 많이 사랑받는 음식으로, 풍부한 해산물과 매콤한 양념이 어우러져 식탁을 풍성하게 하는 별미로 자리 잡았습니다.',
    },
    price: 260,
    photo: '80',
  },
  {
    id: 'wang-gyelanmal-i',
    no: 81,
    categoryId: 'anju',
    name: { en: 'Wang gyelanmal-i', pl: 'Wang gyelanmal-i', ko: '왕 치즈계란말이' },
    description: {
      en: 'Korean rolled egg omelette.',
      pl: 'Delikatny i puszysty omlet, zwijany warstwowo, często z dodatkiem warzyw. Podawany pokrojony na porcje.',
      ko: '부드러운 계란말이에 고소한 치즈를 넣어 만든 퓨전 한국식 반찬입니다. 전통적인 계란말이에 치즈를 더한 형태로, 최근 서양식 재료가 한국 요리에 접목되면서 인기를 얻기 시작했습니다.',
    },
    price: 75,
    photo: '81',
  },
  {
    id: 'haemul-pajeon',
    no: 82,
    categoryId: 'anju',
    name: { en: 'Haemul Pajeon', pl: 'Haemul Pajeon', ko: '해물파전' },
    description: {
      en: 'Korean savory pancake with seafood and green onions.',
      pl: 'Koreański wytrawny naleśnik z owocami morza i z cebulą dymką.',
      ko: '유래는 조선시대부터 전통적으로 내려오는 부침요리에서 발전했으며, 특히 바다와 가까운 지역에서 신선한 해산물을 활용해 만들어지기 시작했습니다. 해물파전은 비 오는 날 막걸리와 함께 즐기는 대표적인 음식으로 자리 잡았으며, 고소하고 쫄깃한 맛으로 많은 사랑을 받고 있습니다.',
    },
    price: 70,
    photo: '82',
    featured: true,
  },
  {
    id: 'chicken-kimchijeon',
    no: 83,
    categoryId: 'anju',
    name: { en: 'Chicken-Kimchijeon', pl: 'Chicken-Kimchijeon', ko: '치킨김치전' },
    description: {
      en: 'Korean savory pancake made with kimchi and chicken, crispy on the outside and tender on the inside.',
      pl: 'Koreański wytrawny naleśnik z kimchi i kurczakiem, chrupiący z zewnątrz i delikatny w środku.',
      ko: '유래는 김치를 활용한 다양한 전통 요리에서 발전했으며, 특히 남은 묵은 김치를 아깝지 않게 활용하기 위해 만들어진 음식입니다. 조선시대부터 집집마다 김치와 밀가루 반죽을 이용해 간단하게 부쳐 먹던 서민 음식으로, 오늘날에는 비 오는 날이나 간식, 안주로 널리 사랑받고 있습니다.',
    },
    price: 60,
    photo: '83',
  },

  // ─── 예약메뉴 · Reservation Menu ──────────────────────────────────────
  {
    id: 'mukeunji-samgyeopsal-jjim',
    no: 84,
    categoryId: 'rezerwacja',
    name: {
      en: 'Mukeunji samgyeopsal jjim',
      pl: 'Mukeunji samgyeopsal jjim',
      ko: '묵은지 통삼겹김치찜',
    },
    description: {
      en: 'Braised pork belly with aged kimchi in a spicy sauce.',
      pl: 'Duszony boczek wieprzowy z dojrzałym kimchi w pikantnym sosie.',
      ko: '통삼겹살과 함께 조리해 고기의 풍미와 김치의 시큼하면서도 감칠맛 나는 맛이 어우러져 한국 가정에서 겨울철 대표 보양식으로 사랑받아 왔습니다. 묵은지 통삼겹김치찜은 식탁을 풍성하게 하는 건강하고 든든한 한 끼 요리로, 세대를 넘어 많은 사람들에게 인기 있는 전통 음식입니다.',
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
    name: { en: 'Bossam', pl: 'Bossam', ko: '보쌈' },
    description: {
      en: 'Boiled pork served with various wraps and dipping sauces.',
      pl: 'Gotowana wieprzowina podawana z różnymi rodzajami zawijanych liści i sosami.',
      ko: '보쌈은 돼지고기를 삶아 부드럽게 익힌 뒤, 김치와 함께 쌈을 싸서 먹는 한국 전통 음식입니다. 유래는 조선시대 돼지고기 요리에서 비롯되었으며, 특히 돼지고기를 삶아 기름기를 제거하고 담백하게 즐기던 방식에서 발전했습니다. ‘보쌈’이라는 이름은 ‘싸다’라는 뜻의 ‘쌈’과 ‘보’가 합쳐져, 고기와 야채를 함께 싸 먹는 식문화를 나타냅니다.',
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
    name: { en: 'Jjim-dalg', pl: 'Jjim-dalg', ko: '찜닭' },
    description: {
      en: 'A representative Korean chicken dish, with a sweet and salty yet light sauce made with a mild soy sauce seasoning, that permeates all the ingredients, including the chicken, and the meat is very tender because the chicken is cooked over a high heat for a long time.',
      pl: 'Typowe koreańskie danie z kurczaka, podawane w słodko-słonym, a jednocześnie lekkim sosie z dodatkiem łagodnego sosu sojowego, który przenika wszystkie składniki, łącznie z kurczakiem. Mięso jest bardzo delikatne, ponieważ kurczak jest długo gotowany na dużym ogniu.',
      ko: '매운맛이 덜한 간장 양념을 써 달콤 짭쪼름하면서도 담백한 소스가 닭을 비롯한 모든 재료에 진하게 배어있고, 오랜 시간 강한 불에서 닭을 조리하였기 때문에 육질도 매우 부드러운 한국의 대표 닭요리.',
    },
    price: 180,
    serves: '3-4',
    photo: '87',
    tags: ['sharing'],
  },
  {
    id: 'yangjangpi',
    no: 88,
    categoryId: 'rezerwacja',
    name: { en: 'Yangjangpi', pl: 'Yangjangpi', ko: '양장피' },
    description: {
      en: 'Korean cold salad made with a variety of vegetables, seafood, and meat, served with a tangy dipping sauce.',
      pl: 'Koreańska zimna sałatka z różnych warzyw, owoców morza i mięsa, podawana z kwaśnym sosem.',
      ko: '‘양장피’라는 이름은 ‘양(洋)’이 ‘서양’을 뜻하는 경우도 있지만, 여기서는 ‘여러 가지’라는 의미를 담고 있으며, ‘장피’는 해파리를 의미합니다. 중국 북방 지방에서 시작된 요리로, 다양한 재료가 어우러져 화려하고 고급스러운 한 접시를 완성하는 것이 특징입니다.',
    },
    price: 300,
    serves: '3-4',
    photo: '88',
    tags: ['sharing'],
  },
  {
    id: 'ori-jumulleok',
    no: 89,
    categoryId: 'rezerwacja',
    name: { en: 'Olijuulleog', pl: 'Olijuulleog', ko: '오리주물럭' },
    description: {
      en: 'Spicy Korean stir-fried duck dish, marinated and cooked with vegetables.',
      pl: 'Pikantna koreańska potrawa z kaczką smażoną z warzywami w marynacie.',
      ko: '‘주물럭’이라는 이름은 고기를 양념에 주물러 재운 뒤 볶는 조리법에서 유래했으며, 부드럽고 감칠맛 나는 오리고기와 매콤한 양념의 조화가 특징입니다. 오리고기는 예로부터 기력 회복과 건강 증진에 좋은 식재료로 알려져, 주물럭 스타일로 조리하면서 맛과 건강을 동시에 잡은 요리로 발전했습니다. 최근에는 건강식과 웰빙 트렌드에 맞춰 많은 식당에서 인기를 얻고 있습니다.',
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
    name: { en: 'Gamja tang', pl: 'Gamja tang', ko: '감자탕' },
    description: {
      en: 'Gamjatang is a thick, spicy Korean soup made with pork backbone, potatoes, ground perilla seeds, red peppers, green onions, and garlic. The soup is rich in ingredients and the burdock root adds a savory flavor that becomes even more pronounced as it simmers.',
      pl: 'Gamjatang to gęsta, pikantna koreańska zupa z kręgosłupa wieprzowego, ziemniaków, mielonych nasion pachnotki, czerwonej papryki, dymki i czosnku. Zupa jest bogata w składniki, a korzeń łopianu dodaje jej pikantnego smaku, który staje się jeszcze bardziej wyrazisty podczas gotowania.',
      ko: '감자탕은 돼지 등뼈와 감자, 우거지, 갈은 들깨, 깻잎, 붉은 고추, 파, 마늘 등을 넣어 맵고 진하게 끓여 걸죽하고 얼큰한 맛이 나는 한국의 국물 요리입니다. 건더기가 풍부하고 우거지가 들어가 있어 끓일수록 구수한 맛이 나기도 합니다.',
    },
    price: 180,
    serves: '3-4',
    photo: '90',
    tags: ['sharing'],
  },

  // ─── 어린이메뉴 · Kids Menu ───────────────────────────────────────────
  {
    id: 'handmade-pork-cutlet-set',
    no: 91,
    categoryId: 'dzieci',
    name: {
      en: 'Handmade Pork Cutlet Set Menu',
      pl: 'Domowy kotlet wieprzowy — zestaw',
      ko: '수제돈카츠 정식',
    },
    description: setServing,
    price: 45,
    photo: '91',
  },
  {
    id: 'handmade-chicken-cutlet-set',
    no: 92,
    categoryId: 'dzieci',
    name: {
      en: 'Handmade Chicken Cutlet Set Menu',
      pl: 'Domowy kotlet z kurczaka — zestaw',
      ko: '수제치킨까스 정식',
    },
    description: setServing,
    price: 45,
    photo: '92',
  },

  // ─── 특선메뉴 · Special Menu ──────────────────────────────────────────
  {
    id: 'iron-plate-corn-cheese',
    no: 93,
    categoryId: 'teukseon',
    name: {
      en: 'Iron Plate Corn Cheese',
      pl: 'Kukurydza z serem na płycie',
      ko: '철판 콘치즈',
    },
    description: {
      en: 'A sizzling dish of sweet corn and butter mayonnaise, corn topped with cheese. A convenient dish with a sweet, salty, and creamy flavor.',
      pl: 'Skrzące danie ze słodkiej kukurydzy z majonezem maślanym, kukurydza posypana serem. Wygodne danie o słodko-słonym i kremowym smaku.',
      ko: '달콤한 옥수수와 버터 마요네즈를 곁들인 옥수수 위에 치즈를 얹은 요리. 달콤하고 짭짤하며 크리미한 풍미를 지닌 간편한 요리입니다.',
    },
    price: 35,
    photo: '93',
  },
  {
    id: 'bulgogi-jap-chae',
    no: 94,
    categoryId: 'teukseon',
    name: { en: 'Bulgogi Jap-chae', pl: 'Bulgogi Jap-chae', ko: '불고기 잡채' },
    description: {
      en: "Japchae is a traditional Korean dish made by stir-frying sweet potato noodles with various vegetables. It's seasoned with soy sauce, sesame oil, and sugar, imparting a subtle sweetness and savory flavor, and then served with traditional Korean bulgogi.",
      pl: 'Japchae to tradycyjne koreańskie danie przyrządzane z makaronu ze słodkich ziemniaków smażonego z różnymi warzywami. Doprawia się je sosem sojowym, olejem sezamowym i cukrem, nadając im subtelną słodycz i wytrawny smak, a następnie podaje z tradycyjnym koreańskim bulgogi.',
      ko: '각종 채소들을 당면과 함께 볶은 뒤 소불고기를 올린 잡채입니다.',
    },
    price: 75,
    photo: '94',
    featured: true,
  },
  {
    id: 'guo-bao-rou',
    no: 95,
    categoryId: 'teukseon',
    name: { en: 'Guo Bao Rou', pl: 'Guo Bao Rou', ko: '꿔바로우' },
    description: {
      en: 'A Korean twist on a Chinese dish made by coating thinly sliced pork in starch batter, frying it until crispy, and then serving it with a sweet and sour sauce.',
      pl: 'Koreańska wersja chińskiego dania, przyrządzanego z cienkich plasterków wieprzowiny panierowanych w cieście skrobiowym, smażonych do uzyskania chrupkości, a następnie podawanych z sosem słodko-kwaśnym.',
      ko: '중국 동북 지역의 탕수 요리로, 한국식으로 소스를 보완하여 얇게 썬 돼지고기에 감자전분을 입혀 바삭하게 튀긴 후, 새콤달콤한 소스에 버무려 먹는 요리입니다.',
    },
    price: 90,
    photo: '95',
  },
  {
    id: 'yurin-gi',
    no: 96,
    categoryId: 'teukseon',
    name: { en: 'Yurin-gi', pl: 'Yurin-gi', ko: '유린기' },
    description: {
      en: 'Yurin-gi is a Korean twist on the Chinese stir-fry dish. It features crispy fried chicken topped with fresh, crunchy vegetables (such as onion, ginger, paprika, etc.) and topped with a sweet and sour soy sauce.',
      pl: 'Yurin-gi to koreańska wersja chińskiego dania stir-fry. Składa się z chrupiącego smażonego kurczaka z dodatkiem świeżych, chrupiących warzyw (takich jak cebula, imbir, papryka itp.) i polanego słodko-kwaśnym sosem sojowym.',
      ko: '유린기는 중국식 요리를 한국인들의 입맛에 맞게 맞춘 요리입니다. 바삭하게 튀긴 닭고기에 신선하고 아삭한 채소(양파, 생강, 파프리카 등)를 얹고 새콤달콤한 간장 소스를 뿌립니다.',
    },
    price: 90,
    photo: '96',
  },
  {
    id: 'zicoba-chicken',
    no: 97,
    categoryId: 'teukseon',
    name: { en: 'Zicoba Chicken', pl: 'Zicoba Chicken', ko: '지코바치킨' },
    description: {
      en: 'Roasted chicken is then simmered for a long time with a sweet and spicy sauce and tteokbokki rice cakes, creating a flavorful chicken dish.',
      pl: 'Pieczonego kurczaka gotuje się przez długi czas w słodko-pikantnym sosie z ryżowymi ciastkami tteokbokki, tworząc pełne smaku danie z kurczaka.',
      ko: '닭을 구운 뒤 매콤달콤한 양념과 떡볶이 떡과 함께 오랜 시간 조려서 풍미가 가득한 닭요리.',
    },
    price: 90,
    photo: '97',
  },
  {
    id: 'beef-bulgogi-hot-pot',
    no: 98,
    categoryId: 'teukseon',
    name: { en: 'Beef Bulgogi Hot Pot', pl: 'Bulgogi wołowe w garnku', ko: '뚝불고기' },
    description: {
      en: 'Tender beef bulgogi simmered with vegetables in a savory broth, served in a hot stone pot.',
      pl: 'Delikatne wołowe bulgogi duszone z warzywami w aromatycznym bulionie, podawane w gorącym kamionkowym garnku.',
      ko: '뚝불고기는 ‘뚝배기 불고기’의 줄임말로, 뜨겁고 깊은 맛이 나는 뚝배기 용기에 불고기를 넣어 끓여낸 한국의 전골 요리입니다. 뚝불고기는 불고기의 달콤짭짤한 맛과 뚝배기의 보온 효과가 어우러져 오랜 시간 따뜻하게 즐길 수 있어 한국 가정과 식당에서 인기 있는 메뉴가 되었습니다.',
    },
    price: 70,
    photo: '98',
  },
]

/** Every menu number a dish covers — its own, or the numbers of its options. */
export function dishNumbers(dish: Dish): number[] {
  if (dish.options?.length) return dish.options.map((option: DishOption) => option.no)
  return dish.no === null ? [] : [dish.no]
}

/** Allergens the menu lists against this dish, from the notice on page 23. */
export function dishAllergens(dish: Dish): Allergen[] {
  return allergensFor(dishNumbers(dish))
}

export const dishesByCategory = (categoryId: string): Dish[] =>
  dishes.filter((dish) => dish.categoryId === categoryId)

export const featuredDishes = (): Dish[] => dishes.filter((dish) => dish.featured)

export const findDish = (id: string): Dish | undefined => dishes.find((dish) => dish.id === id)

/** Lowest price of a dish, whether it is fixed or split across options. */
export const dishFromPrice = (dish: Dish): number =>
  dish.price ?? Math.min(...(dish.options ?? []).map((option) => option.price))
