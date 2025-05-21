// js/main.js
// ==================================
// Estado da Aplicação
// ==================================
let garagem = [];
let veiculoAtualPlaca = null;

// ==================================
// Objetos de Áudio para Interação (Exemplos, descomente e adicione seus arquivos de áudio)
// ==================================
// const somLigar = new Audio('audio/ligar.mp3');
// const somDesligar = new Audio('audio/desligar.mp3');
// const somBuzina = new Audio('audio/buzina.mp3');
// const somTurbo = new Audio('audio/turbo.mp3');
// const somCarga = new Audio('audio/carga.mp3');


// ==================================
// Configuração da API Key (Clima)
// ==================================
// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const apiKey = "0c700589f821587ef3ab07ab0e7ed6c2"; // SUA CHAVE REAL AQUI

// ==================================
// Funções de API (Simulada Veículo e Real Clima)
// ==================================

/**
 * Busca detalhes adicionais de um veículo em uma fonte de dados externa (simulada).
 * @async
 * @param {string} placaVeiculo - A placa do veículo a ser buscada.
 * @returns {Promise<object|null>} Promise com dados do veículo ou null se não encontrado ou erro.
 */
async function buscarDetalhesVeiculoAPI(placaVeiculo) {
    const apiUrl = './dados-veiculos-api.json'; // Nome do arquivo JSON
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Veículo Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        const todosDetalhes = await response.json();
        const detalhes = todosDetalhes.find(item => item && item.placa === placaVeiculo);
        return detalhes || null;
    } catch (error) {
        console.error("Falha na busca de detalhes da API Veículo:", error);
        if (typeof exibirNotificacao === 'function') {
            exibirNotificacao(`Erro ao buscar dados extras do veículo: ${error.message}`, "error");
        }
        return null;
    }
}

/**
 * Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade.
 * Endpoint: "5 day / 3 hour forecast"
 * URL base: https://api.openweathermap.org/data/2.5/forecast
 * Parâmetros: q (cidade), appid (chave), units=metric, lang=pt_br
 * @async
 * @param {string} cidade - O nome da cidade para buscar a previsão.
 * @returns {Promise<object|null>} Uma Promise que resolve com os dados completos da API
 *                                  ou lança um erro em caso de falha.
 */
