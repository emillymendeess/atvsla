// js/manutencao.js
class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {Date|string} data - A data da manutenção (ou string para ser convertida).
     * @param {string} tipo - O tipo de serviço realizado.
     * @param {number} custo - O custo da manutenção.
     * @param {string} [descricao=''] - Descrição opcional.
     */
    constructor(data, tipo, custo, descricao = '') {
        this.data = (data instanceof Date) ? data : new Date(data);
        this.tipo = tipo;
        this.custo = parseFloat(custo) || 0;
        this.descricao = descricao;
    }

    /**
     * Valida os dados da manutenção.
     * @returns {boolean} True se os dados são válidos, false caso contrário.
     */
    validar() {
        // Verifica se a data é válida e se o tipo e custo são razoáveis
        return this.data instanceof Date && !isNaN(this.data) &&
            typeof this.tipo === 'string' && this.tipo.trim() !== '' &&
            typeof this.custo === 'number' && this.custo >= 0;
    }

    /**
     * Formata a manutenção como uma string legível.
     * @returns {string} A string formatada.
     */
    formatar() {
        const dataFormatada = this.data.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let info = `${dataFormatada} - ${this.tipo} (${custoFormatado})`;
        if (this.descricao) {
            info += ` - ${this.descricao}`;
        }
        return info;
    }
}