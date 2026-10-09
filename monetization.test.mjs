// COSTERA — Tests serveur des forfaits, quotas, accès, paiement, cartes.
import { getDB, saveDB } from './src/server/db';
import { countUserDishes, userLevel, checkDishQuota, computeExpiry } from './src/server/planService';
import { canAccessLevel, effectivePlan, nextLevel } from './src/lib/plans';
import { startSubscriptionAction, submitProofAction, validateRequestAction, refuseRequestAction } from './src/server/actions/plans';
import { saveDishAction, deleteDishAction } from './src/server/actions/dishes';
import { deleteCardAction } from './src/server/actions/cards';
import { buildExternalVideo } from './src/lib/video';

let pass=0, fail=0;
function ok(name, cond, extra=''){ if(cond){pass++;console.log('  PASS '+name);} else {fail++;console.log('  FAIL '+name+' '+(extra||''));} }
function setUser(id){ globalThis.__TEST_USER_ID=id; }
const PNG_B64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function main(){
  const db0=getDB();
  const admin=db0.users.find(u=>u.role==='admin');

  console.log('\n== 1. Accès par niveau ==');
  ok('FREE ne voit pas SILVER', canAccessLevel('free','silver')===false);
  ok('FREE ne voit pas GOLD', canAccessLevel('free','gold')===false);
  ok('SILVER voit FREE+SILVER', canAccessLevel('silver','free')&&canAccessLevel('silver','silver'));
  ok('SILVER ne voit pas GOLD', canAccessLevel('silver','gold')===false);
  ok('GOLD voit tout', canAccessLevel('gold','free')&&canAccessLevel('gold','silver')&&canAccessLevel('gold','gold'));
  ok('nextLevel(silver)=gold', nextLevel('silver')==='gold');
  ok('nextLevel(free)=silver', nextLevel('free')==='silver');
  ok('admin => niveau gold', userLevel(admin)==='gold');
  ok('effectivePlan(admin)=gold', effectivePlan(admin)==='gold');

  console.log('\n== 2. Quotas ==');
  const yao=db0.users.find(u=>u.email==='chef@costera.ci');
  const assie=db0.users.find(u=>u.email==='chef.silver@costera.ci');
  const kadia=db0.users.find(u=>u.email==='chef.gold@costera.ci');
  ok('FREE chef a 5 plats', countUserDishes(db0,yao.id)===5,'got '+countUserDishes(db0,yao.id));
  ok('SILVER chef a 10 plats', countUserDishes(db0,assie.id)===10);
  ok('GOLD chef a 12 plats', countUserDishes(db0,kadia.id)===12);
  ok('checkDishQuota FREE refus (5/5)', checkDishQuota(db0,yao,db0.settings).ok===false);
  ok('checkDishQuota SILVER refus (10/10)', checkDishQuota(db0,assie,db0.settings).ok===false);
  ok('checkDishQuota GOLD autorise', checkDishQuota(db0,kadia,db0.settings).ok===true);

  const yaoCard=getDB().cards.find(c=>c.ownerId===yao.id);
  setUser(yao.id);
  const rFree=await saveDishAction({cardId:yaoCard.id,name:'Test6-Free',price:1000,level:'free',allergens:[],status:'brouillon'});
  ok('Action: 6e plat FREE refusé', rFree.quotaExceeded===true);

  const assieCard=getDB().cards.find(c=>c.ownerId===assie.id);
  setUser(assie.id);
  const rSil=await saveDishAction({cardId:assieCard.id,name:'Test11-Silver',price:1000,level:'free',allergens:[],status:'brouillon'});
  ok('Action: 11e plat SILVER refusé', rSil.quotaExceeded===true);

  const kadiaCard=getDB().cards.find(c=>c.ownerId===kadia.id);
  setUser(kadia.id);
  const rGold=await saveDishAction({cardId:kadiaCard.id,name:'Test-Gold',price:1000,level:'free',allergens:[],status:'brouillon'});
  ok('Action: GOLD peut créer (illimité)', rGold.ok===true&&!!rGold.id);
  if(rGold.ok&&rGold.id){ await deleteDishAction(rGold.id); }
  ok('GOLD restauré à 12', countUserDishes(getDB(),kadia.id)===12);

  console.log('\n== 3. Flux paiement + validation ==');
  let db=getDB();
  db.users.push({id:'usr-test',name:'Chef Test',email:'test@costera.ci',role:'chef',passwordHash:'x',createdAt:new Date().toISOString(),plan:'free'});
  saveDB(db);
  setUser('usr-test');

  const start=await startSubscriptionAction({plan:'silver',period:'mensuel'});
  ok('startSubscription crée la demande', start.ok===true&&!!start.ref);
  const reqA=getDB().paymentRequests.find(r=>r.ref===start.ref);
  ok('montant HT SILVER = 15000', reqA.amountHt===15000,'got '+reqA.amountHt);
  ok('TVA 18% = 2700', reqA.tvaAmount===2700,'got '+reqA.tvaAmount);
  ok('total TTC = 17700', reqA.amountTotal===17700,'got '+reqA.amountTotal);

  let fdBad=new FormData();
  fdBad.set('ref',start.ref);
  fdBad.set('txReference','TX-BAD');
  fdBad.set('proof', new File([Buffer.from('pas une image')],'virus.exe',{type:'application/x-msdownload'}));
  const bad=await submitProofAction(fdBad);
  ok('preuve invalide refusée', bad.ok===false);

  let fd=new FormData();
  fd.set('ref',start.ref);
  fd.set('txReference','TX-001');
  fd.set('proof', new File([Buffer.from(PNG_B64,'base64')],'preuve.png',{type:'image/png'}));
  const good=await submitProofAction(fd);
  ok('preuve PNG acceptée', good.ok===true, good.error||'');
  ok('statut = en_attente', getDB().paymentRequests.find(r=>r.ref===start.ref).status==='en_attente');

  setUser(admin.id);
  const req=getDB().paymentRequests.find(r=>r.ref===start.ref);
  const val=await validateRequestAction(req.id);
  ok('admin valide la demande', val.ok===true, val.error||'');
  const after=getDB();
  const testUser=after.users.find(u=>u.id==='usr-test');
  ok('utilisateur passe SILVER', testUser.plan==='silver');
  ok('planExpiresAt défini', !!testUser.planExpiresAt);
  ok('abonnement créé', after.subscriptions.some(s=>s.userId==='usr-test'&&s.plan==='silver'));
  ok('demande = validee', after.paymentRequests.find(r=>r.id===req.id).status==='validee');
  ok('notification de validation créée', after.notifications.some(n=>n.userId==='usr-test'));

  setUser('usr-test');
  const start2=await startSubscriptionAction({plan:'gold',period:'annuel'});
  let fd2=new FormData();
  fd2.set('ref',start2.ref);
  fd2.set('txReference','TX-002');
  fd2.set('proof', new File([Buffer.from(PNG_B64,'base64')],'p2.png',{type:'image/png'}));
  await submitProofAction(fd2);
  const req2=getDB().paymentRequests.find(r=>r.ref===start2.ref);
  ok('demande GOLD annuel = 350000 HT', req2.amountHt===350000,'got '+req2.amountHt);
  setUser(admin.id);
  const refuseNoReason=await refuseRequestAction(req2.id,'');
  ok('refus sans raison refusé', refuseNoReason.ok===false);
  const refuseOk=await refuseRequestAction(req2.id,'Capture illisible');
  ok('refus avec raison accepté', refuseOk.ok===true, refuseOk.error||'');
  const req2b=getDB().paymentRequests.find(r=>r.id===req2.id);
  ok('demande = refusee + raison', req2b.status==='refusee'&&req2b.refuseReason==='Capture illisible');

  let dbEnd=getDB();
  dbEnd.users=dbEnd.users.filter(u=>u.id!=='usr-test');
  dbEnd.notifications=dbEnd.notifications.filter(n=>n.userId!=='usr-test');
  dbEnd.subscriptions=dbEnd.subscriptions.filter(s=>s.userId!=='usr-test');
  dbEnd.paymentRequests=dbEnd.paymentRequests.filter(r=>r.userId!=='usr-test');
  saveDB(dbEnd);
  console.log('\n  (utilisateur de test nettoyé)');

  console.log('\n== 4. Cartes & vidéo ==');
  setUser(yao.id);
  const otherCard=getDB().cards.find(c=>c.ownerId===assie.id);
  const delOther=await deleteCardAction(otherCard.id);
  ok('suppression carte d autrui refusée', delOther.ok===false);

  const someDish=getDB().dishes.find(d=>d.ownerId===yao.id);
  const ext=buildExternalVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const vres=await saveDishAction({cardId:yaoCard.id,id:someDish.id,name:someDish.name,price:someDish.price,level:someDish.level,allergens:someDish.allergens||[],status:someDish.status,video:ext});
  ok('lien YouTube accepté (FREE)', vres.ok===true, vres.error||'');
  ok('externalId extrait', getDB().dishes.find(d=>d.id===someDish.id).video?.externalId==='dQw4w9WgXcQ');
  let dbV=getDB(); const dv=dbV.dishes.find(d=>d.id===someDish.id); dv.video=null; dv.videoUpdatedAt=new Date().toISOString(); saveDB(dbV);

  const exp=computeExpiry('mensuel', new Date('2026-01-15T00:00:00Z'));
  ok('computeExpiry mensuel +1 mois', exp.startsWith('2026-02-15'),'got '+exp);

  console.log('\nRESULTAT: '+pass+' réussis, '+fail+' échecs');
  process.exit(fail?1:0);
}
main().catch(e=>{console.error('ERREUR TEST',e);process.exit(2);});
