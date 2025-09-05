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
});
