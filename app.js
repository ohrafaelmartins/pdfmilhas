const { jsPDF } = window.jspdf;
const MAX_IMAGES = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const pages = [];

// Orientation checkbox logic
const verticalCheckbox = document.getElementById('vertical');
const horizontalCheckbox = document.getElementById('horizontal');

// Elementos DOM
const newPageBtn = document.getElementById('new-page-btn');
const generatePdfBtn = document.getElementById('generate-pdf-btn');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const descriptionTextarea = document.getElementById('description');
const charCountSpan = document.getElementById('char-count');
const pagesList = document.getElementById('pages-list');
const toastContainer = document.getElementById('toast-container');

// Função de Toast
function showToast(message, type = 'success') {
    const toastDiv = document.createElement('div');
    toastDiv.classList.add('toast', 'align-items-center', 'text-white', 'bg-' + type, 'border-0');
    toastDiv.setAttribute('role', 'alert');
    toastDiv.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastDiv);
    const toast = new bootstrap.Toast(toastDiv);
    toast.show();

    toastDiv.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toastDiv);
    });
}

// Contador de caracteres
descriptionTextarea.addEventListener('input', function () {
    const currentLength = this.value.length;
    charCountSpan.textContent = `${currentLength} / 100 caracteres`;
    charCountSpan.classList.toggle('text-danger', currentLength >= 100);
});

// Validação de imagens
function validateImage(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        showToast('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.', 'danger');
        return false;
    }

    if (file.size > MAX_FILE_SIZE) {
        showToast('Arquivo muito grande. Limite de 5MB.', 'danger');
        return false;
    }

    return true;
}

// Atualizar file input após remoção de imagem
function updateFileInput() {
    const dataTransfer = new DataTransfer();
    imagePreview.querySelectorAll('img').forEach((img) => {
        const originalFile = Array.from(imageUpload.files).find(file =>
            file.name === img.dataset.originalName
        );
        if (originalFile) {
            dataTransfer.items.add(originalFile);
        }
    });
    imageUpload.files = dataTransfer.files;
}

// Prévia de imagens com informações e botão de remoção
imageUpload.addEventListener('change', function (e) {
    imagePreview.innerHTML = '';
    const files = Array.from(e.target.files)
        .filter(validateImage)
        .slice(0, MAX_IMAGES);

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement('div');
            container.classList.add('preview-container');

            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview-image', 'img-thumbnail', 'lazy');
            img.setAttribute('loading', 'lazy');
            img.dataset.originalName = file.name;

            const imgInfo = document.createElement('div');
            imgInfo.classList.add('image-info');

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '✕';
            removeBtn.classList.add('remove-image', 'btn', 'btn-sm', 'btn-danger');
            removeBtn.addEventListener('click', () => {
                imagePreview.removeChild(container);
                updateFileInput();
            });

            const image = new Image();
            image.src = e.target.result;
            image.onload = () => {
                imgInfo.textContent = `${image.width} x ${image.height}`;
            };

            container.appendChild(removeBtn);
            container.appendChild(img);
            container.appendChild(imgInfo);

            imagePreview.appendChild(container);
        };
        reader.readAsDataURL(file);
    });
});

// Capturar página
function capturePage() {
    const airlines = Array.from(document.querySelectorAll('input[name="airline"]:checked'))
        .map(input => input.id);
    const payments = Array.from(document.querySelectorAll('input[name="payment"]:checked'))
        .map(input => input.id);
    const description = descriptionTextarea.value.trim();

    const imageContainers = imagePreview.querySelectorAll('.preview-container');
    const images = Array.from(imageContainers).map(container => {
        const img = container.querySelector('img');
        const imgInfo = container.querySelector('.image-info');
        return {
            src: img.src,
            width: parseInt(imgInfo.textContent.split(' x ')[0]),
            height: parseInt(imgInfo.textContent.split(' x ')[1])
        };
    });

    // Validação básica
    if (airlines.length === 0 || payments.length === 0) {
        showToast('Preencha todos os campos', 'warning');
        return null;
    }

    const pageData = {
        airlines,
        payments,
        description,
        images
    };

    pages.push(pageData);
    return pageData;
}

// Função para popular o formulário com dados de página existente para edição
function editPage(index) {
    const page = pages[index];

    // Redefinir formulário atual
    document.querySelectorAll('input[name="airline"], input[name="payment"]').forEach(input => {
        input.checked = false;
    });

    // Restaurar companhias aéreas
    page.airlines.forEach(airline => {
        const checkbox = document.getElementById(airline);
        if (checkbox) checkbox.checked = true;
    });

    // Restaurar pagamentos
    page.payments.forEach(payment => {
        const checkbox = document.getElementById(payment);
        if (checkbox) checkbox.checked = true;
    });

    // Restaurar descrição
    descriptionTextarea.value = page.description;
    charCountSpan.textContent = `${page.description.length} / 100 caracteres`;

    // Restaurar imagens
    imagePreview.innerHTML = '';
    page.images.forEach(img => {
        const container = document.createElement('div');
        container.classList.add('preview-container');

        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.classList.add('preview-image', 'img-thumbnail', 'lazy');
        imgElement.setAttribute('loading', 'lazy');

        const imgInfo = document.createElement('div');
        imgInfo.classList.add('image-info');
        imgInfo.textContent = `${img.width} x ${img.height}`;

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '✕';
        removeBtn.classList.add('remove-image', 'btn', 'btn-sm', 'btn-danger');
        removeBtn.addEventListener('click', () => {
            imagePreview.removeChild(container);
            updateFileInput();
        });

        container.appendChild(removeBtn);
        container.appendChild(imgElement);
        container.appendChild(imgInfo);

        imagePreview.appendChild(container);
    });

    // Remove a página da lista (será atualizada ou recriada)
    pages.splice(index, 1);
    updatePagesList();
}

