// GAPS stage reference data. Paraphrased summary – see RESEARCH.md for sources.
// Stage 7 = Full GAPS.

export const STAGES = [
  { n: 1, name: 'Stage 1', short: 'S1', color: '#3DBE7A',
    summary: 'Gentle start: homemade stock, boiled meats & fish, soups with very soft vegetables, probiotic juices and soothing teas.',
    howToMove: 'Move on when stage 1 foods are well tolerated and stools are starting to settle. Some children need a day or two, others longer.',
    avoid: 'Everything not listed: eggs, raw or fibrous vegetables, fruit, nuts, roasted/fried meat, butter, ghee, olive oil, spices, and all the "never" foods.' },
  { n: 2, name: 'Stage 2', short: 'S2', color: '#4AB3D9',
    summary: 'Add raw egg yolks (then soft-boiled eggs), stews & casseroles with fresh herbs, fermented fish and homemade ghee. More probiotic food.',
    howToMove: 'Introduce one food at a time, starting tiny. Move on when these are tolerated with no return of digestive symptoms.',
    avoid: 'Scrambled/fried eggs, avocado, nuts, solid sauerkraut, roast meat, olive oil, raw vegetables, fruit, spices.' },
  { n: 3, name: 'Stage 3', short: 'S3', color: '#8E7CE0',
    summary: 'Add ripe avocado, nut-butter & squash pancakes, scrambled eggs, slow-cooked onion and the fermented vegetables themselves.',
    howToMove: 'Build fermented vegetables up slowly (a teaspoon at first). Move on once all are tolerated.',
    avoid: 'Roast/grilled meat, olive oil, fresh juices, nut-flour bread, raw vegetables, fruit.' },
  { n: 4, name: 'Stage 4', short: 'S4', color: '#F2A65A',
    summary: 'Add roasted & grilled meats, cold-pressed olive oil, freshly pressed juices (carrot first) and nut-flour bread.',
    howToMove: 'Start juice with a few spoonfuls, olive oil with a few drops, bread with a small piece. Move on when tolerated.',
    avoid: 'Barbecued/fried meat, raw vegetables, fruit, sweet baking.' },
  { n: 5, name: 'Stage 5', short: 'S5', color: '#E86F8E',
    summary: 'Add cooked apple purée, raw vegetables (soft lettuce & peeled cucumber first) and fruit in juices.',
    howToMove: 'Watch stools closely as raw vegetables come in. Move on when they are handled well.',
    avoid: 'Citrus fruit, raw fruit on its own, sweet baking.' },
  { n: 6, name: 'Stage 6', short: 'S6', color: '#C9A227',
    summary: 'Add peeled raw apple, then other raw fruit, more honey and sweet baking with allowed ingredients.',
    howToMove: 'When everything is tolerated and stools are more or less normal, move to Full GAPS.',
    avoid: 'All the "never" foods (grains, sugar, starchy veg, processed food).' },
  { n: 7, name: 'Full GAPS', short: 'Full', color: '#2E8B57',
    summary: 'Meat, fish, eggs, stock, fermented foods and lots of vegetables with natural fats. Fruit, nuts and baking as snacks in moderation.',
    howToMove: 'Usually followed for 1.5–2 years. Starchy foods are reintroduced only later, slowly, with a practitioner.',
    avoid: 'Grains, sugar & syrups, potatoes, sweet potatoes, parsnips, yams, starch powders, soy, fresh milk, processed/tinned food.' },
];

export const CATEGORIES = ['Stock & soup', 'Meat & fish', 'Vegetables', 'Probiotics', 'Fats', 'Eggs', 'Drinks', 'Nuts & baking', 'Fruit', 'Other'];

// f(id, name, stage, category, aliases, tip)
const f = (id, name, stage, cat, aliases = [], tip = '') => ({ id, name, stage, cat, aliases, tip });

