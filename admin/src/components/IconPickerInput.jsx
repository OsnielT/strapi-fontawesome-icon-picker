import * as React from 'react';
import { Field, Popover } from '@strapi/design-system';

import { usePackageSelection } from '../hooks/usePackageSelection';
import { useIconCatalog } from '../hooks/useIconCatalog';
import { useResolvedIcon } from '../hooks/useResolvedIcon';
import { useScrollToSelected } from '../hooks/useScrollToSelected';
import { formatValue } from '../utils/iconValue';
import PickerTrigger from './icon-picker/PickerTrigger';
import PickerContent from './icon-picker/PickerContent';

/**
 * Custom-field input. Thin container: wires the field to the picker hooks and
 * composes the trigger + popover content. Logic lives in hooks, UI in
 * ./icon-picker/*, pure helpers in ../utils/*.
 */
const IconPickerInput = React.forwardRef((props, ref) => {
  const { attribute, name, onChange, value = '', disabled = false, required = false, labelAction, label, hint, error } =
    props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selection = usePackageSelection(open);
  const catalog = useIconCatalog(open, selection.pkg, query);
  const selectedIcon = useResolvedIcon(value);
  const scroll = useScrollToSelected(open, query, value, catalog.displayCategories);

  const outputFormat = attribute?.options?.output || 'class';
  const emit = (nextValue) => onChange({ target: { name, type: attribute.type, value: nextValue } });

  const onSelect = (icon) => {
    emit(formatValue(icon, outputFormat));
    setOpen(false);
    setQuery('');
  };

  return (
    <Field.Root name={name} id={name} error={error} hint={hint} required={required}>
      <Field.Label action={labelAction}>{label}</Field.Label>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <PickerTrigger ref={ref} value={value} selectedIcon={selectedIcon} disabled={disabled} />
        </Popover.Trigger>
        <Popover.Content sideOffset={4}>
          <PickerContent
            selection={selection}
            catalog={catalog}
            query={query}
            setQuery={setQuery}
            value={value}
            onSelect={onSelect}
            onRemove={() => emit('')}
            scroll={scroll}
          />
        </Popover.Content>
      </Popover.Root>

      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
});

export default IconPickerInput;
