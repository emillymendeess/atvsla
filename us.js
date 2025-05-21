// js/us.js (ou ui.js)
// ==================================
// Referências de Elementos do DOM
// ==================================
const garagemSection = document.getElementById('garage-section');
const addVehicleSection = document.getElementById('add-vehicle-section');
const detalhesSection = document.getElementById('detalhes-veiculo-section');
const listaGaragemElement = document.getElementById('lista-garagem');
const detalhesTituloElement = document.getElementById('detalhes-veiculo-titulo');
const listaHistoricoElement = document.getElementById('lista-historico');
const listaAgendamentosElement = document.getElementById('lista-agendamentos');
const veiculoTipoSelect = document.getElementById('veiculo-tipo');
const agendamentoPlacaInput = document.getElementById('agendamento-veiculo-placa');
const detalhesStatusElement = document.getElementById('detalhes-veiculo-status');
const detalhesBotoesContainer = document.getElementById('detalhes-veiculo-botoes');
const detalhesImagemElement = document.getElementById('detalhes-veiculo-imagem');
const notificacoesContainer = document.getElementById('notificacoes-container');
const apiDetailsSection = document.getElementById('api-details-section');
const apiDetailsContent = document.getElementById('api-details-content');
const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado');

// ==================================
// Funções de Exibição e UI
// ==================================

/**
 * Exibe os veículos na lista da garagem.
 * @param {Veiculo[]} veiculos - Array de objetos Veiculo.
 */
function exibirVeiculos(veiculos) {
    if (!listaGaragemElement) {
        console.error("Elemento 'lista-garagem' não encontrado para exibir veículos.");
        return;
    }
    listaGaragemElement.innerHTML = '';
    if (!veiculos || veiculos.length === 0) {
        listaGaragemElement.innerHTML = '<p>Nenhum veículo na garagem.</p>';
        return;
    }
    veiculos.forEach(veiculo => {
        const li = document.createElement('li');
        li.classList.add('veiculo-list-item');
        li.classList.add(`veiculo-${veiculo._tipoVeiculo.toLowerCase()}`);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('veiculo-info');
        infoDiv.innerHTML = `<p><strong>${veiculo.placa}</strong> - ${veiculo.modelo} (${veiculo.cor}) - <em>${veiculo.status || 'Status Desconhecido'}</em></p>`;

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('veiculo-actions');
        actionsDiv.innerHTML = `
            <button class="btn btn-success btn-sm btn-detalhes" data-placa="${veiculo.placa}">
                Detalhes / Interagir
            </button>
            <button class="btn btn-info btn-sm btn-api-details" data-placa="${veiculo.placa}">
                Info Extra (API)
            </button>
        `;
        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        listaGaragemElement.appendChild(li);
    });
}

/**
 * Atualiza a seção de detalhes e interação do veículo.
 * @param {Veiculo} veiculo - O objeto Veiculo cujos detalhes serão exibidos.
 */