export const FOODS = [
  // ---- Stage 1
  f('meat-stock', 'Meat stock', 1, 'Stock & soup', ['meat stock', 'chicken stock', 'beef stock', 'lamb stock', 'stock', 'bone broth', 'broth'], 'Homemade, from bones & joints. Keep the fat in.'),
  f('fish-stock', 'Fish stock', 1, 'Stock & soup', ['fish stock'], 'Homemade from whole fish / heads & bones.'),
  f('soup', 'Homemade soup', 1, 'Stock & soup', ['soup', 'chicken soup', 'vegetable soup'], 'Stock + very soft, non-fibrous veg.'),
  f('boiled-chicken', 'Boiled chicken', 1, 'Meat & fish', ['boiled chicken', 'chicken', 'poached chicken'], ''),
  f('boiled-beef', 'Boiled beef', 1, 'Meat & fish', ['boiled beef', 'beef'], ''),
  f('boiled-lamb', 'Boiled lamb', 1, 'Meat & fish', ['boiled lamb', 'lamb'], ''),
  f('boiled-turkey', 'Boiled turkey', 1, 'Meat & fish', ['turkey'], ''),
  f('boiled-fish', 'Boiled / poached fish', 1, 'Meat & fish', ['boiled fish', 'poached fish', 'fish', 'salmon', 'cod', 'haddock', 'white fish'], ''),
  f('soft-tissue', 'Soft tissue off the bone', 1, 'Meat & fish', ['soft tissue', 'cartilage', 'gelatinous', 'skin off the bone'], 'The gelatinous bits are prized.'),
  f('bone-marrow', 'Bone marrow', 1, 'Meat & fish', ['bone marrow', 'marrow bone'], ''),
  f('liver', 'Boiled liver / organ meat', 1, 'Meat & fish', ['liver', 'organ meat', 'heart', 'kidney'], ''),
  f('carrot-cooked', 'Carrot (well cooked)', 1, 'Vegetables', ['carrot', 'carrots', 'cooked carrot'], ''),
  f('courgette', 'Courgette (peeled, cooked)', 1, 'Vegetables', ['courgette', 'courgettes', 'zucchini'], ''),
  f('squash', 'Squash / pumpkin (peeled, seeded)', 1, 'Vegetables', ['squash', 'butternut', 'pumpkin', 'marrow'], ''),
  f('onion-cooked', 'Onion (cooked in soup)', 1, 'Vegetables', ['onion', 'onions'], ''),
  f('leek', 'Leek (cooked)', 1, 'Vegetables', ['leek', 'leeks'], ''),
  f('cauliflower', 'Cauliflower florets (cooked)', 1, 'Vegetables', ['cauliflower'], 'Stalks removed.'),
  f('broccoli', 'Broccoli florets (cooked)', 1, 'Vegetables', ['broccoli'], 'Stalks removed.'),
  f('garlic', 'Garlic (cooked into soup)', 1, 'Vegetables', ['garlic'], ''),
  f('animal-fat', 'Animal fat (from stock/meat)', 1, 'Fats', ['animal fat', 'chicken fat', 'duck fat', 'goose fat', 'tallow', 'lard', 'schmaltz', 'fat'], ''),
  f('coconut-oil', 'Coconut oil', 1, 'Fats', ['coconut oil'], 'Listed at stage 1 in some guides.'),
  f('sauerkraut-juice', 'Sauerkraut juice', 1, 'Probiotics', ['sauerkraut juice', 'kraut juice'], 'Start with 1–2 tsp a day.'),
  f('ferm-veg-juice', 'Fermented vegetable juice', 1, 'Probiotics', ['fermented vegetable juice', 'ferment juice', 'brine', 'veg medley juice', 'vegetable medley'], 'Start with 1–2 tsp a day.'),
  f('whey', 'Whey (from homemade yoghurt)', 1, 'Probiotics', ['whey'], 'Only if dairy tolerated.'),
  f('yoghurt', 'Homemade yoghurt', 1, 'Probiotics', ['yoghurt', 'yogurt', 'homemade yoghurt', 'homemade yogurt'], 'Only if dairy tolerated – start 1–2 tsp.'),
  f('kefir', 'Homemade kefir', 1, 'Probiotics', ['kefir'], 'Only if dairy tolerated – start 1–2 tsp.'),
  f('ginger-tea', 'Ginger tea', 1, 'Drinks', ['ginger tea', 'ginger'], ''),
  f('chamomile-tea', 'Chamomile tea', 1, 'Drinks', ['chamomile', 'camomile'], ''),
  f('mint-tea', 'Mint tea', 1, 'Drinks', ['mint tea', 'peppermint tea'], ''),
  f('water', 'Warm filtered water', 1, 'Drinks', ['water'], ''),
  f('honey-tea', 'Honey (a little, in tea)', 1, 'Other', ['honey'], 'Small amounts.'),
  f('salt', 'Sea salt / peppercorns', 1, 'Other', ['salt', 'sea salt', 'peppercorn', 'peppercorns', 'pepper'], ''),
  // ---- Stage 2
  f('egg-yolk', 'Raw egg yolk (in soup)', 2, 'Eggs', ['egg yolk', 'yolk', 'yolks', 'raw yolk'], 'Start with 1 a day.'),
  f('soft-egg', 'Soft-boiled egg', 2, 'Eggs', ['soft boiled egg', 'soft-boiled egg', 'boiled egg', 'egg', 'eggs'], 'After yolks are tolerated.'),
  f('stew', 'Stew / casserole (fresh herbs)', 2, 'Meat & fish', ['stew', 'casserole'], 'No spices yet.'),
  f('ferm-fish', 'Fermented fish', 2, 'Meat & fish', ['fermented fish', 'gravlax'], 'One piece a day to start.'),
  f('ghee', 'Homemade ghee', 2, 'Fats', ['ghee'], 'Start with 1 tsp a day.'),
  f('fresh-herbs', 'Fresh herbs', 2, 'Other', ['herbs', 'parsley', 'dill', 'thyme', 'basil', 'coriander'], ''),
  f('cod-liver-oil', 'Cod liver oil', 2, 'Fats', ['cod liver oil'], 'Check dose with practitioner.'),
  // ---- Stage 3
  f('avocado', 'Ripe avocado', 3, 'Vegetables', ['avocado', 'avo'], 'Start 1–3 tsp mashed into soup.'),
  f('pancakes', 'Nut-butter & squash pancakes', 3, 'Nuts & baking', ['pancake', 'pancakes'], 'One small pancake a day to start.'),
  f('nut-butter', 'Nut butter', 3, 'Nuts & baking', ['nut butter', 'almond butter', 'peanut butter', 'cashew butter'], ''),
  f('scrambled-egg', 'Scrambled / gently fried egg', 3, 'Eggs', ['scrambled egg', 'scrambled eggs', 'fried egg', 'fried eggs', 'omelette', 'omelet'], 'Plenty of fat.'),
  f('onion-fat', 'Onion slow-cooked in fat', 3, 'Vegetables', ['slow cooked onion', 'caramelised onion', 'fried onion'], ''),
  f('sauerkraut', 'Sauerkraut / fermented veg (solid)', 3, 'Probiotics', ['sauerkraut', 'fermented vegetables', 'fermented veg', 'kraut', 'kimchi'], 'Build up from a teaspoon.'),
  f('cabbage-cooked', 'Cabbage (well cooked)', 3, 'Vegetables', ['cabbage', 'celeriac', 'asparagus', 'kale', 'celery'], 'Fibrous veg – later stage.'),
  // ---- Stage 4
  f('roast-meat', 'Roast / grilled meat', 4, 'Meat & fish', ['roast', 'roasted', 'roast chicken', 'roast beef', 'grilled', 'grill', 'baked chicken'], 'No burnt bits.'),
  f('olive-oil', 'Cold-pressed olive oil', 4, 'Fats', ['olive oil', 'extra virgin'], 'Start with a few drops.'),
  f('carrot-juice', 'Fresh carrot juice', 4, 'Drinks', ['carrot juice', 'fresh juice', 'pressed juice', 'juice', 'celery juice'], 'Few spoonfuls, empty stomach.'),
  f('nut-bread', 'Nut / seed flour bread', 4, 'Nuts & baking', ['almond bread', 'nut bread', 'gaps bread', 'almond flour', 'nut flour', 'muffin'], 'Small piece to start.'),
  // ---- Stage 5
  f('apple-puree', 'Cooked apple purée', 5, 'Fruit', ['apple puree', 'apple purée', 'stewed apple', 'cooked apple', 'apple sauce', 'applesauce'], 'A few spoonfuls first.'),
  f('lettuce', 'Lettuce (soft parts)', 5, 'Vegetables', ['lettuce'], ''),
  f('cucumber', 'Cucumber (peeled)', 5, 'Vegetables', ['cucumber'], ''),
  f('raw-veg', 'Other raw vegetables', 5, 'Vegetables', ['raw carrot', 'raw veg', 'raw vegetables', 'salad', 'tomato', 'tomatoes', 'raw onion', 'pepper strips', 'crudites'], ''),
  f('fruit-juice', 'Juice with apple / pineapple / mango', 5, 'Drinks', ['apple juice', 'pineapple juice', 'mango juice'], 'No citrus yet.'),
  // ---- Stage 6
  f('raw-apple', 'Peeled raw apple', 6, 'Fruit', ['apple', 'apples', 'raw apple'], ''),
  f('raw-fruit', 'Other raw fruit', 6, 'Fruit', ['fruit', 'banana', 'berries', 'strawberries', 'blueberries', 'raspberries', 'pear', 'peach', 'mango', 'pineapple', 'grapes', 'melon', 'kiwi'], 'As snacks between meals.'),
  f('more-honey', 'Honey (more freely)', 6, 'Other', ['more honey'], ''),
  f('sweet-baking', 'GAPS cakes / sweet baking', 6, 'Nuts & baking', ['cake', 'cakes', 'biscuit', 'cookie', 'cookies', 'brownie', 'flapjack'], 'Sweetened with dried fruit/honey.'),
  f('dried-fruit', 'Dried fruit', 6, 'Fruit', ['dried fruit', 'raisins', 'dates', 'sultanas', 'apricots'], ''),
  // ---- Full GAPS
  f('butter', 'Butter', 7, 'Fats', ['butter'], 'Introduce dairy carefully.'),
  f('cheese', 'Natural hard cheese', 7, 'Other', ['cheese', 'cheddar', 'parmesan'], ''),
  f('nuts', 'Nuts & seeds (soaked)', 7, 'Nuts & baking', ['nuts', 'almonds', 'walnuts', 'cashews', 'seeds', 'sunflower seeds', 'pumpkin seeds'], ''),
  f('citrus', 'Citrus fruit', 7, 'Fruit', ['orange', 'oranges', 'satsuma', 'clementine', 'grapefruit', 'lemon', 'lime', 'orange juice'], ''),
  f('white-beans', 'White (navy) beans, soaked', 7, 'Other', ['navy beans', 'white beans', 'haricot', 'lentils', 'split peas'], 'Properly soaked & cooked.'),
  f('bbq-fried', 'Barbecued / fried meat', 7, 'Meat & fish', ['bbq', 'barbecue', 'barbecued', 'fried chicken', 'fried meat', 'pan fried', 'sausage', 'sausages', 'bacon'], 'Pure-meat sausages only.'),
  f('spices', 'Spices', 7, 'Other', ['spice', 'spices', 'paprika', 'cumin', 'curry', 'chilli', 'cinnamon'], ''),
  f('coconut', 'Coconut (flesh / milk / flour)', 7, 'Nuts & baking', ['coconut', 'coconut milk', 'coconut flour'], ''),
  f('cider-vinegar', 'Apple cider vinegar', 7, 'Other', ['cider vinegar', 'vinegar'], ''),
];

