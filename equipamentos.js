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

// ======= INICIALIZAÇÃO FIREBASE =======
function inicializarFirebase() {
    try {
        // Verificar se Firebase já foi inicializado
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
    return [];
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

// ======= ELEMENTOS DOM =======
const elementos = {
    tabela: document.getElementById("tableBodyEquipamentos"),
    searchInput: document.getElementById("searchInputEquipamentos"),
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
    corpoRelatorio: document.getElementById("corpoRelatorio"),
    dataGeracao: document.getElementById("dataGeracao")
};

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
    if (elementos.searchInput) elementos.searchInput.addEventListener("input", filtrarUsuarios);
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
    
    if (elementos.btnGerarRelatorio) {
        elementos.btnGerarRelatorio.addEventListener("click", abrirModalRelatorio);
    }
    
    // Relatório
    if (elementos.filtroRelatorio) elementos.filtroRelatorio.addEventListener("change", configurarFiltroRelatorio);
    if (elementos.btnVisualizarRelatorio) elementos.btnVisualizarRelatorio.addEventListener("click", gerarRelatorio);
    if (elementos.btnImprimirRelatorio) elementos.btnImprimirRelatorio.addEventListener("click", imprimirRelatorio);
    if (elementos.btnCancelarRelatorio) elementos.btnCancelarRelatorio.addEventListener("click", fecharModalRelatorio);
    
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

function renderizarTabela(dados = estado.dadosFiltrados) {
    if (!elementos.tabela) return;
    
    elementos.tabela.innerHTML = "";
    
    if (dados.length === 0) {
        elementos.tabela.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    dados.forEach((usuario) => {
        const tr = document.createElement("tr");
        
        let statusClass = "";
        switch(usuario.status) {
            case "Ativo": statusClass = "status-ativo"; break;
            case "Manutenção": statusClass = "status-manutencao"; break;
            case "Inativo": statusClass = "status-inativo"; break;
        }
        
        tr.innerHTML = `
            <td>${usuario.usuario || 'N/A'}</td>
            <td>${usuario.anydesk || 'N/A'}</td>
            <td>${usuario.departamento || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${usuario.status || 'N/A'}</span></td>
            <td>${usuario.data || 'N/A'}</td>
            <td>
                <div class="actions">
                    <button class="action-btn view-user-kit" title="Ver equipamentos">👤</button>
                    <button class="action-btn visualizar-btn" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button class="action-btn editar-btn" title="Editar"><i class="fas fa-pen"></i></button>
                    <button class="action-btn excluir-btn" title="Excluir" data-usuario="${usuario.usuario}" data-anydesk="${usuario.anydesk}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        elementos.tabela.appendChild(tr);
    });
    
    configurarEventosBotoes();
}

function configurarEventosBotoes() {
    // Visualizar
    document.querySelectorAll('.visualizar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const usuarioNome = tr.querySelector('td:first-child').textContent;
            const index = usuarios.findIndex(user => user.usuario === usuarioNome);
            if (index !== -1) visualizarUsuario(index);
        });
    });
    
    // Editar
    document.querySelectorAll('.editar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const usuarioNome = tr.querySelector('td:first-child').textContent;
            const index = usuarios.findIndex(user => user.usuario === usuarioNome);
            if (index !== -1) editarUsuario(index);
        });
    });
    
    // Excluir
    document.querySelectorAll('.excluir-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const usuario = btn.getAttribute('data-usuario');
            const anydesk = btn.getAttribute('data-anydesk');
            const index = usuarios.findIndex(user => user.usuario === usuario && user.anydesk === anydesk);
            if (index !== -1) excluirUsuario(index);
        });
    });
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

// ======= FILTROS E RELATÓRIOS =======
function filtrarUsuarios() {
    const termo = elementos.searchInput?.value.toLowerCase() || '';
    const status = elementos.statusFilter?.value || 'Todos';
    const departamento = elementos.departamentoFilter?.value || 'Todos';
    
    estado.dadosFiltrados = usuarios.filter(usuario => {
        const matchesSearch = usuario.usuario.toLowerCase().includes(termo) ||
                             usuario.anydesk.toLowerCase().includes(termo) ||
                             usuario.departamento.toLowerCase().includes(termo);
        const matchesStatus = status === 'Todos' || usuario.status === status;
        const matchesDepartamento = departamento === 'Todos' || usuario.departamento === departamento;
        
        return matchesSearch && matchesStatus && matchesDepartamento;
    });
    
    renderizarTabela();
}

function abrirModalRelatorio() {
    if (elementos.modalRelatorio) {
        elementos.modalRelatorio.style.display = 'flex';
        configurarFiltroRelatorio();
    }
}

function fecharModalRelatorio() {
    if (elementos.modalRelatorio) elementos.modalRelatorio.style.display = 'none';
}

function configurarFiltroRelatorio() {
    if (!elementos.filtroRelatorio) return;
    
    const filtro = elementos.filtroRelatorio.value;
    if (elementos.grupoFiltroEspecifico) {
        elementos.grupoFiltroEspecifico.style.display = filtro === 'todos' ? 'none' : 'block';
    }
    
    if (elementos.filtroEspecifico) {
        elementos.filtroEspecifico.innerHTML = '';
        
        if (filtro === 'status') {
            ['Ativo', 'Manutenção', 'Inativo'].forEach(s => {
                const option = document.createElement('option');
                option.value = s; option.textContent = s;
                elementos.filtroEspecifico.appendChild(option);
            });
        } else if (filtro === 'departamento') {
            [...new Set(usuarios.map(u => u.departamento))].forEach(depto => {
                const option = document.createElement('option');
                option.value = depto; option.textContent = depto;
                elementos.filtroEspecifico.appendChild(option);
            });
        }
    }
}

function gerarRelatorio() {
    const filtro = elementos.filtroRelatorio?.value || 'todos';
    const filtroEspecifico = elementos.filtroEspecifico?.value || '';
    const ordenacao = elementos.ordenacaoRelatorio?.value || 'usuario';
    
    let dadosRelatorio = [...usuarios];
    
    if (filtro !== 'todos' && filtroEspecifico) {
        dadosRelatorio = dadosRelatorio.filter(usuario => usuario[filtro] === filtroEspecifico);
    }
    
    dadosRelatorio.sort((a, b) => {
        if (ordenacao === 'data') {
            return new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-'));
        }
        return a[ordenacao].localeCompare(b[ordenacao]);
    });
    
    // Atualizar UI do relatório
    const agora = new Date();
    if (elementos.dataRelatorio) elementos.dataRelatorio.textContent = `Data: ${agora.toLocaleDateString('pt-BR')}`;
    if (elementos.dataGeracao) elementos.dataGeracao.textContent = agora.toLocaleDateString('pt-BR');
    
    if (elementos.corpoRelatorio) {
        elementos.corpoRelatorio.innerHTML = '';
        dadosRelatorio.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.usuario}</td>
                <td>${usuario.anydesk}</td>
                <td>${usuario.departamento}</td>
                <td>${usuario.status}</td>
                <td>${usuario.data}</td>
            `;
            elementos.corpoRelatorio.appendChild(tr);
        });
    }
    
    if (elementos.areaRelatorio) elementos.areaRelatorio.style.display = 'block';
    if (elementos.modalRelatorio) elementos.modalRelatorio.style.display = 'none';
}

function imprimirRelatorio() {
    window.print();
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