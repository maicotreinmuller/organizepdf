// Sistema de limpeza simplificado
class ClearManager {
    constructor() {
        // Classe simplificada
    }

    async performClear() {
        Utils.showProgress();
        Utils.updateProgressWithDetails(0, 'Carregando', 0, 1);

        try {
            // Simular progresso de limpeza
            for (let i = 0; i <= 100; i += 10) {
                Utils.updateProgressWithDetails(i, 'Carregando', 1, 1);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Executar limpeza
            await this.clearAppState();
            await this.clearFileStorage();
            await this.clearInterface();
            await this.resetVisualSettings();

            Utils.hideProgress();

        } catch (error) {
            console.error('Erro durante a limpeza:', error);
            Utils.hideProgress();
            alert('Erro durante a limpeza: ' + error.message);
        }
    }

    async clearAppState() {
        if (window.appState) {
            window.appState.pages = [];
            window.appState.selectedPages = new Set();
            window.appState.viewMode = 'grid';
        }
    }

    async clearFileStorage() {
        if (window.fileHandler) {
            window.fileHandler.clearLoadedFiles();
        }
    }

    async clearInterface() {
        const pagesGrid = document.getElementById('pagesGrid');
        if (pagesGrid) {
            pagesGrid.innerHTML = '';
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async resetVisualSettings() {
        setViewMode('grid');
        Utils.updateStatus();
    }

    async quickClear() {
        if (!window.appState || window.appState.pages.length === 0) {
            return;
        }
        await this.performClear();
    }
}

// Instância global
window.clearManager = new ClearManager();

function openClearModal() {
    window.clearManager.quickClear();
}

function quickClear() {
    window.clearManager.quickClear();
}