function atualizarDetalhesInteracao(veiculo) {
    if (!veiculo) {
        if (detalhesStatusElement) detalhesStatusElement.textContent = 'Erro: Veículo não encontrado para interação.';
        if (detalhesBotoesContainer) detalhesBotoesContainer.innerHTML = '';
        return;
    }
    if (!detalhesStatusElement || !detalhesBotoesContainer) {
        console.error("Elementos de status ou botões de detalhes não encontrados.");
        return;
    }

    detalhesStatusElement.textContent = veiculo.getInfo(true);

    const btnLigar = document.getElementById('btn-detail-ligar');
    const btnDesligar = document.getElementById('btn-detail-desligar');
    const btnAcelerar = document.getElementById('btn-detail-acelerar');
    const btnFrear = document.getElementById('btn-detail-frear');
    const btnBuzinar = document.getElementById('btn-detail-buzinar');
    const btnTurbo = document.getElementById('btn-detail-turbo');
    const btnCarregar = document.getElementById('btn-detail-carregar');
    const btnDescarregar = document.getElementById('btn-detail-descarregar');

    if (!btnLigar || !btnDesligar || !btnAcelerar || !btnFrear || !btnBuzinar || !btnTurbo || !btnCarregar || !btnDescarregar) {
        console.error("Um ou mais botões de interação não foram encontrados no DOM.");
        if (detalhesStatusElement) detalhesStatusElement.textContent += " (Erro: Botões de interação faltando)";
        return;
    }

    btnTurbo.style.display = (veiculo instanceof CarroEsportivo) ? 'inline-block' : 'none';
    btnCarregar.style.display = (veiculo instanceof Caminhao) ? 'inline-block' : 'none';
    btnDescarregar.style.display = (veiculo instanceof Caminhao) ? 'inline-block' : 'none';

    btnLigar.disabled = veiculo.ligado;
    btnDesligar.disabled = !veiculo.ligado || veiculo.velocidade > 0;
    btnAcelerar.disabled = !veiculo.ligado;
    btnFrear.disabled = !veiculo.ligado || veiculo.velocidade === 0;
    btnBuzinar.disabled = false;

    if (veiculo instanceof CarroEsportivo) {
        btnTurbo.textContent = veiculo.turboAtivado ? 'Desativar Turbo' : 'Ativar Turbo';
    }

    if (detalhesImagemElement) {
        let imagemSrc = '';
        switch (veiculo._tipoVeiculo) {
            case 'Carro': imagemSrc = 'images/carro.png'; break;
            case 'CarroEsportivo': imagemSrc = 'images/carroesportivo.png'; break;
            case 'Caminhao': imagemSrc = 'images/caminhao.png'; break;
            default: imagemSrc = 'images/veiculo_default.png'; 
        }
        if (imagemSrc) {
            detalhesImagemElement.src = imagemSrc;
            detalhesImagemElement.alt = `Imagem de um ${veiculo._tipoVeiculo}`;
            detalhesImagemElement.style.display = 'block';
        } else {
            detalhesImagemElement.style.display = 'none';
        }
    }
}

/**
 * Exibe a visão de detalhes completos de um veículo.
 * @param {Veiculo} veiculo - O objeto Veiculo.
 */
function exibirDetalhesCompletos(veiculo) {
    if (!veiculo) {
        console.error("Tentativa de exibir detalhes internos de um veículo inválido.");
        mostrarGaragemView();
        exibirNotificacao("Erro ao carregar detalhes do veículo.", "error");
        return;
    }
    if (!detalhesSection || !detalhesTituloElement || !agendamentoPlacaInput || !listaHistoricoElement || !listaAgendamentosElement || !garagemSection || !addVehicleSection) {
        console.error("Elementos essenciais para exibirDetalhesCompletos não encontrados.");
        return;
    }

    detalhesTituloElement.textContent = `Detalhes - ${veiculo.placa} (${veiculo.modelo})`;
    agendamentoPlacaInput.value = veiculo.placa;
    atualizarDetalhesInteracao(veiculo);

    listaHistoricoElement.innerHTML = '';
    listaAgendamentosElement.innerHTML = '';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let historicoCount = 0;
    let agendamentoCount = 0;

    if (veiculo.historicoManutencao && veiculo.historicoManutencao.length > 0) {
        veiculo.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        veiculo.historicoManutencao.forEach(manutencao => {
            const li = document.createElement('li');
            li.textContent = manutencao.formatar();
            
            const dataManutencao = (manutencao.data instanceof Date) ? new Date(manutencao.data.getTime()) : new Date(manutencao.data);
            if (isNaN(dataManutencao.getTime())) return;
            dataManutencao.setHours(0,0,0,0);

            if (dataManutencao <= hoje) {
                listaHistoricoElement.appendChild(li);
                historicoCount++;
            } else {
                listaAgendamentosElement.appendChild(li);
                agendamentoCount++;
            }
        });
    }

    if (historicoCount === 0) listaHistoricoElement.innerHTML = '<li>Nenhum histórico registrado.</li>';
    if (agendamentoCount === 0) listaAgendamentosElement.innerHTML = '<li>Nenhum agendamento futuro.</li>';

    detalhesSection.style.display = 'block';
    garagemSection.style.display = 'none';
    addVehicleSection.style.display = 'none';
    if (apiDetailsSection) apiDetailsSection.style.display = 'none';
}

