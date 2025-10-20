// Gerenciamento do menu de contexto (CORRIGIDO - Visualizar abre página única)
class ContextMenuManager {
    constructor() {
        this.currentRightClickPage = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', this.hideContextMenu.bind(this));
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    handleRightClick(e) {
        e.preventDefault();
        this.currentRightClickPage = parseInt(e.currentTarget.dataset.index);
        this.showContextMenu(e.clientX, e.clientY);
    }

    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            menu.classList.add('active');
        }
    }

    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.classList.remove('active');
        }
    }
}

// Instância global
window.contextMenuManager = new ContextMenuManager();

// CORRIGIDO: "Visualizar" agora abre visualizador de página única
function viewSinglePage() {
    window.contextMenuManager.hideContextMenu();
    
    if (window.contextMenuManager.currentRightClickPage !== null) {
        // Abrir visualizador de página única
        if (window.singlePageViewer) {
            window.singlePageViewer.openPage(window.contextMenuManager.currentRightClickPage);
        }
    }
}

// Funções existentes do menu de contexto
function rotatePage() {
    window.contextMenuManager.hideContextMenu();
    window.appState.pages[window.contextMenuManager.currentRightClickPage].rotation += 90;
    if (window.appState.pages[window.contextMenuManager.currentRightClickPage].rotation >= 360) {
        window.appState.pages[window.contextMenuManager.currentRightClickPage].rotation = 0;
    }
    window.appState.pages[window.contextMenuManager.currentRightClickPage].canvas = null;
    window.pageRenderer.renderPages();
}

function movePage() {
    window.contextMenuManager.hideContextMenu();
    const movePosition = document.getElementById('movePosition');
    if (movePosition) {
        movePosition.innerHTML = '';
        
        for (let i = 0; i < window.appState.pages.length; i++) {
            if (i !== window.contextMenuManager.currentRightClickPage) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Posição ${i + 1}`;
                movePosition.appendChild(option);
            }
        }
    }
    
    document.getElementById('moveModal').classList.add('active');
}

function confirmMove() {
    const newPosition = parseInt(document.getElementById('movePosition').value);
    const page = window.appState.pages.splice(window.contextMenuManager.currentRightClickPage, 1)[0];
    window.appState.pages.splice(newPosition, 0, page);
    window.pageRenderer.renderPages();
    Utils.closeModal();
}

function deletePage() {
    window.contextMenuManager.hideContextMenu();
    window.appState.pages.splice(window.contextMenuManager.currentRightClickPage, 1);
    window.appState.selectedPages.delete(window.contextMenuManager.currentRightClickPage);
    
    const newSelectedPages = new Set();
    for (const index of window.appState.selectedPages) {
        if (index > window.contextMenuManager.currentRightClickPage) {
            newSelectedPages.add(index - 1);
        } else {
            newSelectedPages.add(index);
        }
    }
    window.appState.selectedPages = newSelectedPages;
    
    window.pageRenderer.renderPages();
    window.selectionManager.updateVisuals();
}