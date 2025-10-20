// Gerenciamento de seleção com toggle de selecionar/desmarcar tudo
class SelectionManager {
    constructor() {
        this.lastSelectedIndex = -1;
        this.allSelected = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const pagesGrid = document.getElementById('pagesGrid');
        if (pagesGrid) {
            pagesGrid.addEventListener('click', this.handlePageClick.bind(this));
        }
    }

    handlePageClick(e) {
        const pageItem = e.target.closest('.page-item');
        if (!pageItem) return;

        const index = parseInt(pageItem.dataset.index);
        
        if (e.shiftKey && this.lastSelectedIndex !== -1) {
            this.selectRange(this.lastSelectedIndex, index);
        } else if (e.ctrlKey || e.metaKey) {
            this.toggleSelection(index);
            this.lastSelectedIndex = index;
        } else {
            this.clearSelection();
            this.selectPage(index);
            this.lastSelectedIndex = index;
        }
    }

    selectRange(start, end) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        
        window.appState.selectedPages.clear();
        
        for (let i = min; i <= max; i++) {
            window.appState.selectedPages.add(i);
        }
        this.updateVisuals();
    }

    toggleSelection(index) {
        if (window.appState.selectedPages.has(index)) {
            window.appState.selectedPages.delete(index);
        } else {
            window.appState.selectedPages.add(index);
        }
        this.updateVisuals();
    }

    selectPage(index) {
        window.appState.selectedPages.add(index);
        this.updateVisuals();
    }

    clearSelection() {
        window.appState.selectedPages.clear();
        this.allSelected = false;
        this.updateVisuals();
        this.updateToggleButton();
    }

    updateVisuals() {
        document.querySelectorAll('.page-item').forEach((item, index) => {
            if (window.appState.selectedPages.has(index)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        Utils.updateStatus();
        this.updateSelectionButtons();
        this.updateToggleButton();
    }

    updateSelectionButtons() {
        const exportBtn = document.getElementById('exportSelectedBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        
        const hasSelection = window.appState.selectedPages.size > 0;
        
        if (exportBtn) {
            exportBtn.disabled = !hasSelection;
            if (hasSelection) {
                exportBtn.classList.remove('disabled');
            } else {
                exportBtn.classList.add('disabled');
            }
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = !hasSelection;
            if (hasSelection) {
                deleteBtn.classList.remove('disabled');
            } else {
                deleteBtn.classList.add('disabled');
            }
        }
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('toggleSelectBtn');
        const toggleIcon = toggleBtn?.querySelector('i');
        
        if (!toggleBtn || !toggleIcon) return;

        const totalPages = window.appState.pages.length;
        const selectedPages = window.appState.selectedPages.size;
        
        this.allSelected = selectedPages === totalPages && totalPages > 0;
        
        if (this.allSelected) {
            toggleIcon.className = 'fas fa-square-check';
            toggleBtn.setAttribute('data-tooltip', 'Desmarcar todas');
        } else {
            toggleIcon.className = 'fas fa-check-square';
            toggleBtn.setAttribute('data-tooltip', 'Selecionar todas');
        }
    }
}

// Instância global
window.selectionManager = new SelectionManager();

// Função de toggle para selecionar/desmarcar todas
function toggleSelectAll() {
    if (!window.appState || window.appState.pages.length === 0) return;
    
    const totalPages = window.appState.pages.length;
    const selectedPages = window.appState.selectedPages.size;
    const isAllSelected = selectedPages === totalPages && totalPages > 0;
    
    if (isAllSelected) {
        // Desmarcar todas
        window.appState.selectedPages.clear();
    } else {
        // Selecionar todas
        window.appState.selectedPages.clear();
        for (let i = 0; i < totalPages; i++) {
            window.appState.selectedPages.add(i);
        }
    }
    
    window.selectionManager.updateVisuals();
}

// Manter funções antigas para compatibilidade
function selectAllPages() {
    if (window.selectionManager.allSelected) return;
    
    window.appState.selectedPages.clear();
    for (let i = 0; i < window.appState.pages.length; i++) {
        window.appState.selectedPages.add(i);
    }
    window.selectionManager.allSelected = true;
    window.selectionManager.updateVisuals();
}

function deleteSelected() {
    if (window.appState.selectedPages.size === 0) {
        alert('Nenhuma página selecionada');
        return;
    }
    
    const indices = Array.from(window.appState.selectedPages).sort((a, b) => b - a);
    indices.forEach(index => window.appState.pages.splice(index, 1));
    window.appState.selectedPages.clear();
    window.selectionManager.allSelected = false;
    window.pageRenderer.renderPages();
    window.selectionManager.updateVisuals();
}