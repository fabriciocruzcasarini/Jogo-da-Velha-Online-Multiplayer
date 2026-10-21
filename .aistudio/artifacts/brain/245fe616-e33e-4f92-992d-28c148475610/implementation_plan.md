# Plano de Implementação: Chat de Voz em Tempo Real (WebRTC P2P)

Este plano detalha a adição de **chat de voz em tempo real** entre os dois jogadores conectados na mesma sala, utilizando a tecnologia WebRTC P2P (Peer-to-Peer) com sinalização pelo servidor WebSocket já existente.

---

## 🎯 Requisitos & Escolhas do Usuário
- **Modo de Ativação**: Microfone aberto contínuo com botão intuitivo de silenciar (Mute/Desmutar).
- **Indicador Visual**: Ondas sonoras animadas e anel pulsante ao redor do avatar do jogador que estiver falando (detecção de volume via `AnalyserNode`).
- **Compatibilidade Android**: Cancelamento de eco (`echoCancellation`), supressão de ruído (`noiseSuppression`) e ganho automático ativados.
- **Eficiência de Rede**: Áudio transmitido diretamente de celular para celular (P2P), sem consumo de banda do seu servidor Apache/VPS.

---

## 🏗️ Arquitetura Proposta

```
[ Celular Android A ]                        [ Celular Android B ]
   (Jogador X)                                  (Jogador O)
        │                                            │
        ├────── Troca de Sinais (SDP / ICE) ────────┤  (Via WebSocket existente)
        │                                            │
        ▼══════════════ Áudio P2P WebRTC ════════════▼  (Conexão direta de voz)
```

1. **Sinalização via WebSocket (`server.ts`)**:
   - Novo evento `webrtc_signal`: encaminha ofertas (`offer`), respostas (`answer`) e candidatos ICE (`candidate`) entre o Jogador X e Jogador O da mesma sala.
   - Notificação de status de voz (`voice_status`: mutado/falando).

2. **Hook de Voz do Cliente (`src/hooks/useVoiceChat.ts`)**:
   - Gerencia a conexão `RTCPeerConnection` com STUN servers gratuitos do Google (`stun.l.google.com:19302`).
   - Captura de áudio via `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`.
   - Analisador de volume em tempo real (`AudioContext` + `AnalyserNode`) para disparar os estados `isSpeakingLocal` e `isSpeakingRemote`.
   - Métodos: `toggleMute()`, `toggleDeafen()` (ensurdecer/silenciar áudio recebido), `disconnectVoice()`.

3. **Interface e Componentes Visuais**:
   - **`VoiceControlBar.tsx`**: Botão de microfone flutuante (ou integrado ao HUD) com estados visuais claros:
     - 🟢 Microfone Ativo
     - 🔴 Microfone Mutado
     - 🔊 Áudio Conectado / 🔇 Alto-falante Desativado
   - **`PlayerHUD.tsx`**:
     - Ondas sonoras com brilho neon ao redor do card do jogador que estiver emitindo som.
     - Indicador de status de microfone em cada card (ícone de microfone aberto ou cortado).

---

## 📋 Etapas de Execução

1. **Backend (`server.ts`)**:
   - Adicionar manipulador para `webrtc_signal` que roteia mensagens SDP/ICE de um jogador diretamente para o outro na mesma sala.

2. **Frontend Engine (`src/hooks/useVoiceChat.ts`)**:
   - Implementar o ciclo de vida da chamada WebRTC (criação de oferta quando 2º jogador conecta, resposta e negociação de candidatos ICE).
   - Configurar o detector de nível sonoro para animar as ondas visuais quando o volume ultrapassar o limiar de fala.

3. **Componentes e Animação**:
   - Criar o componente de ondas sonoras (`VoiceWaveIndicator.tsx`).
   - Integrar os controles de voz ao `PlayerHUD.tsx` e `GameBoard.tsx`.
   - Adicionar botão de permissão de microfone amigável com tratamento para recusa de permissão no Android.

4. **Testes & Verificação**:
   - Teste de negociação SDP e criação do canal de áudio.
   - Verificação do botão de Mute/Desmutar e das animações de ondas de voz.
   - Execução de `npm test`, `npm run lint` e compilação `npm run build`.

---

## 🔒 Permissões e Segurança
- O navegador Android solicita permissão de microfone na primeira vez. Caso o usuário negue, o jogo continuará funcionando normalmente com aviso visual explicativo.
- Requer conexão segura **HTTPS** (já configurada em `https://fabriciocruz.ddns.net`).
