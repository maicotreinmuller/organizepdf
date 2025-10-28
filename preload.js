const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Conversão de PDF
  convertPDF: (data) => ipcRenderer.invoke('convert-pdf', data),
  
  // Listeners para progresso
  onConversionProgress: (callback) => {
    ipcRenderer.on('conversion-progress', (event, data) => callback(data));
  },
  
  // Remover listeners
  removeConversionListeners: () => {
    ipcRenderer.removeAllListeners('conversion-progress');
  },

  // Dialog para salvar arquivo
  saveFile: (options) => ipcRenderer.invoke('save-file-dialog', options),
  
  // Verificar se poppler está disponível
  checkPopplerAvailable: () => ipcRenderer.invoke('check-poppler')
});