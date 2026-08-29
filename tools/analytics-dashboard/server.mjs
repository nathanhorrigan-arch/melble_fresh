import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));

async function loadEnvironment() {
  try {
    const text = await readFile(join(folder, ".env"), "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadEnvironment();

const json = (response, status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
};

const isoDaysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

async function fetchAllUsers() {
  const baseUrl = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !secret) {
    throw new Error("Supabase credentials have not been configured yet.");
  }

  const users = [];
  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(
      `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`,
      { headers: { apikey: secret, Authorization: `Bearer ${secret}` } }
    );
    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}.`);
    }
    const payload = await response.json();
    const pageUsers = payload.users ?? [];
    users.push(...pageUsers);
    if (pageUsers.length < 1000) break;
  }
  return users;
}

async function registrationSummary() {
  const users = await fetchAllUsers();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const createdAfter = (user, boundary) =>
    new Date(user.created_at).getTime() >= boundary;

  return {
    total: users.length,
    confirmed: users.filter((user) => user.confirmed_at).length,
    last7Days: users.filter((user) => createdAfter(user, sevenDaysAgo)).length,
    last30Days: users.filter((user) => createdAfter(user, thirtyDaysAgo)).length,
  };
}

async function cloudflarePeriod(days) {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const hostname = process.env.MELBURB_HOSTNAME || "www.melburb.com";
  if (!token || !accountId) {
    throw new Error("Cloudflare analytics credentials have not been configured yet.");
  }

  const query = `query Traffic($accountTag: string, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        traffic: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) {
          count
          sum { visits }
        }
      }
    }
  }`;
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        filter: {
          datetime_geq: isoDaysAgo(days),
          datetime_lt: new Date().toISOString(),
          requestHost: hostname,
        },
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Cloudflare returned ${response.status}.`);
  }
  const row = payload.data?.viewer?.accounts?.[0]?.traffic?.[0];
  return { visits: row?.sum?.visits ?? 0, requests: row?.count ?? 0 };
}

async function dashboardData() {
  const [registrations, traffic7, traffic30] = await Promise.allSettled([
    registrationSummary(),
    cloudflarePeriod(7),
    cloudflarePeriod(30),
  ]);
  const valueOrError = (result) =>
    result.status === "fulfilled"
      ? { data: result.value }
      : { error: result.reason.message };

  return {
    updatedAt: new Date().toISOString(),
    registrations: valueOrError(registrations),
    traffic7: valueOrError(traffic7),
    traffic30: valueOrError(traffic30),
  };
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/api/dashboard") {
      return json(response, 200, await dashboardData());
    }
    if (request.url === "/" || request.url === "/index.html") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(await readFile(join(folder, "index.html"), "utf8"));
      return;
    }
    json(response, 404, { error: "Not found" });
  } catch (error) {
    json(response, 500, { error: error.message });
  }
});

const port = Number(process.env.PORT || 4174);
server.listen(port, "127.0.0.1", () => {
  console.log(`MelBurb dashboard: http://127.0.0.1:${port}`);
});
