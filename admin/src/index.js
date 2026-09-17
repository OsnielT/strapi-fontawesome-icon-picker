import { PLUGIN_ID } from './pluginId';
import PluginIcon from './components/PluginIcon';

export default {
  register(app) {
    // The custom field. Stored value is a string (e.g. "fa-solid fa-user").
    app.customFields.register({
      name: 'icon',
      pluginId: PLUGIN_ID,
      type: 'string',
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.field.label`,
        defaultMessage: 'Font Awesome icon',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.field.description`,
        defaultMessage: 'Pick a Font Awesome icon',
      },
      components: {
        Input: async () =>
          import('./components/IconPickerInput').then((m) => ({ default: m.default })),
      },
      options: {
        base: [
          {
            sectionTitle: null,
            items: [
              {
                // Stored on the attribute as `options.output`; read in the Input.
                name: 'options.output',
                type: 'select',
                defaultValue: 'class',
                intlLabel: {
                  id: `${PLUGIN_ID}.options.output.label`,
                  defaultMessage: 'Stored value format',
                },
                description: {
                  id: `${PLUGIN_ID}.options.output.description`,
                  defaultMessage: 'What this field saves when an icon is picked.',
                },
                options: [
                  {
                    key: 'name',
                    value: 'name',
                    metadatas: {
                      intlLabel: {
                        id: `${PLUGIN_ID}.options.output.name`,
                        defaultMessage: 'Name only — e.g. "user"',
                      },
                    },
                  },
                  {
                    key: 'class',
                    value: 'class',
                    metadatas: {
                      intlLabel: {
                        id: `${PLUGIN_ID}.options.output.class`,
                        defaultMessage: 'Name + type — e.g. "fa-solid fa-user"',
                      },
                    },
                  },
                  {
                    key: 'object',
                    value: 'object',
                    metadatas: {
                      intlLabel: {
                        id: `${PLUGIN_ID}.options.output.object`,
                        defaultMessage: 'Full detail object (JSON string)',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: `${PLUGIN_ID}.options.required`,
                  defaultMessage: 'Required field',
                },
              },
            ],
          },
        ],
      },
    });

    // A dedicated settings section. This page is READ-ONLY status only — it does
    // not accept or display the secret API token (that lives in an env var).
    app.createSettingSection(
      {
        id: PLUGIN_ID,
        intlLabel: { id: `${PLUGIN_ID}.settings.section`, defaultMessage: 'Font Awesome' },
      },
      [
        {
          intlLabel: { id: `${PLUGIN_ID}.settings.link`, defaultMessage: 'Configuration' },
          id: `${PLUGIN_ID}-settings`,
          to: `${PLUGIN_ID}`,
          Component: async () =>
            import('./pages/Settings').then((m) => ({ default: m.default })),
        },
      ]
    );
  },

  async registerTrads({ locales }) {
    return Promise.all(
      (locales || []).map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
