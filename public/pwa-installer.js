// public/pwa-installer.js - VERSÃO DE DEPURAÇÃO

// Função auxiliar para atualizar o painel de status
function updateDebugStatus(elementId, text, color) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.style.color = color;
    }
}

// Assim que este script carrega, ele se anuncia no painel.
// Usamos um pequeno timeout para garantir que o HTML do painel já foi renderizado.
setTimeout(() => {
    updateDebugStatus('debug-listener-status', 'Sim', 'green');
}, 100);

// Esta variável guardará o evento para que possa ser usado quando o botão for clicado.
let deferredPrompt;

// Ouve o evento que o navegador dispara quando o app é instalável.
window.addEventListener('beforeinstallprompt', (e) => {
  // ATUALIZAÇÃO DE DEBUG: O evento mais importante aconteceu!
  updateDebugStatus('debug-event-status', 'Sim', 'green');
  console.log('[pwa-installer-debug] Evento "beforeinstallprompt" DISPARADO.');

  e.preventDefault();
  deferredPrompt = e;
  window.deferredPrompt = e;

  // ATUALIZAÇÃO DE DEBUG: Confirmamos que o prompt foi salvo na variável.
  updateDebugStatus('debug-capture-status', 'Sim', 'green');
  console.log('[pwa-installer-debug] Prompt de instalação CAPTURADO.');

  // Lógica antiga para o botão de instalar na página /app (mantida por segurança)
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', async () => {
      installButton.style.display = 'none';
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[pwa-installer-debug] Resultado da instalação: ${outcome}`);
        deferredPrompt = null;
        window.deferredPrompt = null;
      }
    });
  }
});
