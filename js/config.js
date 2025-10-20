// Configuração global da aplicação
window.PDFEditorConfig = {
    // Configuração do PDF.js
    pdfjs: {
        workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    },
    
    // Configurações de qualidade de compressão
    compression: {
        pdf: 0.9,
        preview: 0.8,
        single: 1.5,
        thumbnail: 0.3
    },
    
    // Configurações de renderização
    render: {
        thumbnailScale: 0.3,
        previewScale: 1.5,
        singleViewScale: 2.0,
        maxZoom: 3.0,
        minZoom: 0.3,
        zoomStep: 0.2
    }
};

// Configurar PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = window.PDFEditorConfig.pdfjs.workerSrc;
}