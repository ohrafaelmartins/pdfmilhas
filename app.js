$(document).ready(function () {
    const { jsPDF } = window.jspdf;

    const codigosIATA = [
        "ATL", "PEK", "LHR", "HND", "ORD", "DXB", "CDG", "DFW", "CAN", "JFK",
        "AMS", "PVG", "FRA", "IST", "SIN", "ICN", "BKK", "HKG", "DEL", "SYD",
        "LAX", "MIA", "GRU", "EZE", "LIM", "SCL", "BOG", "MEX", "YYZ", "YVR",
        "MUC", "MAD", "VIE", "ZRH", "CPH", "ARN", "HEL", "OSL", "BRU", "MXP",
        "FCO", "NAP", "BCN", "MLA", "ATH", "OTP", "PRG", "BUD", "LIS", "DUB",
        "MNL", "KUL", "CGK", "BNE", "AKL", "DOH", "JNB", "CAI", "LOS", "ADD",
        "NRT", "KIX", "CTS", "ITM", "OKA", "TPE", "PUS", "ICN", "FUK", "HGH",
    ];

    // Adiciona os códigos IATA ao select
    const addOptions = (selector) => {
        codigosIATA.forEach((code) => {
            $(selector).append(`<option value="${code}">${code}</option>`);
        });
    };

    addOptions("#origem");
    addOptions("#destino");

    let pageIndex = 0;

    // Adiciona uma nova página dinâmica
    $("#addPage").click(function () {
        pageIndex++;
        const newPage = `
        <div class="dynamic-page border p-3 mt-3" data-page="${pageIndex}">
          <h5>Página Dinâmica ${pageIndex}</h5>
          <div class="mb-3">
            <label class="form-label">Companhia Aérea</label>
            <select class="form-select companhia">
              <option value="Azul">Azul</option>
              <option value="Gol">Gol</option>
              <option value="Latam">Latam</option>
              <option value="Tap">Tap</option>
              <option value="Iberia">Iberia</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo de Pagamento</label>
            <select class="form-select pagamento">
              <option value="Pontos">Pontos</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Imagem</label>
            <input type="file" class="form-control imagem" accept="image/*">
          </div>
        </div>`;
        $("#dynamicPages").append(newPage);
    });

    // Gerar PDF
    $("#generatePDF").click(async function () {
        const nomeCliente = $("#nomeCliente").val();
        const formatoPDF = $("#formatoPDF").val();
        const origem = $("#origem").val();
        const destino = $("#destino").val();
        const resumo = $("#resumo").val();
        const pdf = new jsPDF({
            orientation: formatoPDF,
            unit: "mm",
            format: "a4",
        });

        pdf.setFontSize(12);

        // Primeira Página
        pdf.text(`Nome do Cliente: ${nomeCliente}`, 20, 30);
        pdf.text(`Origem: ${origem}`, 20, 40);
        pdf.text(`Destino: ${destino}`, 20, 50);

        // Segunda Página
        pdf.addPage();
        pdf.text("Resumo:", 20, 30);
        pdf.text(resumo, 20, 40, { maxWidth: 170 });

        // Páginas Dinâmicas
        const dynamicPages = $(".dynamic-page");
        for (let i = 0; i < dynamicPages.length; i++) {
            const page = $(dynamicPages[i]);
            const companhia = page.find(".companhia").val();
            const pagamento = page.find(".pagamento").val();
            const imagemInput = page.find(".imagem")[0].files[0];

            pdf.addPage();
            pdf.text(`Companhia Aérea: ${companhia}`, 20, 30);
            pdf.text(`Tipo de Pagamento: ${pagamento}`, 20, 40);

            // Adiciona Imagem com Validação
            if (imagemInput) {
                const isValid = validateImage(imagemInput);
                if (!isValid) continue;

                const imgData = await readImageAsDataURL(imagemInput);

                // Define espaço máximo para a imagem
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const maxWidth = pageWidth - 40; // Margem ABNT
                const maxHeight = pageHeight - 60; // Margem ABNT

                pdf.addImage(imgData, "JPEG", 20, 50, maxWidth, maxHeight - 50, undefined, 'FAST');
            }
        }

        // Salva o PDF
        const nomeArquivo = `${nomeCliente.toLowerCase().replace(/ /g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(nomeArquivo);
    });

    // Função para carregar imagem como DataURL
    function readImageAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event) {
                resolve(event.target.result);
            };
            reader.onerror = function (error) {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    // Valida Imagem
    function validateImage(file) {
        const maxSize = 1.6 * 1024 * 1024; // 1,6 MB
        const validFormats = ["image/jpeg", "image/png"];

        if (!validFormats.includes(file.type)) {
            alert("Formato de imagem inválido! Apenas JPEG e PNG são aceitos.");
            return false;
        }
        if (file.size > maxSize) {
            alert("Imagem muito grande! O tamanho máximo permitido é 1,6 MB.");
            return false;
        }
        return true;
    }


});
