import { useState } from 'react';
import { Button, Card, Input, Modal, Text, CATEGORY_ICONS } from '@/components/ui';
import type { Category, CategoryIcon } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import './Categories.css';

const ICON_OPTIONS: CategoryIcon[] = ['burger', 'combo', 'fries', 'drink', 'dessert'];

interface Draft {
  id?: string;
  name: string;
  icon: CategoryIcon;
  order: number;
}

export default function Categories() {
  const { categories } = useCategories();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const openNew = () => setDraft({ name: '', icon: 'burger', order: categories.length + 1 });
  const openEdit = (c: Category) => setDraft({ id: c.id, name: c.name, icon: c.icon, order: c.order });
  const close = () => setDraft(null);

  const handleSave = () => {
    // Mock: aqui chamaria categoriesService.create/update
    close();
  };

  const handleDelete = () => {
    // Mock: aqui chamaria categoriesService.remove(toDelete.id)
    setToDelete(null);
  };

  return (
    <div className="cat">
      <div className="cat__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Categorias</Text>
          <Text tone="muted" size="sm">Organize os itens do cardápio</Text>
        </div>
        <Button onClick={openNew}>+ Nova categoria</Button>
      </div>

      <div className="cat__list">
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          return (
            <Card key={c.id} padding="md">
              <div className="cat__row">
                <div className="cat__row-icon">
                  <Icon size={28} />
                </div>
                <div className="cat__row-info">
                  <Text weight="bold" size="lg">{c.name}</Text>
                  <Text tone="muted" size="sm">Ordem {c.order} · id {c.id}</Text>
                </div>
                <div className="cat__row-actions">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(c)}>
                    <span style={{ color: 'var(--color-danger)' }}>Excluir</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de edição / criação */}
      <Modal
        open={Boolean(draft)}
        title={draft?.id ? 'Editar categoria' : 'Nova categoria'}
        confirmLabel="Salvar"
        cancelLabel="Cancelar"
        onConfirm={handleSave}
        onCancel={close}
        description={
          draft && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                label="Nome"
                size="lg"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex: Sobremesas"
              />

              <div>
                <Text weight="bold" size="sm" style={{ marginBottom: 8, display: 'block' }}>Ícone</Text>
                <div className="cat__icons">
                  {ICON_OPTIONS.map((opt) => {
                    const I = CATEGORY_ICONS[opt];
                    const active = draft.icon === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`cat__icon-opt ${active ? 'cat__icon-opt--on' : ''}`}
                        onClick={() => setDraft({ ...draft, icon: opt })}
                        aria-label={opt}
                      >
                        <I size={26} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Ordem"
                size="md"
                type="number"
                value={String(draft.order)}
                onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) || 0 })}
              />
            </div>
          )
        }
      />

      {/* Modal de confirmação de exclusão */}
      <Modal
        open={Boolean(toDelete)}
        title="Excluir categoria?"
        description={
          toDelete && (
            <Text tone="muted">
              A categoria <strong>{toDelete.name}</strong> será removida.
              Produtos nessa categoria ficarão sem categoria.
            </Text>
          )
        }
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
