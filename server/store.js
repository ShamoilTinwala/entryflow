// Compare-and-swap makes the command, audit record and retry receipt one database write.
export async function transact(load, save, work) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await load();
    const outcome = work(row.data);
    if (!outcome.changed) return { ...outcome, revision: row.revision };
    if (await save(row.revision, outcome.data)) return { ...outcome, revision: row.revision + 1 };
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));
  }
  throw new Error("The gates are busy. Refresh and try again.");
}

let cached;

export function database(base, key) {
  const url = base + "/rest/v1/entryflow_store?id=eq.1";
  const headers = {apikey: key, "Content-Type":"application/json"};
  if (!key.startsWith("sb_secret_")) headers.Authorization = "Bearer " + key;
  async function query(endpoint, options) {
    const res = await fetch(endpoint, {headers, ...options});
    if (!res.ok) throw new Error("Shared database unavailable. Check the server configuration.");
    return res.json();
  }
  return {
    async load() {
      if (cached?.base === base) {
        const [version] = await query(url + "&select=revision", {});
        if (version?.revision === cached.row.revision) return cached.row;
      }
      const [row] = await query(url + "&select=revision,data", {});
      if (!row) throw new Error("Apply the hosted store migration.");
      cached = {base,row};
      return row;
    },
    async save(revision, data) {
      const rows = await query(url + "&select=revision&revision=eq." + revision, {
        method: "PATCH", headers: {...headers, Prefer: "return=representation"},
        body: JSON.stringify({revision: revision + 1, data}),
      });
      if (rows.length === 1) cached = {base,row:{revision:revision + 1,data}};
      return rows.length === 1;
    },
  };
}
