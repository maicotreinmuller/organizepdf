class SinglePageViewer {
    constructor() {
        this.isOpen = false;
        this.currentPageData = null;
        this.currentIndex = -1;
        this.isTransitioning = false;
        this.renderScale = 2.5;
    }

    async openPage(pageIndex) {
        if (!window.appState || !window.appState.pages[pageIndex]) {
            console.error('Página não encontrada:', pageIndex);
            return;
        }

        this.currentIndex = pageIndex;
        this.currentPageData = window.appState.pages[pageIndex];
        this.isOpen = true;

        this.createModal();
        this.showModal();

        await this.renderPage();
        this.setupEventListeners();
    }

    createModal() {
        const existingModal = document.getElementById('singlePageModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'singlePageModal';
        modal.className = 'modal single-page-modal';
        modal.innerHTML = `
            <div class="modal-content fullscreen windows-viewer">
                <div class="windows-titlebar">
                    <div class="titlebar-left">
                        <div class="titlebar-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <span class="titlebar-title" id="singlePageInfo">Visualizador de Documentos</span>
                    </div>
                    
                    <div class="titlebar-controls">
                        <button class="titlebar-btn close-btn" onclick="window.singlePageViewer.close()" data-tooltip="Fechar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="single-viewer-container" id="singleViewerContainer">
                    <div class="single-page-wrapper" id="singlePageWrapper"></div>
                </div>

                <div class="single-viewer-footer">
                    <div class="navigation-controls">
                        <button class="viewer-btn" onclick="window.singlePageViewer.previousPage()" data-tooltip="Página anterior (←)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="page-counter" id="singlePageCounter">1 / 1</span>
                        <button class="viewer-btn" onclick="window.singlePageViewer.nextPage()" data-tooltip="Próxima página (→)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showModal() {
        const modal = document.getElementById('singlePageModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    close() {
        const modal = document.getElementById('singlePageModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }
        
        this.isOpen = false;
        this.currentPageData = null;
        this.currentIndex = -1;
        this.removeEventListeners();
    }

    async renderPage() {
        if (!this.currentPageData || this.isTransitioning) return;

        const wrapper = document.getElementById('singlePageWrapper');
        if (!wrapper) return;

        try {
            this.isTransitioning = true;

            // Criar novo canvas invisível
            const newCanvas = document.createElement('canvas');
            newCanvas.className = 'single-page-canvas';
            newCanvas.style.opacity = '0';
            newCanvas.style.position = 'absolute';

            const viewport = this.currentPageData.page.getViewport({ 
                scale: this.renderScale,
                rotation: 0
            });

            newCanvas.width = viewport.width;
            newCanvas.height = viewport.height;

            // Renderizar página completamente antes de mostrar
            const context = newCanvas.getContext('2d');
            await this.currentPageData.page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Pegar canvas antigo
            const oldCanvas = wrapper.querySelector('.single-page-canvas');

            // Adicionar novo canvas ao wrapper
            wrapper.appendChild(newCanvas);

            // Aguardar um frame para garantir que o canvas foi adicionado
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Fade out do antigo e fade in do novo simultaneamente
            if (oldCanvas) {
                oldCanvas.style.transition = 'opacity 0.3s ease';
                oldCanvas.style.opacity = '0';
            }

            newCanvas.style.transition = 'opacity 0.3s ease';
            newCanvas.style.opacity = '1';

            // Remover canvas antigo após transição
            setTimeout(() => {
                if (oldCanvas && oldCanvas.parentNode) {
                    oldCanvas.remove();
                }
                newCanvas.style.position = 'relative';
                this.isTransitioning = false;
            }, 300);

            this.updatePageInfo();
            this.updateNavigation();

        } catch (error) {
            console.error('Erro ao renderizar página:', error);
            this.isTransitioning = false;
        }
    }

    async previousPage() {
        if (this.currentIndex > 0 && !this.isTransitioning) {
            this.currentIndex--;
            this.currentPageData = window.appState.pages[this.currentIndex];
            await this.renderPage();
        }
    }

    async nextPage() {
        if (this.currentIndex < window.appState.pages.length - 1 && !this.isTransitioning) {
            this.currentIndex++;
            this.currentPageData = window.appState.pages[this.currentIndex];
            await this.renderPage();
        }
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('singlePageInfo');
        if (pageInfo && this.currentPageData) {
            const fileName = this.currentPageData.fileName || 'Documento';
            const pageNum = this.currentPageData.pageNum || (this.currentIndex + 1);
            pageInfo.textContent = `${fileName} - Página ${pageNum}`;
        }
    }

    updateNavigation() {
        const pageCounter = document.getElementById('singlePageCounter');
        if (pageCounter) {
            pageCounter.textContent = `${this.currentIndex + 1} / ${window.appState.pages.length}`;
        }

        const prevBtn = document.querySelector('[onclick="window.singlePageViewer.previousPage()"]');
        const nextBtn = document.querySelector('[onclick="window.singlePageViewer.nextPage()"]');
        
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === window.appState.pages.length - 1;
    }

    setupEventListeners() {
        this.keydownHandler = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.keydownHandler);
    }

    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextPage();
                break;
        }
    }
}

// Instância global
window.singlePageViewer = new SinglePageViewer();