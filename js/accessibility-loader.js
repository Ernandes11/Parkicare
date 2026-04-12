/**
 * accessibility-loader.js
 * Carrega e aplica as configurações de acessibilidade globalmente no ParkiCare.
 */
(function() {
    function applySettings() {
        try {
            // 1. Tamanho da Fonte
            const fontSize = JSON.parse(localStorage.getItem('parkicare_fontSize') || '"medium"');
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            if (fontSize === 'small') document.body.classList.add('font-small');
            if (fontSize === 'large') document.body.classList.add('font-large');

            // 2. Tamanho dos Botões
            const btnSize = JSON.parse(localStorage.getItem('parkicare_btnSize') || '"medium"');
            document.body.classList.remove('btn-small', 'btn-medium', 'btn-large', 'mode-big-buttons');
            if (btnSize === 'small') document.body.classList.add('btn-small');
            if (btnSize === 'large') document.body.classList.add('btn-large', 'mode-big-buttons');

            // 3. Alto Contraste
            const highContrast = JSON.parse(localStorage.getItem('parkicare_highContrast') || 'false');
            if (highContrast) {
                document.body.classList.add('mode-high-contrast');
            } else {
                document.body.classList.remove('mode-high-contrast');
            }

            console.log("Accessibility settings applied successfully.");
        } catch (e) {
            console.error("Error loading accessibility settings:", e);
        }
    }

    // Executa imediatamente se o body já existir, ou quando o DOM carregar
    if (document.body) {
        applySettings();
    } else {
        document.addEventListener('DOMContentLoaded', applySettings);
    }

    // Exporta para uso manual se necessário (ex: na tela de config)
    window.refreshAccessibility = applySettings;
})();
