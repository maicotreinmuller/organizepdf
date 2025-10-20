// Gerenciamento de temas com persistência
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Padrão dark
        this.configKey = 'pdfeditor_config';
    }

    initialize() {
        // Carregar configuração salva
        const savedConfig = this.loadConfig();
        const theme = savedConfig.theme || 'dark'; // Default dark
        this.setTheme(theme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        this.saveConfig();
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    loadConfig() {
        try {
            const configStr = localStorage.getItem(this.configKey);
            return configStr ? JSON.parse(configStr) : {};
        } catch (error) {
            console.warn('Erro ao carregar configuração:', error);
            return {};
        }
    }

    saveConfig() {
        try {
            const config = this.loadConfig();
            config.theme = this.currentTheme;
            localStorage.setItem(this.configKey, JSON.stringify(config));
        } catch (error) {
            console.warn('Erro ao salvar configuração:', error);
        }
    }

    // Método para exportar configuração como arquivo config.ini
    exportConfigFile() {
        const config = this.loadConfig();
        const iniContent = `[Settings]
theme=${config.theme || 'dark'}
created_date=${new Date().toISOString()}
version=1.0`;

        const blob = new Blob([iniContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.ini';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Método para importar configuração de arquivo config.ini
    importConfigFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const themeMatch = content.match(/theme=(\w+)/);
                    if (themeMatch) {
                        const theme = themeMatch[1];
                        if (theme === 'light' || theme === 'dark') {
                            this.setTheme(theme);
                            resolve(theme);
                        } else {
                            reject('Tema inválido no arquivo de configuração');
                        }
                    } else {
                        reject('Formato de arquivo de configuração inválido');
                    }
                } catch (error) {
                    reject('Erro ao processar arquivo de configuração');
                }
            };
            reader.onerror = () => reject('Erro ao ler arquivo');
            reader.readAsText(file);
        });
    }
}

// Instância global
window.themeManager = new ThemeManager();

// Função global para compatibilidade
function toggleTheme() {
    window.themeManager.toggle();
}

// Inicializar tema ao carregar página
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager.initialize();
});