# 🎮 Jogo da Velha Multiplayer Online (Android & Web)

Um jogo da velha moderno, responsivo e em tempo real desenvolvido especialmente para permitir que dois jogadores disputem partidas diretamente de seus aparelhos **Android** (ou qualquer navegador web), com sincronização instantânea via WebSockets, leitura de QR Code, efeitos sonoros sintetizados e resposta tátil com vibração.

---

## ✨ Principais Funcionalidades

- 🌐 **Multiplayer Online em Tempo Real**:
  - Comunicação bidirecional de baixa latência com servidor autoritativo via **WebSockets (`ws`)**.
  - Criação rápida de salas com **código PIN de 4 caracteres** (ex: `A3K9`).
  - **Leitor de QR Code integrado**: um jogador exibe o QR Code na tela e o amigo aponta a câmera do celular para entrar na hora.
  - Compartilhamento rápido via link direto ou botão nativo do **WhatsApp**.

- 📱 **Otimizado para Celulares Android**:
  - Suporte completo a **PWA (Progressive Web App)**: pode ser adicionado à tela inicial como aplicativo nativo.
  - **Feedback tátil com vibração háptica (`navigator.vibrate`)** a cada toque, jogada ou vitória.
  - Alvos de toque generosos (mínimo de 64px) e layout `overscroll-none` sem zoom indesejado ou atrasos de clique.
  - Modo escuro vibrante (Cyber Glow Neon) com alto contraste para visibilidade sob luz solar.

- 🎙️ **Chat de Voz em Tempo Real (WebRTC P2P)**:
  - Comunicação de áudio de ponta a ponta sem sobrecarregar o servidor (P2P via WebRTC).
  - **Microfone aberto com botão de silenciar (Mute/Desmutar)** a 1 toque.
  - **Indicador animado de ondas sonoras** e borda pulsante no card do jogador que estiver falando (detecção via `AnalyserNode`).
  - Cancelamento de eco (`echoCancellation`), ganho automático e supressão de ruído ativo.

- 💬 **Reações e Interatividade**:
  - Barra de reações instantâneas com emojis animados (🔥, 👏, 😂, 😱, 🏆, 🎯) e frases rápidas que flutuam na tela do adversário em tempo real.

- 🏆 **Placar & Revanche Justa**:
  - Placar contínuo com contagem de vitórias de X, O e empates.
  - Sistema de revanche sincronizado que alterna automaticamente quem inicia a jogada na rodada seguinte.
  - Efeito comemorativo de confetes na tela do vencedor.

- 🔊 **Áudio Procedural Leve (Web Audio API)**:
  - Sons de toque, marcação de X, marcação de O, fanfarra de vitória e empate sintetizados proceduralmente sem downloads de arquivos pesados de áudio.
  - Botão de ativar/desativar som e vibração no topo da tela.

- 🕹️ **Modos Extras Offline**:
  - **1 Aparelho (Passar e Jogar)**: Jogue com um amigo lado a lado revezando o mesmo celular.
  - **Contra o Robô (IA Minimax)**: Treine suas jogadas com 3 níveis de inteligência artificial (Fácil, Médio e Impossível/Difícil).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - [React 19](https://react.dev/) com TypeScript
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Lucide Icons](https://lucide.dev/)
  - [Canvas Confetti](https://github.com/catdad/canvas-confetti)
  - [QRCode](https://github.com/soldair/node-qrcode)

- **Backend**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [WebSockets (`ws`)](https://github.com/websockets/ws) para sincronização de estado
  - [Vite 8](https://vitejs.dev/) com middleware integrado no desenvolvimento

- **Testes**:
  - Node.js Test Runner nativo (`node:test` e `node:assert/strict`)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** v20 ou superior instalado.
- **npm** (ou **pnpm** / **yarn**).

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/jogo-da-velha-multiplayer.git
   cd jogo-da-velha-multiplayer
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no seu navegador ou celular:**
   - No computador: Abra `http://localhost:3000`
   - No celular (mesma rede Wi-Fi): Abra `http://<IP-DO-SEU-COMPUTADOR>:3000`

---

## 🧪 Executando os Testes Unitários

O projeto conta com testes unitários cobrindo as regras fundamentais do jogo (vitórias em linha, coluna, diagonal, empates, bloqueio de jogadas e algoritmo minimax):

```bash
npm test
```

---

## 📦 Build para Produção

Para gerar os arquivos estáticos otimizados para produção:

```bash
npm run build
```

E para iniciar o servidor de produção:

```bash
npm start
```

---

## 📁 Estrutura do Projeto

```text
├── index.html                # Ponto de entrada HTML com meta tags Android/PWA
├── package.json              # Configurações de scripts e dependências
├── server.ts                 # Servidor Express + WebSocket em tempo real
├── tsconfig.json             # Configurações TypeScript
├── vite.config.ts            # Configurações do Vite
├── public/
│   └── icon.svg              # Ícone estilizado do app
└── src/
    ├── App.tsx               # Componente raiz gerenciador de telas e conexões
    ├── index.css             # Estilos globais e importação do Tailwind CSS
    ├── main.tsx              # Ponto de montagem React
    ├── components/
    │   ├── GameBoard.tsx     # Tabuleiro 3x3 responsivo e animado
    │   ├── GameOverModal.tsx # Modal de resultado com placar e revanche
    │   ├── JoinModal.tsx     # Modal para digitar ou colar o código da sala
    │   ├── LobbyModal.tsx    # Tela de espera com QR Code e link de compartilhamento
    │   ├── OfflineIndicator.tsx # Alerta flutuante de status de conexão
    │   ├── PlayerHUD.tsx     # Indicador de turno, pontos e jogadores
    │   ├── PWAInstallButton.tsx # Botão para instalar na tela do Android
    │   ├── ReactionDrawer.tsx# Menu retrátil de emojis e reações rápidas
    │   └── TitleScreen.tsx   # Tela inicial com menu de modos de jogo
    ├── game/
    │   ├── rules.ts          # Lógica pura de regras, validação e Minimax
    │   └── rules.test.ts     # Testes unitários com node:test
    ├── hooks/
    │   ├── useMultiplayer.ts # Hook do cliente WebSocket e reconexão
    │   └── usePWAInstall.ts  # Hook para captura do evento beforeinstallprompt
    └── utils/
        └── audio.ts          # Síntese Web Audio procedural e vibração háptica
```

---

## 📄 Licença

Distribuído sob a licença [Apache-2.0](LICENSE).
