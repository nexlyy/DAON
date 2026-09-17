import korean from '../../content/menu.ko.json'
import { allergensFor } from './allergens'
import type { Allergen } from './allergens'
import type { Dish, LocalizedText } from './types'

const ramenPorkDesc: LocalizedText = {
  en: 'Ramen with pork, vegetables and rich broth.',
  pl: 'Ramen z wieprzowiną, warzywami i aromatycznym bulionem.',
}

const ramenBeefDesc: LocalizedText = {
  en: 'Ramen with beef, vegetables and rich broth.',
  pl: 'Ramen z wołowiną, warzywami i aromatycznym bulionem.',
}

const ramenChickenDesc: LocalizedText = {
  en: 'Ramen with chicken, vegetables and savory broth.',
  pl: 'Ramen z kurczakiem, warzywami i aromatycznym bulionem.',
}

const jajangmyeonTangsuyukDesc: LocalizedText = {
  en: 'Delight the rich, savory flavors of jajangmeon, featuring silky noodles coated in a deep black bean sauce, paired with crispy Tang Suyuk, choose from tender pork, chicken or tofu served with a sweet and tangy sauce for a perfect contrast of flavors and textures.',
  pl: 'Rozkoszuj się bogatym, wyrazistym smakiem jjajangmyeon — jedwabiste kluski w głębokim sosie z czarnej fasoli. Podawane z chrupiącym tangsuyuk — do wyboru delikatna wieprzowina, kurczak lub tofu w słodko-kwaśnym sosie, tworząc idealne połączenie smaków i tekstur.',
}

const jjamppongTangsuyukDesc: LocalizedText = {
  en: 'Spicy seafood noodle soup with fresh seafood, vegetables, and meat in a rich broth, served with crispy sweet and sour pork (pork, chicken, or tofu).',
  pl: 'Pikantna zupa z makaronem i owocami morza w aromatycznym bulionie, podawana z chrupiącym mięsem w sosie słodko-kwaśnym (wieprzowina, kurczak lub tofu).',
}

const dolsotBibimbapDesc: LocalizedText = {
  en: 'Hearty stew, served bubbling hot in a stone pot for an unforgettable dining experience.',
  pl: 'Treściwy gulasz serwowany w gorącym kamiennym garnku dla niezapomnianych smakowych doznań.',
}

const tteokbokkiCheeseDesc: LocalizedText = {
  en: 'Chewy rice cakes stir-fried in a sweet and spicy gochujang sauce.',
  pl: 'Koreańskie kluski ryżowe smażone w słodko-pikantnym sosie z pastą gochujang.',
}

const tangchuGalbiDesc: LocalizedText = {
  en: 'Succulent marinated pork short ribs, grilled to perfection for a smoky, caramelized flavor.',
  pl: 'Marynowane żeberka wieprzowe z grilla o dymnym, karmelizowanym smaku.',
}

const kkanpunggiPorkDesc: LocalizedText = {
  en: 'Crispy fried chicken stir-fried with garlic, chili, and vegetables in a spicy-sour sauce.',
  pl: 'Chrupiący smażony kurczak z czosnkiem, papryką i warzywami w pikantno-kwaśnym sosie.',
}

const koreanFriedChickenDesc: LocalizedText = {
  en: 'Indulge in the irresistible crunch of Korean fried chicken glazed with your favorite sauce.',
  pl: 'Rozkoszuj się nieodpartą chrupkością koreańskiego smażonego kurczaka, polanego Twoim ulubionym sosem.',
}

const bbqServing: LocalizedText = {
  en: 'Fresh wrap vegetables, crispy chili, and garlic balance the richness of the meat. Served with spicy-sweet ssamjang, sesame oil sauce, and a special sauce for various flavor options.',
  pl: 'Świeże warzywa, chrupiące papryczki i czosnek równoważą tłustość mięsa. Podawane z pikantno-słodkim ssamjang, sosem sezamowym i specjalnym sosem dla różnych wariantów smaku.',
}

const kalguksuSeafoodDesc: LocalizedText = {
  en: 'Kalguksu is a Korean noodle dish made with knife-cut noodles served in a broth. It\'s a rich noodle dish with a rich broth and a variety of vegetables, creating a rich, flavorful dish.',
  pl: 'Kalguksu to koreańskie danie z makaronem, przygotowywane z makaronu krojonego nożem, podawanego w bulionie. To bogate danie z makaronem, podawane z bogatym bulionem i różnorodnymi warzywami, tworzące bogate, aromatyczne danie.',
}

const doenjangJjigaeDesc: LocalizedText = {
  en: 'Korean soybean paste stew with tofu and vegetables.',
  pl: 'Koreańska zupa z pastą sojową, tofu i warzywami.',
}

const sundubuJjigaeDesc: LocalizedText = {
  en: 'Spicy Korean stew with seafood, silken tofu and vegetables.',
  pl: 'Pikantna koreańska zupa z owocami morza, delikatnym tofu i warzywami.',
}

const tangSuyukSmallDesc: LocalizedText = {
  en: 'Pork fried with sweet and sour sauce.',
  pl: 'Wieprzowina smażona w sosie słodko-kwaśnym.',
}

const bossamSmallDesc: LocalizedText = {
  en: 'Boiled pork served with various wraps and dipping sauces.',
  pl: 'Gotowana wieprzowina podawana z różnymi rodzajami zawijanych liści i sosami.',
}

const setServing: LocalizedText = {
  en: 'Served with daily side dishes such as salad, fruit, and more alongside the main dish.',
  pl: 'Podawane z codziennymi przystawkami, takimi jak sałatka, owoce i inne, obok dania głównego.',
}

