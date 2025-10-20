// Gerenciamento de drag and drop (CORRIGIDO)
class DragDropManager {
    constructor() {
        this.draggedPage = null; // Usado para arrastar uma única página
        this.draggedPages = []; // Usado para arrastar múltiplas páginas
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

        // CORREÇÃO: Lógica para arrastar múltiplas páginas ou uma única
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
        
        // Criar imagem de drag personalizada para manter o tamanho
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
        
        // CORREÇÃO: Mover todas as páginas selecionadas
        if (this.draggedPages.length > 0) {
            
            // Re-ordena o array para remover do último para o primeiro (evita problemas de índice)
            const pagesToRemove = this.draggedPages.sort((a, b) => b - a);
            const movedPages = [];
            
            // Remove as páginas do array principal e armazena-as
            pagesToRemove.forEach(index => {
                movedPages.unshift(window.appState.pages.splice(index, 1)[0]);
            });

            // Ajusta o índice de destino, pois as páginas anteriores foram removidas
            let adjustedTargetIndex = targetIndex;
            pagesToRemove.forEach(index => {
                if (index < targetIndex) {
                    adjustedTargetIndex--;
                }
            });

            // Insere as páginas movidas na nova posição
            window.appState.pages.splice(adjustedTargetIndex, 0, ...movedPages);
            
            // Atualiza a seleção
            window.appState.selectedPages.clear();
            for (let i = 0; i < movedPages.length; i++) {
                window.appState.selectedPages.add(adjustedTargetIndex + i);
            }

            // Renderiza e atualiza a interface
            window.pageRenderer.renderPages();
            window.selectionManager.updateVisuals();
        }
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.draggedPage = null;
        this.draggedPages = []; // Limpa o array de páginas arrastadas
    }
}

// Instância global
window.dragDropManager = new DragDropManager();