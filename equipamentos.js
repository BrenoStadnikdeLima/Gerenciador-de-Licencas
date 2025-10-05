// ======= DADOS E CONFIGURAÇÕES =======
// Função para carregar dados do localStorage
function carregarDados() {
    const dadosSalvos = localStorage.getItem('equipamentosProsul');
    if (dadosSalvos) {
        return JSON.parse(dadosSalvos);
    } else {
        // Dados iniciais se não houver nada salvo
        return [
            { 
                equipamento: "Dell Latitude 5490", 
                tipo: "Notebook", 
                serie: "DL5490X12345", 
                departamento: "TI", 
                status: "Ativo", 
                data: "15/10/2024" 
            },
            { 
                equipamento: "HP ProDesk 600", 
                tipo: "Desktop", 
                serie: "HPPD600A67890", 
                departamento: "Financeiro", 
                status: "Ativo", 
                data: "10/10/2024" 
            },
            { 
                equipamento: "Dell Ultrasharp U2419", 
                tipo: "Monitor", 
                serie: "DUU2419B54321", 
                departamento: "Marketing", 
                status: "Manutenção", 
                data: "08/10/2024" 
            },
            { 
                equipamento: "HP LaserJet Pro", 
                tipo: "Impressora", 
                serie: "HPLJP45678", 
                departamento: "RH", 
                status: "Ativo", 
                data: "12/10/2024" 
            }
        ];
    }
}

// Função para salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('equipamentosProsul', JSON.stringify(equipamentos));
}

// Carregar dados iniciais
let equipamentos = carregarDados();

// Elementos DOM
const elementos = {
    tabela: document.getElementById("tableBodyEquipamentos"),
    searchInput: document.getElementById("searchInputEquipamentos"),
    statusFilter: document.getElementById("statusFilterEquipamentos"),
    tipoFilter: document.getElementById("tipoFilterEquipamentos"),
    modal: document.getElementById("modalEquipamentos"),
    modalTitle: document.getElementById("modalTitleEquipamentos"),
    formEquipamento: document.getElementById("formEquipamento"),
    salvarBtn: document.getElementById("salvarBtnEquipamentos"),
    cancelarBtn: document.getElementById("cancelarBtnEquipamentos"),
    alerta: document.getElementById("alertaSucessoEquipamentos"),
    notificationText: document.getElementById("notificationTextEquipamentos"),
    modalEquipamentoNome: document.getElementById("modalEquipamentoNome"),
    modalEquipamentoTipo: document.getElementById("modalEquipamentoTipo"),
    modalEquipamentoSerie: document.getElementById("modalEquipamentoSerie"),
    modalEquipamentoDepartamento: document.getElementById("modalEquipamentoDepartamento"),
    modalEquipamentoStatus: document.getElementById("modalEquipamentoStatus"),
    closeModal: document.querySelector("#modalEquipamentos .close-modal"),
    btnAdicionar: document.getElementById("adicionarEquipamento"),
    // Elementos do Relatório
    modalRelatorio: document.getElementById("modalRelatorio"),
    btnGerarRelatorio: document.getElementById("gerarRelatorio"),
    filtroRelatorio: document.getElementById("filtroRelatorio"),
    grupoFiltroEspecifico: document.getElementById("grupoFiltroEspecifico"),
    labelFiltroEspecifico: document.getElementById("labelFiltroEspecifico"),
    filtroEspecifico: document.getElementById("filtroEspecifico"),
    ordenacaoRelatorio: document.getElementById("ordenacaoRelatorio"),
    btnVisualizarRelatorio: document.getElementById("visualizarRelatorio"),
    btnImprimirRelatorio: document.getElementById("imprimirRelatorio"),
    btnCancelarRelatorio: document.getElementById("cancelarRelatorio"),
    areaRelatorio: document.getElementById("areaRelatorio"),
    dataRelatorio: document.getElementById("dataRelatorio"),
    filtroAplicado: document.getElementById("filtroAplicado"),
    totalEquipamentos: document.getElementById("totalEquipamentos"),
    totalAtivos: document.getElementById("totalAtivos"),
    totalManutencao: document.getElementById("totalManutencao"),
    totalInativos: document.getElementById("totalInativos"),
    corpoRelatorio: document.getElementById("corpoRelatorio"),
    dataGeracao: document.getElementById("dataGeracao")
};

