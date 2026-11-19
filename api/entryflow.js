import { createHmac } from "node:crypto";
import { database, transact } from "../server/store.js";
import { operation, RequestError, secret } from "../server/service.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control","private, no-store");
  try {
    if (req.method !== "POST") throw new RequestError("POST required.",405);
    if (!req.headers["content-type"]?.startsWith("application/json") ||
        (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) {
      throw new RequestError("Invalid request origin.",403);
    }
    const { SUPABASE_URL: base, SUPABASE_SECRET_KEY: key, SUPABASE_PUBLISHABLE_KEY: publishable, ENTRYFLOW_ADMIN_USER_ID: adminId } = process.env;
    if (!base || !key || !publishable || !adminId) throw new RequestError("EntryFlow hosting setup is incomplete. Configure the server environment.",503);
    const {action,args=[],path="/",requestId} = req.body ?? {};
    if (typeof action !== "string" || !Array.isArray(args) || typeof path !== "string" || path.length > 500 || !/^[a-f0-9-]{36}$/i.test(requestId)) throw new RequestError("Invalid request.");
    let identity;
    if (action === "login") {
      const {email,password} = args[0] ?? {};
      if (typeof email !== "string" || typeof password !== "string") throw new RequestError("Enter your email and password.");
      const auth = await fetch(base + "/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:publishable,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      if (!auth.ok) throw new RequestError(auth.status === 429 ? "Too many login attempts. Try again later." : "Sign-in failed. Check your email and password.",auth.status===429?429:403);
      identity = (await auth.json()).user;
      if (!identity?.email_confirmed_at) throw new RequestError("Confirm the account email first.",403);
    }
    const token = (req.headers.cookie || "").match(/(?:^|;\s*)__Host-entryflow=([a-f0-9]{64})(?:;|$)/)?.[1];
    const newToken = action === "claimInvite" ? createHmac("sha256",key).update(JSON.stringify([action,args[0],requestId])).digest("hex") : secret();
    const request = {action,args,path,requestId,adminId,identity,token,newToken};
    const db = database(base.replace(/\/$/,""),key);
    const outcome = await transact(db.load,db.save,data=>operation(data,request));
    if (outcome.cookie !== undefined) res.setHeader("Set-Cookie",`__Host-entryflow=${outcome.cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${outcome.cookie ? 2592000 : 0}`);
    const {result,snapshot,user,revision,message} = outcome;
    const view = [revision,user?.id ?? null,path].join("|");
    if (action === "read" && req.body.view === view) return res.status(200).json({unchanged:true});
    res.status(200).json({result,snapshot,user,revision,message,view});
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("EntryFlow service error",error.message);
    res.status(error.status || 503).json({message:error.status ? error.message : "Shared data unavailable. Check your connection or hosting setup."});
  }
}
