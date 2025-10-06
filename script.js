// ======= DADOS E CONFIGURAÇÕES =======
let licencas = [
    { software: "Microsoft Office", versao: "2021 Pro Plus", licencas: 50, data: "03/10/2025" },
    { software: "Autodesk", versao: "Autocad e Revit", licencas: 60, data: "03/10/2025" },
    { software: "Windows", versao: "Pro", licencas: 200, data: "03/10/2025" },
    { software: "Adobe", versao: "Pro", licencas: 15, data: "03/10/2025" }
];

// Elementos DOM
const elementos = {
    tabela: document.getElementById("tableBody"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    formLicenca: document.getElementById("formLicenca"),
    salvarBtn: document.getElementById("salvarBtn"),
    cancelarBtn: document.getElementById("cancelarBtn"),
    alerta: document.getElementById("alertaSucesso"),
    modalSoftware: document.getElementById("modalSoftware"),
    modalVersao: document.getElementById("modalVersao"),
    modalLicencas: document.getElementById("modalLicencas"),
    modalData: document.getElementById("modalData"),
    closeModal: document.querySelector(".close-modal")
};

// Estado da aplicação
let estado = {
    licencaSelecionada: null,
    modoEdicao: false,
    dadosFiltrados: [...licencas],
    editingCell: null
};

// ======= INICIALIZAÇÃO =======
document.addEventListener('DOMContentLoaded', function() {
    inicializarAplicacao();
});

function inicializarAplicacao() {
    renderizarTabela();
    configurarEventListeners();
}

function configurarEventListeners() {
    // Pesquisa em tempo real
    elementos.searchInput.addEventListener("input", filtrarLicencas);
    
    // Filtro por status
    elementos.statusFilter.addEventListener("change", filtrarLicencas);
    
    // Modal
    elementos.cancelarBtn.addEventListener("click", fecharModal);
    elementos.salvarBtn.addEventListener("click", salvarLicenca);
    elementos.closeModal.addEventListener("click", fecharModal);
    
    // Fechar modal ao clicar fora
    elementos.modal.addEventListener("click", function(e) {
        if (e.target === elementos.modal) {
            fecharModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (elementos.modal.style.display === "flex") {
                fecharModal();
            }
            if (estado.editingCell) {
                cancelarEdicaoInline();
            }
        }
    });
}

// ======= RENDERIZAÇÃO DA TABELA =======
function renderizarTabela(dados = estado.dadosFiltrados) {
    elementos.tabela.innerHTML = "";
    
    dados.forEach((licenca, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        tr.innerHTML = `
            <td class="editable" data-field="software">${licenca.software}</td>
            <td class="editable" data-field="versao">${licenca.versao}</td>
            <td class="editable" data-field="licencas">${licenca.licencas}</td>
            <td class="modification-date">${licenca.data}</td>
            <td>
                <div class="actions">
                    <button class="action-btn visualizar-btn" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn editar-btn" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                </div>
            </td>
        `;
        elementos.tabela.appendChild(tr);
    });
    
    // Configurar eventos dos botões
    configurarEventosBotoes();
    
    // Configurar edição inline
    configurarEdicaoInline();
}

function configurarEventosBotoes() {
    // Botões de visualizar
    document.querySelectorAll('.visualizar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            
            // Encontrar licença correspondente nos dados filtrados
            const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
            
            // Encontrar índice correto no array original
            const originalIndex = licencas.findIndex(lic => 
                lic.software === licencaFiltrada.software && 
                lic.versao === licencaFiltrada.versao
            );
            
            if (originalIndex !== -1) {
                visualizarLicenca(originalIndex);
            }
        });
    });
    
    // Botões de editar
    document.querySelectorAll('.editar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            
            // Encontrar licença correspondente nos dados filtrados
            const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
            
            // Encontrar índice correto no array original
            const originalIndex = licencas.findIndex(lic => 
                lic.software === licencaFiltrada.software && 
                lic.versao === licencaFiltrada.versao
            );
            
            if (originalIndex !== -1) {
                editarLicenca(originalIndex);
            }
        });
    });
}