// Not allowed at any GAPS stage.
export const NEVER = [
  { label: 'Grains', words: ['bread', 'toast', 'pasta', 'spaghetti', 'noodles', 'rice', 'oats', 'porridge', 'oatmeal', 'cereal', 'wheat', 'flour', 'corn', 'maize', 'popcorn', 'barley', 'rye', 'cracker', 'crackers', 'pizza', 'sandwich', 'wrap', 'tortilla', 'couscous', 'bagel', 'croissant', 'pastry', 'biscuits', 'weetabix', 'cheerios'] },
  { label: 'Grain-like seeds', words: ['quinoa', 'buckwheat', 'millet', 'amaranth'] },
  { label: 'Sugar & sweeteners', words: ['sugar', 'sweets', 'candy', 'chocolate', 'syrup', 'maple', 'agave', 'jam', 'ice cream', 'sweetener', 'haribo', 'lolly', 'lollipop', 'fizzy', 'cola', 'squash drink', 'cordial'] },
  { label: 'Starchy vegetables', words: ['potato', 'potatoes', 'chips', 'fries', 'crisps', 'mash', 'sweet potato', 'yam', 'yams', 'parsnip', 'parsnips', 'chickpeas', 'hummus', 'baked beans'] },
  { label: 'Starch powders', words: ['tapioca', 'arrowroot', 'cornflour', 'cornstarch', 'starch'] },
  { label: 'Soy', words: ['soy', 'soya', 'tofu', 'edamame'] },
  { label: 'Fresh / pasteurised milk', words: ['milk', 'formula'] },
  { label: 'Processed food', words: ['stock cube', 'bouillon', 'gravy granules', 'nuggets', 'ready meal', 'tinned', 'canned', 'processed', 'ketchup', 'takeaway', 'mcdonalds'] },
];

