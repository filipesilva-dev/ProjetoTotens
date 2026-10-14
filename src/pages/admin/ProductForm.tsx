import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Input, Spinner, Text } from '@/components/ui';
import { ToggleSwitch } from '@/components/admin/ToggleSwitch';
import { productsService } from '@/services/products';
import { useCategories } from '@/hooks/useCategories';
import type { Allergen } from '@/types';
import './ProductForm.css';

interface FormState {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  available: boolean;
  imageUrl: string;
  ingredients: string;
  allergens: string;
  ncm: string;
  cfop: string;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  available: true,
  imageUrl: '',
  ingredients: '',
  allergens: '',
  ncm: '',
  cfop: '',
};

const ALLERGENS = [
  { id: 'gluten',    label: '🌾 Glúten' },
  { id: 'milk',      label: '🥛 Leite' },
  { id: 'egg',       label: '🥚 Ovo' },
  { id: 'peanut',    label: '🥜 Amendoim' },
  { id: 'soy',       label: '🫘 Soja' },
  { id: 'fish',      label: '🐟 Peixe' },
  { id: 'shellfish', label: '🦐 Crustáceos' },
  { id: 'nuts',      label: '🌰 Castanhas' },
  { id: 'sesame',    label: '🌱 Gergelim' },
];

/**
 * Formulário de produto.
 *
 * Detecta modo pelo parâmetro da rota:
 *   /admin/products/new   →  cadastro
 *   /admin/products/:id   →  edição
 *
 * Em produção, o `useEffect` abaixo chamaria `productsService.byId(id)`.
 * Usa `productsService.list()` como fallback porque a rota individual não tem
 * `byId` individual exposto — quando o backend entrar, trocar por byId.
 */
export default function ProductForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { categories } = useCategories();

  useEffect(() => {
    if (!isEdit && categories.length && !form.categoryId) setForm(f => ({ ...f, categoryId: categories[0]!.id }));
  }, [categories, isEdit, form.categoryId]);

  // Modo edição: carrega produto
  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    (async () => {
      try {
        const p = await productsService.byId(id);
        if (!alive) return;
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          categoryId: p.categoryId,
          available: p.available,
          imageUrl: p.imageUrl,
          ingredients: (p.ingredients ?? []).join(', '),
          allergens: (p.allergens ?? []).join(', '),
          ncm: p.ncm ?? '',
          cfop: p.cfop ?? '',
        });
      } catch {
        // Produto não encontrado → volta pra listagem
        if (alive) nav('/admin/products');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, isEdit, nav]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAllergen = (a: string) => {
    const list = form.allergens.split(',').map((s) => s.trim()).filter(Boolean);
    const next = list.includes(a) ? list.filter((x) => x !== a) : [...list, a];
    update('allergens', next.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, description: form.description, price: Number(form.price),
      categoryId: form.categoryId, available: form.available, imageUrl: form.imageUrl,
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      allergens: form.allergens.split(',').map(s => s.trim()).filter(Boolean) as Allergen[], additions: [],
      ncm: form.ncm || null, cfop: form.cfop || null };
    try {
      if (isEdit && id) await productsService.update(id, payload);
      else await productsService.create(payload);
      nav('/admin/products');
    } catch (cause) { setError((cause as { detail?: string }).detail ?? 'Falha ao salvar produto'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="screen screen--center"><Spinner size={56} /></div>;
  }

  const activeAllergens = form.allergens.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="pform">
      <div className="pform__head">
        <div>
          <Text as="h1" size="3xl" weight="black">
            {isEdit ? 'Editar produto' : 'Novo produto'}
          </Text>
          <Text tone="muted" size="sm">
            {isEdit ? `ID #${id}` : 'Preencha os dados do item'}
          </Text>
        </div>
        <div className="pform__head-actions">
          <Button type="button" variant="ghost" size="md" onClick={() => nav('/admin/products')}>
            Cancelar
          </Button>
          <Button type="submit" size="md" loading={saving}>
            {isEdit ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </div>
      </div>

      <div className="pform__grid">
        {error && <Text tone="danger">{error}</Text>}
        <main className="pform__main">
          <Card padding="lg">
            <Text weight="black" size="lg" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>
              Informações básicas
            </Text>

            <Input
              label="Nome do produto"
              size="lg"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ex: X-Burger Especial"
              required
            />

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Descrição</Text>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="pform__textarea"
                placeholder="Pão brioche, hambúrguer 180g, queijo cheddar..."
              />
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Input label="NCM (8 dígitos, para NFC-e)" value={form.ncm} onChange={e => update('ncm', e.target.value.replace(/\D/g, '').slice(0, 8))} />
              <Input label="CFOP (4 dígitos, para NFC-e)" value={form.cfop} onChange={e => update('cfop', e.target.value.replace(/\D/g, '').slice(0, 4))} />
            </div>
          </Card>

          <Card padding="lg">
            <Text weight="black" size="lg" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>
              Ingredientes e alergênicos
            </Text>

            <Input
              label="Ingredientes removíveis"
              size="lg"
              value={form.ingredients}
              onChange={(e) => update('ingredients', e.target.value)}
              placeholder="Cebola, Tomate, Alface, Picles"
              hint="Separe por vírgula. O cliente poderá desmarcar cada um."
            />

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Alergênicos</Text>
              <div className="pform__allergens">
                {ALLERGENS.map((a) => {
                  const active = activeAllergens.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`pform__allergen ${active ? 'pform__allergen--on' : ''}`}
                      onClick={() => toggleAllergen(a.id)}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </main>

        <aside className="pform__side">
          <Card padding="lg">
            <Text weight="black" size="lg" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>
              Apresentação
            </Text>

            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="pform__preview" />
            ) : (
              <div className="pform__preview pform__preview--empty">Sem imagem</div>
            )}

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Input
                label="URL da imagem"
                size="md"
                value={form.imageUrl}
                onChange={(e) => update('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </Card>

          <Card padding="lg">
            <Text weight="black" size="lg" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>
              Preço e categoria
            </Text>

            <Input
              label="Preço (R$)"
              size="lg"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="28.00"
              required
            />

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Categoria</Text>
              <select
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                className="pform__select"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <ToggleSwitch
                checked={form.available}
                onChange={(v) => update('available', v)}
                label="Disponível no cardápio"
              />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
