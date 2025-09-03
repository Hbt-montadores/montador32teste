--- START OF FILE public/script.js ---
// public/script.js - Versão Final com Correção de Sintaxe no PDF e Notificações Push

// ===================================================================
// SEÇÃO 1: LOGGING DE ERROS DO CLIENTE E SERVICE WORKER
// ===================================================================

function logErrorToServer(level, message) {
  const errorLevel = level || 'error';
  const errorMessage = message || 'Mensagem de erro não fornecida.';
  
  try {
    navigator.sendBeacon('/api/log-error', JSON.stringify({ level: errorLevel, message: errorMessage }));
  } catch (e) {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: errorLevel, message: errorMessage }),
      keepalive: true
    }).catch(console.error);
  }
}

window.onerror = function(message, source, lineno, colno, error) {
  const errorMessage = `[FRONTEND ERROR] Erro não capturado: ${message} em ${source}:${lineno}:${colno}. Stack: ${error ? error.stack : 'N/A'}`;
  logErrorToServer('error', errorMessage);
  return false;
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[FRONTEND] Service Worker registrado com sucesso no app.html.'))
      .catch(err => logErrorToServer('error', `[FRONTEND ERROR] Falha ao registrar Service Worker: ${err.message}`));
  });
}


// ===================================================================
// SEÇÃO 2: LÓGICA PRINCIPAL DA APLICAÇÃO
// ===================================================================

let currentStep = 1;
let elements = {};
let loadingInterval;
let sermonData = {};

const longSermonMessages = [
    "Consultando as referências e o contexto bíblico...",
    "Estruturando a espinha dorsal da sua mensagem...",
    "Definindo os pontos principais e a sequência lógica...",
    "Esboçando a introdução para capturar a atenção...",
    "Aprofundando na exegese para uma base sólida...",
    "Desenvolvendo cada ponto com clareza e profundidade...",
    "Buscando ilustrações e aplicações práticas...",
    "Construindo uma conclusão impactante para sua mensagem...",
    "Quase pronto! Polindo os detalhes finais do seu sermão."
];

window.addEventListener('load', () => {
  if (document.getElementById('step-container')) {
    elements = {
        stepContainer: document.getElementById('step-container'),
        question: document.getElementById('question'),
        inputArea: document.getElementById('input-area'),
        userInput: document.getElementById('user-input'),
        options: document.getElementById('options'),
        loading: document.getElementById('loading'),
        loadingText: document.getElementById('loading-text'),
        sermonResult: document.getElementById('sermon-result'),
        errorContainer: document.getElementById('error-container'),
        // NOVO: Adiciona o botão de notificações
        enableNotificationsButton: document.getElementById('enable-notifications-button') 
    };
    startNewSermon();
    // NOVO: Inicializa a lógica de notificações push
    initializePushNotifications();
  }
});

function startNewSermon() {
  currentStep = 1;
  sermonData = {};
  if (!elements || !elements.question) return;

  elements.question.innerText = 'Qual será o tema do seu sermão?';
  elements.userInput.value = '';
  elements.options.innerHTML = '';
  
  elements.stepContainer.style.display = 'block';
  elements.inputArea.style.display = 'block';
  elements.options.style.display = 'none';
  elements.sermonResult.style.display = 'none';
  elements.loading.style.display = 'none';
  elements.errorContainer.style.display = 'none';

  if (elements.loadingText) elements.loadingText.textContent = "Gerando sermão, por favor aguarde...";
  clearInterval(loadingInterval);
}

function handleFetchError(error) {
    const errorMessage = `[FRONTEND ERROR] Erro na comunicação com o servidor: ${JSON.stringify(error)}`;
    logErrorToServer('error', errorMessage);

    elements.loading.style.display = 'none';
    elements.stepContainer.style.display = 'none';
    
    let errorHTML;
    if (error && error.renewal_url) {
        errorHTML = `
            <h2>Atenção!</h2>
            <p style="font-size: 1.2em; color: #D32F2F; margin-bottom: 20px;">${error.message}</p>
            <a href="${error.renewal_url}" target="_blank" class="action-button" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; font-size: 1.5em; border-radius: 8px; display: inline-block; margin-top: 10px;">LIBERAR ACESSO</a>
            <br><br><button onclick="startNewSermon()" style="margin-top: 20px;">Voltar ao Início</button>`;
    } else {
        errorHTML = `
            <h2>Ocorreu um Erro Inesperado</h2>
            <p>Não foi possível continuar. Por favor, verifique sua conexão ou tente novamente mais tarde.</p>
            <button onclick="startNewSermon()">Tentar Novamente</button>`;
    }

    elements.errorContainer.innerHTML = errorHTML;
    elements.errorContainer.style.display = 'block';
}

