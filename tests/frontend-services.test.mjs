import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// Exercise the real service modules at the HTTP boundary without a browser or API server.
function loadService(file, dependencies) {
  const source = readFileSync(resolve('src/services', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  });
  const exports = {};
  const requireMock = (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  };
  new Function('require', 'exports', outputText)(requireMock, exports);
  return exports;
}

test('login sends credentials and stores the returned session', async () => {
  const calls = [];
  const sessions = [];
  const api = { post: async (...args) => {
    calls.push(args);
    return { data: { accessToken: 'jwt', user: { id: 'u1', role: 'gerente', email: 'g@example.com' } } };
  } };
  const { authService } = loadService('auth.ts', {
    './api': { api },
    '@/contexts/AuthContext': { useAuthStore: { getState: () => ({ login: (...args) => sessions.push(args) }) } },
    '@/contexts/SuperAdminContext': { useSuperAdminStore: { setState: () => {}, getState: () => ({ login: () => assert.fail('wrong role') }) } },
  });
  const user = await authService.login('g@example.com', 'secret');
  assert.deepEqual(calls, [['/auth/login', { email: 'g@example.com', password: 'secret' }]]);
  assert.deepEqual(sessions, [[user, 'jwt']]);
});

test('creating a tenant posts the form to the admin API', async () => {
  const calls = [];
  const { tenantsService } = loadService('tenants.ts', {
    './api': { api: { post: async (...args) => {
      calls.push(args);
      return { data: { id: 'tenant-1', name: 'Loja Nova', cnpj: null } };
    } } },
  });
  const payload = { name: 'Loja Nova', ownerEmail: 'owner@example.com' };
  const tenant = await tenantsService.create(payload);
  assert.deepEqual(calls, [['/admin/tenants', payload]]);
  assert.equal(tenant.cnpj, '');
});

test('issuing a boleto posts the requested tenant and amount', async () => {
  const calls = [];
  const { invoicesService } = loadService('invoices.ts', {
    './api': { api: { post: async (...args) => {
      calls.push(args);
      return { data: { id: 'invoice-1', amount: '123.45', status: 'pending' } };
    } } },
  });
  const payload = { tenantId: 'tenant-1', amount: 123.45, dueAt: '2026-10-20' };
  const invoice = await invoicesService.create(payload);
  assert.deepEqual(calls, [['/admin/invoices', payload]]);
  assert.equal(invoice.amount, 123.45);
});

test('manager changes stay within the explicit superadmin tenant route', async () => {
  const calls = [];
  const { managersService } = loadService('managers.ts', {
    './api': { api: {
      post: async (...args) => { calls.push(args); return { data: { id: 'm1', tenantId: 't1', ...args[1] } }; },
      patch: async (...args) => { calls.push(args); return { data: { id: 'm1', tenantId: 't1', ...args[1] } }; },
    } },
  });
  await managersService.create('t1', { name: 'Maria', email: 'm@example.com', password: 'strong-pass' });
  await managersService.update('t1', 'm1', { active: false });
  assert.deepEqual(calls[0], ['/admin/tenants/t1/managers', { name: 'Maria', email: 'm@example.com', password: 'strong-pass' }]);
  assert.deepEqual(calls[1], ['/admin/tenants/t1/managers/m1', { active: false }]);
});
