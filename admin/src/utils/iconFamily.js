// Pure helpers for Font Awesome family/pack naming. No React, no side effects.

export const titleCase = (key) =>
  String(key)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// FA exposes pack variants as distinct families. Decompose a family into a base
// pack + variant so the picker can offer up to three dependent dropdowns
// (base -> variant -> weight). Duotone / Sharp Duotone are folded in as a
// "duotone" variant of Classic / Sharp.
//   classic        -> { base: "classic", variant: "standard" }
//   duotone        -> { base: "classic", variant: "duotone" }
//   sharp-duotone  -> { base: "sharp",   variant: "duotone" }
//   jelly-duo      -> { base: "jelly",   variant: "duo" }
//   slab-press-duo -> { base: "slab",    variant: "press-duo" }
const VARIANT_SUFFIXES = ['press-duo', 'press', 'duo', 'fill'];

export const splitFamily = (family) => {
  if (family === 'duotone') return { base: 'classic', variant: 'duotone' };
  if (family === 'sharp-duotone') return { base: 'sharp', variant: 'duotone' };
  for (const suffix of VARIANT_SUFFIXES) {
    if (family.endsWith(`-${suffix}`)) {
      return { base: family.slice(0, family.length - suffix.length - 1), variant: suffix };
    }
  }
  return { base: family, variant: 'standard' };
};
