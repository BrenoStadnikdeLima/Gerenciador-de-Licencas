// ======= CONFIGURAÇÃO FIREBASE =======
const firebaseConfig = {
    apiKey: "AIzaSyC5p_Bcaxs_075-Av-dKFoNfqVjXUZP9a0",
    authDomain: "prosul-equipamentos.firebaseapp.com",
    projectId: "prosul-equipamentos",
    storageBucket: "prosul-equipamentos.firebasestorage.app",
    messagingSenderId: "799195941543",
    appId: "1:799195941543:web:8eb0e9e3f83c980e302982"
};

// Variáveis globais
let db;
let usuarios = [];
let estado = {
    usuarioSelecionado: null,
    modoEdicao: false,
    modoAdicao: false,
    dadosFiltrados: [],
    editingCell: null
};

// ======= ELEMENTOS DOM =======
const elementos = {
    tabela: document.getElementById("tableBodyEquipamentos"),
    searchInput: document.getElementById("searchInputEquipamentos"),
    searchBtn: document.getElementById("searchBtnEquipamentos"),
    statusFilter: document.getElementById("statusFilterEquipamentos"),
    departamentoFilter: document.getElementById("departamentoFilterEquipamentos"),
    modal: document.getElementById("modalEquipamentos"),
    modalTitle: document.getElementById("modalTitleEquipamentos"),
    formEquipamento: document.getElementById("formEquipamento"),
    salvarBtn: document.getElementById("salvarBtnEquipamentos"),
    cancelarBtn: document.getElementById("cancelarBtnEquipamentos"),
    modalUsuarioNome: document.getElementById("modalUsuarioNome"),
    modalUsuarioAnydesk: document.getElementById("modalUsuarioAnydesk"),
    modalUsuarioDepartamento: document.getElementById("modalUsuarioDepartamento"),
    modalUsuarioStatus: document.getElementById("modalUsuarioStatus"),
    modalUsuarioDesktop: document.getElementById("modalUsuarioDesktop"),
    modalUsuarioMonitor1: document.getElementById("modalUsuarioMonitor1"),
    modalUsuarioMonitor2: document.getElementById("modalUsuarioMonitor2"),
    modalUsuarioNobreak: document.getElementById("modalUsuarioNobreak"),
    closeModal: document.querySelector("#modalEquipamentos .close-modal"),
    btnAdicionar: document.getElementById("adicionarEquipamento"),
    btnLimparDados: document.getElementById("limparDados"),
    btnGerarRelatorio: document.getElementById("gerarRelatorio"),
    btnLimparFiltros: document.getElementById("limparFiltros"),
    modalRelatorio: document.getElementById("modalRelatorio"),
    filtroRelatorio: document.getElementById("filtroRelatorio"),
    filtroStatusRelatorio: document.getElementById("filtroStatusRelatorio"),
    ordenacaoRelatorio: document.getElementById("ordenacaoRelatorio"),
    btnVisualizarRelatorio: document.getElementById("visualizarRelatorio"),
    btnImprimirRelatorio: document.getElementById("imprimirRelatorio"),
    btnCancelarRelatorio: document.getElementById("cancelarRelatorio"),
    areaRelatorio: document.getElementById("areaRelatorio"),
    dataRelatorio: document.getElementById("dataRelatorio"),
    corpoRelatorio: document.getElementById("corpoRelatorio"),
    dataGeracao: document.getElementById("dataGeracao")
};