async function buscarPrevisaoDetalhada(cidade) {
    // Usar um placeholder genérico para a verificação, pois a chave real já está na const apiKey
    if (apiKey === "SUA_CHAVE_OPENWEATHERMAP_AQUI" || !apiKey) {
        const errorMsg = "A chave da API de clima (OpenWeatherMap) não está configurada. Por favor, adicione-a em js/main.js.";
        console.error(errorMsg);
        // A notificação será exibida pelo chamador (handleVerificarClima)
        throw new Error(errorMsg);
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(url);
        const data = await response.json(); // Tenta parsear JSON mesmo se não for ok, para obter msg de erro da API

        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}: ${data.message || response.statusText || 'Erro desconhecido ao buscar previsão detalhada.'}`;
            if (response.status === 401) {
                errorMessage = "Chave de API inválida ou não autorizada para previsão detalhada. Verifique sua chave no OpenWeatherMap e no arquivo js/main.js.";
            } else if (response.status === 404) {
                errorMessage = `Cidade "${cidade}" não encontrada pelo serviço de previsão detalhada.`;
            }
            console.error("Erro ao buscar previsão detalhada:", errorMessage, data);
            throw new Error(errorMessage);
        }
        return data; // Retorna os dados completos
    } catch (error) {
        // Loga o erro e re-lança para ser tratado por quem chamou
        console.error(`Falha na requisição ou processamento ao buscar previsão detalhada para "${cidade}":`, error.message);
        throw error; // Re-lança o erro para ser pego pelo catch no handleVerificarClima
    }
}

/**
 * Processa os dados brutos da API de forecast para um formato de resumo diário.
 * @param {object} data - O objeto JSON completo retornado pela API de forecast.
 * @returns {Array<object>|null} Um array de objetos, cada um representando um dia com dados resumidos,
 *                                ou null se os dados de entrada forem inválidos.
 * Exemplo de retorno: [{ data: 'AAAA-MM-DD', temp_min: X, temp_max: Y, descricao: '...', icone: '...' }, ...]
 */
function processarDadosForecast(data) {
    if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
        console.warn("Dados de forecast inválidos ou lista de previsões vazia.", data);
        return null;
    }

    const previsoesPorDia = {};

    data.list.forEach(previsaoHoraria => {
        const dia = previsaoHoraria.dt_txt.split(' ')[0]; // Extrai 'AAAA-MM-DD'
        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = {
                data: dia,
                temps: [],
                // Armazena a previsão horária completa se for de 12:00 ou 15:00 (ou a primeira do dia)
                previsaoRepresentativa: null
            };
        }
        previsoesPorDia[dia].temps.push(previsaoHoraria.main.temp);
        
        const hora = previsaoHoraria.dt_txt.split(' ')[1];
        if (hora === "12:00:00") {
            previsoesPorDia[dia].previsaoRepresentativa = previsaoHoraria;
        } else if (hora === "15:00:00" && (!previsoesPorDia[dia].previsaoRepresentativa || previsoesPorDia[dia].previsaoRepresentativa.dt_txt.split(' ')[1] !== "12:00:00")) {
            previsoesPorDia[dia].previsaoRepresentativa = previsaoHoraria;
        } else if (!previsoesPorDia[dia].previsaoRepresentativa) {
            previsoesPorDia[dia].previsaoRepresentativa = previsaoHoraria;
        }
    });

    const resultadoFinal = [];
    for (const diaStr in previsoesPorDia) {
        const diaData = previsoesPorDia[diaStr];
        
        const rep = diaData.previsaoRepresentativa || data.list.find(p => p.dt_txt.startsWith(diaStr));

        resultadoFinal.push({
            data: diaData.data,
            temp_min: Math.min(...diaData.temps),
            temp_max: Math.max(...diaData.temps),
            descricao: rep ? rep.weather[0].description : 'N/D',
            icone: rep ? rep.weather[0].icon : '01d' 
        });
    }
    resultadoFinal.sort((a,b) => new Date(a.data) - new Date(b.data));
    return resultadoFinal;
}


// ==================================
// Funções de Lógica Principal
// ==================================

function encontrarVeiculo(placa) {
    if (!placa) return undefined;
    return garagem.find(v => v && v.placa === placa);
}

function handleAddVeiculo(event) {
    event.preventDefault();
    const tipo = document.getElementById('veiculo-tipo').value;
    const placaInput = document.getElementById('veiculo-placa');
    const modeloInput = document.getElementById('veiculo-modelo');
    const corInput = document.getElementById('veiculo-cor');

    const placa = placaInput.value.trim().toUpperCase();
    const modelo = modeloInput.value.trim();
    const cor = corInput.value.trim();

    if (!placa || !modelo || !cor) {
        exibirNotificacao("Placa, modelo e cor são obrigatórios.", "error");
        return;
    }
    if (encontrarVeiculo(placa)) {
        exibirNotificacao(`A placa ${placa} já está cadastrada na garagem.`, "error");
        return;
    }

    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro':
                const numPortasCarro = document.getElementById('carro-portas').value;
                novoVeiculo = new Carro(placa, modelo, cor, numPortasCarro);
                break;
            case 'CarroEsportivo':
                const numPortasEsportivo = document.getElementById('carroesportivo-portas').value;
                novoVeiculo = new CarroEsportivo(placa, modelo, cor, numPortasEsportivo);
                break;
            case 'Caminhao':
                const numEixos = document.getElementById('caminhao-eixos').value;
                const capacidade = document.getElementById('caminhao-capacidade').value;
                novoVeiculo = new Caminhao(placa, modelo, cor, numEixos, capacidade);
                break;
            default:
                exibirNotificacao("Tipo de veículo selecionado inválido.", "error");
                return;
        }
        garagem.push(novoVeiculo);
        salvarGaragem(garagem); 
        exibirVeiculos(garagem); 
        exibirNotificacao(`${tipo} ${placa} adicionado com sucesso!`, "success"); 
        limparFormulario('form-add-veiculo'); 
    } catch (error) {
        console.error("Erro ao criar ou adicionar veículo:", error);
        exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, "error");
    }
}

function handleClickDetalhesGaragem(event) {
    if (event.target.classList.contains('btn-detalhes') || event.target.closest('.btn-detalhes')) {
        const placa = (event.target.classList.contains('btn-detalhes') ? event.target.dataset.placa : event.target.closest('.btn-detalhes').dataset.placa);
        const veiculo = encontrarVeiculo(placa);
        if (veiculo) {
            veiculoAtualPlaca = placa;
            exibirDetalhesCompletos(veiculo); 
        } else {
            exibirNotificacao(`Veículo com placa ${placa} não encontrado na garagem.`, "error"); 
            veiculoAtualPlaca = null;
        }
    }
}

async function handleBuscarDetalhesAPI(event) {
    if (!event.target.classList.contains('btn-api-details') && !event.target.closest('.btn-api-details')) return;
    const placa = event.target.dataset.placa || event.target.closest('.btn-api-details').dataset.placa;

    if (typeof exibirFeedbackLoadingAPI !== 'function' || typeof exibirDetalhesAPI !== 'function') {
        console.error("Funções de UI para API details não encontradas (exibirFeedbackLoadingAPI ou exibirDetalhesAPI).");
        return;
    }

    exibirFeedbackLoadingAPI(placa); 
    try {
        const detalhes = await buscarDetalhesVeiculoAPI(placa);
        exibirDetalhesAPI(detalhes, placa); 
    } catch (error) {
        console.error("Erro no manipulador handleBuscarDetalhesAPI:", error);
        exibirDetalhesAPI(null, placa); 
    }
}


function handleAgendarManutencao(event) {
    event.preventDefault();
    const placa = document.getElementById('agendamento-veiculo-placa').value;
    const dataInput = document.getElementById('agenda-data');
    const tipoInput = document.getElementById('agenda-tipo');
    const custoInput = document.getElementById('agenda-custo');
    const descricaoInput = document.getElementById('agenda-descricao');

    const data = dataInput.value;
    const tipo = tipoInput.value.trim();
    const custoStr = custoInput.value;
    const descricao = descricaoInput.value.trim();

    if (!placa || !data || !tipo || custoStr === '') {
        exibirNotificacao("Preencha Data, Tipo de Serviço e Custo para agendar.", "error");
        return;
    }
    const custo = parseFloat(custoStr);
    if (isNaN(custo) || custo < 0) {
        exibirNotificacao("O Custo informado é inválido ou negativo.", "error");
        return;
    }

    const veiculo = encontrarVeiculo(placa);
    if (!veiculo) {
        exibirNotificacao(`Veículo com placa ${placa} não encontrado para agendamento.`, "error");
        return;
    }

    try {
        const dataObj = new Date(data + 'T00:00:00Z'); // Usar Z para UTC ou remover para local
        if (isNaN(dataObj.getTime())) {
            exibirNotificacao("A data fornecida para o agendamento é inválida.", "error");
            return;
        }

        const novaManutencao = new Manutencao(dataObj, tipo, custo, descricao);
        if (!novaManutencao.validar()) { 
            exibirNotificacao("Dados fornecidos para a manutenção são inválidos.", "error");
            return;
        }

        if (veiculo.adicionarManutencao(novaManutencao)) {
            salvarGaragem(garagem);
            exibirDetalhesCompletos(veiculo); 
            exibirNotificacao(`Manutenção para ${placa} agendada com sucesso!`, "success");
            limparFormulario('form-agendamento'); 
        } else {
            exibirNotificacao("Não foi possível adicionar o agendamento de manutenção.", "error");
        }
    } catch (error) {
        console.error("Erro ao criar ou agendar manutenção:", error);
        exibirNotificacao(`Erro ao agendar: ${error.message}`, "error");
    }
}

function verificarAgendamentos() {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    hoje.setHours(0, 0, 0, 0);
    amanha.setHours(0, 0, 0, 0);

    garagem.forEach(veiculo => {
        (veiculo.historicoManutencao || []).forEach(manutencao => {
            const dataManutencao = (manutencao.data instanceof Date) ? new Date(manutencao.data.getTime()) : new Date(manutencao.data);
            if (isNaN(dataManutencao.getTime())) return; 
            
            dataManutencao.setHours(0, 0, 0, 0); 

            if (dataManutencao.getTime() === hoje.getTime()) {
                exibirNotificacao(`Lembrete HOJE: ${manutencao.formatar()} p/ ${veiculo.placa}`, 'warning', 10000);
            } else if (dataManutencao.getTime() === amanha.getTime()) {
                exibirNotificacao(`Lembrete AMANHÃ: ${manutencao.formatar()} p/ ${veiculo.placa}`, 'info', 10000);
            }
        });
    });
}

/**
 * Manipulador para o clique no botão "Verificar Clima" (Previsão de 5 dias).
 * Busca e exibe a previsão do tempo detalhada para a cidade digitada.
 * @async
 */
async function handleVerificarClima() {
    const destinoInput = document.getElementById('destino-viagem');
    const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado');
    const btnVerificarClima = document.getElementById('verificar-clima-btn');

    if (!destinoInput || !previsaoResultadoDiv || !btnVerificarClima) {
        console.error("Elementos de input/output/botão do clima não encontrados.");
        if (typeof exibirNotificacao === 'function') exibirNotificacao("Erro interno: Elementos da interface de clima não encontrados.", "error");
        return;
    }
    const nomeCidade = destinoInput.value.trim();

    if (!nomeCidade) {
        if (typeof exibirNotificacao === 'function') exibirNotificacao("Por favor, digite o nome da cidade de destino.", "warning");
        previsaoResultadoDiv.innerHTML = '<p style="color: orange;">Digite uma cidade para verificar a previsão.</p>';
        return;
    }

    previsaoResultadoDiv.innerHTML = `<p>Buscando previsão detalhada para ${nomeCidade}...</p>`;
    btnVerificarClima.disabled = true;
    btnVerificarClima.textContent = 'Verificando...';


    try {
        const dadosBrutosForecast = await buscarPrevisaoDetalhada(nomeCidade);
        
        if (dadosBrutosForecast) {
            const previsaoProcessada = processarDadosForecast(dadosBrutosForecast);

            if (previsaoProcessada && typeof exibirPrevisaoDetalhada === 'function') {
                exibirPrevisaoDetalhada(previsaoProcessada, nomeCidade); 
            } else if (!previsaoProcessada) {
                if (typeof exibirNotificacao === 'function') exibirNotificacao(`Não foi possível processar os dados da previsão para ${nomeCidade}.`, "warning");
                previsaoResultadoDiv.innerHTML = `<p style="color: orange;">Não foi possível processar os dados da previsão para ${nomeCidade}. Verifique o console para mais detalhes.</p>`;
            } else {
                console.error("Função exibirPrevisaoDetalhada não encontrada em us.js");
                previsaoResultadoDiv.innerHTML = `<p style="color: red;">Erro na configuração da interface para exibir a previsão detalhada.</p>`;
            }
        } 
    } catch (error) {
        console.error(`Erro final ao tentar obter e exibir previsão detalhada para "${nomeCidade}":`, error);
        if (typeof exibirNotificacao === 'function') exibirNotificacao(`${error.message}`, "error", 7000);
        previsaoResultadoDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
    } finally {
        btnVerificarClima.disabled = false;
        btnVerificarClima.textContent = 'Verificar Previsão';
    }
}


// ==================================
// Funções de Interação com Veículo
// ==================================
function handleInteracao(acao) {
    if (!veiculoAtualPlaca) {
        exibirNotificacao("Nenhum veículo selecionado para interação.", "warning");
        return;
    }
    const veiculo = encontrarVeiculo(veiculoAtualPlaca);
    if (!veiculo) {
        exibirNotificacao("Erro interno: Veículo selecionado não encontrado.", "error");
        veiculoAtualPlaca = null;
        mostrarGaragemView(); 
        return;
    }

    let resultado = "";
    // let somParaTocar = null; 

    try {
        switch (acao) {
            case 'ligar':
                resultado = veiculo.ligar(); 
                // if (resultado.includes("ligado!") && typeof somLigar !== 'undefined') somParaTocar = somLigar; 
                break;
            case 'desligar':
                resultado = veiculo.desligar(); 
                // if (resultado.includes("desligado!") && typeof somDesligar !== 'undefined') somParaTocar = somDesligar; 
                break;
            case 'acelerar':
                resultado = veiculo.acelerar(); break;
            case 'frear':
                resultado = veiculo.frear(); break;
            case 'buzinar':
                resultado = veiculo.buzinar(); 
                // if (typeof somBuzina !== 'undefined') somParaTocar = somBuzina; 
                break;
            case 'turbo':
                if (veiculo instanceof CarroEsportivo) {
                    resultado = veiculo.turboAtivado ? veiculo.desativarTurbo() : veiculo.ativarTurbo();
                    // if (resultado.includes("ativado!") && typeof somTurbo !== 'undefined') somParaTocar = somTurbo;
                } else { resultado = "Esta ação só é aplicável a Carros Esportivos."; }
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                    resultado = veiculo.carregar(1000); 
                    // if (resultado.includes("carregado") && typeof somCarga !== 'undefined') somParaTocar = somCarga;
                } else { resultado = "Esta ação só é aplicável a Caminhões."; }
                break;
            case 'descarregar':
                if (veiculo instanceof Caminhao) {
                    resultado = veiculo.descarregar(500); 
                    // if (resultado.includes("descarregado") && typeof somCarga !== 'undefined') somParaTocar = somCarga;
                } else { resultado = "Esta ação só é aplicável a Caminhões."; }
                break;
            default: resultado = "Ação desconhecida.";
        }

        let tipoNotificacao = 'info';
        if (resultado.includes("Erro") || resultado.includes("não aplicável") || resultado.includes("Pare o veículo") || resultado.includes("excedida") || resultado.includes("Não há carga") || resultado.includes("já está") || resultado.includes("Ligue o veículo") || resultado.includes("Ligue o carro")) {
            tipoNotificacao = 'warning';
        }
        exibirNotificacao(resultado, tipoNotificacao);

        // if (somParaTocar && typeof somParaTocar.play === 'function') {
        //     somParaTocar.currentTime = 0;
        //     somParaTocar.play().catch(e => console.warn(`Erro ao tocar o som para a ação ${acao}:`, e));
        // }

        atualizarDetalhesInteracao(veiculo); 
        salvarGaragem(garagem); 

    } catch (error) {
        console.error(`Erro durante a execução da ação '${acao}' no veículo ${veiculoAtualPlaca}:`, error);
        exibirNotificacao(`Erro inesperado ao tentar '${acao}'. Verifique o console.`, "error");
    }
}

// ==================================
// Inicialização e Event Listeners
// ==================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Inicializando Garagem Inteligente Unificada...");
    garagem = carregarGaragem(); 
    exibirVeiculos(garagem); 

    const formAdd = document.getElementById('form-add-veiculo');
    if (formAdd) formAdd.addEventListener('submit', handleAddVeiculo);
    else console.error("Form 'form-add-veiculo' não encontrado.");

    const formAgend = document.getElementById('form-agendamento');
    if (formAgend) formAgend.addEventListener('submit', handleAgendarManutencao);
    else console.error("Form 'form-agendamento' não encontrado.");

    const elListaGaragem = document.getElementById('lista-garagem');
    if (elListaGaragem) {
        elListaGaragem.addEventListener('click', (event) => {
            handleClickDetalhesGaragem(event); 
            handleBuscarDetalhesAPI(event);    
        });
    } else console.error("Elemento 'lista-garagem' não encontrado.");

    const btnVoltar = document.getElementById('btn-voltar-garagem');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            veiculoAtualPlaca = null;
            mostrarGaragemView(); 
        });
    } else console.error("Botão 'btn-voltar-garagem' não encontrado.");

    const btnCloseApi = document.getElementById('btn-close-api-details');
    const elApiDetailsSection = document.getElementById('api-details-section');
    if (btnCloseApi && elApiDetailsSection) {
        btnCloseApi.addEventListener('click', () => elApiDetailsSection.style.display = 'none');
    } else console.warn("Botão/Seção de fechar API details não encontrados.");

    const botoesInteracaoConfig = [
        { id: 'btn-detail-ligar', acao: 'ligar' }, { id: 'btn-detail-desligar', acao: 'desligar' },
        { id: 'btn-detail-acelerar', acao: 'acelerar' }, { id: 'btn-detail-frear', acao: 'frear' },
        { id: 'btn-detail-buzinar', acao: 'buzinar' }, { id: 'btn-detail-turbo', acao: 'turbo' },
        { id: 'btn-detail-carregar', acao: 'carregar' }, { id: 'btn-detail-descarregar', acao: 'descarregar' },
    ];
    botoesInteracaoConfig.forEach(config => {
        const btn = document.getElementById(config.id);
        if (btn) btn.addEventListener('click', () => handleInteracao(config.acao));
        else console.warn(`Botão de interação '${config.id}' não encontrado.`);
    });

    const elVeiculoTipoSelect = document.getElementById('veiculo-tipo');
    if (elVeiculoTipoSelect) {
        elVeiculoTipoSelect.addEventListener('change', atualizarCamposEspecificos); 
        atualizarCamposEspecificos(); 
    }
    else console.error("Select 'veiculo-tipo' não encontrado.");

    const btnVerificarClima = document.getElementById('verificar-clima-btn');
    if (btnVerificarClima) {
        btnVerificarClima.addEventListener('click', handleVerificarClima);
    } else {
        console.error("Botão 'verificar-clima-btn' não encontrado.");
    }
    verificarAgendamentos(); 
    console.log("Garagem Inteligente Unificada inicializada com sucesso.");
});