import * as planet from './planet.js';
import * as talisman from './talisman.js';

export const recipes = { [planet.code]: planet, [talisman.code]: talisman };

export function recipeByCode(code) {
  const c = String(code || '').toLowerCase();
  return recipes[c] || recipes[c + '1'] || null;
}
