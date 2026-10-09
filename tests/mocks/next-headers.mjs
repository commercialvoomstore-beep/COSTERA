import { createHmac } from 'crypto';
const SECRET = process.env.COSTERA_SECRET || 'costera-secret-demo-v1';
function sign(p){return createHmac('sha256',SECRET).update(p).digest('base64url');}
export function encodeSession(uid){
  const p=Buffer.from(JSON.stringify({u:uid,exp:Date.now()+7*24*3600e3})).toString('base64url');
  return p+'.'+sign(p);
}
export async function cookies(){
  const uid = globalThis.__TEST_USER_ID || null;
  const value = uid? encodeSession(uid): undefined;
  return {
    get:(name)=> (name==='costera_session' && value)? {value} : undefined,
    set(name, val, opts){ globalThis.__TEST_COOKIE_SET = { name, value: val, opts }; },
    delete(name){ globalThis.__TEST_COOKIE_DELETED = name; },
  };
}
export async function headers(){ return { get:()=>null }; }