function configurarEdicaoInline() {
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('dblclick', iniciarEdicaoInline);
    });
}

// ======= EDIÇÃO INLINE =======
function iniciarEdicaoInline(e) {
    if (estado.editingCell) return;
    
    const cell = e.target;
    const field = cell.getAttribute('data-field');
    const tr = cell.closest('tr');
    const filteredIndex = parseInt(tr.getAttribute('data-index'));
    const originalValue = cell.textContent;
    
    // Encontrar licença correspondente nos dados filtrados
    const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
    
    // Encontrar índice correto no array original
    const originalIndex = licencas.findIndex(lic => 
        lic.software === licencaFiltrada.software && 
        lic.versao === licencaFiltrada.versao
    );
    
    estado.editingCell = { cell, field, originalIndex, filteredIndex, originalValue };
    
    // Criar input para edição
    const input = document.createElement('input');
    input.type = field === 'licencas' ? 'number' : 'text';
    input.value = originalValue;
    input.className = 'inline-edit-input';
    
    // Substituir conteúdo
    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add('editing');
    
    // Focar no input
    input.focus();
    input.select();
    
    // Eventos do input
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            finalizarEdicaoInline(input.value);
        } else if (e.key === 'Escape') {
            cancelarEdicaoInline();
        }
    });
    
    input.addEventListener('blur', function() {
        finalizarEdicaoInline(input.value);
    });
}

function finalizarEdicaoInline(novoValor) {
    if (!estado.editingCell) return;
    
    const { cell, field, originalIndex, filteredIndex, originalValue } = estado.editingCell;
    
    if (novoValor.trim() === '') {
        mostrarNotificacao('Valor não pode estar vazio', 'erro');
        cancelarEdicaoInline();
        return;
    }
    
    // Atualizar dados
    const valorFinal = field === 'licencas' ? parseInt(novoValor) : novoValor;
    
    // Atualizar array original
    licencas[originalIndex][field] = valorFinal;
    licencas[originalIndex].data = obterDataAtual();
    
    // Atualizar array filtrado
    estado.dadosFiltrados[filteredIndex][field] = valorFinal;
    estado.dadosFiltrados[filteredIndex].data = obterDataAtual();
    
    // Atualizar célula
    cell.textContent = valorFinal;
    cell.classList.remove('editing');
    
    estado.editingCell = null;
    mostrarNotificacao('Licença atualizada com sucesso!');
}

function cancelarEdicaoInline() {
    if (!estado.editingCell) return;
    
    const { cell, originalValue } = estado.editingCell;
    cell.textContent = originalValue;
    cell.classList.remove('editing');
    estado.editingCell = null;
}

// ======= FILTROS E PESQUISA =======
function filtrarLicencas() {
    const termo = elementos.searchInput.value.toLowerCase();
    const status = elementos.statusFilter.value;
    
    estado.dadosFiltrados = licencas.filter(licenca => {
        const matchesSearch = licenca.software.toLowerCase().includes(termo) ||
                             licenca.versao.toLowerCase().includes(termo);
        
        // Simular status baseado em regras simples
        let statusLicenca = 'Ativa';
        const dataExpiracao = new Date(licenca.data.split('/').reverse().join('-'));
        const hoje = new Date();
        
        if (licenca.licencas < 20) statusLicenca = 'Em Renovação';
        if (dataExpiracao < hoje) {
            statusLicenca = 'Expirada';
        }
        
        const matchesStatus = status === 'Todos' || statusLicenca === status;
        
        return matchesSearch && matchesStatus;
    });
    
    renderizarTabela();
}

// ======= MODAL =======
function visualizarLicenca(index) {
    estado.licencaSelecionada = index;
    estado.modoEdicao = false;
    const licenca = licencas[index];
    
    abrirModal(licenca, false);
}

function editarLicenca(index) {
    estado.licencaSelecionada = index;
    estado.modoEdicao = true;
    const licenca = licencas[index];
    
    abrirModal(licenca, true);
}

