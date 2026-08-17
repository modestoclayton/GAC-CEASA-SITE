# GAC CEASA — IDENTIDADE VISUAL PARA CLOUD CODE

Objetivo: aplicar a nova identidade visual do GAC CEASA ao projeto existente sem alterar regras de negócio, banco, cálculos, permissões ou fluxos.

## Cores oficiais

```css
:root {
  --gac-bg: #0B1F17;
  --gac-bg-secondary: #112E24;
  --gac-card: #15382D;
  --gac-card-secondary: #1B4635;
  --gac-green: #00E676;
  --gac-green-soft: #9EE8B6;
  --gac-blue: #00B8FF;
  --gac-gold: #FFC107;
  --gac-orange: #FF8A00;
  --gac-red: #FF5252;
  --gac-text: #F4F7F2;
  --gac-muted: #A5B6A9;
  --gac-border: rgba(180,255,210,.16);
  --gac-shadow: 0 12px 34px rgba(0,0,0,.28);
}
```

### Uso
- `#0B1F17` — fundo principal.
- `#112E24` — áreas secundárias/navegação.
- `#15382D` — cards e botões.
- `#1B4635` — campos e destaques.
- `#00E676` — ativo, sucesso e destaque principal.
- `#9EE8B6` — texto secundário.
- `#00B8FF` — logística/entregas/informação.
- `#FFC107` — faturamento/lucro.
- `#FF8A00` — contas a receber/atenção.
- `#FF5252` — perdas/alertas críticos.

## Estilo

Tema: **Dark Green Agro Tech**.

Visual moderno, profissional, tecnológico e adequado a operação de pátio/CEASA. Priorizar celular. Usar cards arredondados, sombras discretas, bordas sutis, ícones lineares e alto contraste.

Cards:
```css
background: linear-gradient(145deg,#1B4635,#0F3327);
border: 1px solid rgba(180,255,210,.16);
border-radius: 20px;
box-shadow: 0 12px 34px rgba(0,0,0,.28);
```

Faturamento/Lucro:
```css
background: linear-gradient(145deg,#E8AB12,#C88900);
```

A receber:
```css
background: linear-gradient(145deg,#F46D2D,#D9551E);
```

Perda:
```css
background: linear-gradient(145deg,#A82A24,#731D1C);
```

Menu inferior: `HOJE | REGISTRAR | ESTOQUE | CONTAS`, fundo verde escuro translúcido, blur, borda discreta e item ativo em `#00E676`.

Inputs:
```css
background:#173E30;
color:#F4F7F2;
border:1px solid rgba(180,255,210,.16);
border-radius:17px;
height:52px;
```

Foco:
```css
border-color:rgba(0,230,118,.65);
box-shadow:0 0 0 3px rgba(0,230,118,.08);
```

## Ícone

Arquivo: `GAC_CEASA.ico`

Colocar em:
`public/GAC_CEASA.ico`

HTML:
```html
<link rel="icon" type="image/x-icon" href="/GAC_CEASA.ico">
```

Se o projeto usar Next.js/metadata, configurar o mesmo arquivo como favicon sem duplicar configurações.

## Cabeçalho

Usar o ícone GAC e:
`GAC CEASA`
`CEASA MANAGER • PÁTIO`

## Regra de integração

Não reconstruir o sistema. Não remover funcionalidades. Não alterar banco, cálculos, autenticação, permissões ou regras de negócio. Alterar apenas a camada visual e componentes de apresentação necessários.

Antes de editar, identificar layout global, cabeçalho, navegação inferior, dashboard, Registrar, cards, formulários e botões. Reaproveitar handlers, rotas e dados existentes.

## Resultado

O GAC CEASA deve manter todas as funções atuais, mas apresentar uma identidade visual única, escura, verde, moderna, tecnológica e otimizada para celular.
