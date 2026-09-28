import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Input, Spinner, Text } from '@/components/ui';
import { ToggleSwitch } from '@/components/admin/ToggleSwitch';
import { productsService } from '@/services/products';
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
}

const EMPTY: FormState = {
  name: '',
  description: '',
  price: '',
  categoryId: 'burgers',
  available: true,
  imageUrl: '',
  ingredients: '',
  allergens: '',
};

const CATEGORIES = [
  { id: 'combos',    label: 'Combos' },
  { id: 'burgers',   label: 'Burgers' },
  { id: 'sides',     label: 'Acompanhamentos' },
  { id: 'drinks',    label: 'Bebidas' },
  { id: 'desserts',  label: 'Sobremesas' },
];

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
 * Agora usa `productsService.list()` como fallback porque o mock não tem
 * `byId` individual exposto — quando o backend entrar, trocar por byId.
 */
export default function ProductForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

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
    // Mock: aqui chamaria productsService.create() ou update(id, ...)
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    nav('/admin/products');
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
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
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
