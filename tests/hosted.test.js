import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import handler from "../api/entryflow.js";
import { peopleInside } from "../src/lib/occupancy.js";

test("four independent gate sessions share admissions and isolate roles", async t => {
  const adminId = randomUUID();
  Object.assign(process.env,{SUPABASE_URL:"https://local.example", SUPABASE_SECRET_KEY:"sb_secret_test",SUPABASE_PUBLISHABLE_KEY:"test",ENTRYFLOW_ADMIN_USER_ID:adminId});
  let row = {revision:0, data:Object.fromEntries(["events","members","hosts","guests","entries","audit","invites","sessions","receipts"].map(k=>[k,[]]))};
  t.mock.method(globalThis,"fetch",async (url,opts)=>{
    if (url.includes("/auth/")) {
      const {email,password} = JSON.parse(opts.body);
      if (password !== "correct-pass") return Response.json({}, {status:400});
      return Response.json({user:{email,id:email==="admin@test.example"?adminId:"staff-id",email_confirmed_at:"confirmed"}});
    }
    const query = new URL(url).searchParams;
    if (opts.method === "PATCH") {
      assert.equal(opts.headers.apikey,"sb_secret_test");
      if (query.get("revision")!=="eq."+row.revision) return Response.json([]);
      row = JSON.parse(opts.body);
      return Response.json([{revision:row.revision}]);
    }
    return Response.json(query.get("select")==="revision"?[{revision:row.revision}]:[row]);
  });
  function browser(){
    let cookie="";
    return async function call(action,args=[],path="/",requestId=randomUUID()) {
      const headers={};
      const res={setHeader(k,v){headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;}};
      await handler({method:"POST",headers:{host:"app.test",origin:"https://app.test",cookie,"content-type":"application/json"},body:{action,args,path,requestId}},res);
      if(headers["Set-Cookie"]) cookie=headers["Set-Cookie"].split(";")[0];
      return {status:res.code,...res.body};
    };
  }
  const admin=browser(), host=browser(), visitor=browser();
  assert.equal((await admin("login",[{email:"admin@test.example",password:"x"}])).status,403);
  assert.equal((await admin("login",[{email:"admin@test.example",password:"correct-pass"}])).status,200);
  const event=(await admin("createEvent",[{name:"Show",venue:"Hall",date:"2026-11-22"}])).result;
  const eventId=event.id;
  assert.equal((await visitor("read",[],"/event-invitation/"+event.invitationToken)).snapshot.events.length,1);
  assert.equal((await visitor("read",[],"/event-invitation/"+eventId)).snapshot.events.length,0);
  await admin("updateEvent",[eventId,{status:"Live"}]);
  async function invite(role) {
    const response=await admin("createInvite",[{eventId,role,capacity:10,expiresInHours:48}]);
    assert.equal(response.status,200);
    return response.result.token;
  }
  const link=await invite("Host");
  const claimKeys=[randomUUID(),randomUUID()];
  const [a,b]=await Promise.all([host("claimInvite",[link],"/",claimKeys[0]),visitor("claimInvite",[link],"/",claimKeys[1])]);
  assert.deepEqual([a.status,b.status],[200,200]);
  assert.equal(a.user.id,b.user.id);
  assert.equal(row.data.hosts.length,1);
  const activeHost = host;
  const hostId=(a.user||b.user).id;
  for (const role of ["Host", "Supervisor", "Gate Scanner", "Superhost"]) {
    assert.equal((await host("createInvite", [{eventId, role, capacity: 10}])).status, 403);
  }
  const recovered=await browser()("claimInvite",[link],"/",claimKeys[a.status===200?0:1]);
  assert.equal(recovered.user.id,hostId);
  const staff=await admin("createMember",[{eventId,role:"Supervisor",email:"team@test.example",name:"Supervisor",capacity:10}]);
  const named=browser();
  assert.equal((await named("login",[{email:"team@test.example",password:"correct-pass"}])).user.id,staff.result.id);
  const second=(await admin("createEvent",[{name:"Other event",date:"2026-11-24",venue:"Other hall"}])).result;
  assert.equal((await named("read")).snapshot.events.some(e=>e.id===second.id),false);
  assert.equal((await named("updateEvent",[second.id,{name:"Another name"}])).status,409);
  const pass=(await activeHost("createGuest",[{eventId,hostId,name:"Guest",count:1}])).result;
  const issue=()=>activeHost("createGuest",[{eventId,hostId,name:"Allocation test",count:9}]);
  const competing=await Promise.all([issue(),issue()]);
  assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);
  const gates=[];
  const scannerLink=await invite("Gate Scanner");
  for(let i=0;i<4;i++){
    const gate=browser();
    assert.equal((await gate("claimInvite",[scannerLink])).status,200);
    gates.push(gate);
  }
  const scan=[{eventId,code:pass.code,count:1,gate:"North"}];
  const keys=gates.map(()=>randomUUID());
  const scans=await Promise.all(gates.map((gate,i)=>gate("scanPass",scan,"/scanner",keys[i])));
  assert.equal(scans.filter(s=>s.status===200).length,1);
  const winner=scans.findIndex(s=>s.status===200);
  assert.equal((await gates[winner]("scanPass",scan,"/scanner",keys[winner])).status,200);
  const publicPass=await browser()("read",[],"/pass/"+pass.code);
  assert.equal(publicPass.snapshot.guests[0].insideCount,1);
  assert.deepEqual(publicPass.snapshot.members,[]);
  assert.deepEqual((await gates[0]("read")).snapshot.invites,[]);
  assert.equal((await activeHost("updateGuest",[pass.id,{primaryName:"Other",totalCount:2}])).status,409);
  assert.equal((await activeHost("updateMember",[hostId,{role:"Global Admin"}])).status,400);
  assert.equal((await gates[(winner+1)%4]("undoLastScan")).status,409);
  assert.equal((await gates[winner]("undoLastScan")).status,200);
  const inviteId=row.data.invites.find(i=>i.token===scannerLink).id;
  const groupPass = competing.find(response => response.status === 200).result;
  const admitGroup = (gate, count) => gate("scanPass", [{eventId, code:groupPass.code, count, gate:"Main Gate"}]);
  assert.equal((await admitGroup(gates[0], 3)).result.remaining, 6);
  assert.equal((await admitGroup(gates[1], 7)).status, 409);
  assert.equal((await admitGroup(gates[1], 6)).result.remaining, 0);
  assert.equal((await gates[1]("undoLastScan", [eventId])).status, 200);
  assert.equal((await gates[0]("undoLastScan", [eventId])).status, 200);
  const accountId=(await gates[0]("read")).user.id;
  await gates[0]("logout");
  assert.equal((await gates[0]("claimInvite",[scannerLink])).user.id,accountId);
  assert.equal((await visitor("read",[],"/invite/"+scannerLink)).snapshot.invites.length,1);
  assert.equal((await admin("revokeInvite",[inviteId])).status,200);
  assert.equal((await gates[1]("read")).user,null);
  assert.equal((await browser()("claimInvite",[scannerLink])).status,409);
  const manual=await admin("manualCheckIn",[{eventId,code:"",name:"Walk-in",count:3,gate:"Main"}]);
  await admin("checkOut",[{sourceEntryId:manual.result.entry.id,count:1,gate:"Main"}]);
  const state=(await admin("read")).snapshot;
  assert.equal(peopleInside(state.guests,state.entries),2);
  assert.equal((await admin("reverseEntry",[manual.result.entry.id,"Correction"])).status,200);
  assert.equal(peopleInside(row.data.guests,row.data.entries),0);
  const legacy=row.data.invites.find(i=>i.token===link);
  legacy.expiresAt="2020-01-01T00:00:00Z";
  row.revision++;
  assert.equal((await browser()("claimInvite",[link])).user.id,hostId);
  const superhost=browser();
  const managerLink=await invite("Superhost");
  await superhost("claimInvite",[managerLink]);
  const managed=await superhost("createInvite",[{eventId,role:"Supervisor",capacity:1}]);
  assert.equal(managed.status,200);
  const fromPhone=await browser()("claimInvite",[managed.result.token]);
  const fromLaptop=await browser()("claimInvite",[managed.result.token]);
  assert.equal(fromPhone.user.id,fromLaptop.user.id);
  assert.equal((await superhost("read")).snapshot.invites.some(i=>i.token===managerLink),false);
  assert.equal((await superhost("revokeInvite",[managed.result.id])).status,200);
  const namedHost = (await superhost("createMember", [{eventId, role:"Host", name:"Asha", email:"asha@test.example", capacity:8}])).result;
  const options = [{eventId, role:"Host", hostId:namedHost.id}];
  const [firstShare, repeatShare] = await Promise.all([superhost("createInvite", options), admin("createInvite", options)]);
  assert.equal(firstShare.status, 200);
  assert.equal(firstShare.result.token, repeatShare.result.token);
  const passwordSession = browser(), phone = browser(), laptop = browser();
  assert.equal((await passwordSession("login", [{email:namedHost.email, password:"correct-pass"}])).user.id, namedHost.id);
  const oldPass = (await passwordSession("createGuest", [{eventId,hostId:namedHost.id,name:"Existing guest",count:2}])).result;
  for (const device of [phone, laptop]) {
    const opened = await device("claimInvite", [firstShare.result.token]);
    assert.equal(opened.user.id, namedHost.id);
    assert.equal(opened.snapshot.hosts[0].capacity, 8);
    assert.equal(opened.snapshot.guests[0].id, oldPass.id);
  }
  assert.equal((await phone("createInvite", options)).status, 403);
  assert.equal((await superhost("createInvite", [{...options[0],eventId:second.id}])).status,409);
  assert.equal((await superhost("createInvite", [{...options[0],role:"Supervisor"}])).status,409);
  assert.equal((await superhost("revokeInvite", [firstShare.result.id])).status,200);
  assert.equal((await phone("read")).user,null);
  assert.equal((await laptop("claimInvite", [firstShare.result.token])).status,409);
  assert.equal((await passwordSession("read")).user.id, namedHost.id);
  const replacement = (await admin("createInvite", options)).result;
  assert.notEqual(replacement.token, firstShare.result.token);
  assert.equal((await phone("claimInvite", [replacement.token])).user.id,namedHost.id);
  assert.equal((await laptop("read")).user,null);
  await superhost("removeMember", [namedHost.id]);
  assert.equal((await phone("claimInvite", [replacement.token])).status,409);
  assert.equal((await admin("createInvite", options)).status,409);
  const previousLink = await invite("Gate Scanner");
  const existingGate = browser();
  const previousRequest = randomUUID();
  assert.equal((await existingGate("claimInvite", [previousLink], "/", previousRequest)).status, 200);
  const previousInvite = row.data.invites.find(i => i.token === previousLink);
  previousInvite.createdBy = hostId;
  row.revision++;
  assert.deepEqual((await host("read", [], "/my-passes")).snapshot.invites, []);
  assert.equal((await host("revokeInvite", [previousInvite.id])).status, 403);
  assert.equal((await browser()("claimInvite", [previousLink])).status, 409);
  assert.equal((await browser()("claimInvite", [previousLink], "/", previousRequest)).status, 409);
  assert.equal((await existingGate("read")).user.role, "Gate Scanner");
  assert.equal((await superhost("revokeInvite", [previousInvite.id])).status, 200);
  assert.equal((await existingGate("read")).user, null);
  await admin("removeMember",[hostId]);
  assert.equal((await activeHost("read")).user,null);
  assert.equal((await browser()("claimInvite",[link])).status,409);
  assert.equal((await activeHost("createGuest",[{eventId,hostId,name:"Removed",count:1}])).status,401);
  assert.equal((await admin("logout")).user,null);
});
