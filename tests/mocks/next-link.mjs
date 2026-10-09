import { createElement as h } from 'react';
export default function Link({ href, children, ...p }) { return h('a', { href, ...p }, children); }
