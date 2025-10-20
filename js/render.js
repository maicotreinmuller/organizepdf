// Renderização de páginas com correção da visualização única
class PageRenderer {
    async renderPages() {
        const grid = document.getElementById('pagesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';

        for (let i = 0; i < window.appState.pages.length; i++) {
            const pageData = window.appState.pages[i];
            const pageElement = await this.createPageElement(pageData, i);
            grid.appendChild(pageElement);
        }
        
        // Atualizar botões de seleção
        if (window.selectionManager) {
            window.selectionManager.updateSelectionButtons();
            window.selectionManager.updateToggleButton();
        }
    }

    async createPageElement(pageData, index) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-item';
        pageDiv.draggable = true;
        pageDiv.dataset.index = index;

        const canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        
        await this.renderThumbnail(canvas, pageData);

        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.innerHTML = `
            <div>Página ${pageData.pageNum}</div>
            <div>${pageData.fileName}</div>
        `;

        const fileBadge = document.createElement('div');
        fileBadge.className = 'file-badge';
        fileBadge.textContent = pageData.type.toUpperCase();
        fileBadge.title = pageData.fileName;

        pageDiv.appendChild(canvas);
        pageDiv.appendChild(pageInfo);
        pageDiv.appendChild(fileBadge);

        // Event listeners
        pageDiv.addEventListener('dragstart', window.dragDropManager.handleDragStart.bind(window.dragDropManager));
        pageDiv.addEventListener('dragover', window.dragDropManager.handleDragOver.bind(window.dragDropManager));
        pageDiv.addEventListener('drop', window.dragDropManager.handleDrop.bind(window.dragDropManager));
        pageDiv.addEventListener('dragend', window.dragDropManager.handleDragEnd.bind(window.dragDropManager));
        pageDiv.addEventListener('contextmenu', window.contextMenuManager.handleRightClick.bind(window.contextMenuManager));

        return pageDiv;
    }

    async renderThumbnail(canvas, pageData) {
        const context = canvas.getContext('2d');
        
        const originalViewport = pageData.page.getViewport({ scale: 1, rotation: 0 });
        
        const maxThumbnailSize = 120;
        const scale = Math.min(
            maxThumbnailSize / Math.max(originalViewport.width, originalViewport.height),
            window.PDFEditorConfig.compression.thumbnail
        );
        
        const finalViewport = pageData.page.getViewport({ 
            scale: scale, 
            rotation: pageData.rotation 
        });
        
        canvas.width = finalViewport.width;
        canvas.height = finalViewport.height;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        await pageData.page.render({
            canvasContext: context,
            viewport: finalViewport
        }).promise;
        
        pageData.canvas = canvas.cloneNode();
        pageData.canvas.getContext('2d').drawImage(canvas, 0, 0);
    }
}

// Instância global
window.pageRenderer = new PageRenderer();

// Função setViewMode corrigida
function setViewMode(mode) {
    if (!window.appState) {
        window.appState = {
            pages: [],
            selectedPages: new Set(),
            viewMode: 'grid'
        };
    }

    window.appState.viewMode = mode;
    const grid = document.getElementById('pagesGrid');
    
    // Atualizar botões de visualização
    const viewToggles = document.querySelectorAll('.view-toggle');
    viewToggles.forEach(toggle => {
        if (toggle.dataset.view === mode) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
    
    if (mode === 'single') {
        // CORREÇÃO: Abrir visualizador de documento em vez da grade
        if (window.documentViewer && window.appState.pages.length > 0) {
            window.documentViewer.open();
        }
    } else {
        // Fechar visualizador se estiver aberto
        if (window.documentViewer && window.documentViewer.isOpen) {
            window.documentViewer.close();
        }
        
        // Mostrar grid e aplicar classe correta
        if (grid) {
            grid.style.display = 'grid';
            
            grid.classList.remove('grid-view', 'list-view');
            
            if (mode === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.add('grid-view');
            }
        }
    }
}