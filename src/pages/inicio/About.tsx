import { Text } from '@/components/ui';
import './ContentPage.css';

const NUMBERS = [
  { value: '2024', label: 'Ano de fundação' },
  { value: '+15%', label: 'Aumento de vendas por cliente' },
  { value: '99%', label: 'Precisão nos pedidos' },
  { value: '3x', label: 'Mais pedidos por hora em pico' },
];

export default function About() {
  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Sobre</span>
        <Text as="h1" size="4xl" weight="black">Feito para lanchonetes que odeiam fila</Text>
      </header>

      <section className="cp__section">
        <Text as="h2" size="2xl" weight="black">De onde viemos</Text>
        <Text as="p">
          O FastLanches nasceu de uma conversa entre cinco estudantes de engenharia de software
          que estavam cansados de esperar em fila de lanchonete. A gente percebeu que o gargalo
          não era a cozinha — era o caixa. Cada pedido levava 4 minutos para ser tomado por um
          atendente humano. Em horário de pico, isso significava uma fila que dobrava a esquina.
        </Text>
        <Text as="p">
          A pergunta que guiou o projeto foi simples: e se o cliente pudesse fazer o pedido
          sozinho, do jeito que ele quer, sem depender de ninguém para anotar? Com essa premissa,
          construímos um totem com pagamento via Pix que resolve o pedido inteiro em menos de
          um minuto.
        </Text>
      </section>

      <section className="cp__section">
        <Text as="h2" size="2xl" weight="black">Nossos números hoje</Text>
        <div className="cp__grid">
          {NUMBERS.map((n) => (
            <div key={n.value} className="cp__card" style={{ alignItems: 'center', textAlign: 'center' }}>
              <Text size="3xl" weight="black" tone="primary">{n.value}</Text>
              <Text tone="muted" size="sm">{n.label}</Text>
            </div>
          ))}
        </div>
      </section>

      <section className="cp__section">
        <Text as="h2" size="2xl" weight="black">Como pensamos o produto</Text>
        <Text as="p">Três decisões definem o FastLanches e explicam por que ele funciona:</Text>
        <ul>
          <li><strong>Somente Pix.</strong> Cada forma de pagamento adicional exige hardware, integração e tela própria. Reduzimos para Pix e o fluxo ficou três vezes mais rápido.</li>
          <li><strong>CPF e email são opcionais.</strong> A maioria dos clientes não precisa de nota fiscal. Priorizamos o caminho de pular e deixamos o campo de identificação disponível para quem realmente quiser.</li>
          <li><strong>Layout pensado para TV vertical.</strong> Totem não é desktop. Desenhamos cada tela considerando que o cliente está a 60 centímetros de distância e que o toque precisa ser preciso.</li>
        </ul>
      </section>

      <section className="cp__section">
        <Text as="h2" size="2xl" weight="black">Equipe</Text>
        <Text as="p">
          Ana Carolina Gontijo Vilela Dias, André Vinícius Guedes Martins, Filipe Silva da
          Fonseca, Gabriel Cézar Peres Matos e Gabriel Victor Vidal de Sales.
        </Text>
        <Text as="p" size="sm" tone="muted">
          Projeto desenvolvido como trabalho acadêmico na Universidade Católica de Brasília, 2026.
        </Text>
      </section>
    </div>
  );
}
