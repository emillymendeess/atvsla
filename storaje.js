/**
 * Chave usada para armazenar os dados da garagem no LocalStorage.
 */
const GARAGEM_STORAGE_KEY = '0c700589f821587ef3ab07ab0e7ed6c2';

/**
 * Salva a lista atual de veículos, incluindo seu estado de interação, no LocalStorage.
 * @param {Veiculo[]} veiculos - O array de objetos Veiculo (ou subclasses) a ser salvo.
 */
function salvarGaragem(veiculos) {
    try {
        const dataToSave = JSON.stringify(veiculos);
        localStorage.setItem(GARAGEM_STORAGE_KEY, dataToSave);
    } catch (error) {
        console.error("Erro ao salvar dados da garagem no LocalStorage:", error);
        if (typeof exibirNotificacao === 'function') {
            exibirNotificacao("Erro crítico ao salvar dados. Verifique o console.", "error", 0);
        }
    }
}

/**
 * Carrega a lista de veículos do LocalStorage.
 * Reconstrói as instâncias das classes corretas e restaura o estado.
 * @returns {Veiculo[]} Um array com os objetos Veiculo (e subclasses) reconstruídos.
 */
function carregarGaragem() {
    try {
        const dataJSON = localStorage.getItem(GARAGEM_STORAGE_KEY);
        if (!dataJSON) {
            return [];
        }

        const veiculosPlain = JSON.parse(dataJSON);
        const veiculosReconstruidos = [];

        for (const veiculoPlain of veiculosPlain) {
            if (!veiculoPlain || !veiculoPlain.placa || !veiculoPlain._tipoVeiculo) {
                console.warn("Item inválido encontrado no LocalStorage, pulando:", veiculoPlain);
                continue;
            }

            let veiculoReal = null;
            const historicoReconstruido = (veiculoPlain.historicoManutencao || []).map(mPlain =>
                new Manutencao(
                    new Date(mPlain.data),
                    mPlain.tipo,
                    mPlain.custo,
                    mPlain.descricao
                )
            );

            switch (veiculoPlain._tipoVeiculo) {
                case 'Carro':
                    veiculoReal = new Carro(
                        veiculoPlain.placa,
                        veiculoPlain.modelo,
                        veiculoPlain.cor,
                        veiculoPlain.numPortas
                    );
                    break;
                case 'CarroEsportivo':
                    veiculoReal = new CarroEsportivo(
                        veiculoPlain.placa,
                        veiculoPlain.modelo,
                        veiculoPlain.cor,
                        veiculoPlain.numPortas
                    );
                    veiculoReal.turboAtivado = veiculoPlain.turboAtivado || false;
                    break;
                case 'Caminhao':
                    veiculoReal = new Caminhao(
                        veiculoPlain.placa,
                        veiculoPlain.modelo,
                        veiculoPlain.cor,
                        veiculoPlain.numEixos,
                        veiculoPlain.capacidadeCarga
                    );
                    veiculoReal.cargaAtual = veiculoPlain.cargaAtual || 0;
                    break;
                case 'Veiculo':
                    veiculoReal = new Veiculo(
                        veiculoPlain.placa,
                        veiculoPlain.modelo,
                        veiculoPlain.cor
                    );
                    break;
                default:
                    console.warn(`Tipo de veículo desconhecido: '${veiculoPlain._tipoVeiculo}'. Criando como Veiculo base.`);
                    veiculoReal = new Veiculo(
                        veiculoPlain.placa,
                        veiculoPlain.modelo,
                        veiculoPlain.cor
                    );
                    break;
            }

            if (veiculoReal) {
                veiculoReal.historicoManutencao = historicoReconstruido;
                veiculoReal.ligado = veiculoPlain.ligado || false;
                veiculoReal.velocidade = veiculoPlain.velocidade || 0;
                veiculoReal.status = veiculoPlain.status ||
                    (veiculoReal.ligado ? (veiculoReal.velocidade > 0 ? `Em movimento (${veiculoReal.velocidade} km/h)` : "Ligado (Parado)") : "Na Garagem");
                veiculosReconstruidos.push(veiculoReal);
            }
        }
        return veiculosReconstruidos;

    } catch (error) {
        console.error("Erro crítico ao carregar ou parsear dados da garagem:", error);
        if (typeof exibirNotificacao === 'function') {
            exibirNotificacao("Erro ao carregar dados salvos. A garagem foi resetada.", "error");
        }
        localStorage.removeItem(GARAGEM_STORAGE_KEY);
        return [];
    }
}