// Estado da aplicação
let estado = {
    equipamentoSelecionado: null,
    modoEdicao: false,
    modoAdicao: false,
    dadosFiltrados: [...equipamentos],
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
    elementos.searchInput.addEventListener("input", filtrarEquipamentos);
    
    // Filtros
    elementos.statusFilter.addEventListener("change", filtrarEquipamentos);
    elementos.tipoFilter.addEventListener("change", filtrarEquipamentos);
    
    // Modal
    elementos.cancelarBtn.addEventListener("click", fecharModal);
    elementos.salvarBtn.addEventListener("click", salvarEquipamento);
    elementos.closeModal.addEventListener("click", fecharModal);
    
    // Botão Adicionar
    elementos.btnAdicionar.addEventListener("click", abrirModalAdicionar);
    
    // Relatório
    elementos.btnGerarRelatorio.addEventListener("click", abrirModalRelatorio);
    elementos.filtroRelatorio.addEventListener("change", configurarFiltroRelatorio);
    elementos.btnVisualizarRelatorio.addEventListener("click", gerarRelatorio);
    elementos.btnImprimirRelatorio.addEventListener("click", imprimirRelatorio);
    elementos.btnCancelarRelatorio.addEventListener("click", fecharModalRelatorio);
    
    // Fechar modal ao clicar fora
    elementos.modal.addEventListener("click", function(e) {
        if (e.target === elementos.modal) {
            fecharModal();
        }
    });
    
    elementos.modalRelatorio.addEventListener("click", function(e) {
        if (e.target === elementos.modalRelatorio) {
            fecharModalRelatorio();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (elementos.modal.style.display === "flex") {
                fecharModal();
            }
            if (elementos.modalRelatorio.style.display === "flex") {
                fecharModalRelatorio();
            }
        }
    });
    
    // Fechar modal de relatório
    elementos.modalRelatorio.querySelector('.close-modal').addEventListener('click', fecharModalRelatorio);
}

