// public/pwa-installer.js - Versão Final e Resiliente

let deferredPrompt;

// Função reutilizável para mostrar o botão de instalação se ele existir na página atual.
function showInstallButtonIfExists() {
    // Só executa se o prompt de instalação já foi capturado e guardado.
    if (window.deferredPrompt) {
        const installButtonOnAppPage = document.getElementById('install-button');
        // Verifica se o botão com o ID correto está presente no HTML da página atual.
        if (installButtonOnAppPage) {
            console.log('[pwa-installer] Botão de instalação encontrado. Exibindo...');
            installButtonOnAppPage.style.display = 'block';
            installButtonOnAppPage.addEventListener('click', () => {
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                }
            });
        }
    }
}

// Ouve o evento que o navegador dispara.
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[pwa-installer] Evento "beforeinstallprompt" capturado.');
    e.preventDefault();
    
    // Guarda o evento para ser usado depois.
    deferredPrompt = e;
    window.deferredPrompt = e;
    
    // Tenta mostrar o botão imediatamente, caso ele já esteja na tela.
    showInstallButtonIfExists();
    
    // Dispara o evento customizado para a página welcome.html.
    console.log('[pwa-installer] Disparando evento "pwa-installable".');
    window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// ADIÇÃO CRÍTICA: Ouve o carregamento de CADA página.
// Isso garante que, se o evento já foi capturado em uma página anterior (como o login),
// a função `showInstallButtonIfExists` seja executada novamente na nova página (como a /app),
// corrigindo o bug.
window.addEventListener('load', showInstallButtonIfExists);
