// Utilitários gerais simplificados
class Utils {
    static updateProgress(percentage, title, subtitle) {
        const progressFill = document.getElementById('progressFill');
        const progressTitle = document.getElementById('progressTitle');
        
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressTitle) progressTitle.textContent = title || 'Carregando';
    }

    static updateProgressWithDetails(percentage, title, current, total) {
        const progressFill = document.getElementById('progressFill');
        const progressTitle = document.getElementById('progressTitle');
        const currentProgress = document.getElementById('currentProgress');
        const totalProgress = document.getElementById('totalProgress');
        
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressTitle) progressTitle.textContent = title || 'Carregando';
        if (currentProgress) currentProgress.textContent = current || 0;
        if (totalProgress) totalProgress.textContent = total || 0;
    }

    static showProgress() {
        const overlay = document.getElementById('progressOverlay');
        if (overlay) overlay.classList.add('active');
    }

    static hideProgress() {
        const overlay = document.getElementById('progressOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    static closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    static updateStatus() {
        const pageCount = document.getElementById('pageCount');
        const selectedCount = document.getElementById('selectedCount');
        const footer = document.getElementById('organizeFooter');
        
        if (pageCount && window.appState) {
            const count = window.appState.pages.length;
            pageCount.textContent = `${count} página${count !== 1 ? 's' : ''}`;
        }
        if (selectedCount && window.appState) {
            const count = window.appState.selectedPages.size;
            selectedCount.textContent = `${count} selecionada${count !== 1 ? 's' : ''}`;
        }
        
        // Atualizar visibilidade do footer
        if (footer && window.appState) {
            if (window.appState.pages.length > 0) {
                footer.classList.remove('hidden');
            } else {
                footer.classList.add('hidden');
            }
        }
    }

    // Método para formatar tamanho de arquivo
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Método para validar tipo de arquivo
    static isValidFileType(file) {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // Método para sanitizar nome de arquivo
    static sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9\-_\.]/g, '_');
    }

    // Método para debounce
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Método para throttle
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Disponibilizar globalmente
window.Utils = Utils;