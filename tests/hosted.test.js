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
  assert.deepEqual([a.status,b.status].sort(),[200,409]);
  const activeHost = a.status===200 ? host : visitor;
  const hostId=(a.user||b.user).id;
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
  for(let i=0;i<4;i++){
    const gate=browser();
    assert.equal((await gate("claimInvite",[await invite("Gate Scanner")])).status,200);
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
  assert.equal((await gates[winner]("undoLastScan")).status,200);
  const manual=await admin("manualCheckIn",[{eventId,code:"",name:"Walk-in",count:3,gate:"Main"}]);
  await admin("checkOut",[{sourceEntryId:manual.result.entry.id,count:1,gate:"Main"}]);
  const state=(await admin("read")).snapshot;
  assert.equal(peopleInside(state.guests,state.entries),2);
  assert.equal((await admin("reverseEntry",[manual.result.entry.id,"Correction"])).status,200);
  assert.equal(peopleInside(row.data.guests,row.data.entries),0);
  await admin("removeMember",[hostId]);
  assert.equal((await activeHost("read")).user,null);
  assert.equal((await activeHost("createGuest",[{eventId,hostId,name:"Removed",count:1}])).status,401);
  assert.equal((await admin("logout")).user,null);
});