// allowed words that would otherwise be caught by the NEVER list
const NEVER_EXCEPTIONS = ['coconut milk', 'squash', 'almond flour', 'nut flour', 'coconut flour', 'butternut'];

export const stageName = (n) => (STAGES.find((s) => s.n === n) || STAGES[0]).name;
export const foodById = (id) => FOODS.find((x) => x.id === id);
export const allowedFoods = (stage) => FOODS.filter((x) => x.stage <= stage);

const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9éè\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

function findSpans(text, phrase) {
  const out = [];
  const p = norm(phrase).trim();
  if (!p) return out;
  let i = text.indexOf(' ' + p + ' ');
  while (i !== -1) {
    out.push([i + 1, i + 1 + p.length]);
    i = text.indexOf(' ' + p + ' ', i + 1);
  }
  // simple plural
  let j = text.indexOf(' ' + p + 's ');
  while (j !== -1) { out.push([j + 1, j + 2 + p.length]); j = text.indexOf(' ' + p + 's ', j + 1); }
  return out;
}

/** Match a free-text description to foods. Returns {matches:[food], never:[label], unknown:boolean} */
export function matchText(raw) {
  const text = norm(raw);
  if (!text.trim()) return { matches: [], never: [], unknown: false };
  const cands = [];
  for (const food of FOODS) {
    for (const a of [food.name, ...food.aliases]) {
      for (const sp of findSpans(text, a)) cands.push({ food, sp, len: sp[1] - sp[0] });
    }
  }
  const exceptSpans = NEVER_EXCEPTIONS.flatMap((e) => findSpans(text, e));
  for (const grp of NEVER) {
    for (const w of grp.words) {
      for (const sp of findSpans(text, w)) {
        if (exceptSpans.some((e) => e[0] <= sp[0] && e[1] >= sp[1])) continue;
        cands.push({ never: grp.label, sp, len: sp[1] - sp[0] });
      }
    }
  }
  // keep longest non-overlapping
  cands.sort((a, b) => b.len - a.len);
  const kept = [];
  for (const c of cands) {
    if (kept.some((k) => !(c.sp[1] <= k.sp[0] || c.sp[0] >= k.sp[1]))) continue;
    kept.push(c);
  }
  const matches = [...new Map(kept.filter((k) => k.food).map((k) => [k.food.id, k.food])).values()];
  const never = [...new Set(kept.filter((k) => k.never).map((k) => k.never))];
  return { matches, never, unknown: matches.length === 0 && never.length === 0 };
}

