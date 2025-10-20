// Sistema de exportação completo (CORRIGIDO - índices e diálogo de salvar)
class ExportManager {
    constructor() {
        this.selectedType = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.export-option')) {
                const option = e.target.closest('.export-option');
                this.selectExportOption(option);
            }
        });

        this.setupModalCloseListeners();
    }

    setupModalCloseListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                Utils.closeModal();
                this.resetExportSelection();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                Utils.closeModal();
                this.resetExportSelection();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Utils.closeModal();
                this.resetExportSelection();
            }
        });
    }

    resetExportSelection() {
        this.selectedType = null;
        document.querySelectorAll('.export-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    }

    selectExportOption(option) {
        document.querySelectorAll('.export-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        option.classList.add('selected');
        this.selectedType = option.dataset.type;
    }

    async exportSelected() {
        if (!this.selectedType) {
            alert('Selecione um tipo de exportação');
            return;
        }

        if (!window.appState || window.appState.selectedPages.size === 0) {
            alert('Nenhuma página selecionada para exportar');
            return;
        }

        Utils.showProgress();
        
        try {
            switch (this.selectedType) {
                case 'single-pdf':
                    await this.exportSinglePDF();
                    break;
                case 'separate-pdf':
                    await this.exportSeparatePDFsAsZip();
                    break;
                case 'separate-images':
                    await this.exportSeparateImagesAsZip();
                    break;
            }
        } catch (error) {
            console.error('Erro na exportação:', error);
            alert('Erro durante a exportação: ' + error.message);
        } finally {
            Utils.hideProgress();
            Utils.closeModal();
            this.resetExportSelection();
        }
    }

    async exportSinglePDF() {
        Utils.updateProgress(10, 'Criando PDF...', 'Preparando documento');

        const pdfDoc = await PDFLib.PDFDocument.create();
        const selectedIndices = Array.from(window.appState.selectedPages).sort((a, b) => a - b);
        
        for (let i = 0; i < selectedIndices.length; i++) {
            const pageIndex = selectedIndices[i];
            const pageData = window.appState.pages[pageIndex];
            const progress = Math.round(((i + 1) / selectedIndices.length) * 80) + 10;
            
            Utils.updateProgress(progress, 'Criando PDF...', `Adicionando página ${i + 1}/${selectedIndices.length}`);

            if (pageData.type === 'pdf') {
                await this.addPDFPageToPDF(pdfDoc, pageData);
            } else if (pageData.type === 'image') {
                await this.addImagePageToPDF(pdfDoc, pageData);
            }
        }

        Utils.updateProgress(95, 'Finalizando...', 'Gerando arquivo');
        
        const pdfBytes = await pdfDoc.save();
        await this.saveFileWithDialog(pdfBytes, 'documento-organizado.pdf', 'application/pdf');
        
        Utils.updateProgress(100, 'Concluído!', 'PDF exportado com sucesso');
    }

    async exportSeparatePDFsAsZip() {
        if (!window.JSZip) {
            alert('Biblioteca JSZip não está carregada');
            return;
        }

        Utils.updateProgress(0, 'Preparando exportação...', 'Criando arquivo ZIP');

        try {
            const zip = new JSZip();
            const selectedIndices = Array.from(window.appState.selectedPages).sort((a, b) => a - b);
            
            for (let i = 0; i < selectedIndices.length; i++) {
                const pageIndex = selectedIndices[i];
                const pageData = window.appState.pages[pageIndex];
                const progress = Math.round(((i + 1) / selectedIndices.length) * 80);
                
                Utils.updateProgress(progress, 'Criando PDFs...', `Página ${i + 1}/${selectedIndices.length}`);

                const pdfDoc = await PDFLib.PDFDocument.create();
                
                if (pageData.type === 'pdf') {
                    await this.addPDFPageToPDF(pdfDoc, pageData);
                } else if (pageData.type === 'image') {
                    await this.addImagePageToPDF(pdfDoc, pageData);
                }

                const pdfBytes = await pdfDoc.save();
                const filename = `pagina-${String(pageData.pageNum).padStart(3, '0')}-${this.sanitizeFilename(pageData.fileName)}.pdf`;
                zip.file(filename, pdfBytes);
            }

            Utils.updateProgress(90, 'Finalizando ZIP...', 'Compactando arquivos');
            
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const zipFilename = `PDFs-separados-${timestamp}.zip`;
            
            await this.saveZipWithDialog(zipBlob, zipFilename);
            
            Utils.updateProgress(100, 'Concluído!', 'PDFs exportados em ZIP com sucesso');
            setTimeout(() => Utils.hideProgress(), 1500);

        } catch (error) {
            console.error('Erro na exportação de PDFs em ZIP:', error);
            alert('Erro durante a exportação: ' + error.message);
            Utils.hideProgress();
        }
    }

    async exportSeparateImagesAsZip() {
        if (!window.JSZip) {
            alert('Biblioteca JSZip não está carregada');
            return;
        }

        Utils.updateProgress(0, 'Preparando exportação...', 'Criando arquivo ZIP');

        try {
            const zip = new JSZip();
            const selectedIndices = Array.from(window.appState.selectedPages).sort((a, b) => a - b);
            
            for (let i = 0; i < selectedIndices.length; i++) {
                const pageIndex = selectedIndices[i];
                const pageData = window.appState.pages[pageIndex];
                const progress = Math.round(((i + 1) / selectedIndices.length) * 80);
                
                Utils.updateProgress(progress, 'Criando imagens...', `Página ${i + 1}/${selectedIndices.length}`);

                const canvas = await this.pageToCanvas(pageData, 4.0);
                const blob = await this.canvasToBlob(canvas, 'image/png', 1.0);
                
                const filename = `pagina-${String(pageData.pageNum).padStart(3, '0')}-${this.sanitizeFilename(pageData.fileName)}.png`;
                zip.file(filename, blob);
            }

            Utils.updateProgress(90, 'Finalizando ZIP...', 'Compactando arquivos');
            
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const zipFilename = `Imagens-separadas-${timestamp}.zip`;
            
            await this.saveZipWithDialog(zipBlob, zipFilename);
            
            Utils.updateProgress(100, 'Concluído!', 'Imagens exportadas em ZIP com sucesso');
            setTimeout(() => Utils.hideProgress(), 1500);

        } catch (error) {
            console.error('Erro na exportação de imagens em ZIP:', error);
            alert('Erro durante a exportação: ' + error.message);
            Utils.hideProgress();
        }
    }

    async exportFullPDF() {
        if (!window.appState || window.appState.pages.length === 0) {
            alert('Nenhuma página disponível para exportar');
            return;
        }

        Utils.showProgress();
        Utils.updateProgress(10, 'Criando PDF completo...', 'Preparando documento');

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            for (let i = 0; i < window.appState.pages.length; i++) {
                const pageData = window.appState.pages[i];
                const progress = Math.round(((i + 1) / window.appState.pages.length) * 80) + 10;
                
                Utils.updateProgress(progress, 'Criando PDF completo...', `Página ${i + 1}/${window.appState.pages.length}`);

                if (pageData.type === 'pdf') {
                    await this.addPDFPageToPDF(pdfDoc, pageData);
                } else if (pageData.type === 'image') {
                    await this.addImagePageToPDF(pdfDoc, pageData);
                }
            }

            Utils.updateProgress(95, 'Finalizando...', 'Gerando arquivo');
            
            const pdfBytes = await pdfDoc.save();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            await this.saveFileWithDialog(pdfBytes, `documento-completo-${timestamp}.pdf`, 'application/pdf');
            
            Utils.updateProgress(100, 'Concluído!', 'PDF completo exportado');
            setTimeout(Utils.hideProgress, 1500);
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            alert('Erro durante a exportação: ' + error.message);
            Utils.hideProgress();
        }
    }

    // CORREÇÃO: Adicionar página PDF ao documento
    async addPDFPageToPDF(targetDoc, pageData) {
        try {
            const fileStorage = window.fileHandler.fileStorage;
            const fileInfo = fileStorage.get(pageData.fileId);
            
            if (!fileInfo || !fileInfo.buffer) {
                throw new Error('Arquivo PDF original não encontrado');
            }

            const sourcePdf = await PDFLib.PDFDocument.load(fileInfo.buffer);
            
            // CORREÇÃO: Verificar o índice correto
            const pageIndexInSource = pageData.pageNum - 1;
            const totalPages = sourcePdf.getPageCount();
            
            if (pageIndexInSource < 0 || pageIndexInSource >= totalPages) {
                console.error(`Índice inválido: ${pageIndexInSource}, total de páginas: ${totalPages}`);
                throw new Error(`Índice de página inválido: ${pageData.pageNum} (máximo: ${totalPages})`);
            }
            
            const [copiedPage] = await targetDoc.copyPages(sourcePdf, [pageIndexInSource]);
            
            // Obter dimensões originais da página
            const { width: originalWidth, height: originalHeight } = copiedPage.getSize();
            
            // Detectar orientação automaticamente
            const isLandscape = originalWidth > originalHeight;
            
            // Definir tamanho A4 baseado na orientação
            const targetWidth = isLandscape ? 842 : 595;
            const targetHeight = isLandscape ? 595 : 842;
            
            // Verificar se precisa normalizar
            const needsNormalization = 
                Math.abs(originalWidth - targetWidth) > 10 || 
                Math.abs(originalHeight - targetHeight) > 10;
            
            if (!needsNormalization) {
                // Se já está no tamanho correto, adicionar diretamente
                if (pageData.rotation) {
                    copiedPage.setRotation(PDFLib.degrees(pageData.rotation));
                }
                targetDoc.addPage(copiedPage);
            } else {
                // Converter página para imagem e normalizar
                const canvas = await this.renderPDFPageToCanvas(pageData, 5.0);
                const imageBytes = await this.canvasToArrayBuffer(canvas, 'image/png', 1.0);
                const image = await targetDoc.embedPng(imageBytes);
                
                // Criar nova página normalizada
                const newPage = targetDoc.addPage([targetWidth, targetHeight]);
                
                // Calcular dimensões mantendo proporção com margens
                const margin = 20;
                const availableWidth = targetWidth - (margin * 2);
                const availableHeight = targetHeight - (margin * 2);
                
                const imageAspect = image.width / image.height;
                const availableAspect = availableWidth / availableHeight;
                
                let drawWidth, drawHeight;
                if (imageAspect > availableAspect) {
                    drawWidth = availableWidth;
                    drawHeight = availableWidth / imageAspect;
                } else {
                    drawHeight = availableHeight;
                    drawWidth = availableHeight * imageAspect;
                }
                
                // Centralizar imagem na página
                const x = (targetWidth - drawWidth) / 2;
                const y = (targetHeight - drawHeight) / 2;
                
                // Desenhar imagem centralizada
                newPage.drawImage(image, {
                    x: x,
                    y: y,
                    width: drawWidth,
                    height: drawHeight,
                    rotate: PDFLib.degrees(pageData.rotation || 0)
                });
            }
            
        } catch (error) {
            console.error('Erro ao adicionar página PDF:', error);
            throw error;
        }
    }

    // Renderizar página PDF como canvas
    async renderPDFPageToCanvas(pageData, scale = 5.0) {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', {
                alpha: false,
                desynchronized: false,
                willReadFrequently: false
            });
            
            const viewport = pageData.page.getViewport({ 
                scale: scale,
                rotation: pageData.rotation || 0
            });
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Fundo branco
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Configurar contexto para máxima qualidade
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            
            await pageData.page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            return canvas;
        } catch (error) {
            console.error('Erro ao renderizar página PDF:', error);
            throw error;
        }
    }

    // AUTO-AJUSTE para imagens
    async addImagePageToPDF(targetDoc, pageData) {
        try {
            // Renderizar imagem em alta qualidade (escala 5.0)
            const canvas = await this.pageToCanvas(pageData, 5.0);
            const imageBytes = await this.canvasToArrayBuffer(canvas, 'image/png', 1.0);
            const image = await targetDoc.embedPng(imageBytes);
            
            // Obter dimensões da imagem
            const imageWidth = image.width;
            const imageHeight = image.height;
            
            // Detectar orientação automaticamente
            const isLandscape = imageWidth > imageHeight;
            
            // Definir tamanho A4 baseado na orientação
            const pageWidth = isLandscape ? 842 : 595;
            const pageHeight = isLandscape ? 595 : 842;
            
            // Criar página normalizada
            const page = targetDoc.addPage([pageWidth, pageHeight]);
            
            // Calcular dimensões mantendo proporção com margens
            const margin = 20;
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            
            const imageAspect = imageWidth / imageHeight;
            const availableAspect = availableWidth / availableHeight;
            
            let drawWidth, drawHeight;
            if (imageAspect > availableAspect) {
                // Imagem mais larga - ajustar pela largura
                drawWidth = availableWidth;
                drawHeight = availableWidth / imageAspect;
            } else {
                // Imagem mais alta - ajustar pela altura
                drawHeight = availableHeight;
                drawWidth = availableHeight * imageAspect;
            }
            
            // Centralizar imagem na página
            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;
            
            // Desenhar imagem centralizada
            page.drawImage(image, {
                x: x,
                y: y,
                width: drawWidth,
                height: drawHeight,
                rotate: PDFLib.degrees(pageData.rotation || 0)
            });
            
        } catch (error) {
            console.error('Erro ao adicionar página de imagem:', error);
            throw error;
        }
    }

    // Renderizar com alta qualidade
    async pageToCanvas(pageData, scale = 5.0) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', {
            alpha: false,
            desynchronized: false,
            willReadFrequently: false
        });
        
        const viewport = pageData.page.getViewport({ 
            scale: scale,
            rotation: pageData.rotation || 0
        });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Fundo branco
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Configurar contexto para máxima qualidade
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        await pageData.page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        return canvas;
    }

    async canvasToBlob(canvas, mimeType = 'image/png', quality = 1.0) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, mimeType, quality);
        });
    }

    async canvasToArrayBuffer(canvas, mimeType = 'image/png', quality = 1.0) {
        const blob = await this.canvasToBlob(canvas, mimeType, quality);
        return blob.arrayBuffer();
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Novo método para salvar arquivo com diálogo do Electron
    async saveFileWithDialog(data, defaultFilename, mimeType) {
        // Verificar se está no Electron
        if (typeof require !== 'undefined') {
            try {
                const { dialog } = require('@electron/remote');
                
                // Mostrar diálogo para salvar arquivo
                const result = await dialog.showSaveDialog({
                    title: 'Salvar arquivo',
                    defaultPath: defaultFilename,
                    filters: [
                        { name: 'PDF Files', extensions: ['pdf'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    const fs = require('fs');
                    fs.writeFileSync(result.filePath, Buffer.from(data));
                    return true;
                }
                return false;
            } catch (error) {
                console.warn('Erro ao usar diálogo do Electron, usando download padrão:', error);
                // Fallback para download padrão
                this.downloadFile(data, defaultFilename, mimeType);
                return true;
            }
        } else {
            // Usar download padrão no navegador
            this.downloadFile(data, defaultFilename, mimeType);
            return true;
        }
    }

    // Novo método para salvar ZIP com diálogo
    async saveZipWithDialog(blob, defaultFilename) {
        // Verificar se está no Electron
        if (typeof require !== 'undefined') {
            try {
                const { dialog } = require('@electron/remote');
                
                // Mostrar diálogo para salvar arquivo
                const result = await dialog.showSaveDialog({
                    title: 'Salvar arquivo ZIP',
                    defaultPath: defaultFilename,
                    filters: [
                        { name: 'ZIP Files', extensions: ['zip'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    const fs = require('fs');
                    const buffer = await blob.arrayBuffer();
                    fs.writeFileSync(result.filePath, Buffer.from(buffer));
                    return true;
                }
                return false;
            } catch (error) {
                console.warn('Erro ao usar diálogo do Electron, usando download padrão:', error);
                // Fallback para download padrão
                this.downloadBlob(blob, defaultFilename);
                return true;
            }
        } else {
            // Usar download padrão no navegador
            this.downloadBlob(blob, defaultFilename);
            return true;
        }
    }

    sanitizeFilename(filename) {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        return nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50);
    }
}

// Instância global
window.exportManager = new ExportManager();

// Funções globais
function openExportModal() {
    if (!window.appState || window.appState.selectedPages.size === 0) {
        alert('Selecione pelo menos uma página para exportar');
        return;
    }
    document.getElementById('exportModal').classList.add('active');
}

function confirmExport() {
    window.exportManager.exportSelected();
}

function exportFullPDF() {
    window.exportManager.exportFullPDF();
}

function cancelExport() {
    Utils.closeModal();
    window.exportManager.resetExportSelection();
}