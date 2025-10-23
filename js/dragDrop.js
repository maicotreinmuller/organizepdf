// Gerenciamento de drag and drop
class DragDropManager {
    constructor() {
        this.draggedPage = null;
        this.draggedPages = [];
        this.setupFileDropZone();
    }

    setupFileDropZone() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea) {
            uploadArea.addEventListener('dragover', this.handleFileDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleFileDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        }
    }

    handleFileDragOver(e) {
        e.preventDefault();
        if (e.currentTarget.classList.contains('upload-area')) {
            e.currentTarget.classList.add('dragover');
        }
    }

    handleFileDragLeave(e) {
        if (e.currentTarget.classList.contains('upload-area')) {
            e.currentTarget.classList.remove('dragover');
        }
    }

    handleFileDrop(e) {
        e.preventDefault();
        if (e.currentTarget.classList.contains('upload-area')) {
            e.currentTarget.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            window.fileHandler.processMultipleFiles(files);
        }
    }

    handleDragStart(e) {
        const startIndex = parseInt(e.currentTarget.dataset.index);

        // Se a página clicada não estiver selecionada, limpa a seleção e seleciona apenas ela
        if (!window.appState.selectedPages.has(startIndex)) {
            window.selectionManager.clearSelection();
            window.selectionManager.selectPage(startIndex);
        }
        
        // Armazena as páginas selecionadas para arrastar
        this.draggedPages = Array.from(window.appState.selectedPages).sort((a, b) => a - b);
        
        e.currentTarget.classList.add('dragging');
        
        // Configurar dados de transferência para melhor compatibilidade
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        
        // Criar imagem de drag personalizada
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg) scale(1.05)';
        
        // Adicionar ao DOM temporariamente fora da tela
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        
        // Usar como imagem de drag
        e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
        
        // Remover após um curto delay
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 100);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        const targetIndex = parseInt(e.currentTarget.dataset.index);
        
        // ========================================
        // CORREÇÃO: Lógica completamente reescrita
        // ========================================
        
        if (this.draggedPages.length === 0) {
            return;
        }

        // Se está tentando soltar no mesmo lugar
        if (this.draggedPages.includes(targetIndex)) {
            return;
        }

        // 1. Extrair as páginas que serão movidas
        const pagesToMove = this.draggedPages.map(index => window.appState.pages[index]);
        
        // 2. Criar novo array sem as páginas selecionadas
        const remainingPages = window.appState.pages.filter((_, index) => 
            !this.draggedPages.includes(index)
        );
        
        // 3. Calcular o novo índice de destino
        // Contar quantas páginas selecionadas estão ANTES do target
        const selectedBeforeTarget = this.draggedPages.filter(index => index < targetIndex).length;
        let adjustedTargetIndex = targetIndex - selectedBeforeTarget;
        
        // Se está soltando DEPOIS de onde estavam as páginas, ajustar
        if (targetIndex > this.draggedPages[this.draggedPages.length - 1]) {
            adjustedTargetIndex = targetIndex - this.draggedPages.length + 1;
        }
        
        // Garantir que o índice está dentro dos limites
        adjustedTargetIndex = Math.max(0, Math.min(adjustedTargetIndex, remainingPages.length));
        
        // 4. Inserir as páginas movidas na nova posição
        remainingPages.splice(adjustedTargetIndex, 0, ...pagesToMove);
        
        // 5. Atualizar o estado global
        window.appState.pages = remainingPages;
        
        // 6. Atualizar a seleção para refletir as novas posições
        window.appState.selectedPages.clear();
        for (let i = 0; i < pagesToMove.length; i++) {
            window.appState.selectedPages.add(adjustedTargetIndex + i);
        }

        // 7. Renderizar e atualizar a interface
        window.pageRenderer.renderPages();
        window.selectionManager.updateVisuals();
        
        console.log(`✅ Movidas ${pagesToMove.length} página(s) para posição ${adjustedTargetIndex + 1}`);
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.draggedPage = null;
        this.draggedPages = [];
    }
}

// Instância global
window.dragDropManager = new DragDropManager();