// ======= INICIALIZAÇÃO FIREBASE =======
function inicializarFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase não carregado');
            return false;
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log('✅ Firebase inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// ======= FUNÇÕES FIREBASE =======
async function carregarDados() {
    if (!db) {
        console.log('⚠️ Firebase não inicializado, usando dados locais');
        return carregarDadosLocais();
    }

    try {
        console.log('📥 Carregando dados do Firebase...');
        const snapshot = await db.collection('equipamentos').get();
        
        if (snapshot.empty) {
            console.log('📭 Nenhum dado encontrado no Firebase');
            return carregarDadosLocais();
        }
        
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${dados.length} itens carregados do Firebase`);
        return dados;
    } catch (error) {
        console.error('❌ Erro ao carregar do Firebase:', error);
        alert('⚠️ Usando modo offline. Dados serão salvos localmente.');
        return carregarDadosLocais();
    }
}

async function salvarDados() {
    // Sempre salvar localmente primeiro
    salvarDadosLocais();
    
    if (!db) {
        console.log('⚠️ Firebase não disponível, salvando apenas localmente');
        return true;
    }

    try {
        console.log('💾 Tentando salvar no Firebase...');
        
        // Buscar documentos existentes
        const snapshot = await db.collection('equipamentos').get();
        const batch = db.batch();
        
        // Limpar documentos existentes
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('🗑️ Documentos antigos removidos');

        // Salvar novos documentos
        const newBatch = db.batch();
        usuarios.forEach(usuario => {
            const docRef = db.collection('equipamentos').doc(usuario.anydesk);
            newBatch.set(docRef, usuario);
        });
        await newBatch.commit();
        
        console.log(`✅ ${usuarios.length} itens salvos no Firebase`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar no Firebase:', error);
        alert('⚠️ Dados salvos apenas localmente. Verifique a conexão.');
        return false;
    }
}

// ======= FUNÇÕES LOCAIS (FALLBACK) =======
function carregarDadosLocais() {
    try {
        const dadosSalvos = localStorage.getItem('equipamentosProsul');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            console.log(`📁 ${dados.length} itens carregados do localStorage`);
            return dados;
        }
    } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
    }
    
    // Dados de exemplo se não houver nada salvo
    return [
        { 
            usuario: "João Silva", 
            anydesk: "123456789", 
            departamento: "TC1", 
            status: "Em uso", 
            data: "15/01/2024",
            desktop: "Dell Optiplex 3070",
            monitor1: "Dell 24\"",
            monitor2: "Dell 24\"",
            nobreak: "APC 1500VA"
        },
        { 
            usuario: "Maria Santos", 
            anydesk: "987654321", 
            departamento: "LOGISTICA", 
            status: "Em manutenção", 
            data: "10/01/2024",
            desktop: "HP EliteDesk 800",
            monitor1: "HP 27\"",
            monitor2: "",
            nobreak: ""
        }
    ];
}

function salvarDadosLocais() {
    try {
        localStorage.setItem('equipamentosProsul', JSON.stringify(usuarios));
        console.log(`💾 ${usuarios.length} itens salvos no localStorage`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar dados locais:', error);
        return false;
    }
}

// ======= INICIALIZAÇÃO =======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando aplicação...');
    
    // Inicializar Firebase
    const firebaseInicializado = inicializarFirebase();
    
    // Carregar dados (tenta Firebase primeiro, depois local)
    usuarios = await carregarDados();
    estado.dadosFiltrados = [...usuarios];
    
    renderizarTabela();
    configurarEventListeners();
    configurarModalKit();
    
    console.log(`🎯 Aplicação iniciada com ${usuarios.length} usuários`);
    console.log(`🌐 Firebase: ${firebaseInicializado ? 'CONECTADO' : 'OFFLINE'}`);
});

// ======= CONFIGURAÇÃO DE EVENTOS =======
function configurarEventListeners() {
    // Pesquisa e Filtros
    if (elementos.searchInput) {
        elementos.searchInput.addEventListener("input", filtrarUsuarios);
        elementos.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") filtrarUsuarios();
        });
    }
    
    if (elementos.searchBtn) {
        elementos.searchBtn.addEventListener("click", filtrarUsuarios);
    }
    
    if (elementos.statusFilter) elementos.statusFilter.addEventListener("change", filtrarUsuarios);
    if (elementos.departamentoFilter) elementos.departamentoFilter.addEventListener("change", filtrarUsuarios);
    
    // Modal Principal
    if (elementos.cancelarBtn) elementos.cancelarBtn.addEventListener("click", fecharModal);
    if (elementos.salvarBtn) elementos.salvarBtn.addEventListener("click", salvarUsuario);
    if (elementos.closeModal) elementos.closeModal.addEventListener("click", fecharModal);
    
    // Botões de Ação
    if (elementos.btnAdicionar) {
        elementos.btnAdicionar.addEventListener("click", () => {
            console.log('➕ Botão adicionar clicado');
            abrirModalAdicionar();
        });
    }
    
    if (elementos.btnLimparDados) {
        elementos.btnLimparDados.addEventListener("click", limparTodosDados);
    }
    
    if (elementos.btnLimparFiltros) {
        elementos.btnLimparFiltros.addEventListener("click", limparFiltros);
    }
    
    // Relatório
    if (elementos.btnGerarRelatorio) {
        elementos.btnGerarRelatorio.addEventListener("click", abrirModalRelatorio);
    }
    
    if (elementos.btnVisualizarRelatorio) {
        elementos.btnVisualizarRelatorio.addEventListener("click", visualizarRelatorioComFiltros);
    }
    
    if (elementos.btnImprimirRelatorio) {
        elementos.btnImprimirRelatorio.addEventListener("click", imprimirRelatorioComFiltros);
    }
    
    if (elementos.btnCancelarRelatorio) {
        elementos.btnCancelarRelatorio.addEventListener("click", fecharModalRelatorio);
    }
    
    // Fechar modais
    if (elementos.modal) {
        elementos.modal.addEventListener("click", (e) => {
            if (e.target === elementos.modal) fecharModal();
        });
    }
    
    if (elementos.modalRelatorio) {
        elementos.modalRelatorio.addEventListener("click", (e) => {
            if (e.target === elementos.modalRelatorio) fecharModalRelatorio();
        });
        
        const closeBtn = elementos.modalRelatorio.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', fecharModalRelatorio);
    }
    
    // Fechar relatório
    document.addEventListener('click', function(e) {
        if (e.target.id === 'fecharRelatorio' || e.target.closest('#fecharRelatorio')) {
            fecharRelatorio();
        }
    });
    
    // Tecla ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (elementos.modal?.style.display === "flex") fecharModal();
            if (elementos.modalRelatorio?.style.display === "flex") fecharModalRelatorio();
        }
    });
}

// ======= FUNÇÕES PRINCIPAIS =======
function configurarModalKit() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-user-kit')) {
            const button = e.target.closest('.view-user-kit');
            const userName = button.closest('tr').querySelector('td:first-child').textContent;
            const userData = usuarios.find(user => user.usuario === userName);
            
            if (userData) {
                document.getElementById('modal-user-name').textContent = userData.usuario;
                document.getElementById('modal-anydesk').textContent = userData.anydesk;
                document.getElementById('modal-desktop').textContent = userData.desktop || '-';
                document.getElementById('modal-monitor1').textContent = userData.monitor1 || '-';
                document.getElementById('modal-monitor2').textContent = userData.monitor2 || '-';
                document.getElementById('modal-nobreak').textContent = userData.nobreak || '-';
                
                const modal = new bootstrap.Modal(document.getElementById('userKitModal'));
                modal.show();
            }
        }
    });
}

// ======= FILTRO DINÂMICO DE DEPARTAMENTOS =======
function atualizarFiltroDepartamentos() {
    const departamentoFilter = elementos.departamentoFilter;
    if (!departamentoFilter) return;
    
    // Salvar valor atual selecionado
    const valorAtual = departamentoFilter.value;
    
    // Limpar opções exceto "Todos"
    departamentoFilter.innerHTML = '<option value="Todos">Departamento</option>';
    
    // Pegar departamentos únicos dos dados
    const departamentos = [...new Set(usuarios
        .map(user => user.departamento)
        .filter(Boolean)
        .sort())];
    
    // Adicionar ao filtro
    departamentos.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        departamentoFilter.appendChild(option);
    });
    
    // Restaurar valor selecionado se ainda existir
    if (valorAtual && departamentos.includes(valorAtual)) {
        departamentoFilter.value = valorAtual;
    }
    
    console.log(`📊 Filtro de departamentos atualizado: ${departamentos.length} departamentos`);
}

// ======= ATUALIZAR SUGESTÕES DE DEPARTAMENTOS =======
function atualizarSugestoesDepartamentos() {
    const datalist = document.getElementById('departamentosSugeridos');
    if (!datalist) return;
    
    // Limpar sugestões
    datalist.innerHTML = '';
    
    // Pegar departamentos únicos
    const departamentos = [...new Set(usuarios.map(user => user.departamento).filter(Boolean))];
    
    // Adicionar sugestões
    departamentos.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        datalist.appendChild(option);
    });
}

function renderizarTabela(dados = estado.dadosFiltrados) {
    if (!elementos.tabela) return;
    
    elementos.tabela.innerHTML = "";
    
    if (dados.length === 0) {
        elementos.tabela.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 10px;">Nenhum usuário encontrado</h3>
                    <p style="opacity: 0.7;">Tente ajustar os filtros ou termos de pesquisa</p>
                </td>
            </tr>
        `;
        
        // Atualizar contador mesmo quando não há resultados
        mostrarContadorResultados();
        return;
    }
    
    dados.forEach((usuario, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        // STATUS
        let statusClass = "";
        let statusText = "";
        switch(usuario.status) {
            case "Em uso":
                statusClass = "status-ativo";
                statusText = "EM USO";
                break;
            case "Em manutenção":
                statusClass = "status-manutencao";
                statusText = "EM MANUTENÇÃO";
                break;
            case "Sem uso":
                statusClass = "status-inativo";
                statusText = "SEM USO";
                break;
            default:
                statusClass = "status-inativo";
                statusText = usuario.status || 'N/A';
        }
        
        tr.innerHTML = `
            <td>${usuario.usuario || 'N/A'}</td>
            <td>${usuario.anydesk || 'N/A'}</td>
            <td>${usuario.departamento || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${usuario.data || 'N/A'}</td>
            <td>
                <div class="actions">
                    <button class="action-btn view-user-kit" title="Ver equipamentos">
                        <i class="fas fa-laptop"></i>
                    </button>
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
    
    // ATUALIZAR FILTRO DE DEPARTAMENTOS DINAMICAMENTE
    atualizarFiltroDepartamentos();
    atualizarSugestoesDepartamentos();
    
    // Atualizar contador de resultados
    mostrarContadorResultados();
}

function configurarEventosBotoes() {
    // Visualizar
    document.querySelectorAll('.visualizar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            const usuarioFiltrado = estado.dadosFiltrados[filteredIndex];
            const originalIndex = usuarios.findIndex(user => user.anydesk === usuarioFiltrado.anydesk);
            if (originalIndex !== -1) visualizarUsuario(originalIndex);
        });
    });
    
    // Editar
    document.querySelectorAll('.editar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            const usuarioFiltrado = estado.dadosFiltrados[filteredIndex];
            const originalIndex = usuarios.findIndex(user => user.anydesk === usuarioFiltrado.anydesk);
            if (originalIndex !== -1) editarUsuario(originalIndex);
        });
    });
    
    // Excluir
    document.querySelectorAll('.excluir-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            const usuarioFiltrado = estado.dadosFiltrados[filteredIndex];
            const originalIndex = usuarios.findIndex(user => user.anydesk === usuarioFiltrado.anydesk);
            if (originalIndex !== -1) excluirUsuario(originalIndex);
        });
    });
}

// ======= CONTADOR DE RESULTADOS =======
function mostrarContadorResultados() {
    // Remover contador anterior se existir
    const contadorAnterior = document.getElementById('contadorResultados');
    if (contadorAnterior) {
        contadorAnterior.remove();
    }
    
    // Criar e adicionar novo contador
    const contador = document.createElement('div');
    contador.id = 'contadorResultados';
    contador.className = 'contador-resultados';
    contador.innerHTML = `
        <span class="contador-texto">
            ${estado.dadosFiltrados.length} de ${usuarios.length} usuários encontrados
        </span>
    `;
    
    // Inserir após a seção de filtros
    const filterSection = document.querySelector('.filter-section');
    if (filterSection && filterSection.parentNode) {
        filterSection.parentNode.insertBefore(contador, filterSection.nextSibling);
    }
}

// ======= MODAL FUNCTIONS =======
function abrirModalAdicionar() {
    estado.modoAdicao = true;
    estado.modoEdicao = true;
    estado.usuarioSelecionado = null;
    
    // Limpar campos
    const campos = ['modalUsuarioNome', 'modalUsuarioAnydesk', 'modalUsuarioDepartamento', 'modalUsuarioDesktop', 'modalUsuarioMonitor1', 'modalUsuarioMonitor2', 'modalUsuarioNobreak'];
    campos.forEach(campo => {
        if (elementos[campo]) elementos[campo].value = '';
    });
    if (elementos.modalUsuarioStatus) elementos.modalUsuarioStatus.value = '';
    
    // Configurar UI
    if (elementos.modalTitle) elementos.modalTitle.textContent = 'Adicionar Novo Usuário';
    if (elementos.salvarBtn) elementos.salvarBtn.style.display = 'block';
    if (elementos.modal) elementos.modal.style.display = 'flex';
    
    setTimeout(() => {
        if (elementos.modalUsuarioNome) elementos.modalUsuarioNome.focus();
    }, 100);
}

function visualizarUsuario(index) {
    estado.usuarioSelecionado = index;
    estado.modoEdicao = false;
    estado.modoAdicao = false;
    abrirModal(usuarios[index], false);
}

function editarUsuario(index) {
    estado.usuarioSelecionado = index;
    estado.modoEdicao = true;
    estado.modoAdicao = false;
    abrirModal(usuarios[index], true);
}

function abrirModal(usuario, editavel) {
    // Preencher campos
    if (elementos.modalUsuarioNome) elementos.modalUsuarioNome.value = usuario.usuario || '';
    if (elementos.modalUsuarioAnydesk) elementos.modalUsuarioAnydesk.value = usuario.anydesk || '';
    if (elementos.modalUsuarioDepartamento) elementos.modalUsuarioDepartamento.value = usuario.departamento || '';
    if (elementos.modalUsuarioStatus) elementos.modalUsuarioStatus.value = usuario.status || '';
    if (elementos.modalUsuarioDesktop) elementos.modalUsuarioDesktop.value = usuario.desktop || '';
    if (elementos.modalUsuarioMonitor1) elementos.modalUsuarioMonitor1.value = usuario.monitor1 || '';
    if (elementos.modalUsuarioMonitor2) elementos.modalUsuarioMonitor2.value = usuario.monitor2 || '';
    if (elementos.modalUsuarioNobreak) elementos.modalUsuarioNobreak.value = usuario.nobreak || '';
    
    // Configurar estado
    const campos = ['modalUsuarioNome', 'modalUsuarioAnydesk', 'modalUsuarioDepartamento', 'modalUsuarioStatus', 'modalUsuarioDesktop', 'modalUsuarioMonitor1', 'modalUsuarioMonitor2', 'modalUsuarioNobreak'];
    campos.forEach(campo => {
        if (elementos[campo]) elementos[campo].disabled = !editavel;
    });
    
    // Configurar UI
    if (elementos.modalTitle) elementos.modalTitle.textContent = editavel ? 'Editar Usuário' : 'Visualizar Usuário';
    if (elementos.salvarBtn) elementos.salvarBtn.style.display = editavel ? 'block' : 'none';
    if (elementos.modal) elementos.modal.style.display = 'flex';
}

function fecharModal() {
    if (elementos.modal) elementos.modal.style.display = 'none';
    if (elementos.formEquipamento) elementos.formEquipamento.reset();
    estado.usuarioSelecionado = null;
    estado.modoEdicao = false;
    estado.modoAdicao = false;
}

async function salvarUsuario() {
    // Coletar dados
    const usuario = elementos.modalUsuarioNome?.value.trim() || '';
    const anydesk = elementos.modalUsuarioAnydesk?.value.trim() || '';
    const departamento = elementos.modalUsuarioDepartamento?.value.trim() || '';
    const status = elementos.modalUsuarioStatus?.value || '';
    const desktop = elementos.modalUsuarioDesktop?.value.trim() || '';
    const monitor1 = elementos.modalUsuarioMonitor1?.value.trim() || '';
    const monitor2 = elementos.modalUsuarioMonitor2?.value.trim() || '';
    const nobreak = elementos.modalUsuarioNobreak?.value.trim() || '';
    
    // Validação
    if (!usuario || !anydesk || !departamento || !status) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (estado.modoAdicao) {
        // Verificar duplicata
        if (usuarios.find(u => u.anydesk === anydesk)) {
            alert('Já existe um usuário com este ID do Anydesk!');
            return;
        }
        
        // Adicionar
        usuarios.unshift({
            usuario, anydesk, departamento, status,
            data: obterDataAtual(),
            desktop, monitor1, monitor2, nobreak
        });
        alert('✅ Usuário adicionado com sucesso!');
    } else if (estado.modoEdicao && estado.usuarioSelecionado !== null) {
        // Editar
        usuarios[estado.usuarioSelecionado] = {
            ...usuarios[estado.usuarioSelecionado],
            usuario, anydesk, departamento, status,
            data: obterDataAtual(),
            desktop, monitor1, monitor2, nobreak
        };
        alert('✅ Usuário atualizado com sucesso!');
    }
    
    // Salvar e atualizar
    await salvarDados();
    estado.dadosFiltrados = [...usuarios];
    renderizarTabela();
    fecharModal();
}

async function excluirUsuario(index) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuarios[index].usuario}"?`)) return;
    
    usuarios.splice(index, 1);
    await salvarDados();
    estado.dadosFiltrados = [...usuarios];
    renderizarTabela();
    alert('✅ Usuário excluído com sucesso!');
}

async function limparTodosDados() {
    if (!confirm('🚨 ATENÇÃO! Isso apagará TODOS os dados. Continuar?')) return;
    
    usuarios = [];
    await salvarDados();
    estado.dadosFiltrados = [];
    renderizarTabela();
    alert('✅ Todos os dados foram apagados!');
}

// ======= LIMPAR FILTROS =======
function limparFiltros() {
    // Limpar campos de pesquisa e filtros
    if (elementos.searchInput) elementos.searchInput.value = '';
    if (elementos.statusFilter) elementos.statusFilter.value = 'Todos';
    if (elementos.departamentoFilter) elementos.departamentoFilter.value = 'Todos';
    
    // Restaurar dados completos
    estado.dadosFiltrados = [...usuarios];
    renderizarTabela();
    
    console.log('🧹 Filtros limpos');
}

// ======= FILTROS =======
function filtrarUsuarios() {
    const termo = elementos.searchInput?.value.toLowerCase().trim() || '';
    const status = elementos.statusFilter?.value || 'Todos';
    const departamento = elementos.departamentoFilter?.value || 'Todos';
    
    console.log(`🔍 Filtrando: "${termo}" | Status: ${status} | Depto: ${departamento}`);
    
    estado.dadosFiltrados = usuarios.filter(usuario => {
        const matchesSearch = !termo || 
                             usuario.usuario?.toLowerCase().includes(termo) ||
                             usuario.anydesk?.toLowerCase().includes(termo) ||
                             usuario.departamento?.toLowerCase().includes(termo);
        
        const matchesStatus = status === 'Todos' || usuario.status === status;
        const matchesDepartamento = departamento === 'Todos' || usuario.departamento === departamento;
        
        return matchesSearch && matchesStatus && matchesDepartamento;
    });
    
    renderizarTabela();
    
    // Mostrar contador de resultados
    mostrarContadorResultados();
}

// ======= FUNÇÕES DO RELATÓRIO COM FILTROS =======
function abrirModalRelatorio() {
    if (elementos.modalRelatorio) {
        // Atualizar a lista de departamentos no filtro
        atualizarFiltroDepartamentosRelatorio();
        elementos.modalRelatorio.style.display = 'flex';
    }
}

function fecharModalRelatorio() {
    if (elementos.modalRelatorio) elementos.modalRelatorio.style.display = 'none';
}

function atualizarFiltroDepartamentosRelatorio() {
    const filtroRelatorio = elementos.filtroRelatorio;
    if (!filtroRelatorio) return;
    
    // Salvar valor selecionado atual
    const valorAtual = filtroRelatorio.value;
    
    // Limpar opções exceto "Todos"
    filtroRelatorio.innerHTML = '<option value="todos">Todos os Departamentos</option>';
    
    // Pegar departamentos únicos dos dados (usando a mesma lógica da tabela)
    const departamentos = [...new Set(usuarios
        .map(user => user.departamento)
        .filter(Boolean)
        .sort())];
    
    // Adicionar departamentos ao filtro
    departamentos.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = `Apenas ${dept}`;
        filtroRelatorio.appendChild(option);
    });
    
    // Restaurar valor selecionado se ainda existir
    if (valorAtual) {
        const opcaoExistente = Array.from(filtroRelatorio.options).find(opt => opt.value === valorAtual);
        if (opcaoExistente) {
            filtroRelatorio.value = valorAtual;
        }
    }
}