function nextStep(response) {
  let userResponse = response;
  
  if (!userResponse) {
    if (elements.userInput && elements.userInput.value.trim() !== '') {
      userResponse = elements.userInput.value.trim();
    } else {
      alert("Por favor, insira o tema do sermão.");
      return;
    }
  }

  if(currentStep === 1) sermonData.topic = userResponse;
  if(currentStep === 2) sermonData.audience = userResponse;
  if(currentStep === 3) sermonData.sermonType = userResponse;
  if(currentStep === 4) sermonData.duration = userResponse;

  if (currentStep === 4) {
    generateSermon(userResponse);
    return;
  }
  
  elements.stepContainer.style.display = 'none';
  elements.loading.style.display = 'block';

  fetch('/api/next-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: currentStep, userResponse: userResponse })
  })
  .then(res => {
    elements.loading.style.display = 'none';
    if (!res.ok) { return res.json().then(err => { throw err; }); }
    return res.json();
  })
  .then(data => {
    if (data.question) {
      currentStep = data.step;
      displayQuestion(data);
    } else { throw new Error('Resposta inválida do servidor.'); }
  })
  .catch(handleFetchError);
}

function displayQuestion(data) {
  elements.question.innerText = data.question;
  elements.inputArea.style.display = 'none';
  
  elements.options.innerHTML = ''; 
  data.options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option-button';
    button.innerText = option;
    button.onclick = () => nextStep(option);
    elements.options.appendChild(button);
  });
  elements.options.style.display = 'block';
  elements.stepContainer.style.display = 'block';
}

function generateSermon(userResponse) {
  elements.stepContainer.style.display = 'none';
  elements.loading.style.display = 'block';

  const longSermonTriggers = ["Entre 40 e 50 min", "Entre 50 e 60 min", "Acima de 1 hora"];
  if (longSermonTriggers.includes(userResponse)) {
    elements.loadingText.textContent = "Você escolheu um sermão mais longo. A preparação pode levar um pouco mais de tempo...";
    
    let messageIndex = 0;
    setTimeout(() => {
        elements.loadingText.textContent = longSermonMessages[messageIndex];
        loadingInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % longSermonMessages.length;
            elements.loadingText.textContent = longSermonMessages[messageIndex];
        }, 7000); 
    }, 4000);
  } else {
    elements.loadingText.textContent = "Gerando seu sermão, por favor aguarde...";
  }

  fetch('/api/next-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 4, userResponse: userResponse })
  })
  .then(res => {
      clearInterval(loadingInterval);
      elements.loading.style.display = 'none';
      if (!res.ok) { return res.json().then(err => { throw err; }); }
      return res.json();
  })
  .then(data => {
      if (data.sermon) {
          const formattedSermon = data.sermon.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
          elements.sermonResult.innerHTML = `
              <h2>Seu Sermão está Pronto!</h2>
              <div class="sermon-content">${formattedSermon}</div>
              <div class="sermon-actions">
                <button onclick="saveAsPdf()">Salvar</button>
                <button onclick="startNewSermon()">Novo</button>
              </div>`;
          elements.sermonResult.style.display = 'block';
      } else { throw new Error('Resposta final inválida do servidor.'); }
  })
  .catch(handleFetchError);
}

