import { Flex, Box, SingleSelect, SingleSelectOption } from '@strapi/design-system';

import { useTranslate } from '../../hooks/useTranslate';

const SelectBox = ({ label, value, options, onChange }) => (
  <Box flex="1">
    <SingleSelect size="S" label={label} value={value} onChange={(v) => onChange(String(v))}>
      {options.map((o) => (
        <SingleSelectOption key={o.value} value={o.value}>
          {o.label}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  </Box>
);

/**
 * The dependent Family -> Variant -> Weight selectors. Each dropdown is only
 * rendered when its axis has more than one option (so 1-3 show as needed).
 */
const PackageSelectors = ({ selection }) => {
  const t = useTranslate();
  const {
    packages,
    pkg,
    bases,
    variants,
    weights,
    selectedBase,
    selectedVariant,
    onBaseChange,
    onVariantChange,
    selectPkg,
  } = selection;

  if (packages.length <= 1) return null;

  return (
    <Flex gap={2} alignItems="flex-end">
      {bases.length > 1 ? (
        <SelectBox
          label={t('input.family', 'Family')}
          value={selectedBase}
          options={bases}
          onChange={onBaseChange}
        />
      ) : null}
      {variants.length > 1 ? (
        <SelectBox
          label={t('input.variant', 'Variant')}
          value={selectedVariant}
          options={variants}
          onChange={onVariantChange}
        />
      ) : null}
      {weights.length > 1 ? (
        <SelectBox
          label={t('input.weight', 'Weight')}
          value={pkg}
          options={weights.map((w) => ({ value: w.id, label: w.weightLabel }))}
          onChange={selectPkg}
        />
      ) : null}
    </Flex>
  );
};

export default PackageSelectors;
