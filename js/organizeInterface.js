// Gerenciamento da interface organizada
class OrganizeInterface {
    constructor() {
        this.isInitialized = false;
        this.buttonsEnabled = false;
        this.dragOverlay = null;
        this.currentView = 'grid';
        this.animationDuration = 150;
    }

    initialize() {
        if (this.isInitialized) return;
        
        this.setupDragAndDrop();
        this.setupButtonStates();
        this.setupKeyboardShortcuts();
        this.setupViewTransitions();
        this.setupResponsiveMenu();
        this.isInitialized = true;
        
        console.log('🎨 Organize Interface initialized!');
    }

    // ==========================================
    // CONFIGURAÇÃO DE DRAG AND DROP
    // ==========================================

    setupDragAndDrop() {
        const content = document.querySelector('.organize-content');
        if (!content) return;

        content.addEventListener('dragover', this.handleDragOver.bind(this));
        content.addEventListener('dragleave', this.handleDragLeave.bind(this));
        content.addEventListener('drop', this.handleDrop.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // DETECÇÃO AVANÇADA: Verificar tipos de dados
        const dataTypes = Array.from(e.dataTransfer.types || []);
        const hasFileType = dataTypes.includes('Files');
        const hasPageDrag = dataTypes.includes('text/plain') && document.querySelector('.page-item.dragging');
        
        // Se é drag de página interna, ignorar
        if (hasPageDrag || !hasFileType) {
            return;
        }
        
        // Só continuar se realmente tem arquivos sendo arrastados
        const content = e.currentTarget;
        content.classList.add('drag-over');
        
        const emptyState = document.getElementById('emptyState');
        if (emptyState && !emptyState.classList.contains('hidden')) {
            emptyState.style.transform = 'scale(1.02)';
            emptyState.style.transition = 'transform 0.2s ease';
        }
    }

    handleDragLeave(e) {
        const content = e.currentTarget;
        const rect = content.getBoundingClientRect();
        
        // Verificar se realmente saiu da área
        if (e.clientX < rect.left || e.clientX >= rect.right || 
            e.clientY < rect.top || e.clientY >= rect.bottom) {
            content.classList.remove('drag-over');
            
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.transform = '';
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const content = e.currentTarget;
        content.classList.remove('drag-over');
        
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.transform = '';
        }

        // Processar arquivos dropped
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            window.fileHandler.processMultipleFiles(files);
        }
    }

    // ==========================================
    // GERENCIAMENTO DE ESTADOS DOS BOTÕES
    // ==========================================