const printed: Dish[] = [
  {
    id: 'jeyuk-bokkeum',
    number: '01',
    categoryId: 'hansang',
    name: {
      en: 'Jeyuk Bokkeum',
      pl: 'Jeyuk Bokkeum',
    },
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
    number: '02',
    categoryId: 'hansang',
    name: {
      en: 'Cheese Dakgalbi',
      pl: 'Cheese Dakgalbi',
    },
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
    number: '03',
    categoryId: 'hansang',
    name: {
      en: 'Bulgogi',
      pl: 'Bulgogi',
    },
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
    number: '04',
    categoryId: 'hansang',
    name: {
      en: 'Braised Beef Short Ribs',
      pl: 'Duszone żeberka wołowe',
    },
    description: {
      en: 'Braised beef short ribs in soy-based sauce.',
      pl: 'Duszone żeberka wołowe w sosie sojowym.',
    },
    price: 70,
    photo: '04',
  },
  {
    id: 'dwaeji-bulgogi',
    number: '05',
    categoryId: 'hansang',
    name: {
      en: 'Dwaeji bulgogi',
      pl: 'Dwaeji bulgogi',
    },
    description: {
      en: 'A dish of stir-fried pork marinated in a sweet and salty sauce.',
      pl: 'Marynowana wieprzowina w słodko-słonym sosie.',
    },
    price: 60,
    photo: '05',
  },
  {
    id: 'grilled-mackerel',
    number: '06',
    categoryId: 'hansang',
    name: {
      en: 'Grilled mackerel',
      pl: 'Grillowana makrela',
    },
    description: {
      en: 'A popular Korean dish featuring fresh mackerel seasoned and grilled until the skin is crispy and the meat is tender and flavorful.',
      pl: 'Koreańskie danie ze świeżej makreli, przyprawionej i grillowanej, z chrupiącą skórką, a mięsem soczystym i aromatycznym.',
    },
    price: 70,
    photo: '06',
  },
  {
    id: 'ramen-pork-mild',
    number: '07',
    categoryId: 'ramyeon',
    name: {
      en: 'Pork Ramen — Mild',
      pl: 'Ramen wieprzowy — Łagodny',
    },
    description: ramenPorkDesc,
    price: 50,
    photo: '07',
    featured: true,
  },
  {
    id: 'ramen-pork-spicy',
    number: '08',
    categoryId: 'ramyeon',
    name: {
      en: 'Pork Ramen — Spicy',
      pl: 'Ramen wieprzowy — Ostry',
    },
    description: ramenPorkDesc,
    price: 55,
    photo: '07',
  },
  {
    id: 'ramen-beef-mild',
    number: '09',
    categoryId: 'ramyeon',
    name: {
      en: 'Beef Ramen — Mild',
      pl: 'Ramen wołowy — Łagodny',
    },
    description: ramenBeefDesc,
    price: 55,
    photo: '09',
  },
  {
    id: 'ramen-beef-spicy',
    number: '10',
    categoryId: 'ramyeon',
    name: {
      en: 'Beef Ramen — Spicy',
      pl: 'Ramen wołowy — Ostry',
    },
    description: ramenBeefDesc,
    price: 60,
    photo: '09',
  },
  {
    id: 'ramen-chicken-mild',
    number: '11',
    categoryId: 'ramyeon',
    name: {
      en: 'Chicken Ramen — Mild',
      pl: 'Ramen z kurczakiem — Łagodny',
    },
    description: ramenChickenDesc,
    price: 50,
    photo: '11',
  },
  {
    id: 'ramen-chicken-spicy',
    number: '12',
    categoryId: 'ramyeon',
    name: {
      en: 'Chicken Ramen — Spicy',
      pl: 'Ramen z kurczakiem — Ostry',
    },
    description: ramenChickenDesc,
    price: 55,
    photo: '11',
  },
  {
    id: 'jajangmyeon-tangsuyuk-pork',
    number: '13',
    categoryId: 'jungsik',
    name: {
      en: 'Jajangmyeoun & Tangsuyuk — Pork',
      pl: 'Jajangmyeoun & Tangsuyuk — Wieprzowina',
    },
    description: jajangmyeonTangsuyukDesc,
    price: 65,
    photo: '13',
  },
  {
    id: 'jajangmyeon-tangsuyuk-chicken',
    number: '14',
    categoryId: 'jungsik',
    name: {
      en: 'Jajangmyeoun & Tangsuyuk — Chicken',
      pl: 'Jajangmyeoun & Tangsuyuk — Kurczak',
    },
    description: jajangmyeonTangsuyukDesc,
    price: 65,
    photo: '13',
  },
  {
    id: 'jajangmyeon-tangsuyuk-tofu',
    number: '15',
    categoryId: 'jungsik',
    name: {
      en: 'Jajangmyeoun & Tangsuyuk — Tofu',
      pl: 'Jajangmyeoun & Tangsuyuk — Tofu',
    },
    description: jajangmyeonTangsuyukDesc,
    price: 62,
    photo: '13',
  },
  {
    id: 'jjamppong-tangsuyuk-pork',
    number: '16',
    categoryId: 'jungsik',
    name: {
      en: 'Jjamppong & Tangsuyuk — Pork',
      pl: 'Jjamppong & Tangsuyuk — Wieprzowina',
    },
    description: jjamppongTangsuyukDesc,
    price: 75,
    photo: '16',
    tags: ['mildAvailable'],
  },
  {
    id: 'jjamppong-tangsuyuk-chicken',
    number: '17',
    categoryId: 'jungsik',
    name: {
      en: 'Jjamppong & Tangsuyuk — Chicken',
      pl: 'Jjamppong & Tangsuyuk — Kurczak',
    },
    description: jjamppongTangsuyukDesc,
    price: 75,
    photo: '16',
    tags: ['mildAvailable'],
  },
  {
    id: 'jjamppong-tangsuyuk-tofu',
    number: '18',
    categoryId: 'jungsik',
    name: {
      en: 'Jjamppong & Tangsuyuk — Tofu',
      pl: 'Jjamppong & Tangsuyuk — Tofu',
    },
    description: jjamppongTangsuyukDesc,
    price: 72,
    photo: '16',
    tags: ['mildAvailable'],
  },
  {
    id: 'basic-kimbap',
    number: '19',
    categoryId: 'kimbap',
    name: {
      en: 'Basic kimbap',
      pl: 'Kimbap podstawowy',
    },
    description: {
      en: 'Kimbap looks similar to Japanese sushi, but it differs in ingredients and preparation. It is a dish that embodies the unique taste and culture of Korea.',
      pl: 'Kimbap wygląda podobnie do japońskiego sushi, ale różni się składnikami i sposobem przygotowania. To potrawa, która zawiera w sobie wyjątkowy smak i kulturę Korei.',
    },
    price: 40,
    photo: '19',
  },
  {
    id: 'tuna-kimbap',
    number: '20',
    categoryId: 'kimbap',
    name: {
      en: 'Tuna Kimbap',
      pl: 'Kimbap z tuńczykiem',
    },
    description: {
      en: 'A Korean seaweed rice roll filled with tuna and vegetables.',
      pl: 'Koreańska rolka z ryżem, tuńczykiem i warzywami.',
    },
    price: 50,
    photo: '20',
  },
  {
    id: 'bulgogi-kimbap',
    number: '21',
    categoryId: 'kimbap',
    name: {
      en: 'Bulgogi Kimbap',
      pl: 'Kimbap z bulgogi',
    },
    description: {
      en: 'Korean seaweed rice roll filled with marinated beef (bulgogi) and vegetables.',
      pl: 'Koreańska rolka z ryżem, marynowaną wołowiną bulgogi i warzywami.',
    },
    price: 50,
    photo: '21',
  },
  {
    id: 'jeyuk-kimbap',
    number: '22',
    categoryId: 'kimbap',
    name: {
      en: 'Jeyuk Kimbap',
      pl: 'Kimbap z jeyuk',
    },
    description: {
      en: 'Korean seaweed rice roll filled with spicy stir-fried pork and vegetables.',
      pl: 'Koreańska rolka z ryżu i wodorostów wypełniona pikantną, smażoną wieprzowiną i warzywami.',
    },
    price: 50,
    photo: '22',
  },
  {
    id: 'shrimp-tempura-kimbap',
    number: '23',
    categoryId: 'kimbap',
    name: {
      en: 'Shrimp Tempura Kimbap',
      pl: 'Kimbap z krewetką w tempurze',
    },
    description: {
      en: 'Korean seaweed rice roll filled with crispy shrimp tempura and vegetables.',
      pl: 'Koreańska rolka z ryżem, chrupiącą krewetką w tempurze i warzywami.',
    },
    price: 55,
    photo: '23',
  },
  {
    id: 'chicken-cheese-kimbap',
    number: '24',
    categoryId: 'kimbap',
    name: {
      en: 'Chicken & Cheese Kimbap',
      pl: 'Kimbap z kurczakiem i serem',
    },
    description: {
      en: 'Korean seaweed rice roll filled with chicken, melted cheese, and vegetables.',
      pl: 'Koreańska rolka z ryżem, kurczakiem, serem i warzywami.',
    },
    price: 55,
    photo: '24',
  },
  {
    id: 'wang-gabitang',
    number: '25',
    categoryId: 'chucheon',
    name: {
      en: 'Wang gabitang',
      pl: 'Wang gabitang',
    },
    description: {
      en: 'Hearty short rib soup, featuring fall-off-the-bone tender meat and a deeply flavorful broth.',
      pl: 'Treściwa zupa z delikatnymi żeberkami wołowymi i bogatym bulionem.',
    },
    price: 70,
    photo: '25',
  },
  {
    id: 'dolsot-bibimbap-beef',
    number: '26',
    categoryId: 'chucheon',
    name: {
      en: 'Dalsot — the stone bowl of rice — Beef',
      pl: 'Dalsot — ryż w kamiennej misie — Wołowina',
    },
    description: dolsotBibimbapDesc,
    price: 60,
    photo: '26',
  },
  {
    id: 'dolsot-bibimbap-pork',
    number: '27',
    categoryId: 'chucheon',
    name: {
      en: 'Dalsot — the stone bowl of rice — Pork',
      pl: 'Dalsot — ryż w kamiennej misie — Wieprzowina',
    },
    description: dolsotBibimbapDesc,
    price: 60,
    photo: '26',
  },
  {
    id: 'dolsot-bibimbap-chicken',
    number: '28',
    categoryId: 'chucheon',
    name: {
      en: 'Dalsot — the stone bowl of rice — Chicken',
      pl: 'Dalsot — ryż w kamiennej misie — Kurczak',
    },
    description: dolsotBibimbapDesc,
    price: 60,
    photo: '26',
  },
  {
    id: 'dolsot-bibimbap-tofu',
    number: '29',
    categoryId: 'chucheon',
    name: {
      en: 'Dalsot — the stone bowl of rice — Tofu',
      pl: 'Dalsot — ryż w kamiennej misie — Tofu',
    },
    description: dolsotBibimbapDesc,
    price: 60,
    photo: '26',
    tags: ['vegetarian'],
  },
  {
    id: 'tteokbokki-cheese',
    number: '30',
    categoryId: 'chucheon',
    name: {
      en: 'Tteokbokki — Cheese',
      pl: 'Tteokbokki — Ser',
    },
    description: tteokbokkiCheeseDesc,
    price: 50,
    photo: '30',
  },
  {
    id: 'tteokbokki-bulgogi',
    number: '31',
    categoryId: 'chucheon',
    name: {
      en: 'Tteokbokki — Bulgogi',
      pl: 'Tteokbokki — Wołowina',
    },
    description: tteokbokkiCheeseDesc,
    price: 60,
    photo: '30',
  },
  {
    id: 'tangchu-galbi-pork',
    number: '32',
    categoryId: 'chucheon',
    name: {
      en: 'Tangchu galbi — Pork',
      pl: 'Tangchu galbi — Wieprzowina',
    },
    description: tangchuGalbiDesc,
    price: 85,
    photo: '32',
  },
  {
    id: 'tangchu-galbi-chicken',
    number: '33',
    categoryId: 'chucheon',
    name: {
      en: 'Tangchu galbi — Chicken',
      pl: 'Tangchu galbi — Kurczak',
    },
    description: tangchuGalbiDesc,
    price: 85,
    photo: '32',
  },
  {
    id: 'tangchu-galbi-tofu',
    number: '34',
    categoryId: 'chucheon',
    name: {
      en: 'Tangchu galbi — Tofu',
      pl: 'Tangchu galbi — Tofu',
    },
    description: tangchuGalbiDesc,
    price: 85,
    photo: '32',
  },
  {
    id: 'kkanpunggi-pork',
    number: '35',
    categoryId: 'chucheon',
    name: {
      en: 'Kkanpunggi — Pork',
      pl: 'Kkanpunggi — Wieprzowina',
    },
    description: kkanpunggiPorkDesc,
    price: 85,
    photo: '35',
  },
  {
    id: 'kkanpunggi-chicken',
    number: '36',
    categoryId: 'chucheon',
    name: {
      en: 'Kkanpunggi — Chicken',
      pl: 'Kkanpunggi — Kurczak',
    },
    description: kkanpunggiPorkDesc,
    price: 85,
    photo: '35',
  },
  {
    id: 'kkanpunggi-tofu',
    number: '37',
    categoryId: 'chucheon',
    name: {
      en: 'Kkanpunggi — Tofu',
      pl: 'Kkanpunggi — Tofu',
    },
    description: kkanpunggiPorkDesc,
    price: 85,
    photo: '35',
  },
  {
    id: 'korean-fried-chicken-fried',
    number: '38',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Fried',
      pl: 'Kfc — koreański smażony kurczak — Smażony',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
    featured: true,
  },
  {
    id: 'korean-fried-chicken-spicy',
    number: '39',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Spicy',
      pl: 'Kfc — koreański smażony kurczak — Ostry',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
    tags: ['extraSpicy'],
  },
  {
    id: 'korean-fried-chicken-sweet',
    number: '40',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Sweet',
      pl: 'Kfc — koreański smażony kurczak — Słodki',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
  },
  {
    id: 'korean-fried-chicken-fried-spicy',
    number: '41',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Fried / Spicy',
      pl: 'Kfc — koreański smażony kurczak — Smażony / Ostry',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
    tags: ['extraSpicy'],
  },
  {
    id: 'korean-fried-chicken-fried-sweet',
    number: '42',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Fried / Sweet',
      pl: 'Kfc — koreański smażony kurczak — Smażony / Słodki',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
  },
  {
    id: 'korean-fried-chicken-spicy-sweet',
    number: '43',
    categoryId: 'chucheon',
    name: {
      en: 'Kfc — Korean fried chicken — Spicy / Sweet',
      pl: 'Kfc — koreański smażony kurczak — Ostry / Słodki',
    },
    description: koreanFriedChickenDesc,
    price: 85,
    photo: '38',
    tags: ['extraSpicy'],
  },
  {
    id: 'samgyeobsal',
    number: '44',
    categoryId: 'bbq',
    name: {
      en: 'Samgyeobsal',
      pl: 'Samgyeobsal',
    },
    description: bbqServing,
    price: 65,
    photo: '44',
    portion: '200g',
    featured: true,
  },
  {
    id: 'dwaejimogsal',
    number: '45',
    categoryId: 'bbq',
    name: {
      en: 'Dwaejimogsal',
      pl: 'Dwaejimogsal',
    },
    description: bbqServing,
    price: 65,
    photo: '44',
    portion: '200g',
  },
  {
    id: 'jowls-skinless',
    number: '46',
    categoryId: 'bbq',
    name: {
      en: 'Jowls skinless',
      pl: 'Podgardle bez skóry',
    },
    description: bbqServing,
    price: 70,
    photo: '44',
    portion: '200g',
  },
  {
    id: 'dwaeji-galbi',
    number: '47',
    categoryId: 'bbq',
    name: {
      en: 'Dwaeji Galbi',
      pl: 'Dwaeji Galbi',
    },
    description: bbqServing,
    price: 75,
    photo: '44',
    portion: '200g',
  },
  {
    id: 'sliced-pork-belly',
    number: '48',
    categoryId: 'bbq',
    name: {
      en: 'Sliced Pork Belly',
      pl: 'Boczek w plastrach',
    },
    description: bbqServing,
    price: 70,
    photo: '44',
    portion: '200g',
  },
  {
    id: 'assorted-pork',
    number: '49',
    categoryId: 'bbq',
    name: {
      en: 'Assorted Pork',
      pl: 'Wieprzowina mieszana',
    },
    description: bbqServing,
    price: 300,
    photo: '44',
    portion: '1000g',
  },
  {
    id: 'bulgoggie-bbq',
    number: '50',
    categoryId: 'bbq',
    name: {
      en: 'Bulgoggie B.B.Q',
      pl: 'Bulgoggie B.B.Q',
    },
    description: bbqServing,
    price: 100,
    photo: '50',
    portion: '150g',
  },
  {
    id: 'brisket',
    number: '51',
    categoryId: 'bbq',
    name: {
      en: 'Brisket',
      pl: 'Mostek wołowy',
    },
    description: bbqServing,
    price: 100,
    photo: '50',
    portion: '150g',
  },
  {
    id: 'boneless-short-rib',
    number: '52',
    categoryId: 'bbq',
    name: {
      en: 'Boneless ShortRib',
      pl: 'Żeberka bez kości',
    },
    description: bbqServing,
    price: 100,
    photo: '50',
    portion: '150g',
  },
  {
    id: 'rib-eye',
    number: '53',
    categoryId: 'bbq',
    name: {
      en: 'Rib Eye',
      pl: 'Rib Eye',
    },
    description: bbqServing,
    price: 100,
    photo: '50',
    portion: '150g',
  },
  {
    id: 'la-style-galbi',
    number: '54',
    categoryId: 'bbq',
    name: {
      en: 'LA-style Galbi',
      pl: 'Galbi w stylu LA',
    },
    description: bbqServing,
    price: 120,
    photo: '50',
    portion: '180g',
    featured: true,
  },
  {
    id: 'assorted-beef',
    number: '55',
    categoryId: 'bbq',
    name: {
      en: 'Assorted Beef',
      pl: 'Wołowina mieszana',
    },
    description: bbqServing,
    price: 450,
    photo: '50',
    portion: '800g',
  },
  {
    id: 'buckwheat-soba',
    number: '56',
    categoryId: 'yeoreum',
    name: {
      en: 'Buckwheat Soba',
      pl: 'Soba gryczana',
    },
    description: {
      en: 'Buckwheat soba noodles, known for their nutty flavor and chewy texture, often served with dipping sauce or in broth.',
      pl: 'Makaron soba z gryki, znany z orzechowego smaku i sprężystej konsystencji, podawany z sosem do maczania lub w bulionie.',
    },
    price: 50,
    photo: '56',
  },
  {
    id: 'bibim-soba',
    number: '57',
    categoryId: 'yeoreum',
    name: {
      en: 'Bibim Soba',
      pl: 'Bibim Soba',
    },
    description: {
      en: 'Cold buckwheat noodles mixed with fresh vegetables and a spicy, tangy sauce.',
      pl: 'Zimny makaron gryczany wymieszany ze świeżymi warzywami i pikantnym, kwaśnym sosem.',
    },
    price: 50,
    photo: '57',
    tags: ['vegetarian'],
  },
  {
    id: 'kalguksu-seafood',
    number: '58',
    categoryId: 'yeoreum',
    name: {
      en: 'Kalguksu — Seafood',
      pl: 'Kalguksu — Owoce morza',
    },
    description: kalguksuSeafoodDesc,
    price: 60,
    photo: '58',
  },
  {
    id: 'kalguksu-kimchi',
    number: '59',
    categoryId: 'yeoreum',
    name: {
      en: 'Kalguksu — Kimchi',
      pl: 'Kalguksu — Kimchi',
    },
    description: kalguksuSeafoodDesc,
    price: 50,
    photo: '58',
    tags: ['vegetarian'],
  },
  {
    id: 'kimchi-jjigae',
    number: '60',
    categoryId: 'siksa',
    name: {
      en: 'Kimchi-jjigae',
      pl: 'Kimchi-jjigae',
    },
    description: {
      en: 'Spicy Korean stew with kimchi, pork and tofu.',
      pl: 'Pikantna zupa koreańska z kimchi, wieprzowiną i tofu.',
    },
    price: 60,
    photo: '60',
    featured: true,
  },
  {
    id: 'doenjang-jjigae-seafood',
    number: '61',
    categoryId: 'siksa',
    name: {
      en: 'Doenjang-jjigae — Seafood',
      pl: 'Doenjang-jjigae — Owoce morza',
    },
    description: doenjangJjigaeDesc,
    price: 63,
    photo: '61',
  },
  {
    id: 'doenjang-jjigae-brisket',
    number: '62',
    categoryId: 'siksa',
    name: {
      en: 'Doenjang-jjigae — Brisket',
      pl: 'Doenjang-jjigae — Mostek wołowy',
    },
    description: doenjangJjigaeDesc,
    price: 70,
    photo: '61',
  },
  {
    id: 'sundubu-jjigae-seafood',
    number: '63',
    categoryId: 'siksa',
    name: {
      en: 'Sundubu-Jjigae — Seafood',
      pl: 'Sundubu-Jjigae — Owoce morza',
    },
    description: sundubuJjigaeDesc,
    price: 63,
    photo: '63',
    tags: ['mildAvailable'],
  },
  {
    id: 'sundubu-jjigae-brisket',
    number: '64',
    categoryId: 'siksa',
    name: {
      en: 'Sundubu-Jjigae — Brisket',
      pl: 'Sundubu-Jjigae — Mostek wołowy',
    },
    description: sundubuJjigaeDesc,
    price: 70,
    photo: '63',
    tags: ['mildAvailable'],
  },
  {
    id: 'kkochge-odeng-tang',
    number: '65',
    categoryId: 'jeongol',
    name: {
      en: 'Kkochge odeng-tang',
      pl: 'Kkochge odeng-tang',
    },
    description: {
      en: 'Spicy Korean soup with crab, fish cakes and vegetables.',
      pl: 'Pikantna koreańska zupa z krabem, klopsikami rybnymi i warzywami.',
    },
    price: 140,
    photo: '65',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'budae-jeongol',
    number: '66',
    categoryId: 'jeongol',
    name: {
      en: 'Budae Jeongol',
      pl: 'Budae Jeongol',
    },
    description: {
      en: 'Spicy Korean hot pot with sausages, ham, kimchi, tofu and noodles.',
      pl: 'Pikantny koreański kociołek z kiełbaskami, szynką, kimchi, tofu i makaronem.',
    },
    price: 160,
    photo: '66',
    serves: '3-4',
    tags: ['sharing'],
    featured: true,
  },
  {
    id: 'kimchi-jeongol',
    number: '67',
    categoryId: 'jeongol',
    name: {
      en: 'Kimchi Jeongol',
      pl: 'Kimchi Jeongol',
    },
    description: {
      en: 'Spicy Korean stew made with aged kimchi, pork and tofu.',
      pl: 'Pikantna koreańska zupa z dojrzałym kimchi, wieprzowiną i tofu.',
    },
    price: 140,
    photo: '67',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'chadoldoenjang-jeongol',
    number: '68',
    categoryId: 'jeongol',
    name: {
      en: 'Chadoldoenjang jeongol',
      pl: 'Chadoldoenjang jeongol',
    },
    description: {
      en: 'Hot pot with beef brisket and doenjang (soybean paste) broth.',
      pl: 'Gorący garnek z wołowiną i aromatycznym sojowym bulionem.',
    },
    price: 160,
    photo: '68',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'jjamppong-tang',
    number: '69',
    categoryId: 'jeongol',
    name: {
      en: 'Jjamppong-tang',
      pl: 'Jjamppong-tang',
    },
    description: {
      en: 'Spicy Korean seafood soup with noodles and vegetables.',
      pl: 'Pikantna koreańska zupa z owocami morza, makaronem i warzywami.',
    },
    price: 165,
    photo: '69',
    serves: '3-4',
    tags: ['sharing', 'mildAvailable'],
  },
  {
    id: 'dumpling-tofu-jeongol',
    number: '70',
    categoryId: 'jeongol',
    name: {
      en: 'Dumpling tofu jeongol',
      pl: 'Dumpling tofu jeongol',
    },
    description: {
      en: 'Korean hot pot with dumplings, tofu, mushrooms, and vegetables.',
      pl: 'Koreański kociołek z pierożkami, tofu, grzybami i warzywami.',
    },
    price: 165,
    photo: '70',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'haemul-sundubu-jeongol',
    number: '71',
    categoryId: 'jeongol',
    name: {
      en: 'Haemul sundubu jeongol',
      pl: 'Haemul sundubu jeongol',
    },
    description: {
      en: 'Korean hot pot with seafood, silken tofu, vegetables, and a spicy broth.',
      pl: 'Koreański kociołek z owocami morza, delikatnym tofu i warzywami w pikantnym bulionie.',
    },
    price: 165,
    photo: '71',
    serves: '3-4',
    tags: ['sharing', 'mildAvailable'],
  },
  {
    id: 'ox-knee-jeongol',
    number: '72',
    categoryId: 'jeongol',
    name: {
      en: 'Ox Knee Jeongol',
      pl: 'Ox Knee Jeongol',
    },
    description: {
      en: 'Korean hot pot with ox knee, noodles, and vegetables in a clear, rich broth.',
      pl: 'Delikatny koreański kociołek z kolanem wołowym, makaronem i warzywami w klarownym bulionie.',
    },
    price: 180,
    photo: '72',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'haemul-tang',
    number: '73',
    categoryId: 'jeongol',
    name: {
      en: 'Haemul tang',
      pl: 'Haemul tang',
    },
    description: {
      en: 'A spicy dish of shrimp, crab, squid, mussels and other seafood, served with various vegetables.',
      pl: 'Pikantna potrawa z krewetek, krabów, kałamarnic, małży i innych owoców morza, podana z różnymi warzywami.',
    },
    price: 260,
    photo: '73',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'jokbal',
    number: '74',
    categoryId: 'anju',
    name: {
      en: 'Jokbal',
      pl: 'Jokbal',
    },
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
    number: '75',
    categoryId: 'anju',
    name: {
      en: 'Tofu Kimchi',
      pl: 'Tofu Kimchi',
    },
    description: {
      en: 'Warm tofu served with stir-fried kimchi and pork.',
      pl: 'Ciepłe tofu podawane z podsmażanym kimchi i wieprzowiną.',
    },
    price: 90,
    photo: '75',
  },
  {
    id: 'tang-suyuk-small-portion',
    number: '76',
    categoryId: 'anju',
    name: {
      en: 'Tang suyuk — Small portion',
      pl: 'Tang suyuk — Mała porcja',
    },
    description: tangSuyukSmallDesc,
    price: 85,
    photo: '76',
  },
  {
    id: 'tang-suyuk-large-portion',
    number: '77',
    categoryId: 'anju',
    name: {
      en: 'Tang suyuk — Large portion',
      pl: 'Tang suyuk — Duża porcja',
    },
    description: tangSuyukSmallDesc,
    price: 125,
    photo: '76',
  },
  {
    id: 'jokbal-naengchae',
    number: '78',
    categoryId: 'anju',
    name: {
      en: 'Jokbal-naengchae',
      pl: 'Jokbal-naengchae',
    },
    description: {
      en: 'Cold pork salad with vegetables and a tangy Korean mustard dressing.',
      pl: 'Sałatka z zimną wieprzowiną i warzywami w koreańskim stylu.',
    },
    price: 125,
    photo: '78',
  },
  {
    id: 'seasoned-whelk-salad',
    number: '79',
    categoryId: 'anju',
    name: {
      en: 'Seasoned Whelk Salad',
      pl: 'Sałatka z golbaengi',
    },
    description: {
      en: 'Thin noodles mixed with sea snails and vegetables in a spicy sauce.',
      pl: 'Koreański makaron z owocami morza (golbaengi), warzywami i pikantnym sosem.',
    },
    price: 185,
    photo: '79',
  },
  {
    id: 'haemuljjim',
    number: '80',
    categoryId: 'anju',
    name: {
      en: 'Haemuljjim',
      pl: 'Haemuljjim',
    },
    description: {
      en: 'Korean-style spicy braised seafood with vegetables.',
      pl: 'Koreańskie pikantne duszone owoce morza z warzywami.',
    },
    price: 260,
    photo: '80',
  },
  {
    id: 'wang-gyelanmal-i',
    number: '81',
    categoryId: 'anju',
    name: {
      en: 'Wang gyelanmal-i',
      pl: 'Wang gyelanmal-i',
    },
    description: {
      en: 'Korean rolled egg omelette.',
      pl: 'Delikatny i puszysty omlet, zwijany warstwowo, często z dodatkiem warzyw. Podawany pokrojony na porcje.',
    },
    price: 75,
    photo: '81',
  },
  {
    id: 'haemul-pajeon',
    number: '82',
    categoryId: 'anju',
    name: {
      en: 'Haemul Pajeon',
      pl: 'Haemul Pajeon',
    },
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
    number: '83',
    categoryId: 'anju',
    name: {
      en: 'Chicken-Kimchijeon',
      pl: 'Chicken-Kimchijeon',
    },
    description: {
      en: 'Korean savory pancake made with kimchi and chicken, crispy on the outside and tender on the inside.',
      pl: 'Koreański wytrawny naleśnik z kimchi i kurczakiem, chrupiący z zewnątrz i delikatny w środku.',
    },
    price: 60,
    photo: '83',
  },
  {
    id: 'mukeunji-samgyeopsal-jjim',
    number: '84',
    categoryId: 'rezerwacja',
    name: {
      en: 'Mukeunji samgyeopsal jjim',
      pl: 'Mukeunji samgyeopsal jjim',
    },
    description: {
      en: 'Braised pork belly with aged kimchi in a spicy sauce.',
      pl: 'Duszony boczek wieprzowy z dojrzałym kimchi w pikantnym sosie.',
    },
    price: 260,
    photo: '84',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'bossam-small-portion',
    number: '85',
    categoryId: 'rezerwacja',
    name: {
      en: 'Bossam — Small portion',
      pl: 'Bossam — Mała porcja',
    },
    description: bossamSmallDesc,
    price: 130,
    photo: '85',
  },
  {
    id: 'bossam-large-portion',
    number: '86',
    categoryId: 'rezerwacja',
    name: {
      en: 'Bossam — Large portion',
      pl: 'Bossam — Duża porcja',
    },
    description: bossamSmallDesc,
    price: 160,
    photo: '85',
  },
  {
    id: 'jjim-dalg',
    number: '87',
    categoryId: 'rezerwacja',
    name: {
      en: 'Jjim-dalg',
      pl: 'Jjim-dalg',
    },
    description: {
      en: 'A representative Korean chicken dish, with a sweet and salty yet light sauce made with a mild soy sauce seasoning, that permeates all the ingredients, including the chicken, and the meat is very tender because the chicken is cooked over a high heat for a long time.',
      pl: 'Typowe koreańskie danie z kurczaka, podawane w słodko-słonym, a jednocześnie lekkim sosie z dodatkiem łagodnego sosu sojowego, który przenika wszystkie składniki, łącznie z kurczakiem. Mięso jest bardzo delikatne, ponieważ kurczak jest długo gotowany na dużym ogniu.',
    },
    price: 180,
    photo: '87',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'yangjangpi',
    number: '88',
    categoryId: 'rezerwacja',
    name: {
      en: 'Yangjangpi',
      pl: 'Yangjangpi',
    },
    description: {
      en: 'Korean cold salad made with a variety of vegetables, seafood, and meat, served with a tangy dipping sauce.',
      pl: 'Koreańska zimna sałatka z różnych warzyw, owoców morza i mięsa, podawana z kwaśnym sosem.',
    },
    price: 300,
    photo: '88',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'ori-jumulleok',
    number: '89',
    categoryId: 'rezerwacja',
    name: {
      en: 'Olijuulleog',
      pl: 'Olijuulleog',
    },
    description: {
      en: 'Spicy Korean stir-fried duck dish, marinated and cooked with vegetables.',
      pl: 'Pikantna koreańska potrawa z kaczką smażoną z warzywami w marynacie.',
    },
    price: 370,
    photo: '89',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'gamja-tang',
    number: '90',
    categoryId: 'rezerwacja',
    name: {
      en: 'Gamja tang',
      pl: 'Gamja tang',
    },
    description: {
      en: 'Gamjatang is a thick, spicy Korean soup made with pork backbone, potatoes, ground perilla seeds, red peppers, green onions, and garlic. The soup is rich in ingredients and the burdock root adds a savory flavor that becomes even more pronounced as it simmers.',
      pl: 'Gamjatang to gęsta, pikantna koreańska zupa z kręgosłupa wieprzowego, ziemniaków, mielonych nasion pachnotki, czerwonej papryki, dymki i czosnku. Zupa jest bogata w składniki, a korzeń łopianu dodaje jej pikantnego smaku, który staje się jeszcze bardziej wyrazisty podczas gotowania.',
    },
    price: 180,
    photo: '90',
    serves: '3-4',
    tags: ['sharing'],
  },
  {
    id: 'handmade-pork-cutlet-set',
    number: '91',
    categoryId: 'dzieci',
    name: {
      en: 'Handmade Pork Cutlet Set Menu',
      pl: 'Domowy kotlet wieprzowy — zestaw',
    },
    description: setServing,
    price: 45,
    photo: '91',
  },
  {
    id: 'handmade-chicken-cutlet-set',
    number: '92',
    categoryId: 'dzieci',
    name: {
      en: 'Handmade Chicken Cutlet Set Menu',
      pl: 'Domowy kotlet z kurczaka — zestaw',
    },
    description: setServing,
    price: 45,
    photo: '92',
  },
  {
    id: 'iron-plate-corn-cheese',
    number: '93',
    categoryId: 'teukseon',
    name: {
      en: 'Iron Plate Corn Cheese',
      pl: 'Kukurydza z serem na płycie',
    },
    description: {
      en: 'A sizzling dish of sweet corn and butter mayonnaise, corn topped with cheese. A convenient dish with a sweet, salty, and creamy flavor.',
      pl: 'Skrzące danie ze słodkiej kukurydzy z majonezem maślanym, kukurydza posypana serem. Wygodne danie o słodko-słonym i kremowym smaku.',
    },
    price: 35,
    photo: '93',
  },
  {
    id: 'bulgogi-jap-chae',
    number: '94',
    categoryId: 'teukseon',
    name: {
      en: 'Bulgogi Jap-chae',
      pl: 'Bulgogi Jap-chae',
    },
    description: {
      en: 'Japchae is a traditional Korean dish made by stir-frying sweet potato noodles with various vegetables. It\'s seasoned with soy sauce, sesame oil, and sugar, imparting a subtle sweetness and savory flavor, and then served with traditional Korean bulgogi.',
      pl: 'Japchae to tradycyjne koreańskie danie przyrządzane z makaronu ze słodkich ziemniaków smażonego z różnymi warzywami. Doprawia się je sosem sojowym, olejem sezamowym i cukrem, nadając im subtelną słodycz i wytrawny smak, a następnie podaje z tradycyjnym koreańskim bulgogi.',
    },
    price: 75,
    photo: '94',
    featured: true,
  },
  {
    id: 'guo-bao-rou',
    number: '95',
    categoryId: 'teukseon',
    name: {
      en: 'Guo Bao Rou',
      pl: 'Guo Bao Rou',
    },
    description: {
      en: 'A Korean twist on a Chinese dish made by coating thinly sliced pork in starch batter, frying it until crispy, and then serving it with a sweet and sour sauce.',
      pl: 'Koreańska wersja chińskiego dania, przyrządzanego z cienkich plasterków wieprzowiny panierowanych w cieście skrobiowym, smażonych do uzyskania chrupkości, a następnie podawanych z sosem słodko-kwaśnym.',
    },
    price: 90,
    photo: '95',
  },
  {
    id: 'yurin-gi',
    number: '96',
    categoryId: 'teukseon',
    name: {
      en: 'Yurin-gi',
      pl: 'Yurin-gi',
    },
    description: {
      en: 'Yurin-gi is a Korean twist on the Chinese stir-fry dish. It features crispy fried chicken topped with fresh, crunchy vegetables (such as onion, ginger, paprika, etc.) and topped with a sweet and sour soy sauce.',
      pl: 'Yurin-gi to koreańska wersja chińskiego dania stir-fry. Składa się z chrupiącego smażonego kurczaka z dodatkiem świeżych, chrupiących warzyw (takich jak cebula, imbir, papryka itp.) i polanego słodko-kwaśnym sosem sojowym.',
    },
    price: 90,
    photo: '96',
  },
  {
    id: 'zicoba-chicken',
    number: '97',
    categoryId: 'teukseon',
    name: {
      en: 'Zicoba Chicken',
      pl: 'Zicoba Chicken',
    },
    description: {
      en: 'Roasted chicken is then simmered for a long time with a sweet and spicy sauce and tteokbokki rice cakes, creating a flavorful chicken dish.',
      pl: 'Pieczonego kurczaka gotuje się przez długi czas w słodko-pikantnym sosie z ryżowymi ciastkami tteokbokki, tworząc pełne smaku danie z kurczaka.',
    },
    price: 90,
    photo: '97',
  },
  {
    id: 'beef-bulgogi-hot-pot',
    number: '98',
    categoryId: 'teukseon',
    name: {
      en: 'Beef Bulgogi Hot Pot',
      pl: 'Bulgogi wołowe w garnku',
    },
    description: {
      en: 'Tender beef bulgogi simmered with vegetables in a savory broth, served in a hot stone pot.',
      pl: 'Delikatne wołowe bulgogi duszone z warzywami w aromatycznym bulionie, podawane w gorącym kamionkowym garnku.',
    },
    price: 70,
    photo: '98',
  },
]

const koreanDishes: Record<string, { name?: string; description?: string }> = korean.dishes

export const dishes: Dish[] = printed.map((dish) => {
  const ko = koreanDishes[dish.number]
  if (!ko) return dish
  return {
    ...dish,
    name: ko.name ? { ...dish.name, ko: ko.name } : dish.name,
    description:
      dish.description && ko.description
        ? { ...dish.description, ko: ko.description }
        : dish.description,
  }
})

export function dishAllergens(dish: Dish): Allergen[] {
  return allergensFor([Number(dish.number)])
}

export const dishesByCategory = (categoryId: string): Dish[] =>
  dishes.filter((dish) => dish.categoryId === categoryId)

export const featuredDishes = (): Dish[] => dishes.filter((dish) => dish.featured)

export const findDish = (id: string): Dish | undefined => dishes.find((dish) => dish.id === id)

export const dishPhotoAlt = (photo: string): LocalizedText =>
  dishes.find((dish) => dish.photo === photo)?.name ?? { en: 'DAON' }
