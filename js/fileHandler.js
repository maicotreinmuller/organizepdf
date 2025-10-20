// Gerenciamento de arquivos com progresso simplificado
class FileHandler {
    constructor() {
        this.fileStorage = new Map();
        this.fileCounter = 0;
        this.loadedFiles = [];
        this.isFileInputSetup = false;
    }

    setupFileInput() {
        if (this.isFileInputSetup) return; // Evita configurar múltiplas vezes
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    this.processMultipleFiles(files);
                }
            });
            this.isFileInputSetup = true;
        }
    }   

    async processMultipleFiles(files) {
        if (files.length === 0) return;
        
        // Garantir que o appState está inicializado
        if (!window.appState) {
            window.appState = {
                pages: [],
                selectedPages: new Set(),
                viewMode: 'grid'
            };
        }
        
        Utils.showProgress();
        
        // Calcular total de páginas primeiro
        let totalExpectedPages = 0;
        
        try {
            // Primeira passada para contar páginas
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                Utils.updateProgressWithDetails(
                    Math.round(((i + 1) / files.length) * 20), 
                    'Carregando',
                    i + 1,
                    files.length
                );
                
                if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const loadingTask = pdfjsLib.getDocument({
                        data: new Uint8Array(arrayBuffer),
                        disableAutoFetch: true,
                        disableStream: true,
                        disableRange: true
                    });
                    const pdfDoc = await loadingTask.promise;
                    totalExpectedPages += pdfDoc.numPages;
                } else if (file.type.startsWith('image/')) {
                    totalExpectedPages += 1;
                }
            }

            let processedPages = 0;
            
            // Segunda passada para processar arquivos
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                if (file.type === 'application/pdf') {
                    processedPages = await this.loadPDFWithProgress(file, processedPages, totalExpectedPages);
                } else if (file.type.startsWith('image/')) {
                    processedPages = await this.loadImageWithProgress(file, processedPages, totalExpectedPages);
                }
            }
            
            Utils.updateProgressWithDetails(95, 'Carregando', totalExpectedPages, totalExpectedPages);
            await window.pageRenderer.renderPages();
            Utils.updateStatus();
            
            // Habilitar botões após carregamento
            this.enableButtons();
            
            Utils.hideProgress();
            
        } catch (error) {
            console.error('Erro ao processar arquivos:', error);
            Utils.hideProgress();
            alert('Erro ao processar arquivos: ' + error.message);
        }
    }

    async loadPDFWithProgress(file, startingPage, totalPages) {
        try {
            const originalBuffer = await file.arrayBuffer();
            const fileId = `pdf-${++this.fileCounter}`;
            
            this.fileStorage.set(fileId, {
                name: file.name,
                buffer: this.cloneArrayBuffer(originalBuffer),
                type: 'pdf'
            });
            
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(originalBuffer),
                disableAutoFetch: true,
                disableStream: true,
                disableRange: true
            });
            
            const pdfDoc = await loadingTask.promise;
            
            this.loadedFiles.push({
                name: file.name,
                type: 'pdf',
                id: fileId,
                pageCount: pdfDoc.numPages
            });
            
            let currentPage = startingPage;
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                currentPage++;
                const progress = Math.round(20 + ((currentPage / totalPages) * 75));
                
                Utils.updateProgressWithDetails(
                    progress,
                    'Carregando',
                    currentPage,
                    totalPages
                );
                
                const page = await pdfDoc.getPage(i);
                window.appState.pages.push({
                    pageNum: i,
                    page: page,
                    rotation: 0,
                    originalIndex: i - 1,
                    fileId: fileId,
                    fileName: file.name,
                    type: 'pdf',
                    canvas: null
                });
                
                // Pequeno delay para permitir atualização da UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            return currentPage;
            
        } catch (error) {
            console.error('Erro ao carregar PDF:', error);
            throw new Error(`Erro ao carregar PDF ${file.name}: ${error.message}`);
        }
    }

    async loadImageWithProgress(file, startingPage, totalPages) {
        try {
            const fileId = `img-${++this.fileCounter}`;
            const currentPage = startingPage + 1;
            const progress = Math.round(20 + ((currentPage / totalPages) * 75));
            
            Utils.updateProgressWithDetails(
                progress,
                'Carregando',
                currentPage,
                totalPages
            );
            
            this.loadedFiles.push({
                name: file.name,
                type: 'image',
                id: fileId,
                pageCount: 1
            });
            
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const mockPage = {
                        getViewport: (options) => ({
                            width: img.width * (options.scale || 1),
                            height: img.height * (options.scale || 1),
                            rotation: options.rotation || 0
                        }),
                        render: async (renderContext) => {
                            const viewport = renderContext.viewport;
                            const outputCanvas = renderContext.canvasContext.canvas;
                            const outputCtx = renderContext.canvasContext;
                            
                            outputCtx.clearRect(0, 0, viewport.width, viewport.height);
                            outputCtx.drawImage(canvas, 0, 0, viewport.width, viewport.height);
                            
                            return Promise.resolve();
                        }
                    };
                    
                    window.appState.pages.push({
                        pageNum: 1,
                        page: mockPage,
                        rotation: 0,
                        originalIndex: 0,
                        fileId: fileId,
                        fileName: file.name,
                        type: 'image',
                        canvas: canvas
                    });
                    
                    resolve();
                };
                
                img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${file.name}`));
                img.src = URL.createObjectURL(file);
            });
            
            return currentPage;
            
        } catch (error) {
            console.error('Erro ao carregar imagem:', error);
            throw new Error(`Erro ao carregar imagem ${file.name}: ${error.message}`);
        }
    }

    enableButtons() {
        // Habilitar botões após carregamento
        const buttonsToEnable = [
            'saveOrganizedBtn',
            'toggleSelectBtn',
            'clearBtn'
        ];
        
        buttonsToEnable.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        });

        // Habilitar view controls
        const viewControls = document.querySelectorAll('.view-toggle');
        viewControls.forEach(btn => {
            btn.classList.remove('disabled');
            btn.disabled = false;
        });
    }

    cloneArrayBuffer(buffer) {
        if (buffer.byteLength === 0) return new ArrayBuffer(0);
        const cloned = new ArrayBuffer(buffer.byteLength);
        new Uint8Array(cloned).set(new Uint8Array(buffer));
        return cloned;
    }

    clearLoadedFiles() {
        this.fileStorage.clear();
        this.loadedFiles = [];
        this.fileCounter = 0;
        
        if (window.appState) {
            window.appState.pages = [];
            window.appState.selectedPages.clear();
        }

        // Limpar o valor do input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Desabilitar botões após limpeza
        this.disableButtons();
    }

    disableButtons() {
        // Desabilitar todos os botões exceto adicionar arquivos
        const buttonsToDisable = [
            'saveOrganizedBtn',
            'exportSelectedBtn',
            'toggleSelectBtn',
            'deleteBtn',
            'clearBtn'
        ];
        
        buttonsToDisable.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }
        });

        // Desabilitar view controls
        const viewControls = document.querySelectorAll('.view-toggle');
        viewControls.forEach(btn => {
            btn.classList.add('disabled');
            btn.disabled = true;
        });
    }
}

// Instância global
window.fileHandler = new FileHandler();

// Funções globais
function openFiles() {
    document.getElementById('fileInput').click();
}

// Event listener para input de arquivos e clique na área de conteúdo
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                window.fileHandler.processMultipleFiles(files);
            }
        });
    }

    // ABRIR SELETOR DE ARQUIVOS APENAS SE A ÁREA ESTIVER VAZIA
    const organizeContent = document.querySelector('.organize-content');
    if (organizeContent) {
        organizeContent.addEventListener('click', function(e) {
            // Verifica se a área está vazia e se o clique não foi em um botão ou em uma página
            if (window.appState.pages.length === 0 && !e.target.closest('button') && !e.target.closest('.page-item')) {
                openFiles();
            }
        });
    }
});