// public/pwa-installer.js - Versão 5 (Robusta com Evento Customizado)

// Esta variável guardará o evento para que possa ser usado quando o botão for clicado.
let deferredPrompt;

// Ouve o evento que o navegador dispara quando o app é instalável.
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[pwa-installer] Evento "beforeinstallprompt" capturado.');
  e.preventDefault(); // Impede o pop-up padrão do navegador.
  deferredPrompt = e; // Guarda o evento.
  // Disponibiliza o evento globalmente para outros scripts (como welcome.html)
  window.deferredPrompt = e;

  // Encontra o botão de instalação na página /app.
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', async () => {
      installButton.style.display = 'none';
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[pwa-installer] Resultado da instalação: ${outcome}`);
        deferredPrompt = null;
        window.deferredPrompt = null;
      }
    });
  }
  
  // AVISO ATIVO: Dispara um evento customizado para que outras partes da aplicação
  // (como a página welcome.html) saibam que o app é instalável agora.
  console.log('[pwa-installer] Disparando evento "pwa-installable".');
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});```
*   **Salve ("Commit changes")** no GitHub.

---

**Passo 2: Modificar drasticamente o `public/welcome.html`**

Este é o passo principal. Vamos alterar o HTML para incluir os dois botões e o script para gerenciar o fluxo sequencial que você solicitou.

*   **Ação:** Edite o `public/welcome.html` no GitHub, apague todo o conteúdo e substitua pelo código completo abaixo.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo! - Montador de Sermões 3.2</title>
    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="/manifest.json">
    
    <script src="pwa-installer.js" defer></script>
</head>
<body>
    <header>
        <img src="https://cdn.glitch.global/db74bd9b-d683-421c-9223-f55b917c9dce/logo.png?v=1734385573934" alt="Logo do Montador de Sermões 3.2" class="logo">
    </header>
    
    <div class="welcome-container">
        <h1 id="welcome-title">Parabéns!</h1>
        <p id="welcome-text">Seja bem-vindo ao Montador de Sermões 3.2. Para a melhor experiência, recomendamos instalar o atalho do aplicativo em seu dispositivo.</p>
        
        <!-- Botão 1: Instalação (inicialmente visível) -->
        <button id="install-button" class="start-button">Começar a Usar</button>
        
        <!-- Botão 2: Notificações (inicialmente escondido) -->
        <button id="notifications-button" class="start-button" style="display: none;">Receber Atualizações</button>

        <!-- Link para pular e ir direto ao app -->
        <a href="/app" id="skip-link" style="display: block; margin-top: 20px;">Pular por agora</a>
    </div>

    <script>
        // Lógica final e robusta para o fluxo sequencial de Instalação -> Notificações

        const installButton = document.getElementById('install-button');
        const notificationsButton = document.getElementById('notifications-button');
        const skipLink = document.getElementById('skip-link');
        const welcomeTitle = document.getElementById('welcome-title');
        const welcomeText = document.getElementById('welcome-text');

        let isInstallable = false;

        // Função que é chamada quando o app se torna instalável
        function onAppInstallable() {
            console.log('[welcome] App é instalável. Atualizando botão 1.');
            isInstallable = true;
            installButton.innerText = 'Instalar e Continuar';
        }
        
        // Ouve o evento customizado do pwa-installer.js
        window.addEventListener('pwa-installable', onAppInstallable);

        // Função para mostrar a etapa de notificações
        function showNotificationsStep() {
            console.log('[welcome] Mostrando etapa de notificações.');
            installButton.style.display = 'none'; // Esconde o botão de instalar
            
            // Só mostra o botão de notificações se elas forem suportadas e a permissão não for negada
            if (('serviceWorker' in navigator) && ('PushManager' in window) && (Notification.permission !== 'denied')) {
                notificationsButton.style.display = 'block';
                welcomeTitle.innerText = 'Último Passo!';
                welcomeText.innerText = 'Clique abaixo para receber atualizações importantes e novidades do Montador de Sermões.';
            } else {
                // Se notificações não são possíveis, redireciona direto
                redirectToApp();
            }
        }

        function redirectToApp() {
            console.log('[welcome] Redirecionando para /app.');
            skipLink.innerText = 'Redirecionando...';
            window.location.href = '/app';
        }

        // Lógica do clique no primeiro botão (Instalar ou Continuar)
        installButton.addEventListener('click', async () => {
            if (isInstallable && window.deferredPrompt) {
                console.log('[welcome] Mostrando prompt de instalação...');
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                console.log(`[welcome] Resultado da instalação: ${outcome}`);
                window.deferredPrompt = null;
            }
            // Após a interação (ou se não for instalável), avança para a próxima etapa.
            showNotificationsStep();
        });

        // Lógica do clique no segundo botão (Notificações)
        notificationsButton.addEventListener('click', async () => {
            console.log('[welcome] Solicitando permissão de notificação...');
            try {
                const permissionResult = await Notification.requestPermission();
                console.log(`[welcome] Resultado da permissão: ${permissionResult}`);
                
                if (permissionResult === 'granted') {
                    // Se a permissão foi concedida, inscreve o usuário
                    await subscribeUserToPush();
                }
            } catch (error) {
                console.error('[welcome] Erro ao pedir permissão de notificação:', error);
            } finally {
                // Após a interação, redireciona para o app.
                redirectToApp();
            }
        });

        // Função para inscrever o usuário (copiada de script.js)
        async function subscribeUserToPush() {
            try {
                const registration = await navigator.serviceWorker.ready;
                const VAPID_PUBLIC_KEY_RESPONSE = await fetch('/api/vapid-public-key');
                if (!VAPID_PUBLIC_KEY_RESPONSE.ok) throw new Error('Falha ao buscar chave VAPID.');
                
                const VAPID_PUBLIC_KEY = await VAPID_PUBLIC_KEY_RESPONSE.text();
                if (!VAPID_PUBLIC_KEY) throw new Error('Chave VAPID vazia.');

                const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });

                await fetch('/api/subscribe-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription),
                });
                console.log('[welcome] Inscrição Push enviada com sucesso.');
            } catch (error) {
                console.error('[welcome] Falha ao inscrever para notificações:', error);
                // Não bloqueia o usuário, apenas loga o erro.
            }
        }

        function urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    </script>
</body>
</html>
