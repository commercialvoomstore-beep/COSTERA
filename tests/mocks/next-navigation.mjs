export function redirect(p){ throw new Error('NEXT_REDIRECT:'+p); }
export function notFound(){ throw new Error('NOT_FOUND'); }
export function usePathname(){ return '/'; }
export function useRouter(){ return { push(){}, replace(){}, refresh(){} }; }