/**
 * Mostra a visão principal da garagem e o formulário de adicionar veículo.
 */
function mostrarGaragemView() {
    if (detalhesSection) detalhesSection.style.display = 'none';
    if (garagemSection) garagemSection.style.display = 'block';
    if (addVehicleSection) addVehicleSection.style.display = 'block';
    if (apiDetailsSection) apiDetailsSection.style.display = 'none';
}

/**
 * Exibe uma notificação na tela.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {string} [tipo='info'] - O tipo de notificação ('info', 'success', 'error', 'warning').
 * @param {number} [duracao=4000] - Duração em milissegundos. 0 para persistente.
 */
function exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
    if (!notificacoesContainer) {
        console.error("Container de notificações não encontrado! Mensagem:", mensagem);
        alert(mensagem); 
        return;
    }
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    notificacoesContainer.appendChild(notificacao);

    if (duracao > 0) {
        setTimeout(() => {
            notificacao.classList.add('fade-out');
            setTimeout(() => { if(notificacao.parentNode) notificacao.remove(); }, 500); 
        }, duracao);
    }
}

/**
 * Limpa um formulário.
 * @param {string} formId - O ID do formulário a ser limpo.
 */
function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form && typeof form.reset === 'function') {
        form.reset();
        if (formId === 'form-add-veiculo' && typeof atualizarCamposEspecificos === 'function') {
            atualizarCamposEspecificos();
        }
    } else {
        console.warn(`Formulário com ID '${formId}' não encontrado ou não é um formulário.`);
    }
}

/**
 * Atualiza a visibilidade dos campos específicos do formulário de adicionar veículo
 * com base no tipo de veículo selecionado.
 */
function atualizarCamposEspecificos() {
    if (!veiculoTipoSelect) return;
    const tipoSelecionado = veiculoTipoSelect.value;
    document.querySelectorAll('.campos-especificos').forEach(div => {
        div.style.display = 'none';
    });
    const idCampoParaMostrar = `campos-${tipoSelecionado.toLowerCase()}`;
    const camposParaMostrar = document.getElementById(idCampoParaMostrar);
    if (camposParaMostrar) {
        camposParaMostrar.style.display = 'block';
    }
}

/**
 * Exibe um feedback de carregamento ao buscar detalhes da API.
 * @param {string} placa - A placa do veículo.
 */
function exibirFeedbackLoadingAPI(placa) {
    if (!apiDetailsSection || !apiDetailsContent) {
        console.error("Elementos da seção de detalhes da API não encontrados para loading.");
        return;
    }
    apiDetailsContent.innerHTML = `<p>Buscando detalhes adicionais para ${placa}...</p>`;
    apiDetailsSection.style.display = 'block';
    if (detalhesSection) detalhesSection.style.display = 'none';
    if (garagemSection) garagemSection.style.display = 'none';
    if (addVehicleSection) addVehicleSection.style.display = 'none';
}

/**
 * Exibe os detalhes de um veículo obtidos de uma API externa.
 * @param {object|null} detalhes - Objeto com os detalhes do veículo ou null se erro.
 * @param {string} placa - A placa do veículo.
 */
