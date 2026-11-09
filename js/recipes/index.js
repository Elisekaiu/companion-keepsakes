import * as planet from './planet.js';

export const recipes = { [planet.code]: planet };

export function recipeByCode(code) {
  const c = String(code || '').toLowerCase();
  return recipes[c] || recipes[c + '1'] || null;
}
