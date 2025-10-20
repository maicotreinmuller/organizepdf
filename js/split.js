// Sistema de divisão de PDF
class SplitManager {
    constructor() {
        this.setupModalCloseListeners();
    }
    
    // NOVO: Configurar listeners para fechar modal
    setupModalCloseListeners() {
        // Fechar modal ao clicar no X
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-close')) {
                Utils.closeModal();
                this.resetSplitModal();
            }
        });

        // Fechar modal ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                Utils.closeModal();
                this.resetSplitModal();
            }
        });

        // Fechar modal com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Utils.closeModal();
                this.resetSplitModal();
            }
        });
    }

    resetSplitModal() {
        const input = document.getElementById('pageRangeInput');
        if (input) {
            input.value = '';
        }
        const errorSpan = document.getElementById('splitError');
        if (errorSpan) {
            errorSpan.style.display = 'none';
        }
    }

    validateRange(rangeStr) {
        const errorSpan = document.getElementById('splitError');
        errorSpan.style.display = 'none';
        
        const parts = rangeStr.split('-').map(part => parseInt(part.trim()));
        
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
            errorSpan.textContent = 'Formato inválido. Use "início-fim".';
            errorSpan.style.display = 'block';
            return null;
        }

        const startPage = parts[0];
        const endPage = parts[1];
        const totalPages = window.appState.pages.length;

        if (startPage < 1 || endPage < 1 || startPage > totalPages || endPage > totalPages || startPage > endPage) {
            errorSpan.textContent = `Intervalo de páginas inválido. Use de 1 a ${totalPages}.`;
            errorSpan.style.display = 'block';
            return null;
        }
        
        return { start: startPage, end: endPage };
    }

    async performSplit() {
        const rangeStr = document.getElementById('pageRangeInput').value;
        const validRange = this.validateRange(rangeStr);

        if (!validRange) {
            return;
        }

        Utils.showProgress();
        Utils.updateProgressWithDetails(0, 'Processando', 0, 1);

        try {
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const pagesToCopy = window.appState.pages.slice(validRange.start - 1, validRange.end);
            
            // Agrupa páginas por arquivo original
            const filesToProcess = {};
            pagesToCopy.forEach(pageData => {
                if (!filesToProcess[pageData.fileId]) {
                    filesToProcess[pageData.fileId] = {
                        originalFile: window.fileHandler.fileStorage.get(pageData.fileId),
                        pageNumbers: []
                    };
                }
                filesToProcess[pageData.fileId].pageNumbers.push(pageData.pageNum);
            });

            let copiedCount = 0;
            const totalToCopy = pagesToCopy.length;
            
            for (const fileId in filesToProcess) {
                const { originalFile, pageNumbers } = filesToProcess[fileId];
                
                const originalPdfDoc = await PDFLib.PDFDocument.load(originalFile.buffer);
                
                const pageIndices = pageNumbers.map(num => num - 1);
                const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, pageIndices);
                
                copiedPages.forEach(page => {
                    newPdfDoc.addPage(page);
                    copiedCount++;
                    const progress = Math.round((copiedCount / totalToCopy) * 100);
                    Utils.updateProgressWithDetails(progress, 'Dividindo', copiedCount, totalToCopy);
                });
            }

            const newPdfBytes = await newPdfDoc.save();
            const fileName = `dividido_${validRange.start}-${validRange.end}.pdf`;
            
            // Inicia o download
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();

            Utils.hideProgress();
            Utils.closeModal();
            this.resetSplitModal();

        } catch (error) {
            console.error('Erro ao dividir arquivo:', error);
            Utils.hideProgress();
            const errorSpan = document.getElementById('splitError');
            errorSpan.textContent = 'Erro ao processar. Tente novamente.';
            errorSpan.style.display = 'block';
        }
    }
}

// Instância global
window.splitManager = new SplitManager();

// Funções globais para botões
function openSplitModal() {
    if (!window.appState || window.appState.pages.length === 0) {
        alert('Carregue um arquivo para usar esta função.');
        return;
    }
    document.getElementById('splitModal').classList.add('active');
    window.splitManager.resetSplitModal();
}

function performSplit() {
    window.splitManager.performSplit();
}