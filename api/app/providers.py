import base64
import hashlib
import hmac
import uuid
from datetime import datetime
from abc import ABC, abstractmethod
from decimal import Decimal
import httpx
from fastapi import HTTPException
from app.config import get_settings


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    async def create_pix(self, order_id: uuid.UUID, amount: Decimal, email: str | None) -> dict: ...

    @abstractmethod
    async def create_boleto(self, charge_id: uuid.UUID, amount: Decimal, due_at: datetime, payer: dict) -> dict: ...

    @abstractmethod
    async def status(self, provider_id: str) -> str: ...

    @abstractmethod
    async def cancel(self, provider_id: str) -> str: ...


class MockPaymentProvider(PaymentProvider):
    name = 'mock'

    async def create_pix(self, order_id, amount, email):
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><rect x="20" y="20" width="50" height="50"/><rect x="130" y="20" width="50" height="50"/><rect x="20" y="130" width="50" height="50"/><text x="70" y="110" font-size="15">MOCK</text></svg>'
        return {'id': f'mock-{order_id}', 'status': 'pending', 'qr': 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode(), 'copy': f'MOCK-PIX-{order_id}'}

    async def create_boleto(self, charge_id, amount, due_at, payer):
        return {'id': f'mock-boleto-{charge_id}', 'status': 'pending', 'url': None,
                'barcode': f'MOCK-{charge_id}', 'qr': None, 'copy': None}

    async def status(self, provider_id):
        return 'pending'

    async def cancel(self, provider_id):
        return 'cancelled'


class MercadoPagoProvider(PaymentProvider):
    name = 'mercadopago'
    base = 'https://api.mercadopago.com'

    def headers(self):
        key = get_settings().mercado_pago_access_token
        if not key: raise HTTPException(503, 'Mercado Pago não configurado')
        return {'Authorization': f'Bearer {key}'}

    async def create_pix(self, order_id, amount, email):
        payer_email = email or get_settings().payment_guest_email
        if not payer_email: raise HTTPException(422, 'Email do pagador necessário para Mercado Pago')
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f'{self.base}/v1/payments', headers={**self.headers(), 'X-Idempotency-Key': str(order_id)},
                json={'transaction_amount': float(amount), 'payment_method_id': 'pix', 'payer': {'email': payer_email}, 'external_reference': str(order_id)})
            response.raise_for_status()
            data = response.json()
        pix = data.get('point_of_interaction', {}).get('transaction_data', {})
        qr = pix.get('qr_code_base64')
        return {'id': str(data['id']), 'status': data.get('status', 'pending'),
                'qr': f'data:image/png;base64,{qr}' if qr else '', 'copy': pix.get('qr_code', '')}

    async def create_boleto(self, charge_id, amount, due_at, payer):
        import re
        address = payer.get('address') or {}
        tax_id = re.sub(r'\D', '', payer.get('cnpj') or '')
        required = ('cep', 'street', 'number', 'neighborhood', 'city', 'state')
        if len(tax_id) != 14 or any(not address.get(field) for field in required):
            raise HTTPException(422, 'Boleto Mercado Pago exige CNPJ e endereço completo (CEP, rua, número, bairro, cidade, UF)')
        names = (payer['name'] or '').split(' ', 1)
        payload = {'transaction_amount': float(amount), 'description': f'Assinatura FastLanches {charge_id}',
                   'payment_method_id': 'bolbradesco', 'external_reference': str(charge_id),
                   'date_of_expiration': due_at.isoformat(),
                   'payer': {'email': payer['email'], 'first_name': names[0],
                             'last_name': names[1] if len(names) > 1 else names[0],
                             'identification': {'type': 'CNPJ', 'number': tax_id},
                             'address': {'zip_code': re.sub(r'\D', '', address['cep']),
                                         'street_name': address['street'], 'street_number': address['number'],
                                         'neighborhood': address['neighborhood'], 'city': address['city'],
                                         'federal_unit': address['state']}}}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f'{self.base}/v1/payments',
                                         headers={**self.headers(), 'X-Idempotency-Key': str(charge_id)}, json=payload)
            response.raise_for_status()
            data = response.json()
        details = data.get('transaction_details') or {}
        return {'id': str(data['id']), 'status': data.get('status', 'pending'),
                'url': details.get('external_resource_url'),
                'barcode': details.get('payment_method_reference_id'), 'qr': None, 'copy': None}

    async def status(self, provider_id):
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f'{self.base}/v1/payments/{provider_id}', headers=self.headers())
            response.raise_for_status()
            return response.json()['status']

    async def cancel(self, provider_id):
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.put(f'{self.base}/v1/payments/{provider_id}', headers=self.headers(), json={'status': 'cancelled'})
            response.raise_for_status()
            return response.json()['status']


