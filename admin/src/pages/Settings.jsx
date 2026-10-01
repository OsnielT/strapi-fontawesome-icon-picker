import * as React from 'react';
import { useIntl } from 'react-intl';
import { useFetchClient, Page, Layouts } from '@strapi/strapi/admin';
import {
  Box,
  Flex,
  Typography,
  Button,
  SingleSelect,
  SingleSelectOption,
  MultiSelect,
  MultiSelectOption,
  Loader,
  Alert,
  Field,
} from '@strapi/design-system';

import { PLUGIN_ID } from '../pluginId';

const Settings = () => {
  const { formatMessage } = useIntl();
  const { get, put, post } = useFetchClient();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState(null); // {variant,title}
  const [kits, setKits] = React.useState([]);
  const [kitToken, setKitToken] = React.useState('');
  const [version, setVersion] = React.useState('7.x');
  const [styleOptions, setStyleOptions] = React.useState([]);
  const [enabledStyles, setEnabledStyles] = React.useState([]);
  const [hasToken, setHasToken] = React.useState(true);

  // Initial load: kits + saved settings.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: kitList }, { data: settings }, { data: status }] = await Promise.all([
          get(`/${PLUGIN_ID}/kits`),
          get(`/${PLUGIN_ID}/settings`),
          get(`/${PLUGIN_ID}/status`),
        ]);
        if (!active) return;
        setHasToken(Boolean(status && status.hasToken));
        setKits(Array.isArray(kitList) ? kitList : []);
        setKitToken(settings.kitToken || (kitList[0] && kitList[0].token) || '');
        setVersion(settings.version || (kitList[0] && kitList[0].version) || '7.x');
        setEnabledStyles(settings.enabledStyles || ['classic-solid']);
      } catch {
        if (active) setNotice({ variant: 'danger', title: 'Failed to load settings (check FONTAWESOME_API_TOKEN).' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [get]);

  // Load available family/styles whenever the version changes.
  React.useEffect(() => {
    if (!version) return undefined;
    let active = true;
    get(`/${PLUGIN_ID}/family-styles`, { params: { version } })
      .then(({ data }) => active && setStyleOptions(Array.isArray(data) ? data : []))
      .catch(() => active && setStyleOptions([]));
    return () => {
      active = false;
    };
  }, [version, get]);

  const onKitChange = (token) => {
    setKitToken(String(token));
    const kit = kits.find((k) => k.token === token);
    if (kit && kit.version) setVersion(kit.version);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      await put(`/${PLUGIN_ID}/settings`, { kitToken, version, enabledStyles });
      setNotice({ variant: 'success', title: 'Saved. Reopen the icon picker to see the enabled packages.' });
    } catch {
      setNotice({ variant: 'danger', title: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await post(`/${PLUGIN_ID}/clear-cache`, {});
      setNotice({ variant: 'success', title: `Cleared ${data?.cleared ?? 0} cached style(s). They refetch on next use.` });
    } catch {
      setNotice({ variant: 'danger', title: 'Failed to clear cache.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page.Main>
      <Layouts.Header
        title="Font Awesome"
        subtitle="Choose the kit and which packages the icon picker offers"
        primaryAction={
          <Button onClick={save} loading={saving} disabled={loading}>
            Save
          </Button>
        }
      />
      <Layouts.Content>
        {loading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading…</Loader>
          </Flex>
        ) : (
          <Flex direction="column" alignItems="stretch" gap={4}>
            {notice ? (
              <Alert closeLabel="Close" variant={notice.variant} onClose={() => setNotice(null)}>
                {notice.title}
              </Alert>
            ) : null}

            {!hasToken ? (
              <Alert closeLabel="Close" title="Using the free icon set" variant="default">
                No <code>FONTAWESOME_API_TOKEN</code> is configured, so the picker uses the free icons
                bundled with the plugin (Classic Solid, Classic Regular, Brands). Add a token to unlock
                your kits and Pro families.
              </Alert>
            ) : null}

            <Box background="neutral0" padding={6} hasRadius shadow="tableShadow">
              <Flex direction="column" alignItems="stretch" gap={5}>
                {hasToken ? (
                  <Field.Root name="kit" hint="Sets the Font Awesome version and which packages are available.">
                    <Field.Label>Kit</Field.Label>
                    <SingleSelect value={kitToken} onChange={onKitChange}>
                      {kits.map((k) => (
                        <SingleSelectOption key={k.token} value={k.token}>
                          {`${k.name} (${k.version}) — ${k.token}`}
                        </SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <Field.Hint />
                  </Field.Root>
                ) : null}

                <Field.Root
                  name="styles"
                  hint="Only these packages appear in the picker. Fewer = cleaner UI and less bandwidth."
                >
                  <Field.Label>Enabled packages</Field.Label>
                  <MultiSelect
                    value={enabledStyles}
                    onChange={(vals) => setEnabledStyles(Array.isArray(vals) ? vals : [])}
                    withTags
                    placeholder="Select packages…"
                  >
                    {styleOptions.map((o) => (
                      <MultiSelectOption key={o.id} value={o.id}>
                        {o.label}
                      </MultiSelectOption>
                    ))}
                  </MultiSelect>
                  <Field.Hint />
                </Field.Root>
              </Flex>
            </Box>

            <Box background="neutral0" padding={6} hasRadius shadow="tableShadow">
              <Flex justifyContent="space-between" alignItems="center" gap={4}>
                <Flex direction="column" alignItems="flex-start" gap={1}>
                  <Typography variant="delta">Cache</Typography>
                  <Typography variant="pi" textColor="neutral600">
                    Icon data is fetched from the Font Awesome API and cached in the database. Clear it
                    to force a refresh (e.g. after changing kit contents).
                  </Typography>
                </Flex>
                <Button variant="danger-light" onClick={clearCache} loading={saving}>
                  Clear cache
                </Button>
              </Flex>
            </Box>

            <Alert closeLabel="Close" title="How icons are sourced" variant="default">
              Icons come from the Font Awesome API (offline installs of the 1&nbsp;GB+ Pro packages are
              avoided). The API token is read from <code>FONTAWESOME_API_TOKEN</code> on the server and
              is never stored in the database or sent to the browser.
            </Alert>
          </Flex>
        )}
      </Layouts.Content>
    </Page.Main>
  );
};

export default Settings;
