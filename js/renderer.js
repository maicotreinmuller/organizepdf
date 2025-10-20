// Arquivo principal com funções de ajuda
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar estado da aplicação
    if (!window.appState) {
        window.appState = {
            pages: [],
            selectedPages: new Set(),
            viewMode: 'grid'
        };
    }

    // Configurar modo de visualização inicial
    setViewMode('grid');
    
    // Atualizar status inicial
    Utils.updateStatus();
    
    // Configurar theme toggle moderno
    setupModernThemeToggle();
    
    console.log('PDF Editor - Organizador Avançado inicializado!');
});

// Configurar theme toggle moderno
function setupModernThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const currentTheme = document.body.getAttribute('data-theme');
        themeToggle.checked = currentTheme === 'light';
        
        themeToggle.addEventListener('change', function() {
            toggleTheme();
        });
    }
}

// Função para salvar organizado
function saveOrganized() {
    if (!window.appState || window.appState.pages.length === 0) {
        alert('Nenhuma página para salvar');
        return;
    }
    
    if (window.exportManager) {
        window.exportManager.exportFullPDF();
    }
}

// Funções de modal de ajuda
function openHelpModal() {
    document.getElementById('helpModal').classList.add('active');
}

function closeHelpModal() {
    document.getElementById('helpModal').classList.remove('active');
}

// Funções globais necessárias
function openFiles() {
    document.getElementById('fileInput').click();
}

// Eventos de keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+O - Abrir arquivos
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openFiles();
    }
    
    // Ctrl+A - Selecionar todas as páginas
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && window.appState && window.appState.pages.length > 0) {
        e.preventDefault();
        selectAllPages();
    }
    
    // Delete - Excluir páginas selecionadas
    if (e.key === 'Delete' && window.appState && window.appState.selectedPages.size > 0) {
        e.preventDefault();
        deleteSelected();
    }
    
    // Ctrl+E - Exportar selecionadas
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && window.appState && window.appState.selectedPages.size > 0) {
        e.preventDefault();
        openExportModal();
    }

     if ((e.ctrlKey || e.metaKey) && e.key === 'd' && window.appState && window.appState.pages.length > 0) {
        e.preventDefault();
        openFullDocumentViewer();
    }
    
    // Espaço - Abrir visualizador
    if (e.key === ' ' && window.appState && window.appState.pages.length > 0) {
        e.preventDefault();
        openFullDocumentViewer(); // Agora abre o visualizador completo
    }
    
    // Escape - Fechar modais
    if (e.key === 'Escape') {
        Utils.closeModal();
        if (window.documentViewer && window.documentViewer.isOpen) {
            window.documentViewer.close();
        }
        if (window.singlePageViewer && window.singlePageViewer.isOpen) {
            window.singlePageViewer.close();
        }
    }
    
    // Espaço - Abrir visualizador
    if (e.key === ' ' && window.appState && window.appState.pages.length > 0) {
        e.preventDefault();
        if (window.documentViewer) {
            window.documentViewer.open();
        }
    }
    
    // Escape - Fechar modais
    if (e.key === 'Escape') {
        Utils.closeModal();
        if (window.documentViewer && window.documentViewer.isOpen) {
            closeDocumentViewer();
        }
    }
    
    // 1 - Modo grade
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey && window.appState && window.appState.pages.length > 0) {
        setViewMode('grid');
    }
    
    // 2 - Modo lista
    if (e.key === 'l' && !e.ctrlKey && !e.metaKey && window.appState && window.appState.pages.length > 0) {
        setViewMode('list');
    }
});

function openInfoModal() {
    const modal = document.getElementById('infoModal');
    const body = document.getElementById('infoModalBody');
    modal.style.display = 'block';
    body.innerHTML = '<div style="padding:32px; text-align:center;"><b>Carregando informações...</b></div>';

    fetch('info.html')
      .then(resp => resp.text())
      .then(html => {
          let temp = document.createElement('html');
          temp.innerHTML = html;

          // Extrai o style do info.html
          const styleTag = temp.querySelector('style');
          let style = '';
          if (styleTag) {
              style = `<style>${styleTag.innerHTML}</style>`;
          }

          // Extrai o conteúdo principal
          const header = temp.querySelector('.header');
          const tools = temp.querySelector('.tools-container');
          const footer = temp.querySelector('.footer');
          let main = '';
          if (header && tools && footer) {
              main = header.outerHTML + tools.outerHTML + footer.outerHTML;
          } else {
              main = temp.body ? temp.body.innerHTML : html; // Fallback
          }

          // Monta tudo no modal
          body.innerHTML = `
            ${style}
            <div style="padding:24px">
                ${main}
                <hr style="margin:32px 0;">

                <!-- (Opcional: atalhos extras do próprio index.html, se quiser) -->
                <div>
                    <h2 style="margin-bottom:16px"><i class="fas fa-question-circle"></i> Atalhos e Dicas Rápidas</h2>
                    <div class="help-content">
                        <div class="help-section">
                            <h3><i class="fas fa-keyboard"></i> Atalhos do Teclado</h3>
                            <div class="shortcut-list">
                                <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>O</kbd> <span>Abrir arquivos</span></div>
                                <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>A</kbd> <span>Selecionar todas as páginas</span></div>
                                <div class="shortcut-item"><kbd>Delete</kbd> <span>Excluir páginas selecionadas</span></div>
                                <div class="shortcut-item"><kbd>Ctrl</kbd> + <kbd>E</kbd> <span>Exportar selecionadas</span></div>
                                <div class="shortcut-item"><kbd>Espaço</kbd> <span>Abrir visualizador</span></div>
                                <div class="shortcut-item"><kbd>Esc</kbd> <span>Fechar modais</span></div>
                                <div class="shortcut-item"><kbd>G</kbd> <span>Modo grade</span></div>
                                <div class="shortcut-item"><kbd>L</kbd> <span>Modo lista</span></div>
                            </div>
                        </div>
                        <div class="help-section">
                            <h3><i class="fas fa-info-circle"></i> Formatos Suportados</h3>
                            <div class="format-list">
                                <span class="format-tag">PDF</span>
                                <span class="format-tag">JPEG</span>
                                <span class="format-tag">PNG</span>
                                <span class="format-tag">GIF</span>
                                <span class="format-tag">WEBP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          `;
      });
}
function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}