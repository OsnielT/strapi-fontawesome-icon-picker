import * as React from 'react';
import { useIntl } from 'react-intl';

import { PLUGIN_ID } from '../pluginId';

// A translate helper scoped to the plugin's message namespace.
export const useTranslate = () => {
  const { formatMessage } = useIntl();
  return React.useCallback(
    (id, defaultMessage) => formatMessage({ id: `${PLUGIN_ID}.${id}`, defaultMessage }),
    [formatMessage]
  );
};
