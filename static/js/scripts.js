document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    const fileInfo = document.getElementById('file-info');
    const previewImage = document.getElementById('preview-image');
    const fileName = document.getElementById('file-name');
    const clearFileBtn = document.getElementById('clear-file-btn');
    const extractBtn = document.getElementById('extract-btn');
    const paletteContainer = document.getElementById('palette-container');
    const emptyPaletteMessage = document.getElementById('empty-palette-message');
    const viewJsonBtn = document.getElementById('view-json-btn');
    const viewExamplesBtn = document.getElementById('view-examples-btn');
    const downloadBtn = document.getElementById('download-btn');
    const numColorsInput = document.getElementById('num_colors');
    const numColorsValue = document.getElementById('num_colors_value');
    const toleranceInput = document.getElementById('tolerance');
    const toleranceValue = document.getElementById('tolerance_value');

    // Modais
    const jsonModal = new bootstrap.Modal('#jsonModal');
    const examplesModal = new bootstrap.Modal('#examplesModal');

    let currentPalette = null;

    // Atualiza os valores dos sliders
    numColorsInput.addEventListener('input', () => {
        numColorsValue.textContent = numColorsInput.value;
    });

    toleranceInput.addEventListener('input', () => {
        toleranceValue.textContent = toleranceInput.value;
    });

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    clearFileBtn.addEventListener('click', clearFile);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            handleFiles({ target: { files } });
        }
    }

    function handleFiles(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            displayFileInfo(file);
        } else {
            showToast('Por favor, selecione um arquivo de imagem válido', 'danger');
        }
    }

    function displayFileInfo(file) {
        fileName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            fileInfo.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    function clearFile() {
        fileInput.value = '';
        fileInfo.classList.add('d-none');
        previewImage.src = '#';
        fileName.textContent = '';
        // Limpar paleta atual
        currentPalette = null;
        paletteContainer.innerHTML = '';
        emptyPaletteMessage.classList.remove('d-none');
    }

    // Extração da paleta
    extractBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            showToast('Por favor, selecione uma imagem primeiro', 'danger');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('num_colors', numColorsInput.value);
        formData.append('tolerance', toleranceInput.value);

        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';

        try {
            const response = await fetch('/api/extract_palette', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao processar imagem');
            }

            const data = await response.json();
            // Criar paleta simplificada (somente cores)
            currentPalette = data.palette || data;
            renderPalette(currentPalette);
            emptyPaletteMessage.classList.add('d-none');
            
            showToast('Paleta extraída com sucesso!', 'success');
        } catch (error) {
            showToast(error.message, 'danger');
        } finally {
            extractBtn.disabled = false;
            extractBtn.innerHTML = '<i class="bi bi-magic"></i> Extrair Paleta';
        }
    });

    // Renderiza a paleta
    function renderPalette(palette) {
        paletteContainer.innerHTML = '';
        
        palette.forEach((color, index) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
            colorBox.innerHTML = `
                <div class="color-box mb-2" style="background-color: ${color.hex}">
                    <div class="color-info">
                        <small>${color.hex}</small>
                        <small>${color.percentage}%</small>
                    </div>
                    <div class="color-actions">
                        <button class="btn btn-sm btn-light" onclick="copyToClipboard('${color.hex}')" title="Copiar HEX">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>
            `;
            paletteContainer.appendChild(colorBox);
        });

        // Adicionar botão de aplicações abaixo da paleta
        const actionsRow = document.createElement('div');
        actionsRow.className = 'col-12 text-center mt-3';
        actionsRow.innerHTML = `
            <button id="view-examples-btn-inline" class="btn btn-info btn-sm">
                <i class="bi bi-eye"></i> Ver Aplicações da Paleta
            </button>
        `;
        paletteContainer.appendChild(actionsRow);

        // Adicionar evento ao novo botão
        document.getElementById('view-examples-btn-inline').addEventListener('click', () => {
            updateExamples();
            examplesModal.show();
        });
    }

    // Visualizar JSON
    viewJsonBtn.addEventListener('click', () => {
        if (currentPalette) {
            // Criar versão simplificada (somente cores)
            const simplifiedPalette = currentPalette.map(color => color.hex);
            
            document.getElementById('json-output-full').textContent = JSON.stringify(currentPalette, null, 2);
            document.getElementById('json-output-simplified').textContent = JSON.stringify(simplifiedPalette, null, 2);
            
            jsonModal.show();
        } else {
            showToast('Nenhuma paleta para exibir', 'danger');
        }
    });

    // Visualizar Exemplos
    viewExamplesBtn.addEventListener('click', () => {
        if (currentPalette) {
            updateExamples();
            examplesModal.show();
        } else {
            showToast('Extraia uma paleta primeiro', 'danger');
        }
    });

    // Atualiza exemplos com a paleta atual
    function updateExamples() {
        if (!currentPalette || !currentPalette.length) return;
        
        const colors = currentPalette;
        
        // Usar todas as cores disponíveis
        for (let i = 0; i < Math.min(colors.length, 6); i++) {
            document.documentElement.style.setProperty(`--color-${i + 1}`, colors[i].hex);
        }
        
        // Manter compatibilidade com variáveis antigas
        document.documentElement.style.setProperty('--primary-color', colors[0].hex);
        document.documentElement.style.setProperty('--secondary-color', colors[1]?.hex || colors[0].hex);
    }

    // Download da paleta
    downloadBtn.addEventListener('click', async () => {
        if (!currentPalette) {
            showToast('Nenhuma paleta para baixar', 'danger');
            return;
        }
        
        try {
            // Criar dados simplificados para download
            const downloadData = currentPalette.map(color => color.hex);
            
            const response = await fetch('/download-palette', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(downloadData)
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `paleta_cores_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showToast('Paleta baixada com sucesso!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao baixar');
            }
        } catch (error) {
            showToast(error.message, 'danger');
        }
    });
});

// Funções globais
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copiado: ' + text, 'success');
        }).catch(err => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Copiado: ' + text, 'success');
    } catch (err) {
        showToast('Erro ao copiar: ' + err, 'danger');
    }
    
    document.body.removeChild(textArea);
}

function copyJson() {
    const activeTab = document.querySelector('#jsonTabs .nav-link.active');
    let jsonText = '';
    
    if (activeTab && activeTab.id === 'full-tab') {
        jsonText = document.getElementById('json-output-full').textContent;
    } else {
        jsonText = document.getElementById('json-output-simplified').textContent;
    }
    
    if (jsonText) {
        copyToClipboard(jsonText);
    } else {
        showToast('Nenhum JSON para copiar', 'danger');
    }
}

function showToast(message, type = 'success') {
    // Remover toasts existentes para evitar acúmulo
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(container => container.remove());
    
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('data-bs-autohide', 'true');
    toastEl.setAttribute('data-bs-delay', '4000');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        if (toastContainer && toastContainer.parentNode) {
            toastContainer.remove();
        }
    });
}