function abrirModal(licenca, editavel) {
    elementos.modalSoftware.value = licenca.software;
    elementos.modalVersao.value = licenca.versao;
    elementos.modalLicencas.value = licenca.licencas;
    elementos.modalData.value = licenca.data;
    
    // Configurar estado dos campos
    elementos.modalSoftware.disabled = !editavel;
    elementos.modalVersao.disabled = !editavel;
    elementos.modalLicencas.disabled = !editavel;
    
    // Configurar título e botão
    elementos.modalTitle.textContent = editavel ? 'Editar Licença' : 'Visualizar Licença';
    elementos.salvarBtn.style.display = editavel ? 'block' : 'none';
    
    elementos.modal.style.display = 'flex';
}

function fecharModal() {
    elementos.modal.style.display = 'none';
    elementos.formLicenca.reset();
    estado.licencaSelecionada = null;
    estado.modoEdicao = false;
}

function salvarLicenca() {
    if (!estado.modoEdicao || estado.licencaSelecionada === null) return;
    
    const software = elementos.modalSoftware.value.trim();
    const versao = elementos.modalVersao.value.trim();
    const numLicencas = parseInt(elementos.modalLicencas.value);
    
    // Validações
    if (!software || !versao || isNaN(numLicencas) || numLicencas < 1) {
        mostrarNotificacao('Preencha todos os campos corretamente', 'erro');
        return;
    }
    
    // Atualizar licença
    licencas[estado.licencaSelecionada] = {
        software,
        versao,
        licencas: numLicencas,
        data: obterDataAtual()
    };
    
    // Atualizar tabela
    filtrarLicencas();
    fecharModal();
    mostrarNotificacao('Licença atualizada com sucesso!');
}

// ======= RELATÓRIO =======
function gerarRelatorio() {
    // Criar elemento de relatório temporário
    const relatorioContainer = document.createElement('div');
    relatorioContainer.className = 'relatorio-container';
    relatorioContainer.style.display = 'block';
    
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    
    relatorioContainer.innerHTML = `
        <div class="cabecalho-relatorio">
            <h1 class="titulo-relatorio">Relatório de Licenças</h1>
            <p class="data-relatorio">Data: ${dataFormatada}</p>
        </div>
        
        <table class="tabela-relatorio">
            <thead>
                <tr>
                    <th>Software</th>
                    <th>Versão</th>
                    <th>Nº de Licenças</th>
                    <th>Última Modificação</th>
                </tr>
            </thead>
            <tbody>
                ${licencas.map(licenca => `
                    <tr>
                        <td>${licenca.software}</td>
                        <td>${licenca.versao}</td>
                        <td>${licenca.licencas}</td>
                        <td>${licenca.data}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="rodape-relatorio">
            <p>Relatório gerado em ${dataFormatada}</p>
            <p class="assinatura">___________________________________</p>
            <p>Responsável</p>
        </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(relatorioContainer);
    
    // Imprimir
    window.print();
    
    // Remover após impressão
    setTimeout(() => {
        document.body.removeChild(relatorioContainer);
    }, 100);
}

// ======= UTILITÁRIOS =======
function obterDataAtual() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const texto = elementos.alerta.querySelector('span');
    const icone = elementos.alerta.querySelector('i');
    
    texto.textContent = mensagem;
    
    if (tipo === 'erro') {
        elementos.alerta.style.background = '#dc3545';
        icone.className = 'fas fa-exclamation-circle';
    } else {
        elementos.alerta.style.background = 'var(--primary-blue)';
        icone.className = 'fas fa-check-circle';
    }
    
    elementos.alerta.style.display = 'flex';
    
    setTimeout(() => {
        elementos.alerta.style.display = 'none';
    }, 3000);
}

// Adicionar função de relatório ao escopo global para acesso pelo HTML
window.gerarRelatorio = gerarRelatorio;

// Renderizar tabela inicial
renderizarTabela();