// Atualizar lista de páginas
function updatePagesList() {
    pagesList.innerHTML = '';
    pages.forEach((page, index) => {
        const pageItem = document.createElement('div');
        pageItem.classList.add('list-group-item');
        pageItem.dataset.index = index;
        pageItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">Página ${index + 1}</h5>
                <div>
                    <button class="btn btn-sm btn-primary edit-page me-2" data-index="${index}">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger remove-page" data-index="${index}">
                        Remover
                    </button>
                </div>
            </div>
            <p class="mb-1">
                <strong>Companhias:</strong> ${page.airlines.join(', ')}<br>
                <strong>Pagamentos:</strong> ${page.payments.join(', ')}<br>
                <strong>Descrição:</strong> ${page.description}
            </p>
        `;
        pagesList.appendChild(pageItem);
    });

    // Ouvintes de eventos para remoção de página
    document.querySelectorAll('.remove-page').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            pages.splice(index, 1);
            updatePagesList();
            showToast('Página removida');
        });
    });

    // Ouvintes de eventos para edição de página
    document.querySelectorAll('.edit-page').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            editPage(index);
            showToast('Edição da página iniciada');
        });
    });
}

// Inicializar Sortable.js para reordenação de páginas
new Sortable(pagesList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: function (evt) {
        const movedItem = pages.splice(evt.oldIndex, 1)[0];
        pages.splice(evt.newIndex, 0, movedItem);
    }
});

// Resetar formulário
function resetPageForm() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    descriptionTextarea.value = '';
    charCountSpan.textContent = '0 / 100 caracteres';
    imageUpload.value = '';
    imagePreview.innerHTML = '';
}

// Gerar PDF
function generatePDF() {
    if (pages.length === 0) {
        showToast('Adicione pelo menos uma página', 'warning');
        return;
    }

    const orientation = verticalCheckbox.checked ? 'p' : 'l';

    generatePdfBtn.disabled = true;
    generatePdfBtn.innerHTML = 'Gerando PDF...';

    // Create PDF with selected orientation
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth() - 20;
    const pageHeight = doc.internal.pageSize.getHeight() - 30;

    function formatDateTime() {
        const now = new Date();
        const format = (n) => n.toString().padStart(2, '0');
        return `relatorio_${now.getFullYear()}${format(now.getMonth() + 1)}${format(now.getDate())}_${format(now.getHours())}${format(now.getMinutes())}.pdf`;
    }

    try {
        pages.forEach((page, pageIndex) => {
            if (pageIndex > 0) doc.addPage();

            let yOffset = 10;
            // Companhias Aéreas
            doc.setFontSize(12);
            doc.text('Companhias Aéreas:', 10, yOffset);
            yOffset += 7;
            doc.text(page.airlines.join(', '), 10, yOffset);
            yOffset += 10;

            // Tipos de Pagamento
            doc.setFontSize(12);
            doc.text('Tipos de Pagamento:', 10, yOffset);
            yOffset += 7;
            doc.text(page.payments.join(', '), 10, yOffset);
            yOffset += 10;

            // Descrição
            doc.setFontSize(12);
            doc.text('Descrição:', 10, yOffset);
            yOffset += 7;
            doc.text(page.description, 10, yOffset);
            yOffset += 10;

            // Imagens com proporção original
            page.images.forEach((img, imgIndex) => {
                const maxWidth = pageWidth;
                const maxHeight = pageHeight - yOffset;

                let drawWidth, drawHeight;
                if (img.width / img.height > maxWidth / maxHeight) {
                    // Imagem mais larga que o espaço
                    drawWidth = maxWidth;
                    drawHeight = (img.height / img.width) * maxWidth;
                } else {
                    // Imagem mais alta que o espaço
                    drawHeight = maxHeight;
                    drawWidth = (img.width / img.height) * maxHeight;
                }

                // Centralizar horizontalmente
                const xPosition = (pageWidth - drawWidth) / 2 + 10;

                doc.addImage(img.src, 'JPEG', xPosition, yOffset, drawWidth, drawHeight);
                yOffset += drawHeight + 10;
            });
        });

        // Salvar PDF
        doc.save(formatDateTime());
        showToast('PDF gerado com sucesso!');
    } catch (error) {
        showToast('Erro ao gerar PDF', 'danger');
        console.error(error);
    } finally {
        generatePdfBtn.disabled = false;
        generatePdfBtn.innerHTML = 'Gerar PDF';
    }
}

// Eventos
newPageBtn.addEventListener('click', () => {
    const pageData = capturePage();
    if (pageData) {
        showToast('Nova página adicionada');
        resetPageForm();
        updatePagesList();
    }
});

// Ensure only one checkbox can be checked at a time
verticalCheckbox.addEventListener('change', () => {
    if (verticalCheckbox.checked) {
        horizontalCheckbox.checked = false;
    } else {
        // Prevent unchecking both
        horizontalCheckbox.checked = true;
    }
});

horizontalCheckbox.addEventListener('change', () => {
    if (horizontalCheckbox.checked) {
        verticalCheckbox.checked = false;
    } else {
        // Prevent unchecking both
        verticalCheckbox.checked = true;
    }
});

generatePdfBtn.addEventListener('click', generatePDF);