/**
 * Check a list of foods ({id?, name}) + free text against a stage.
 * Returns array of warnings {level:'stop'|'later'|'unknown', food, msg}
 */
export function checkFoods(foods, freeText, stage) {
  const warnings = [];
  for (const it of foods || []) {
    const food = it.id ? foodById(it.id) : null;
    if (food && food.stage > stage) {
      warnings.push({ level: 'later', food: food.name, msg: `${food.name} is a ${stageName(food.stage)} food – not yet at ${stageName(stage)}.` });
    }
  }
  if (freeText && freeText.trim()) {
    for (const part of freeText.split(/[,;+\n]|\band\b|\bwith\b/i)) {
      if (!part.trim()) continue;
      const r = matchText(part);
      r.never.forEach((label) => warnings.push({ level: 'stop', food: part.trim(), msg: `“${part.trim()}” looks like ${label.toLowerCase()} – not part of GAPS at any stage.` }));
      r.matches.filter((m) => m.stage > stage).forEach((m) => warnings.push({ level: 'later', food: part.trim(), msg: `“${part.trim()}” looks like ${m.name} (${stageName(m.stage)}) – not yet at ${stageName(stage)}.` }));
      if (r.unknown) warnings.push({ level: 'unknown', food: part.trim(), msg: `“${part.trim()}” isn’t on the stage list – double-check it’s GAPS-legal.` });
    }
  }
  // de-dupe
  const seen = new Set();
  return warnings.filter((w) => (seen.has(w.msg) ? false : (seen.add(w.msg), true)));
}
