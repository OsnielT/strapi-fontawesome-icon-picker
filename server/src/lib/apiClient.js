'use strict';

/**
 * Font Awesome GraphQL client. Exchanges the long-lived API token for a
 * short-lived access token (reused for its ~1h life) and runs queries. The API
 * token never leaves the server. `getConfig` yields { apiToken, apiUrl }.
 */
const createApiClient = ({ getConfig }) => {
  let accessToken = null;
  let accessTokenExpiry = 0;
  let tokenPromise = null;

  const getAccessToken = async () => {
    const { apiToken, apiUrl } = getConfig();
    if (!apiToken) throw new Error('FONTAWESOME_API_TOKEN is not configured.');
    if (accessToken && Date.now() < accessTokenExpiry - 60_000) return accessToken;
    if (tokenPromise) return tokenPromise;

    tokenPromise = (async () => {
      try {
        const res = await fetch(`${apiUrl}/token`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (!res.ok) throw new Error(`Font Awesome token exchange failed (${res.status}).`);
        const data = await res.json();
        accessToken = data.access_token;
        accessTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
        return accessToken;
      } finally {
        tokenPromise = null;
      }
    })();
    return tokenPromise;
  };

  const gql = async (query, variables) => {
    const { apiUrl } = getConfig();
    const token = await getAccessToken();
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Font Awesome API request failed (${res.status}).`);
    const json = await res.json();
    if (json.errors) {
      throw new Error(`Font Awesome API error: ${JSON.stringify(json.errors).slice(0, 300)}`);
    }
    return json.data;
  };

  return { gql };
};

module.exports = { createApiClient };