function visualizarRelatorioComFiltros() {
    const departamento = elementos.filtroRelatorio?.value || 'todos';
    const status = elementos.filtroStatusRelatorio?.value || 'todos';
    const ordenacao = elementos.ordenacaoRelatorio?.value || 'departamento';
    
    gerarRelatorioComFiltros(departamento, status, ordenacao);
    
    // Fechar modal e rolar até o relatório
    fecharModalRelatorio();
    if (elementos.areaRelatorio) {
        setTimeout(() => {
            elementos.areaRelatorio.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }
}

function imprimirRelatorioComFiltros() {
    const departamento = elementos.filtroRelatorio?.value || 'todos';
    const status = elementos.filtroStatusRelatorio?.value || 'todos';
    const ordenacao = elementos.ordenacaoRelatorio?.value || 'departamento';
    
    gerarRelatorioComFiltros(departamento, status, ordenacao);
    
    // Fechar modal e imprimir
    fecharModalRelatorio();
    setTimeout(() => {
        window.print();
    }, 500);
}

function gerarRelatorioComFiltros(departamento = 'todos', status = 'todos', ordenacao = 'departamento') {
    let dadosRelatorio = [...usuarios];
    
    // Aplicar filtros
    if (departamento !== 'todos') {
        dadosRelatorio = dadosRelatorio.filter(usuario => usuario.departamento === departamento);
    }
    
    if (status !== 'todos') {
        dadosRelatorio = dadosRelatorio.filter(usuario => usuario.status === status);
    }
    
    // Ordenar
    dadosRelatorio.sort((a, b) => {
        // Primeiro ordena por departamento (se não estiver filtrado por um departamento específico)
        if (ordenacao === 'departamento' && departamento === 'todos') {
            const deptA = a.departamento || 'ZZZ';
            const deptB = b.departamento || 'ZZZ';
            if (deptA !== deptB) {
                return deptA.localeCompare(deptB);
            }
        }
        
        // Ordenar pelo campo selecionado
        if (ordenacao === 'data') {
            return new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-'));
        }
        if (ordenacao === 'status') {
            return a.status.localeCompare(b.status);
        }
        if (ordenacao === 'usuario') {
            return a.usuario.localeCompare(b.usuario);
        }
        if (ordenacao === 'departamento') {
            const deptA = a.departamento || 'ZZZ';
            const deptB = b.departamento || 'ZZZ';
            return deptA.localeCompare(deptB);
        }
        
        return 0;
    });
    
    // Atualizar UI do relatório
    const agora = new Date();
    if (elementos.dataRelatorio) {
        let tituloFiltro = '';
        if (departamento !== 'todos') tituloFiltro += ` - Departamento: ${departamento}`;
        if (status !== 'todos') tituloFiltro += ` - Status: ${status}`;
        
        elementos.dataRelatorio.textContent = `Relatório${tituloFiltro} - Data: ${agora.toLocaleDateString('pt-BR')}`;
    }
    
    if (elementos.dataGeracao) elementos.dataGeracao.textContent = agora.toLocaleDateString('pt-BR');
    
    if (elementos.corpoRelatorio) {
        elementos.corpoRelatorio.innerHTML = '';
        
        let departamentoAtual = '';
        
        dadosRelatorio.forEach(usuario => {
            // Verificar se mudou o departamento (apenas se não estiver filtrado por um departamento específico)
            if (departamento === 'todos' && usuario.departamento !== departamentoAtual) {
                departamentoAtual = usuario.departamento;
                
                // Adicionar linha de cabeçalho do departamento
                const trHeader = document.createElement('tr');
                trHeader.className = 'departamento-header';
                trHeader.innerHTML = `
                    <td colspan="5" style="background-color: #f8f9fa; font-weight: bold; padding: 15px; border-bottom: 2px solid var(--primary-blue);">
                        <i class="fas fa-building"></i> DEPARTAMENTO: ${departamentoAtual || 'NÃO INFORMADO'}
                    </td>
                `;
                elementos.corpoRelatorio.appendChild(trHeader);
            }
            
            // Adicionar linha do usuário
            const tr = document.createElement('tr');
            tr.className = 'usuario-row';
            tr.innerHTML = `
                <td>${usuario.usuario}</td>
                <td>${usuario.anydesk}</td>
                <td>${usuario.departamento}</td>
                <td>${usuario.status}</td>
                <td>${usuario.data}</td>
            `;
            elementos.corpoRelatorio.appendChild(tr);
        });
        
        // Mensagem se não houver resultados
        if (dadosRelatorio.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    Nenhum usuário encontrado com os filtros selecionados
                </td>
            `;
            elementos.corpoRelatorio.appendChild(tr);
        }
    }
    
    // Mostrar o relatório
    if (elementos.areaRelatorio) elementos.areaRelatorio.style.display = 'block';
}

function fecharRelatorio() {
    if (elementos.areaRelatorio) {
        elementos.areaRelatorio.style.display = 'none';
    }
}

// ======= UTILITÁRIOS =======
function obterDataAtual() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

console.log('📄 Script equipamentos.js carregado!');