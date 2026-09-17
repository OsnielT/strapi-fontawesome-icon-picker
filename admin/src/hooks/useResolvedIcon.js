import * as React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLUGIN_ID } from '../pluginId';
import { parseStored } from '../utils/iconValue';

/**
 * Resolves the currently-stored value (any output format) to icon data for the
 * trigger preview — by class id when present, otherwise by bare name.
 */
export const useResolvedIcon = (value) => {
  const { get } = useFetchClient();
  const [icon, setIcon] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    const parsed = parseStored(value);
    if (!parsed) {
      setIcon(null);
      return undefined;
    }
    get(`/${PLUGIN_ID}/resolve`, { params: { id: parsed.id || parsed.name } })
      .then(({ data }) => active && setIcon(data || null))
      .catch(() => active && setIcon(null));
    return () => {
      active = false;
    };
  }, [value, get]);

  return icon;
};