function exibirDetalhesAPI(detalhes, placa) {
    if (!apiDetailsSection || !apiDetailsContent) {
        console.error("Elementos da seção de detalhes da API não encontrados para exibição.");
        return;
    }
    apiDetailsContent.innerHTML = ''; 

    if (detalhes) {
        const valorFIPEFormatado = detalhes.valorFIPE ? `R$ ${detalhes.valorFIPE.toFixed(2).replace('.', ',')}` : 'N/D';
        const temRecallTexto = detalhes.temRecall ? `<strong style="color: red;">Sim</strong>` : 'Não';
        const recallInfoHtml = detalhes.temRecall && detalhes.recallInfo ? `<p><strong>Informação Recall:</strong> ${detalhes.recallInfo}</p>` : '';
        const consumoCidade = detalhes.consumoMedioCidade ? `${detalhes.consumoMedioCidade} km/l` : 'N/D';
        const consumoEstrada = detalhes.consumoMedioEstrada ? `${detalhes.consumoMedioEstrada} km/l` : 'N/D';
        const imagemHtml = detalhes.imagemUrl ? `<img src="${detalhes.imagemUrl}" alt="Imagem de ${detalhes.modelo || placa}" style="max-width: 150px; float: right; margin-left: 10px; border-radius: 5px; border: 1px solid #ccc;">` : '';

        apiDetailsContent.innerHTML = `
            <h4>Detalhes Adicionais para ${placa} (${detalhes.modelo || 'Modelo Desconhecido'})</h4>
            ${imagemHtml}
            <p><strong>Valor Tabela FIPE (Estimado):</strong> ${valorFIPEFormatado}</p>
            <p><strong>Consumo Médio (Cidade):</strong> ${consumoCidade}</p>
            <p><strong>Consumo Médio (Estrada):</strong> ${consumoEstrada}</p>
            <p><strong>Possui Recall Pendente:</strong> ${temRecallTexto}</p>
            ${recallInfoHtml}
            <p><strong>Dica de Manutenção:</strong> ${detalhes.dicaManutencao || 'Nenhuma dica específica.'}</p>
            <p style="clear: both;"><small><em>Identificador API: ${detalhes.identificadorUnico || 'N/D'}</em></small></p>
        `;
    } else {
        apiDetailsContent.innerHTML = `<p>Não foram encontrados detalhes adicionais para a placa ${placa} na fonte externa ou ocorreu um erro ao buscar os dados.</p>`;
    }
    apiDetailsSection.style.display = 'block';
}

/**
 * Exibe a previsão do tempo detalhada (para os próximos dias) na interface.
 * @param {Array<object>} previsaoDiaria - Array com os dados da previsão diária processados.
 *                                         Cada objeto deve ter: { data, temp_min, temp_max, descricao, icone }.
 * @param {string} nomeCidade - O nome da cidade para exibição no título.
 */
function exibirPrevisaoDetalhada(previsaoDiaria, nomeCidade) {
    if (!previsaoResultadoDiv) {
        console.error("Div de resultado da previsão (#previsao-tempo-resultado) não encontrado.");
        return;
    }
    previsaoResultadoDiv.innerHTML = ''; 

    if (!previsaoDiaria || previsaoDiaria.length === 0) {
        previsaoResultadoDiv.innerHTML = `<p style="color: orange;">Não há dados de previsão detalhada para exibir para ${nomeCidade}.</p>`;
        return;
    }

    const nomeCidadeCapitalizado = nomeCidade.charAt(0).toUpperCase() + nomeCidade.slice(1);
    let htmlContent = `<h4>Previsão para os Próximos Dias em ${nomeCidadeCapitalizado}</h4>`;
    htmlContent += '<div class="forecast-container">';

    previsaoDiaria.forEach(dia => {
        // Adicionar 'T00:00:00Z' para garantir que a data seja interpretada como UTC
        // e depois formatada para o locale 'pt-BR' considerando UTC.
        const dataObj = new Date(dia.data + 'T00:00:00Z'); 
        const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }); 
        const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
        const descricaoCapitalizada = dia.descricao ? dia.descricao.charAt(0).toUpperCase() + dia.descricao.slice(1) : 'N/D';

        htmlContent += `
            <div class="forecast-card">
                <div class="forecast-date">${diaSemana}, ${dataFormatada}</div>
                <img src="https://openweathermap.org/img/wn/${dia.icone}@2x.png" alt="${descricaoCapitalizada}" title="${descricaoCapitalizada}" class="forecast-icon">
                <div class="forecast-temps">
                    <span class="temp-max" title="Máxima">${dia.temp_max.toFixed(0)}°C</span> / 
                    <span class="temp-min" title="Mínima">${dia.temp_min.toFixed(0)}°C</span>
                </div>
                <div class="forecast-description">${descricaoCapitalizada}</div>
            </div>
        `;
    });

    htmlContent += '</div>';
    previsaoResultadoDiv.innerHTML = htmlContent;
}