// ======= RENDERIZAÇÃO DA TABELA =======
function renderizarTabela(dados = estado.dadosFiltrados) {
    elementos.tabela.innerHTML = "";
    
    dados.forEach((equipamento, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        // Determinar classe do status
        let statusClass = "";
        switch(equipamento.status) {
            case "Ativo":
                statusClass = "status-ativo";
                break;
            case "Manutenção":
                statusClass = "status-manutencao";
                break;
            case "Inativo":
                statusClass = "status-inativo";
                break;
        }
        
        tr.innerHTML = `
            <td class="editable" data-field="equipamento">${equipamento.equipamento}</td>
            <td class="editable" data-field="tipo">${equipamento.tipo}</td>
            <td>${equipamento.serie}</td>
            <td class="editable" data-field="departamento">${equipamento.departamento}</td>
            <td><span class="status-badge ${statusClass}">${equipamento.status}</span></td>
            <td class="modification-date">${equipamento.data}</td>
            <td>
                <div class="actions">
                    <button class="action-btn visualizar-btn" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn editar-btn" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn excluir-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        elementos.tabela.appendChild(tr);
    });
    
    configurarEventosBotoes();
    configurarEdicaoInline();
}

function configurarEventosBotoes() {
    // Botões de visualizar
    document.querySelectorAll('.visualizar-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tr = btn.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            visualizarEquipamento(index);
        });
    });
    
    // Botões de editar
    document.querySelectorAll('.editar-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tr = btn.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            editarEquipamento(index);
        });
    });
    
    // Botões de excluir
    document.querySelectorAll('.excluir-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const tr = btn.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            excluirEquipamento(index);
        });
    });
}

function configurarEdicaoInline() {
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('dblclick', iniciarEdicaoInline);
    });
}

// ======= EXCLUIR EQUIPAMENTO =======
function excluirEquipamento(index) {
    const equipamento = equipamentos[index];
    
    if (confirm(`Tem certeza que deseja excluir o equipamento "${equipamento.equipamento}"?`)) {
        // Remover do array principal
        equipamentos.splice(index, 1);
        
        // SALVAR NO LOCALSTORAGE
        salvarDados();
        
        // Atualizar dados filtrados
        estado.dadosFiltrados = estado.dadosFiltrados.filter(item => item.serie !== equipamento.serie);
        
        // Re-renderizar tabela
        renderizarTabela();
        
        mostrarNotificacao('Equipamento excluído com sucesso!');
    }
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
    input.type = 'text';
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
    equipamentos[index][field] = novoValor.trim();
    equipamentos[index].data = obterDataAtual();
    
    // SALVAR NO LOCALSTORAGE
    salvarDados();
    
    // Atualizar célula
    cell.textContent = novoValor.trim();
    cell.classList.remove('editing');
    
    // Atualizar dados filtrados se necessário
    const filteredIndex = estado.dadosFiltrados.findIndex(item => 
        item.serie === equipamentos[index].serie
    );
    if (filteredIndex !== -1) {
        estado.dadosFiltrados[filteredIndex] = { ...equipamentos[index] };
    }
    
    estado.editingCell = null;
    mostrarNotificacao('Equipamento atualizado com sucesso!');
}

function cancelarEdicaoInline() {
    if (!estado.editingCell) return;
    
    const { cell, originalValue } = estado.editingCell;
    cell.textContent = originalValue;
    cell.classList.remove('editing');
    estado.editingCell = null;
}

// ======= FILTROS E PESQUISA =======
function filtrarEquipamentos() {
    esconderRelatorio();
    
    const termo = elementos.searchInput.value.toLowerCase();
    const status = elementos.statusFilter.value;
    const tipo = elementos.tipoFilter.value;
    
    estado.dadosFiltrados = equipamentos.filter(equipamento => {
        const matchesSearch = equipamento.equipamento.toLowerCase().includes(termo) ||
                             equipamento.serie.toLowerCase().includes(termo) ||
                             equipamento.departamento.toLowerCase().includes(termo);
        
        const matchesStatus = status === 'Todos' || equipamento.status === status;
        const matchesTipo = tipo === 'Todos' || equipamento.tipo === tipo;
        
        return matchesSearch && matchesStatus && matchesTipo;
    });
    
    renderizarTabela();
}

// ======= MODAL =======
function abrirModalAdicionar() {
    estado.modoAdicao = true;
    estado.modoEdicao = true;
    estado.equipamentoSelecionado = null;
    
    // Limpar campos do modal
    elementos.modalEquipamentoNome.value = '';
    elementos.modalEquipamentoTipo.value = '';
    elementos.modalEquipamentoSerie.value = '';
    elementos.modalEquipamentoDepartamento.value = '';
    elementos.modalEquipamentoStatus.value = '';
    
    // Habilitar todos os campos
    elementos.modalEquipamentoNome.disabled = false;
    elementos.modalEquipamentoTipo.disabled = false;
    elementos.modalEquipamentoSerie.disabled = false;
    elementos.modalEquipamentoDepartamento.disabled = false;
    elementos.modalEquipamentoStatus.disabled = false;
    
    // Configurar título
    elementos.modalTitle.textContent = 'Adicionar Novo Equipamento';
    elementos.salvarBtn.style.display = 'block';
    
    elementos.modal.style.display = 'flex';
    
    // Focar no primeiro campo
    setTimeout(() => {
        elementos.modalEquipamentoNome.focus();
    }, 300);
}

function visualizarEquipamento(index) {
    estado.equipamentoSelecionado = index;
    estado.modoEdicao = false;
    estado.modoAdicao = false;
    const equipamento = equipamentos[index];
    
    abrirModal(equipamento, false);
}

function editarEquipamento(index) {
    estado.equipamentoSelecionado = index;
    estado.modoEdicao = true;
    estado.modoAdicao = false;
    const equipamento = equipamentos[index];
    
    abrirModal(equipamento, true);
}

function abrirModal(equipamento, editavel) {
    elementos.modalEquipamentoNome.value = equipamento.equipamento;
    elementos.modalEquipamentoTipo.value = equipamento.tipo;
    elementos.modalEquipamentoSerie.value = equipamento.serie;
    elementos.modalEquipamentoDepartamento.value = equipamento.departamento;
    elementos.modalEquipamentoStatus.value = equipamento.status;
    
    // Configurar estado dos campos
    elementos.modalEquipamentoNome.disabled = !editavel;
    elementos.modalEquipamentoTipo.disabled = !editavel;
    elementos.modalEquipamentoSerie.disabled = !editavel;
    elementos.modalEquipamentoDepartamento.disabled = !editavel;
    elementos.modalEquipamentoStatus.disabled = !editavel;
    
    // Configurar título e botão
    elementos.modalTitle.textContent = editavel ? 'Editar Equipamento' : 'Visualizar Equipamento';
    elementos.salvarBtn.style.display = editavel ? 'block' : 'none';
    
    elementos.modal.style.display = 'flex';
}

function fecharModal() {
    elementos.modal.style.display = 'none';
    elementos.formEquipamento.reset();
    estado.equipamentoSelecionado = null;
    estado.modoEdicao = false;
    estado.modoAdicao = false;
}

function salvarEquipamento() {
    const equipamento = elementos.modalEquipamentoNome.value.trim();
    const tipo = elementos.modalEquipamentoTipo.value.trim();
    const serie = elementos.modalEquipamentoSerie.value.trim();
    const departamento = elementos.modalEquipamentoDepartamento.value.trim();
    const status = elementos.modalEquipamentoStatus.value;
    
    // Validações
    if (!equipamento || !tipo || !serie || !departamento || !status) {
        mostrarNotificacao('Preencha todos os campos obrigatórios', 'erro');
        return;
    }
    
    if (estado.modoAdicao) {
        // ADICIONAR NOVO EQUIPAMENTO
        const novoEquipamento = {
            equipamento,
            tipo,
            serie,
            departamento,
            status,
            data: obterDataAtual()
        };
        
        equipamentos.unshift(novoEquipamento);
        estado.dadosFiltrados.unshift(novoEquipamento);
        
        mostrarNotificacao('Equipamento adicionado com sucesso!');
        
    } else if (estado.modoEdicao && estado.equipamentoSelecionado !== null) {
        // EDITAR EQUIPAMENTO EXISTENTE
        equipamentos[estado.equipamentoSelecionado] = {
            equipamento,
            tipo,
            serie,
            departamento,
            status,
            data: obterDataAtual()
        };
        
        // Atualizar dados filtrados
        const filteredIndex = estado.dadosFiltrados.findIndex(item => 
            item.serie === equipamentos[estado.equipamentoSelecionado].serie
        );
        if (filteredIndex !== -1) {
            estado.dadosFiltrados[filteredIndex] = { ...equipamentos[estado.equipamentoSelecionado] };
        }
        
        mostrarNotificacao('Equipamento atualizado com sucesso!');
    }
    
    // SALVAR NO LOCALSTORAGE E ATUALIZAR TABELA
    salvarDados();
    renderizarTabela();
    fecharModal();
}

// ======= RELATÓRIOS =======
function abrirModalRelatorio() {
    elementos.modalRelatorio.style.display = 'flex';
    configurarFiltroRelatorio();
}

function fecharModalRelatorio() {
    elementos.modalRelatorio.style.display = 'none';
}

function configurarFiltroRelatorio() {
    const filtro = elementos.filtroRelatorio.value;
    elementos.grupoFiltroEspecifico.style.display = filtro === 'todos' ? 'none' : 'block';
    
    // Limpar opções anteriores
    elementos.filtroEspecifico.innerHTML = '';
    
    if (filtro === 'tipo') {
        elementos.labelFiltroEspecifico.textContent = 'Tipo:';
        const tipos = [...new Set(equipamentos.map(e => e.tipo))];
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            elementos.filtroEspecifico.appendChild(option);
        });
    } else if (filtro === 'status') {
        elementos.labelFiltroEspecifico.textContent = 'Status:';
        const status = ['Ativo', 'Manutenção', 'Inativo'];
        status.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            elementos.filtroEspecifico.appendChild(option);
        });
    } else if (filtro === 'departamento') {
        elementos.labelFiltroEspecifico.textContent = 'Departamento:';
        const departamentos = [...new Set(equipamentos.map(e => e.departamento))];
        departamentos.forEach(depto => {
            const option = document.createElement('option');
            option.value = depto;
            option.textContent = depto;
            elementos.filtroEspecifico.appendChild(option);
        });
    }
}

// ======= FUNÇÃO ATUALIZADA PARA RELATÓRIO =======
function gerarRelatorio() {
    const filtro = elementos.filtroRelatorio.value;
    const filtroEspecifico = elementos.filtroEspecifico.value;
    const ordenacao = elementos.ordenacaoRelatorio.value;
    
    // 1. Filtrar dados
    let dadosRelatorio = [...equipamentos];
    
    if (filtro !== 'todos' && filtroEspecifico) {
        dadosRelatorio = dadosRelatorio.filter(equipamento => {
            return equipamento[filtro] === filtroEspecifico;
        });
    }
    
    // 2. Ordenar dados
    dadosRelatorio.sort((a, b) => {
        if (ordenacao === 'data') {
            return new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-'));
        }
        return a[ordenacao].localeCompare(b[ordenacao]);
    });
    
    // 3. Atualizar data
    const agora = new Date();
    elementos.dataRelatorio.textContent = `Data: ${agora.toLocaleDateString('pt-BR')}`;
    elementos.dataGeracao.textContent = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR');
    
    // 4. Gerar tabela
    elementos.corpoRelatorio.innerHTML = '';
    
    if (dadosRelatorio.length === 0) {
        elementos.corpoRelatorio.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    Nenhum equipamento encontrado com os filtros aplicados
                </td>
            </tr>
        `;
    } else {
        dadosRelatorio.forEach(equipamento => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${equipamento.equipamento}</td>
                <td>${equipamento.tipo}</td>
                <td>${equipamento.serie}</td>
                <td>${equipamento.departamento}</td>
                <td>${equipamento.status}</td>
                <td>${equipamento.data}</td>
            `;
            elementos.corpoRelatorio.appendChild(tr);
        });
    }
    
    // 5. Mostrar relatório
    elementos.areaRelatorio.style.display = 'block';
    elementos.modalRelatorio.style.display = 'none';
    
    // 6. Scroll automático
    setTimeout(() => {
        elementos.areaRelatorio.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function imprimirRelatorio() {
    window.print();
}

function esconderRelatorio() {
    elementos.areaRelatorio.style.display = 'none';
}

function imprimirRelatorio() {
    window.print();
}

function esconderRelatorio() {
    elementos.areaRelatorio.style.display = 'none';
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
    elementos.notificationText.textContent = mensagem;
    
    if (tipo === 'erro') {
        elementos.alerta.style.background = '#dc3545';
        elementos.alerta.querySelector('i').className = 'fas fa-exclamation-circle';
    } else {
        elementos.alerta.style.background = 'var(--primary-blue)';
        elementos.alerta.querySelector('i').className = 'fas fa-check-circle';
    }
    
    elementos.alerta.style.display = 'flex';
    
    setTimeout(() => {
        elementos.alerta.style.display = 'none';
    }, 3000);
}

// Renderizar tabela inicial
renderizarTabela();