function saveAsPdf() {
  const sermonContent = document.querySelector('.sermon-content');
  if (!sermonContent) {
    logErrorToServer('error', '[FRONTEND ERROR] Elemento .sermon-content não encontrado para salvar PDF.');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const htmlContent = sermonContent.innerHTML;
    const margin = 10;
    const fontSize = 16;
    const lineHeight = 8;
    const usableWidth = doc.internal.pageSize.getWidth() - (margin * 2);

    const textLines = htmlContent
      .replace(/<strong>(.*?)<\/strong>/g, 'NEG:$1:NEG')
      .split('<br>');

    let y = margin;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(fontSize);

    textLines.forEach(line => {
      const segments = line.split(/NEG:|:NEG/);
      let isBold = false;
      
      segments.forEach(segment => {
        if (!segment) return;
        doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
        const splitText = doc.splitTextToSize(segment, usableWidth);
        
        splitText.forEach(textLine => {
          if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(textLine, margin, y);
          y += lineHeight;
        });
        isBold = !isBold;
      });
    });

    let fileName = sermonData.topic || 'meu_sermao';
    fileName = fileName.replace(/[\\/:*?"<>|]/g, '').trim();
    fileName = fileName.substring(0, 50);

    doc.save(`${fileName}.pdf`);
    logErrorToServer('info', `[FRONTEND INFO] Usuário salvou o sermão "${fileName}.pdf"`);

  } catch (error) {
    console.error('[FRONTEND ERROR] Erro ao gerar PDF:', error);
    logErrorToServer('error', `[FRONTEND ERROR] Falha ao gerar PDF: ${error.message}`);
    alert('Ocorreu um erro ao gerar o PDF. A funcionalidade pode não ser compatível com seu navegador. Tente salvar o texto manualmente.');
  }
}

// ===================================================================
// SEÇÃO 3: LÓGICA DE NOTIFICAÇÕES PUSH (NOVO)
// ===================================================================

// Converte a chave VAPID pública do Base64 URL Safe para um Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function initializePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[FRONTEND] Notificações Push não suportadas neste navegador.');
    if (elements.enableNotificationsButton) {
      elements.enableNotificationsButton.style.display = 'none';
    }
    return;
  }

  if (Notification.permission === 'denied') {
    console.warn('[FRONTEND] Permissão de notificação negada pelo usuário.');
    if (elements.enableNotificationsButton) {
      elements.enableNotificationsButton.style.display = 'none';
    }
    return;
  }

  if (elements.enableNotificationsButton) {
    elements.enableNotificationsButton.style.display = 'block';
    elements.enableNotificationsButton.addEventListener('click', subscribeUserToPush);
    
    // Verifica se já está inscrito e atualiza o texto do botão
    navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            elements.enableNotificationsButton.innerText = 'Notificações Ativadas';
            elements.enableNotificationsButton.disabled = true;
            elements.enableNotificationsButton.style.backgroundColor = '#4CAF50';
        }
    });
  }
}

async function subscribeUserToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const VAPID_PUBLIC_KEY_RESPONSE = await fetch('/api/vapid-public-key');
    if (!VAPID_PUBLIC_KEY_RESPONSE.ok) {
        throw new Error('Falha ao buscar a chave VAPID do servidor.');
    }
    const VAPID_PUBLIC_KEY = await VAPID_PUBLIC_KEY_RESPONSE.text();

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('[FRONTEND] Inscrição Push realizada:', subscription);

    // Envia a inscrição para o seu backend
    const response = await fetch('/api/subscribe-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (response.ok) {
      console.log('[FRONTEND] Inscrição Push enviada com sucesso para o servidor.');
      alert('Notificações ativadas com sucesso!');
      if (elements.enableNotificationsButton) {
        elements.enableNotificationsButton.innerText = 'Notificações Ativadas';
        elements.enableNotificationsButton.disabled = true;
        elements.enableNotificationsButton.style.backgroundColor = '#4CAF50';
      }
    } else {
      const errorText = await response.text();
      console.error('[FRONTEND ERROR] Falha ao enviar a inscrição Push para o servidor:', errorText);
      alert('Erro ao ativar notificações. Por favor, tente novamente.');
    }

  } catch (error) {
    console.error('[FRONTEND ERROR] Erro ao inscrever o usuário para Push Notificações:', error);
    if (Notification.permission === 'denied') {
      alert('Você negou a permissão para notificações. Para ativá-las, mude as configurações do seu navegador.');
    } else {
      alert('Erro ao ativar notificações. Por favor, tente novamente mais tarde.');
    }
    if (elements.enableNotificationsButton) {
        elements.enableNotificationsButton.style.display = 'none'; // Esconde o botão em caso de erro grave ou negação.
    }
  }
}
--- END OF FILE public/script.js ---
