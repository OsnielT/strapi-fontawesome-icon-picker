import { Flex, Box } from '@strapi/design-system';

import { parseStored } from '../../utils/iconValue';
import FaSvg from './FaSvg';

const GRID_GAP = 4; // px

const IconCell = ({ icon, selected, onSelect }) => (
  <Box
    tag="button"
    type="button"
    padding={2}
    hasRadius
    title={`${icon.label} · ${icon.id}${icon.pro ? ' (Pro)' : ''}`}
    aria-label={icon.label}
    onClick={() => onSelect(icon)}
    background={selected ? 'primary100' : 'neutral0'}
    borderColor={selected ? 'primary600' : 'transparent'}
    cursor="pointer"
    style={{ lineHeight: 0 }}
    color={selected ? 'primary600' : 'neutral500'}
  >
    <FaSvg icon={icon} size={25} />
  </Box>
);

// Grid of selectable icons. Highlights by name so the picked icon shows as
// selected regardless of which style/format was stored.
const IconGrid = ({ icons, value, onSelect }) => {
  const selectedName = parseStored(value)?.name;
  return (
    <Flex wrap="wrap" gap={`${GRID_GAP}px`} alignItems="flex-start">
      {icons.map((icon) => (
        <IconCell
          key={icon.id}
          icon={icon}
          selected={icon.name === selectedName}
          onSelect={onSelect}
        />
      ))}
    </Flex>
  );
};

export default IconGrid;
