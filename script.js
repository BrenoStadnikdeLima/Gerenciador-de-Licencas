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
let licencas = [];
let estado = {
    licencaSelecionada: null,
    modoEdicao: false,
    modoAdicao: false,
    dadosFiltrados: [],
    editingCell: null,
    modoAtual: 'visualizacao' // 'visualizacao' ou 'cadastro'
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
        console.log('✅ Firebase inicializado para licenças!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// ======= FUNÇÕES FIREBASE =======
async function carregarLicencas() {
    if (!db) {
        console.log('⚠️ Firebase não inicializado, usando dados locais');
        return carregarLicencasLocais();
    }

    try {
        console.log('📥 Carregando licenças do Firebase...');
        const snapshot = await db.collection('licencas').get();
        
        if (snapshot.empty) {
            console.log('📭 Nenhuma licença encontrada no Firebase');
            return carregarLicencasLocais();
        }
        
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${dados.length} licenças carregadas do Firebase`);
        return dados;
    } catch (error) {
        console.error('❌ Erro ao carregar licenças do Firebase:', error);
        alert('⚠️ Usando modo offline. Dados serão salvos localmente.');
        return carregarLicencasLocais();
    }
}

async function salvarLicencas() {
    // Sempre salvar localmente primeiro
    salvarLicencasLocais();
    
    if (!db) {
        console.log('⚠️ Firebase não disponível, salvando apenas localmente');
        return true;
    }

    try {
        console.log('💾 Tentando salvar licenças no Firebase...');
        
        // Buscar documentos existentes
        const snapshot = await db.collection('licencas').get();
        const batch = db.batch();
        
        // Limpar documentos existentes
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('🗑️ Licenças antigas removidas');

        // Salvar novos documentos
        const newBatch = db.batch();
        licencas.forEach(licenca => {
            const docRef = db.collection('licencas').doc();
            newBatch.set(docRef, licenca);
        });
        await newBatch.commit();
        
        console.log(`✅ ${licencas.length} licenças salvas no Firebase`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar licenças no Firebase:', error);
        alert('⚠️ Licenças salvas apenas localmente. Verifique a conexão.');
        return false;
    }
}

// ======= FUNÇÕES LOCAIS (FALLBACK) =======
function carregarLicencasLocais() {
    try {
        const dadosSalvos = localStorage.getItem('licencasProsul');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            console.log(`📁 ${dados.length} licenças carregadas do localStorage`);
            return dados;
        }
    } catch (error) {
        console.error('Erro ao carregar licenças locais:', error);
    }
    
    // DADOS LIMPOS - ARRAY VAZIO
    return [];
}

function salvarLicencasLocais() {
    try {
        localStorage.setItem('licencasProsul', JSON.stringify(licencas));
        console.log(`💾 ${licencas.length} licenças salvas no localStorage`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar licenças locais:', error);
        return false;
    }
}

// Elementos DOM
const elementos = {
    // Modo Visualização
    tabela: document.getElementById("tableBody"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    
    // Modos
    btnModoCadastro: document.getElementById("btnModoCadastro"),
    btnVoltarVisualizacao: document.getElementById("btnVoltarVisualizacao"),
    modoCadastro: document.getElementById("modoCadastro"),
    modoVisualizacao: document.querySelector('.main-content .container'),
    
    // Formulário Detalhado
    formCadastroDetalhado: document.getElementById("formCadastroDetalhado"),
    cadSoftware: document.getElementById("cadSoftware"),
    cadVersao: document.getElementById("cadVersao"),
    cadTipo: document.getElementById("cadTipo"),
    cadCategoria: document.getElementById("cadCategoria"),
    cadTotalLicencas: document.getElementById("cadTotalLicencas"),
    cadEmUso: document.getElementById("cadEmUso"),
    cadSemUso: document.getElementById("cadSemUso"),
    cadDataCompra: document.getElementById("cadDataCompra"),
    cadDataExpiracao: document.getElementById("cadDataExpiracao"),
    cadValor: document.getElementById("cadValor"),
    cadMoeda: document.getElementById("cadMoeda"),
    cadPeriodicidadePagamento: document.getElementById("cadPeriodicidadePagamento"),
    cadFornecedor: document.getElementById("cadFornecedor"),
    cadContato: document.getElementById("cadContato"),
    cadEmailContato: document.getElementById("cadEmailContato"),
    cadTelefoneContato: document.getElementById("cadTelefoneContato"),
    cadObservacoes: document.getElementById("cadObservacoes"),
    cadDocumentos: document.getElementById("cadDocumentos"),
    cadLinkContrato: document.getElementById("cadLinkContrato"),
    
    // Modal Existente
    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    formLicenca: document.getElementById("formLicenca"),
    salvarBtn: document.getElementById("salvarBtn"),
    cancelarBtn: document.getElementById("cancelarBtn"),
    alerta: document.getElementById("alertaSucesso"),
    modalSoftware: document.getElementById("modalSoftware"),
    modalVersao: document.getElementById("modalVersao"),
    modalLicencas: document.getElementById("modalLicencas"),
    modalEmUso: document.getElementById("modalEmUso"),
    modalSemUso: document.getElementById("modalSemUso"),
    modalData: document.getElementById("modalData"),
    modalFornecedor: document.getElementById("modalFornecedor"),
    modalValor: document.getElementById("modalValor"),
    modalContato: document.getElementById("modalContato"),
    modalObservacoes: document.getElementById("modalObservacoes"),
    closeModal: document.querySelector(".close-modal"),
    btnNovaLicenca: document.getElementById("novaLicenca"),
    btnGerarRelatorio: document.getElementById("gerarRelatorio"),
    
    // Relatório
    modalRelatorio: document.getElementById("modalRelatorio"),
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
    console.log('🚀 Iniciando controle de licenças...');
    
    // Inicializar Firebase
    const firebaseInicializado = inicializarFirebase();
    
    // Carregar dados
    licencas = await carregarLicencas();
    estado.dadosFiltrados = [...licencas];
    
    renderizarTabela();
    configurarEventListeners();
    configurarModosVisualizacao();
    
    console.log(`🎯 Controle de licenças iniciado com ${licencas.length} licenças`);
    console.log(`🌐 Firebase: ${firebaseInicializado ? 'CONECTADO' : 'OFFLINE'}`);
});

// ======= CONTROLE DE MODOS =======
function configurarModosVisualizacao() {
    if (elementos.btnModoCadastro) {
        elementos.btnModoCadastro.addEventListener('click', function() {
            estado.modoAtual = 'cadastro';
            elementos.modoCadastro.style.display = 'block';
            elementos.modoVisualizacao.style.display = 'none';
            this.style.display = 'none';
        });
    }
    
    if (elementos.btnVoltarVisualizacao) {
        elementos.btnVoltarVisualizacao.addEventListener('click', function() {
            estado.modoAtual = 'visualizacao';
            elementos.modoCadastro.style.display = 'none';
            elementos.modoVisualizacao.style.display = 'block';
            elementos.btnModoCadastro.style.display = 'block';
        });
    }
}

// ======= CONFIGURAÇÃO DE EVENTOS =======
function configurarEventListeners() {
    // Pesquisa em tempo real
    elementos.searchInput.addEventListener("input", filtrarLicencas);
    
    // Filtro por status
    elementos.statusFilter.addEventListener("change", filtrarLicencas);
    
    // Modal Principal
    elementos.cancelarBtn.addEventListener("click", fecharModal);
    elementos.salvarBtn.addEventListener("click", salvarLicenca);
    elementos.closeModal.addEventListener("click", fecharModal);
    
    // Botões de Ação
    if (elementos.btnNovaLicenca) {
        elementos.btnNovaLicenca.addEventListener("click", abrirModalNovaLicenca);
    }
    
    if (elementos.btnGerarRelatorio) {
        elementos.btnGerarRelatorio.addEventListener("click", abrirModalRelatorio);
    }
    
    // Formulário Detalhado
    if (elementos.formCadastroDetalhado) {
        elementos.formCadastroDetalhado.addEventListener("submit", salvarLicencaDetalhada);
    }
    
    // Auto-calcular campo "Sem Uso"
    if (elementos.cadTotalLicencas && elementos.cadEmUso) {
        elementos.cadTotalLicencas.addEventListener('input', calcularSemUso);
        elementos.cadEmUso.addEventListener('input', calcularSemUso);
    }
    
    // Relatório
    if (elementos.filtroRelatorio) elementos.filtroRelatorio.addEventListener("change", configurarFiltroRelatorio);
    if (elementos.btnVisualizarRelatorio) elementos.btnVisualizarRelatorio.addEventListener("click", gerarRelatorio);
    if (elementos.btnImprimirRelatorio) elementos.btnImprimirRelatorio.addEventListener("click", imprimirRelatorio);
    if (elementos.btnCancelarRelatorio) elementos.btnCancelarRelatorio.addEventListener("click", fecharModalRelatorio);
    
    // Fechar modais
    elementos.modal.addEventListener("click", function(e) {
        if (e.target === elementos.modal) {
            fecharModal();
        }
    });
    
    if (elementos.modalRelatorio) {
        elementos.modalRelatorio.addEventListener("click", function(e) {
            if (e.target === elementos.modalRelatorio) fecharModalRelatorio();
        });
        
        const closeBtn = elementos.modalRelatorio.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', fecharModalRelatorio);
    }
    
    // Tecla ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (elementos.modal.style.display === "flex") {
                fecharModal();
            }
            if (elementos.modalRelatorio.style.display === "flex") {
                fecharModalRelatorio();
            }
            if (estado.editingCell) {
                cancelarEdicaoInline();
            }
        }
    });
}

// ======= FUNÇÕES DO FORMULÁRIO DETALHADO =======
function calcularSemUso() {
    if (!elementos.cadTotalLicencas || !elementos.cadSemUso) return;
    
    const total = parseInt(elementos.cadTotalLicencas.value) || 0;
    const emUso = parseInt(elementos.cadEmUso.value) || 0;
    const semUso = total - emUso;
    
    elementos.cadSemUso.value = semUso >= 0 ? semUso : 0;
}

async function salvarLicencaDetalhada(e) {
    e.preventDefault();
    
    // Coletar dados do formulário detalhado
    const licencaDetalhada = {
        software: elementos.cadSoftware.value.trim(),
        versao: elementos.cadVersao.value.trim(),
        tipo: elementos.cadTipo.value,
        categoria: elementos.cadCategoria.value.trim(),
        licencas: parseInt(elementos.cadTotalLicencas.value),
        emUso: parseInt(elementos.cadEmUso.value),
        semUso: parseInt(elementos.cadSemUso.value),
        dataCompra: elementos.cadDataCompra.value,
        dataExpiracao: elementos.cadDataExpiracao.value,
        data: formatarDataParaBR(elementos.cadDataExpiracao.value),
        valor: parseFloat(elementos.cadValor.value) || 0,
        moeda: elementos.cadMoeda.value,
        periodicidadePagamento: elementos.cadPeriodicidadePagamento.value,
        fornecedor: elementos.cadFornecedor.value.trim(),
        contato: elementos.cadContato.value.trim(),
        emailContato: elementos.cadEmailContato.value.trim(),
        telefoneContato: elementos.cadTelefoneContato.value.trim(),
        observacoes: elementos.cadObservacoes.value.trim(),
        linkContrato: elementos.cadLinkContrato.value.trim(),
        status: calcularStatus(elementos.cadDataExpiracao.value),
        dataCadastro: new Date().toISOString()
    };
    
    // Validações
    if (!licencaDetalhada.software || !licencaDetalhada.versao) {
        mostrarNotificacao('Preencha o nome do software e versão!', 'erro');
        return;
    }
    
    if (licencaDetalhada.licencas < 1) {
        mostrarNotificacao('O número total de licenças deve ser maior que zero!', 'erro');
        return;
    }
    
    if (licencaDetalhada.emUso + licencaDetalhada.semUso !== licencaDetalhada.licencas) {
        mostrarNotificacao('A soma de "Em Uso" + "Sem Uso" deve ser igual ao Total de Licenças!', 'erro');
        return;
    }
    
    if (!licencaDetalhada.dataExpiracao) {
        mostrarNotificacao('Informe a data de expiração!', 'erro');
        return;
    }
    
    // Verificar duplicata
    const duplicata = licencas.find(lic => 
        lic.software === licencaDetalhada.software && 
        lic.versao === licencaDetalhada.versao
    );
    
    if (duplicata) {
        mostrarNotificacao('Já existe uma licença com este software e versão!', 'erro');
        return;
    }
    
    // Adicionar aos dados
    licencas.unshift(licencaDetalhada);
    
    // Salvar dados
    await salvarLicencas();
    
    // Atualizar visualização
    estado.dadosFiltrados = [...licencas];
    renderizarTabela();
    
    // Limpar formulário e voltar para visualização
    elementos.formCadastroDetalhado.reset();
    elementos.btnVoltarVisualizacao.click();
    
    mostrarNotificacao('Licença cadastrada com sucesso! 🎉');
}

function formatarDataParaBR(dataISO) {
    if (!dataISO) return '';
    const date = new Date(dataISO);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function calcularStatus(dataExpiracao) {
    if (!dataExpiracao) return 'Ativa';
    
    const hoje = new Date();
    const expiracao = new Date(dataExpiracao);
    const diffTime = expiracao - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expirada';
    if (diffDays <= 30) return 'Em Renovação';
    return 'Ativa';
}

// ======= RENDERIZAÇÃO DA TABELA =======
function renderizarTabela(dados = estado.dadosFiltrados) {
    elementos.tabela.innerHTML = "";
    
    if (dados.length === 0) {
        elementos.tabela.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 10px 0; font-weight: 500;">Nenhuma licença cadastrada</h3>
                    <p style="margin: 0; opacity: 0.7;">Use o "Modo Cadastro" para adicionar sua primeira licença</p>
                </td>
            </tr>
        `;
        return;
    }
    
    dados.forEach((licenca, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        // Calcular percentual de uso para cor
        const percentualUso = (licenca.emUso / licenca.licencas) * 100;
        
        // Determinar classe do status
        let statusClass = 'status-ativo';
        if (licenca.status === 'Expirada') statusClass = 'status-inativo';
        if (licenca.status === 'Em Renovação') statusClass = 'status-manutencao';
        
        tr.innerHTML = `
            <td class="editable" data-field="software">${licenca.software}</td>
            <td class="editable" data-field="versao">${licenca.versao}</td>
            <td class="editable" data-field="licencas">${licenca.licencas}</td>
            <td>
                <div class="uso-badge uso-ativo">
                    <span class="uso-number">${licenca.emUso}</span>
                    <span class="uso-percent">${Math.round(percentualUso)}%</span>
                </div>
            </td>
            <td>
                <div class="uso-badge uso-inativo">
                    <span class="uso-number">${licenca.semUso}</span>
                    <span class="uso-percent">${Math.round(100 - percentualUso)}%</span>
                </div>
            </td>
            <td class="editable" data-field="data">${licenca.data}</td>
            <td><span class="status-badge ${statusClass}">${licenca.status}</span></td>
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

// ======= FILTROS E PESQUISA =======
function filtrarLicencas() {
    const termo = elementos.searchInput.value.toLowerCase();
    const status = elementos.statusFilter.value;
    
    estado.dadosFiltrados = licencas.filter(licenca => {
        const matchesSearch = licenca.software.toLowerCase().includes(termo) ||
                             licenca.versao.toLowerCase().includes(termo);
        
        const matchesStatus = status === 'Todos' || licenca.status === status;
        
        return matchesSearch && matchesStatus;
    });
    
    renderizarTabela();
}

// ======= RELATÓRIOS =======
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
        
        if (filtro === 'software') {
            const softwares = [...new Set(licencas.map(lic => lic.software))];
            softwares.sort();
            softwares.forEach(software => {
                const option = document.createElement('option');
                option.value = software;
                option.textContent = software;
                elementos.filtroEspecifico.appendChild(option);
            });
        } else if (filtro === 'status') {
            const status = ['Ativa', 'Expirada', 'Em Renovação'];
            status.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                elementos.filtroEspecifico.appendChild(option);
            });
        }
    }
}

function gerarRelatorio() {
    const filtro = elementos.filtroRelatorio?.value || 'todos';
    const filtroEspecifico = elementos.filtroEspecifico?.value || '';
    const ordenacao = elementos.ordenacaoRelatorio?.value || 'software';
    
    let dadosRelatorio = [...licencas];
    
    if (filtro !== 'todos' && filtroEspecifico) {
        dadosRelatorio = dadosRelatorio.filter(licenca => licenca[filtro] === filtroEspecifico);
    }
    
    dadosRelatorio.sort((a, b) => {
        if (ordenacao === 'quantidade') {
            return b.licencas - a.licencas;
        } else if (ordenacao === 'data') {
            return new Date(a.dataExpiracao) - new Date(b.dataExpiracao);
        }
        return a[ordenacao].localeCompare(b[ordenacao]);
    });
    
    // Atualizar UI do relatório
    const agora = new Date();
    if (elementos.dataRelatorio) elementos.dataRelatorio.textContent = `Data: ${agora.toLocaleDateString('pt-BR')}`;
    if (elementos.dataGeracao) elementos.dataGeracao.textContent = agora.toLocaleDateString('pt-BR');
    
    if (elementos.corpoRelatorio) {
        elementos.corpoRelatorio.innerHTML = '';
        
        if (dadosRelatorio.length === 0) {
            elementos.corpoRelatorio.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                        Nenhuma licença encontrada para o filtro selecionado
                    </td>
                </tr>
            `;
        } else {
            dadosRelatorio.forEach(licenca => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${licenca.software}</td>
                    <td>${licenca.versao}</td>
                    <td>${licenca.licencas}</td>
                    <td>${licenca.emUso}</td>
                    <td>${licenca.semUso}</td>
                    <td>${licenca.data}</td>
                    <td>${licenca.status}</td>
                `;
                elementos.corpoRelatorio.appendChild(tr);
            });
        }
    }
    
    if (elementos.areaRelatorio) elementos.areaRelatorio.style.display = 'block';
    if (elementos.modalRelatorio) elementos.modalRelatorio.style.display = 'none';
}

function imprimirRelatorio() {
    window.print();
}

// ======= MODAL FUNCTIONS (Existente) =======
function abrirModalNovaLicenca() {
    estado.modoAdicao = true;
    estado.modoEdicao = true;
    estado.licencaSelecionada = null;
    
    // Limpar campos
    const campos = ['modalSoftware', 'modalVersao', 'modalLicencas', 'modalEmUso', 'modalSemUso', 'modalData', 'modalFornecedor', 'modalValor', 'modalContato', 'modalObservacoes'];
    campos.forEach(campo => {
        if (elementos[campo]) elementos[campo].value = '';
    });
    
    // Configurar UI
    elementos.modalTitle.textContent = 'Nova Licença';
    elementos.salvarBtn.style.display = 'block';
    elementos.modal.style.display = 'flex';
    
    setTimeout(() => {
        elementos.modalSoftware.focus();
    }, 100);
}

function visualizarLicenca(index) {
    estado.licencaSelecionada = index;
    estado.modoEdicao = false;
    estado.modoAdicao = false;
    abrirModal(licencas[index], false);
}

function editarLicenca(index) {
    estado.licencaSelecionada = index;
    estado.modoEdicao = true;
    estado.modoAdicao = false;
    abrirModal(licencas[index], true);
}

function abrirModal(licenca, editavel) {
    // Preencher campos principais
    elementos.modalSoftware.value = licenca.software || '';
    elementos.modalVersao.value = licenca.versao || '';
    elementos.modalLicencas.value = licenca.licencas || '';
    elementos.modalEmUso.value = licenca.emUso || '';
    elementos.modalSemUso.value = licenca.semUso || '';
    elementos.modalData.value = licenca.data || '';
    
    // Preencher campos adicionais (se existirem)
    if (elementos.modalFornecedor) elementos.modalFornecedor.value = licenca.fornecedor || '';
    if (elementos.modalValor) elementos.modalValor.value = licenca.valor || '';
    if (elementos.modalContato) elementos.modalContato.value = licenca.contato || '';
    if (elementos.modalObservacoes) elementos.modalObservacoes.value = licenca.observacoes || '';
    
    // Configurar estado dos campos
    const campos = ['modalSoftware', 'modalVersao', 'modalLicencas', 'modalEmUso', 'modalSemUso', 'modalData', 'modalFornecedor', 'modalValor', 'modalContato', 'modalObservacoes'];
    campos.forEach(campo => {
        if (elementos[campo]) elementos[campo].disabled = !editavel;
    });
    
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
    estado.modoAdicao = false;
}

async function salvarLicenca() {
    // Coletar dados principais
    const software = elementos.modalSoftware.value.trim();
    const versao = elementos.modalVersao.value.trim();
    const numLicencas = parseInt(elementos.modalLicencas.value);
    const emUso = parseInt(elementos.modalEmUso.value);
    const semUso = parseInt(elementos.modalSemUso.value);
    const data = elementos.modalData.value.trim();
    
    // Coletar dados adicionais
    const fornecedor = elementos.modalFornecedor?.value.trim() || '';
    const valor = elementos.modalValor?.value.trim() || '';
    const contato = elementos.modalContato?.value.trim() || '';
    const observacoes = elementos.modalObservacoes?.value.trim() || '';
    
    // Validações
    if (!software || !versao || isNaN(numLicencas) || numLicencas < 1 || 
        isNaN(emUso) || emUso < 0 || isNaN(semUso) || semUso < 0 || !data) {
        mostrarNotificacao('Preencha todos os campos obrigatórios!', 'erro');
        return;
    }
    
    // Validar se a soma bate
    if (emUso + semUso !== numLicencas) {
        mostrarNotificacao('A soma de "Em Uso" + "Sem Uso" deve ser igual à Quantidade Total!', 'erro');
        return;
    }
    
    // Validar formato da data
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        mostrarNotificacao('Formato de data inválido! Use DD/MM/AAAA', 'erro');
        return;
    }
    
    if (estado.modoAdicao) {
        // Verificar duplicata
        if (licencas.find(lic => lic.software === software && lic.versao === versao)) {
            mostrarNotificacao('Já existe uma licença com este software e versão!', 'erro');
            return;
        }
        
        // Adicionar nova licença
        const novaLicenca = {
            software,
            versao,
            licencas: numLicencas,
            emUso,
            semUso,
            data,
            status: "Ativa",
            fornecedor,
            valor,
            contato,
            observacoes
        };
        
        licencas.unshift(novaLicenca);
        mostrarNotificacao('Licença adicionada com sucesso!');
    } else if (estado.modoEdicao && estado.licencaSelecionada !== null) {
        // Editar licença existente
        licencas[estado.licencaSelecionada] = {
            ...licencas[estado.licencaSelecionada],
            software,
            versao,
            licencas: numLicencas,
            emUso,
            semUso,
            data,
            fornecedor,
            valor,
            contato,
            observacoes
        };
        mostrarNotificacao('Licença atualizada com sucesso!');
    }
    
    // Salvar dados
    await salvarLicencas();
    
    // Atualizar tabela
    filtrarLicencas();
    fecharModal();
}

async function excluirLicenca(index) {
    if (!confirm(`Tem certeza que deseja excluir a licença "${licencas[index].software}"?`)) return;
    
    licencas.splice(index, 1);
    await salvarLicencas();
    estado.dadosFiltrados = [...licencas];
    renderizarTabela();
    mostrarNotificacao('Licença excluída com sucesso!');
}

// ======= EDIÇÃO INLINE =======
function configurarEdicaoInline() {
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('dblclick', iniciarEdicaoInline);
    });
}

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

async function finalizarEdicaoInline(novoValor) {
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
    
    // Atualizar status se a data foi alterada
    if (field === 'data') {
        const dataExpiracao = new Date(valorFinal.split('/').reverse().join('-'));
        const hoje = new Date();
        licencas[originalIndex].status = dataExpiracao < hoje ? 'Expirada' : 'Ativa';
    }
    
    // Atualizar array filtrado
    estado.dadosFiltrados[filteredIndex][field] = valorFinal;
    if (field === 'data') {
        estado.dadosFiltrados[filteredIndex].status = licencas[originalIndex].status;
    }
    
    // Salvar dados
    await salvarLicencas();
    
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

function configurarEventosBotoes() {
    // Botões de visualizar
    document.querySelectorAll('.visualizar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
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
            const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
            const originalIndex = licencas.findIndex(lic => 
                lic.software === licencaFiltrada.software && 
                lic.versao === licencaFiltrada.versao
            );
            
            if (originalIndex !== -1) {
                editarLicenca(originalIndex);
            }
        });
    });
    
    // Botões de excluir
    document.querySelectorAll('.excluir-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tr = e.target.closest('tr');
            const filteredIndex = parseInt(tr.getAttribute('data-index'));
            const licencaFiltrada = estado.dadosFiltrados[filteredIndex];
            const originalIndex = licencas.findIndex(lic => 
                lic.software === licencaFiltrada.software && 
                lic.versao === licencaFiltrada.versao
            );
            
            if (originalIndex !== -1) {
                excluirLicenca(originalIndex);
            }
        });
    });
}

// Renderizar tabela inicial
renderizarTabela();