class AbacatePayProvider(PaymentProvider):
    name = 'abacatepay'
    base = 'https://api.abacatepay.com/v2'

    def headers(self):
        key = get_settings().abacatepay_api_key
        if not key: raise HTTPException(503, 'AbacatePay não configurado')
        return {'Authorization': f'Bearer {key}'}

    async def create_pix(self, order_id, amount, email):
        cents = int(amount * 100)
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f'{self.base}/transparents/create', headers=self.headers(),
                json={'method': 'PIX', 'data': {'amount': cents, 'externalId': str(order_id), 'description': f'Pedido {order_id}'}})
            response.raise_for_status()
            data = response.json()['data']
        qr = data.get('brCodeBase64') or ''
        return {'id': data['id'], 'status': data.get('status', 'PENDING').lower(),
                'qr': qr if qr.startswith('data:') or not qr else f'data:image/png;base64,{qr}',
                'copy': data.get('brCode', '')}

    async def create_boleto(self, charge_id, amount, due_at, payer):
        import re
        tax_id = re.sub(r'\D', '', payer.get('cnpj') or '')
        if len(tax_id) != 14:
            raise HTTPException(422, 'Boleto AbacatePay exige CNPJ válido do pagador')
        payload = {'method': 'BOLETO', 'data': {'amount': int(amount * 100),
                   'externalId': str(charge_id), 'dueDate': due_at.date().isoformat(),
                   'description': f'Assinatura FastLanches {charge_id}',
                   'customer': {'name': payer['name'], 'taxId': tax_id, 'email': payer['email']}}}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f'{self.base}/transparents/create', headers=self.headers(), json=payload)
            response.raise_for_status()
            data = response.json()['data']
        return {'id': data['id'], 'status': data.get('status', 'PENDING').lower(),
                'url': data.get('url'), 'barcode': data.get('barCode'),
                'qr': data.get('brCodeBase64'), 'copy': data.get('brCode')}

    async def status(self, provider_id):
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f'{self.base}/transparents/check', params={'id': provider_id}, headers=self.headers())
            response.raise_for_status()
            return response.json()['data']['status'].lower()

    async def cancel(self, provider_id):
        raise HTTPException(501, 'AbacatePay não oferece cancelamento de Pix pendente nesta integração')


def payment_provider() -> PaymentProvider:
    name = get_settings().payment_provider
    providers = {'mock': MockPaymentProvider, 'mercadopago': MercadoPagoProvider, 'abacatepay': AbacatePayProvider}
    if name not in providers: raise RuntimeError(f'Unsupported PAYMENT_PROVIDER: {name}')
    return providers[name]()


def verify_mercado_signature(provider_id: str, request_id: str | None, signature: str | None):
    secret = get_settings().mercado_pago_webhook_secret
    if not all((secret, provider_id, request_id, signature)):
        raise HTTPException(401, 'Assinatura Mercado Pago ausente')
    parts = dict(part.strip().split('=', 1) for part in signature.split(',') if '=' in part)
    ts, received = parts.get('ts'), parts.get('v1')
    if not ts or not received: raise HTTPException(401, 'Assinatura Mercado Pago inválida')
    manifest = f'id:{provider_id.lower()};request-id:{request_id};ts:{ts};'
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received): raise HTTPException(401, 'Assinatura Mercado Pago inválida')


def verify_abacate_signature(body: bytes, signature: str | None, secret: str | None):
    config = get_settings()
    if not config.abacatepay_webhook_secret or not config.abacatepay_public_key or not signature or not secret:
        raise HTTPException(401, 'Assinatura AbacatePay ausente')
    if not hmac.compare_digest(config.abacatepay_webhook_secret, secret):
        raise HTTPException(401, 'Secret AbacatePay inválido')
    expected = base64.b64encode(hmac.new(config.abacatepay_public_key.encode(), body, hashlib.sha256).digest()).decode()
    if not hmac.compare_digest(expected, signature): raise HTTPException(401, 'Assinatura AbacatePay inválida')


class InvoiceProvider(ABC):
    @abstractmethod
    async def issue(self, items: list[dict], amount: Decimal, customer: dict | None, api_key: str | None) -> dict: ...

    @abstractmethod
    async def status(self, provider_id: str, api_key: str | None) -> dict: ...


class MockInvoiceProvider(InvoiceProvider):
    async def issue(self, items, amount, customer, api_key):
        return {'invoiceId': f'mock-{uuid.uuid4()}', 'status': 'issued', 'numero': 'MOCK-1', 'pdfUrl': None, 'xmlUrl': None}

    async def status(self, provider_id, api_key):
        return {'invoiceId': provider_id, 'status': 'issued', 'numero': 'MOCK-1'}


class NotaasProvider(InvoiceProvider):
    base = 'https://platform.notaas.com.br/api/v1'

    def headers(self, api_key):
        key = api_key or get_settings().notaas_api_key
        if not key: raise HTTPException(503, 'Notaas não configurado para a loja')
        return {'x-api-key': key}

    async def issue(self, items, amount, customer, api_key):
        if any(not i.get('ncm') or not i.get('cfop') for i in items):
            raise ValueError('NCM e CFOP obrigatórios para todos os produtos')
        fiscal_items = [{'codigo': i['productId'], 'descricao': i['product']['name'], 'ncm': i['ncm'], 'cfop': i['cfop'],
                         'unidade': 'UN', 'quantidade': i['quantity'], 'valorUnitario': i['unitPrice'],
                         'valorTotal': round(i['unitPrice'] * i['quantity'], 2)} for i in items]
        payload = {'modelo': 65, 'naturezaOperacao': 'Venda de mercadoria', 'items': fiscal_items,
                   'pagamentos': [{'tipoPagamento': '17', 'valor': float(amount)}], 'consumidorFinal': 1}
        if customer and customer.get('cpf'):
            payload['dest'] = {'cpf': ''.join(x for x in customer['cpf'] if x.isdigit()), 'nome': 'Consumidor Final'}
            if customer.get('email'): payload['dest']['email'] = customer['email']
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f'{self.base}/nfe/emitir', headers=self.headers(api_key), json=payload)
            response.raise_for_status()
            return response.json()

    async def status(self, provider_id, api_key):
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f'{self.base}/nfe/invoices/{provider_id}/status', headers=self.headers(api_key))
            response.raise_for_status()
            return response.json()


def invoice_provider() -> InvoiceProvider:
    selected = get_settings().invoice_provider
    if selected == 'mock': return MockInvoiceProvider()
    if selected == 'notaas': return NotaasProvider()
    raise RuntimeError(f'Unsupported INVOICE_PROVIDER: {selected}')
