import * as React from 'react';
import { Button, Flex, Box, Typography } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';

import { useTranslate } from '../../hooks/useTranslate';
import { parseStored } from '../../utils/iconValue';
import FaSvg from './FaSvg';

/**
 * The field's trigger button: shows the current icon preview + label and a
 * trailing caret. forwardRef + prop spread let Popover.Trigger (asChild) wire
 * up its open/aria handlers onto the Button.
 */
const PickerTrigger = React.forwardRef(({ value, selectedIcon, disabled, ...triggerProps }, ref) => {
  const t = useTranslate();
  return (
    <Button
      ref={ref}
      variant="tertiary"
      disabled={disabled}
      fullWidth
      justifyContent="space-between"
      size="L"
      // endIcon is a real second flex child, so space-between pushes it right.
      endIcon={<CaretDown fill="neutral500" />}
      {...triggerProps}
    >
      <Flex gap={2} alignItems="center">
        {value ? (
          <Box tag="span" style={{ lineHeight: 0 }}>
            <FaSvg icon={selectedIcon} size={16} />
          </Box>
        ) : null}
        <Typography textColor={value ? 'neutral800' : 'neutral500'}>
          {value
            ? selectedIcon?.label || parseStored(value)?.name || t('input.selected', 'Icon selected')
            : t('input.placeholder', 'Select an icon')}
        </Typography>
      </Flex>
    </Button>
  );
});

export default PickerTrigger;
