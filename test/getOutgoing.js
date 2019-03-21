import test from 'ava';
import getOutgoing from '../src/http-proxy/getOutgoing';

test('getOutgoing', (t) => {
  const ctx = {
    path: '/quan',
    querystring: 'name=888',
  };
  let outgoing = getOutgoing(ctx);
  t.is(outgoing, null);

  outgoing = getOutgoing(ctx, '/quan');

  t.is(outgoing, null);

  outgoing = getOutgoing(ctx, 'http://:quan');

  t.is(outgoing, null);
});