    setupButtonStates() {
        // Inicialmente apenas botão de adicionar arquivos ativo
        this.disableAllMenuButtons();
        this.enableButton('openFiles');
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    enableMenuButtons() {
        this.buttonsEnabled = true;
        const menuButtons = document.querySelectorAll('#editingTools .menu-btn, #exportTools .menu-btn');
        const clearButton = document.querySelector('.menu-btn.danger');
        
        menuButtons.forEach(btn => {
            btn.classList.remove('disabled');
            btn.disabled = false;
        });

        if (clearButton) {
            clearButton.classList.remove('disabled');
            clearButton.disabled = false;
        }

        // Animação de habilitação
        menuButtons.forEach((btn, index) => {
            setTimeout(() => {
                btn.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            }, index * 50);
        });

        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    disableAllMenuButtons() {
        this.buttonsEnabled = false;
        const menuButtons = document.querySelectorAll('#editingTools .menu-btn, #exportTools .menu-btn');
        const clearButton = document.querySelector('.menu-btn.danger');
        
        menuButtons.forEach(btn => {
            btn.classList.add('disabled');
            btn.disabled = true;
        });

        if (clearButton) {
            clearButton.classList.add('disabled');
            clearButton.disabled = true;
        }

        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    enableButton(buttonFunction) {
        const buttonMap = {
            'openFiles': '[onclick="openFiles()"]',
            'selectAllPages': '[onclick="selectAllPages()"]',
            'deleteSelected': '[onclick="deleteSelected()"]',
            'openExportModal': '[onclick="openExportModal()"]',
            'exportFullPDF': '[onclick="exportFullPDF()"]',
            'openConvertModal': '[onclick="openConvertModal()"]',
            'openClearModal': '[onclick="openClearModal()"]',
            'openDocumentViewer': '[onclick="openDocumentViewer()"]'
        };

        const selector = buttonMap[buttonFunction];
        if (selector) {
            const button = document.querySelector(selector);
            if (button) {
                button.classList.remove('disabled');
                button.disabled = false;
            }
        }
    }

    // Método para atualizar o estado do botão Split
    updateSplitButtonState() {
        const splitButton = document.getElementById('splitBtn');
        if (!splitButton) return;
        if (!window.appState || window.appState.pages.length === 0) {
            splitButton.classList.add('disabled');
            splitButton.disabled = true;
            splitButton.setAttribute('aria-disabled', 'true');
            splitButton.setAttribute('tabindex', '-1');
        } else {
            splitButton.classList.remove('disabled');
            splitButton.disabled = false;
            splitButton.removeAttribute('aria-disabled');
            splitButton.removeAttribute('tabindex');
        }
    }

    // Método para atualizar botões de seleção (exportar/excluir)
    updateSelectionBasedButtons() {
        const exportButton = document.querySelector('[onclick="openExportModal()"]');
        const deleteButton = document.querySelector('[onclick="deleteSelected()"]');
        const convertButton = document.querySelector('[onclick="openConvertModal()"]');
        const hasSelection = window.appState && window.appState.selectedPages.size > 0;
        const hasPages = window.appState && window.appState.pages.length > 0;

        if (exportButton) {
            if (!hasPages || !hasSelection) {
                exportButton.classList.add('disabled');
                exportButton.disabled = true;
                exportButton.setAttribute('aria-disabled', 'true');
                exportButton.setAttribute('tabindex', '-1');
            } else {
                exportButton.classList.remove('disabled');
                exportButton.disabled = false;
                exportButton.removeAttribute('aria-disabled');
                exportButton.removeAttribute('tabindex');
            }
        }
        if (convertButton) {
            if (!hasPages || !hasSelection) {
                convertButton.classList.add('disabled');
                convertButton.disabled = true;
                convertButton.setAttribute('aria-disabled', 'true');
                convertButton.setAttribute('tabindex', '-1');
            } else {
                convertButton.classList.remove('disabled');
                convertButton.disabled = false;
                convertButton.removeAttribute('aria-disabled');
                convertButton.removeAttribute('tabindex');
            }
        }
        if (deleteButton) {
            if (!hasPages || !hasSelection) {
                deleteButton.classList.add('disabled');
                deleteButton.disabled = true;
                deleteButton.setAttribute('aria-disabled', 'true');
                deleteButton.setAttribute('tabindex', '-1');
            } else {
                deleteButton.classList.remove('disabled');
                deleteButton.disabled = false;
                deleteButton.removeAttribute('aria-disabled');
                deleteButton.removeAttribute('tabindex');
            }
        }
    }

    // ==========================================
    // TRANSIÇÕES DE VISUALIZAÇÃO
    // ==========================================

    setupViewTransitions() {
        // Configurar transições suaves entre estados
        this.observeContentChanges();
    }

    observeContentChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.handleContentChange();
                }
            });
        });

        const pagesGrid = document.getElementById('pagesGrid');
        if (pagesGrid) {
            observer.observe(pagesGrid, { childList: true });
        }
    }

    handleContentChange() {
        const emptyState = document.getElementById('emptyState');
        const pagesContainer = document.getElementById('pagesContainer');
        
        if (window.appState && window.appState.pages.length > 0) {
            this.showPagesView();
        } else {
            this.showEmptyState();
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const pagesContainer = document.getElementById('pagesContainer');

        if (emptyState && pagesContainer) {
            // Fade out páginas
            pagesContainer.style.opacity = '0';
            pagesContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                pagesContainer.classList.add('hidden');
                emptyState.classList.remove('hidden');
                
                // Fade in estado vazio
                emptyState.style.opacity = '0';
                emptyState.style.transform = 'translateY(20px)';
                
                requestAnimationFrame(() => {
                    emptyState.style.transition = 'all 0.3s ease';
                    emptyState.style.opacity = '1';
                    emptyState.style.transform = 'translateY(0)';
                });
            }, this.animationDuration);
        }

        this.disableAllMenuButtons();
        this.enableButton('openFiles');
        this.updateFileHistory();
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    showPagesView() {
        const emptyState = document.getElementById('emptyState');
        const pagesContainer = document.getElementById('pagesContainer');

        if (emptyState && pagesContainer) {
            // Fade out estado vazio
            emptyState.style.opacity = '0';
            emptyState.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                emptyState.classList.add('hidden');
                pagesContainer.classList.remove('hidden');
                
                // Fade in páginas
                pagesContainer.style.opacity = '0';
                pagesContainer.style.transform = 'translateY(20px)';
                
                requestAnimationFrame(() => {
                    pagesContainer.style.transition = 'all 0.3s ease';
                    pagesContainer.style.opacity = '1';
                    pagesContainer.style.transform = 'translateY(0)';
                });
            }, this.animationDuration);
        }

        this.enableMenuButtons();
        this.updateFileHistory();
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    // ==========================================
    // GERENCIAMENTO DE VISUALIZAÇÃO
    // ==========================================

    setViewMode(mode) {
        if (this.currentView === mode) return;

        const grid = document.getElementById('pagesGrid');
        const viewToggles = document.querySelectorAll('.view-toggle');
        
        // Atualizar botões
        viewToggles.forEach(toggle => {
            if (toggle.dataset.view === mode) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });

        // Transição suave entre modos
        if (grid) {
            grid.style.opacity = '0.5';
            grid.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
                // Remover classes anteriores
                grid.classList.remove('grid-view', 'list-view');
                
                // Adicionar nova classe
                if (mode === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.add('grid-view');
                }
                
                // Restaurar visibilidade
                grid.style.transition = 'all 0.3s ease';
                grid.style.opacity = '1';
                grid.style.transform = 'scale(1)';
            }, 150);
        }

        this.currentView = mode;
        
        // Atualizar estado global
        if (window.appState) {
            window.appState.viewMode = mode;
        }
    }

    // ==========================================
    // ATALHOS DE TECLADO
    // ==========================================

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    handleKeyboardShortcuts(e) {
        // Ignorar se estiver em um input ou modal
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
            document.querySelector('.modal.active')) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'o':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    openFiles();
                }
                break;
                
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (this.buttonsEnabled) {
                        selectAllPages();
                    }
                }
                break;
                
            case 'delete':
            case 'backspace':
                if (this.buttonsEnabled && window.appState && window.appState.selectedPages.size > 0) {
                    e.preventDefault();
                    deleteSelected();
                }
                break;
                
            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (this.buttonsEnabled && window.appState && window.appState.selectedPages.size > 0) {
                        openExportModal();
                    }
                }
                break;
                
            case ' ':
                if (this.buttonsEnabled && window.appState && window.appState.pages.length > 0) {
                    e.preventDefault();
                    openDocumentViewer();
                }
                break;
                
            case 't':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    toggleTheme();
                }
                break;
        }
    }

    // ==========================================
    // MENU RESPONSIVO
    // ==========================================

    setupResponsiveMenu() {
        this.checkMenuOverflow();
        window.addEventListener('resize', this.checkMenuOverflow.bind(this));
    }

    checkMenuOverflow() {
        const menu = document.querySelector('.organize-bottom-menu');
        if (!menu) return;

        const viewportWidth = window.innerWidth;
        
        if (viewportWidth < 768) {
            menu.classList.add('mobile');
            this.adaptMobileMenu();
        } else {
            menu.classList.remove('mobile');
            this.restoreDesktopMenu();
        }
    }

    adaptMobileMenu() {
        const menu = document.querySelector('.organize-bottom-menu');
        if (!menu) return;

        // Reorganizar botões para mobile
        menu.style.flexDirection = 'column';
        menu.style.gap = 'var(--organize-space-2)';
        
        const sections = menu.querySelectorAll('.menu-section');
        sections.forEach(section => {
            section.style.flexDirection = 'row';
            section.style.gap = 'var(--organize-space-2)';
        });
    }

    restoreDesktopMenu() {
        const menu = document.querySelector('.organize-bottom-menu');
        if (!menu) return;

        menu.style.flexDirection = '';
        menu.style.gap = '';
        
        const sections = menu.querySelectorAll('.menu-section');
        sections.forEach(section => {
            section.style.flexDirection = '';
            section.style.gap = '';
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    updatePageCount() {
        const pageCount = document.getElementById('pageCount');
        const selectedCount = document.getElementById('selectedCount');
        
        if (pageCount && window.appState) {
            const count = window.appState.pages.length;
            pageCount.textContent = `${count} página${count !== 1 ? 's' : ''}`;
        }
        
        if (selectedCount && window.appState) {
            const count = window.appState.selectedPages.size;
            selectedCount.textContent = `${count} selecionada${count !== 1 ? 's' : ''}`;
        }
    }

    updateFileHistory() {
        // Método para atualizar histórico de arquivos (implementar se necessário)
    }

    resetInterface() {
        this.showEmptyState();
        this.disableAllMenuButtons();
        this.updateFileHistory();
        this.setViewMode('grid');
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    // ==========================================
    // MÉTODOS PÚBLICOS
    // ==========================================

    onFilesLoaded() {
        this.showPagesView();
        this.enableMenuButtons();
        this.updateFileHistory();
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    onFilesCleared() {
        this.resetInterface();
    }

    onPageSelectionChanged() {
        this.updatePageCount();
        this.updateSelectionBasedButtons();
    }

    // ==========================================
    // LIMPEZA E RESET
    // ==========================================

    cleanup() {
        // Limpar todos os elementos visuais
        this.resetInterface();
        
        // Limpar timers e animações
        const allElements = document.querySelectorAll('*[style*="transition"], *[style*="animation"]');
        allElements.forEach(el => {
            el.style.transition = '';
            el.style.animation = '';
            el.style.transform = '';
            el.style.opacity = '';
        });
        
        // Remover notificações
        const notifications = document.querySelectorAll('.organize-notification');
        notifications.forEach(notif => notif.remove());
    }

    // ==========================================
    // INTEGRAÇÃO COM OUTROS MÓDULOS
    // ==========================================

    // Método chamado quando páginas são renderizadas
    onPagesRendered() {
        // Aplicar animações de entrada
        const pageItems = document.querySelectorAll('.page-item');
        pageItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 30);
        });
        
        this.updatePageCount();
        this.updateSplitButtonState();
        this.updateSelectionBasedButtons();
    }

    // ==========================================
    // CONFIGURAÇÕES AVANÇADAS
    // ==========================================

    // Configurar velocidade das animações
    setAnimationSpeed(speed) {
        // speed: 'slow', 'normal', 'fast'
        const speeds = {
            slow: 300,
            normal: 150,
            fast: 75
        };
        
        this.animationDuration = speeds[speed] || speeds.normal;
        
        // Atualizar CSS custom properties
        document.documentElement.style.setProperty('--organize-transition', `all ${this.animationDuration}ms ease`);
    }

    // Ativar/desativar animações
    toggleAnimations(enabled = true) {
        if (enabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    }

    // Configurar notificações
    configureNotifications(config) {
        this.notificationConfig = {
            position: config.position || 'top-right',
            duration: config.duration || 3000,
            showIcons: config.showIcons !== false,
            showClose: config.showClose !== false
        };
    }

    // ==========================================
    // ACCESSIBILITY E USABILIDADE
    // ==========================================

    // Configurar modo de alto contraste
    setHighContrast(enabled = true) {
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    // Configurar redução de movimento
    setReducedMotion(enabled = true) {
        if (enabled) {
            document.body.classList.add('reduced-motion');
            this.setAnimationSpeed('fast');
        } else {
            document.body.classList.remove('reduced-motion');
            this.setAnimationSpeed('normal');
        }
    }

    // Configurar tamanho da fonte
    setFontSize(size) {
        // size: 'small', 'normal', 'large'
        const sizes = {
            small: '12px',
            normal: '14px',
            large: '16px'
        };
        
        if (sizes[size]) {
            document.documentElement.style.fontSize = sizes[size];
        }
    }

    // ==========================================
    // CLEANUP E DESTRUIÇÃO
    // ==========================================

    destroy() {
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        window.removeEventListener('resize', this.checkMenuOverflow);
        
        // Limpar content observer
        if (this.contentObserver) {
            this.contentObserver.disconnect();
        }
        
        // Limpar notificações
        const notifications = document.querySelectorAll('.organize-notification');
        notifications.forEach(notif => notif.remove());
        
        // Limpar referências
        this.dragOverlay = null;
        this.isInitialized = false;
        
        console.log('🎨 Organize Interface destroyed');
    }
}

// Instância global
window.organizeInterface = new OrganizeInterface();

// Funções globais para compatibilidade
function setViewMode(mode) {
    window.organizeInterface.setViewMode(mode);
}

function updateOrganizeInterface() {
    window.organizeInterface.updatePageCount();
    window.organizeInterface.updateFileHistory();
}

// Inicializar interface quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.organizeInterface.initialize();
});

// Hook para integração com outros módulos
window.addEventListener('load', () => {
    // Integrar com fileHandler
    if (window.fileHandler) {
        const originalProcessFiles = window.fileHandler.processMultipleFiles;
        window.fileHandler.processMultipleFiles = function(...args) {
            const result = originalProcessFiles.apply(this, args);
            window.organizeInterface.onFilesLoaded();
            return result;
        };
    }
    
    // Integrar com pageRenderer
    if (window.pageRenderer) {
        const originalRenderPages = window.pageRenderer.renderPages;
        window.pageRenderer.renderPages = function(...args) {
            const result = originalRenderPages.apply(this, args);
            window.organizeInterface.onPagesRendered();
            return result;
        };
    }
    
    // Integrar com selectionManager
    if (window.selectionManager) {
        const originalUpdateVisuals = window.selectionManager.updateVisuals;
        window.selectionManager.updateVisuals = function(...args) {
            const result = originalUpdateVisuals.apply(this, args);
            window.organizeInterface.onPageSelectionChanged();
            return result;
        };
    }
    
    // Integrar com clearManager
    if (window.clearManager) {
        const originalPerformClear = window.clearManager.performClear;
        window.clearManager.performClear = function(...args) {
            const result = originalPerformClear.apply(this, args);
            window.organizeInterface.onFilesCleared();
            return result;
        };
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrganizeInterface;
}