class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        this.init();
    }

    init() {
        this.tooltip = document.getElementById('customTooltip');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseOver(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target && target.dataset.tooltip) {
            this.currentTarget = target;
            this.showTooltip(target.dataset.tooltip, e);
        }
    }

    handleMouseOut(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target === this.currentTarget) {
            this.hideTooltip();
        }
    }

    handleMouseMove(e) {
        if (this.tooltip && this.tooltip.classList.contains('visible')) {
            this.updatePosition(e);
        }
    }

    showTooltip(text, event) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.showTimeout = setTimeout(() => {
            if (this.tooltip) {
                this.tooltip.textContent = text;
                this.updatePosition(event);
                this.tooltip.classList.add('visible');
            }
        }, 1); // Delay para mostrar
    }

    hideTooltip() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        this.hideTimeout = setTimeout(() => {
            if (this.tooltip) {
                this.tooltip.classList.remove('visible');
            }
        }, 1); // Delay pequeno para esconder
    }

    updatePosition(event) {
        if (!this.tooltip) return;

        const x = event.clientX;
        const y = event.clientY;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let left = x + 10;
        let top = y - tooltipRect.height - 10;

        // Ajustar se sair da tela pela direita
        if (left + tooltipRect.width > windowWidth) {
            left = x - tooltipRect.width - 10;
        }

        // Ajustar se sair da tela por cima
        if (top < 0) {
            top = y + 10;
        }

        // Ajustar se sair da tela por baixo
        if (top + tooltipRect.height > windowHeight) {
            top = windowHeight - tooltipRect.height - 10;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.tooltipManager = new TooltipManager();
});