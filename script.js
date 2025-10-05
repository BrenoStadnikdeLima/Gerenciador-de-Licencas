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
    document.querySelectorAll('.visualizar-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tr = btn.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            visualizarLicenca(index);
        });
    });
    
    // Botões de editar
    document.querySelectorAll('.editar-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tr = btn.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            editarLicenca(index);
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
    const index = parseInt(tr.getAttribute('data-index'));
    const originalValue = cell.textContent;
    
    estado.editingCell = { cell, field, index, originalValue };
    
    // Criar input para edição
    const input = document.createElement('input');
    input.type = field === 'licencas' ? 'number' : 'text';
    input.value = originalValue;
    input.className = 'inline-edit-input';
    
    // Estilizar input
    input.style.width = '100%';
    input.style.border = '2px solid var(--primary-blue)';
    input.style.borderRadius = '4px';
    input.style.padding = '8px';
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    
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
    
    const { cell, field, index, originalValue } = estado.editingCell;
    
    if (novoValor.trim() === '') {
        mostrarNotificacao('Valor não pode estar vazio', 'erro');
        cancelarEdicaoInline();
        return;
    }
    
    // Atualizar dados
    const valorFinal = field === 'licencas' ? parseInt(novoValor) : novoValor;
    licencas[index][field] = valorFinal;
    licencas[index].data = obterDataAtual();
    
    // Atualizar célula
    cell.textContent = valorFinal;
    cell.classList.remove('editing');
    
    // Atualizar dados filtrados se necessário
    const filteredIndex = estado.dadosFiltrados.findIndex(item => 
        item.software === licencas[index].software
    );
    if (filteredIndex !== -1) {
        estado.dadosFiltrados[filteredIndex] = { ...licencas[index] };
    }
    
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
        if (licenca.licencas < 20) statusLicenca = 'Em Renovação';
        if (new Date(licenca.data.split('/').reverse().join('-')) < new Date()) {
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

// Renderizar tabela inicial
renderizarTabela();