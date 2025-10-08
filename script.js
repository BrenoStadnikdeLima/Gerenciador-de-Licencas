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
let licencasIndividuais = [];
let estado = {
    dadosFiltrados: []
};

// Estado para licenças individuais
const estadoIndividual = {
    licencaSelecionada: null,
    modoEdicao: false,
    modoAdicao: false
};

// Elementos DOM
const elementos = {
    // Modo Visualização
    tabela: document.getElementById("tableBody")
};

// Elementos DOM para Licenças Individuais
const elementosIndividuais = {
    tabela: document.getElementById("tableBodyIndividuais"),
    searchInput: document.getElementById("searchInputIndividuais"),
    softwareFilter: document.getElementById("softwareFilter"),
    statusFilter: document.getElementById("statusFilterIndividuais"),
    modal: document.getElementById("modalLicencaIndividual"),
    modalTitle: document.getElementById("modalTitleIndividual"),
    form: document.getElementById("formLicencaIndividual"),
    salvarBtn: document.getElementById("salvarBtnIndividual"),
    cancelarBtn: document.getElementById("cancelarBtnIndividual"),
    btnAdicionar: document.getElementById("adicionarLicencaIndividual"),
    btnRelatorio: document.getElementById("gerarRelatorioIndividuais"),
    btnNovoSoftware: document.getElementById("btnNovoSoftware"),
    
    // Campos do formulário
    software: document.getElementById("modalSoftwareIndividual"),
    chaveAtivacao: document.getElementById("modalChaveAtivacao"),
    usuario: document.getElementById("modalUsuario"),
    hostname: document.getElementById("modalHostname"),
    patrimonio: document.getElementById("modalPatrimonio"),
    status: document.getElementById("modalStatus"),
    
    // Campos adicionais
    infoAdicionais: document.getElementById("infoAdicionais"),
    numeroPedido: document.getElementById("modalNumeroPedido"),
    chamado: document.getElementById("modalChamado"),
    dataPedido: document.getElementById("modalDataPedido"),
    preco: document.getElementById("modalPreco"),
    
    closeModal: document.querySelector("#modalLicencaIndividual .close-modal")
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
        return false;
    }
}

// ======= FUNÇÕES FIREBASE PARA LICENÇAS INDIVIDUAIS =======
async function carregarLicencasIndividuais() {
    if (!db) {
        return carregarLicencasIndividuaisLocais();
    }

    try {
        const snapshot = await db.collection('licencasIndividuais').get();
        
        if (snapshot.empty) {
            return carregarLicencasIndividuaisLocais();
        }
        
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${dados.length} licenças individuais carregadas do Firebase`);
        return dados;
    } catch (error) {
        console.error('❌ Erro ao carregar licenças individuais:', error);
        return carregarLicencasIndividuaisLocais();
    }
}

async function salvarLicencasIndividuais() {
    // Salvar localmente
    salvarLicencasIndividuaisLocais();
    
    if (!db) {
        console.log('⚠️ Firebase não disponível para licenças individuais');
        return true;
    }

    try {
        // Limpar documentos existentes
        const snapshot = await db.collection('licencasIndividuais').get();
        const batch = db.batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Salvar novos documentos
        const newBatch = db.batch();
        licencasIndividuais.forEach(licenca => {
            const docRef = db.collection('licencasIndividuais').doc();
            newBatch.set(docRef, licenca);
        });
        await newBatch.commit();
        
        console.log(`✅ ${licencasIndividuais.length} licenças individuais salvas no Firebase`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar licenças individuais:', error);
        return false;
    }
}

// ======= FUNÇÕES LOCAIS =======
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

function carregarLicencasIndividuaisLocais() {
    try {
        const dadosSalvos = localStorage.getItem('licencasIndividuaisProsul');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            console.log(`📁 ${dados.length} licenças individuais carregadas do localStorage`);
            return dados;
        }
    } catch (error) {
        console.error('Erro ao carregar licenças individuais locais:', error);
    }
    
    return [];
}

function salvarLicencasIndividuaisLocais() {
    try {
        localStorage.setItem('licencasIndividuaisProsul', JSON.stringify(licencasIndividuais));
        console.log(`💾 ${licencasIndividuais.length} licenças individuais salvas no localStorage`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar licenças individuais locais:', error);
        return false;
    }
}

// ======= INICIALIZAÇÃO =======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando controle de licenças...');
    
    // Inicializar Firebase
    const firebaseInicializado = inicializarFirebase();
    
    // Carregar dados
    licencas = await carregarLicencas();
    estado.dadosFiltrados = [...licencas];
    
    // Inicializar licenças individuais
    await inicializarLicencasIndividuais();
    
    renderizarTabela();
    configurarEventListeners();
    
    console.log(`🎯 Controle de licenças iniciado com ${licencas.length} licenças`);
    console.log(`🌐 Firebase: ${firebaseInicializado ? 'CONECTADO' : 'OFFLINE'}`);
});

// ======= INICIALIZAÇÃO DAS LICENÇAS INDIVIDUAIS =======
async function inicializarLicencasIndividuais() {
    // Carregar dados
    licencasIndividuais = await carregarLicencasIndividuais();
    
    // SINCRONIZAR AO INICIAR
    sincronizarTabelaGeral();
    await salvarLicencas();
    
    // Renderizar tabelas
    renderizarTabelaIndividuais();
    
    // Configurar eventos
    configurarEventListenersIndividuais();
    
    // Atualizar filtros
    atualizarFiltroSoftwares();
    
    console.log(`🎯 Licenças individuais iniciadas com ${licencasIndividuais.length} registros`);
    console.log(`🔄 Tabela geral sincronizada com ${licencas.length} softwares`);
}

// ======= SINCRONIZAÇÃO ENTRE TABELAS =======
function calcularTotaisDasLicencasIndividuais() {
    const totaisPorSoftware = {};
    
    licencasIndividuais.forEach(licenca => {
        const software = licenca.software;
        
        if (!totaisPorSoftware[software]) {
            totaisPorSoftware[software] = {
                total: 0,
                emUso: 0,
                semUso: 0
            };
        }
        
        totaisPorSoftware[software].total++;
        
        if (licenca.status === 'Ativa') {
            totaisPorSoftware[software].emUso++;
        } else {
            totaisPorSoftware[software].semUso++;
        }
    });
    
    return totaisPorSoftware;
}

function sincronizarTabelaGeral() {
    const totais = calcularTotaisDasLicencasIndividuais();
    
    // Para cada software nas licenças individuais
    Object.keys(totais).forEach(software => {
        const total = totais[software].total;
        const emUso = totais[software].emUso;
        const semUso = totais[software].semUso;
        
        // Verificar se o software já existe na tabela geral
        const indexExistente = licencas.findIndex(lic => lic.software === software);
        
        if (indexExistente !== -1) {
            // Atualizar software existente
            licencas[indexExistente].licencas = total;
            licencas[indexExistente].emUso = emUso;
            licencas[indexExistente].semUso = semUso;
        } else {
            // Adicionar novo software
            const primeiraOcorrencia = licencasIndividuais.find(lic => lic.software === software);
            
            licencas.unshift({
                software: software,
                versao: primeiraOcorrencia?.versao || 'N/A',
                licencas: total,
                emUso: emUso,
                semUso: semUso,
                dataCadastro: new Date().toISOString(),
                sincronizadoAutomaticamente: true
            });
        }
    });
    
    // Remover softwares da tabela geral que não existem mais nas individuais
    licencas = licencas.filter(licenca => {
        return !licenca.sincronizadoAutomaticamente || 
               Object.keys(totais).includes(licenca.software);
    });
}

// ======= CONFIGURAÇÃO DE EVENTOS =======
function configurarEventListeners() {
    // Tecla ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (elementosIndividuais.modal && elementosIndividuais.modal.style.display === "flex") {
                fecharModalIndividual();
            }
        }
    });
}

// ======= CONFIGURAÇÃO DE EVENTOS INDIVIDUAIS =======
function configurarEventListenersIndividuais() {
    // Pesquisa
    if (elementosIndividuais.searchInput) {
        elementosIndividuais.searchInput.addEventListener("input", filtrarLicencasIndividuais);
    }
    
    // Filtro por software
    if (elementosIndividuais.softwareFilter) {
        elementosIndividuais.softwareFilter.addEventListener("change", filtrarLicencasIndividuais);
    }
    
    // Filtro por status
    if (elementosIndividuais.statusFilter) {
        elementosIndividuais.statusFilter.addEventListener("change", filtrarLicencasIndividuais);
    }
    
    // Botões de ação
    if (elementosIndividuais.btnAdicionar) {
        elementosIndividuais.btnAdicionar.addEventListener("click", abrirModalNovaIndividual);
    }
    
    // Modal
    if (elementosIndividuais.cancelarBtn) {
        elementosIndividuais.cancelarBtn.addEventListener("click", fecharModalIndividual);
    }
    
    if (elementosIndividuais.salvarBtn) {
        elementosIndividuais.salvarBtn.addEventListener("click", salvarLicencaIndividual);
    }
    
    if (elementosIndividuais.closeModal) {
        elementosIndividuais.closeModal.addEventListener("click", fecharModalIndividual);
    }
    
    // Fechar modal ao clicar fora
    if (elementosIndividuais.modal) {
        elementosIndividuais.modal.addEventListener("click", function(e) {
            if (e.target === elementosIndividuais.modal) {
                fecharModalIndividual();
            }
        });
    }
    
    // Novo botão de software
    configurarBotaoNovoSoftware();
    
    // Configurar relatório individuais
    configurarRelatorioIndividuais();
}

function configurarBotaoNovoSoftware() {
    if (elementosIndividuais.btnNovoSoftware && elementosIndividuais.software) {
        elementosIndividuais.btnNovoSoftware.addEventListener('click', function() {
            const nomeSoftware = prompt('📝 Adicionar Novo Software\n\nDigite o nome do novo software:');
            
            if (nomeSoftware && nomeSoftware.trim()) {
                const softwareNome = nomeSoftware.trim();
                
                // Verificar se já existe
                const existe = Array.from(elementosIndividuais.software.options).some(option => 
                    option.value.toLowerCase() === softwareNome.toLowerCase()
                );
                
                if (!existe) {
                    // Adicionar ao select
                    const option = document.createElement('option');
                    option.value = softwareNome;
                    option.textContent = softwareNome;
                    elementosIndividuais.software.appendChild(option);
                    
                    // Selecionar o novo software
                    elementosIndividuais.software.value = softwareNome;
                    
                    // Atualizar também o filtro de softwares se existir
                    if (elementosIndividuais.softwareFilter) {
                        const optionFiltro = document.createElement('option');
                        optionFiltro.value = softwareNome;
                        optionFiltro.textContent = softwareNome;
                        elementosIndividuais.softwareFilter.appendChild(optionFiltro);
                    }
                    
                    mostrarNotificacao(`✅ Software "${softwareNome}" adicionado com sucesso!`);
                    
                    // Focar no próximo campo
                    setTimeout(() => {
                        if (elementosIndividuais.chaveAtivacao) {
                            elementosIndividuais.chaveAtivacao.focus();
                        }
                    }, 100);
                } else {
                    mostrarNotificacao('⚠️ Este software já existe na lista!', 'erro');
                }
            }
        });
    }
}

// ======= FUNÇÕES DO MODAL INDIVIDUAL =======
function abrirModalNovaIndividual() {
    estadoIndividual.modoEdicao = true;
    estadoIndividual.modoAdicao = true;
    estadoIndividual.licencaSelecionada = null;
    
    // Limpar campos
    if (elementosIndividuais.form) {
        elementosIndividuais.form.reset();
    }
    
    // Mostrar seção adicional em modo adição
    if (elementosIndividuais.infoAdicionais) {
        elementosIndividuais.infoAdicionais.style.display = 'block';
    }
    
    // Habilitar todos os campos
    const campos = ['software', 'chaveAtivacao', 'usuario', 'hostname', 'patrimonio', 'status', 'numeroPedido', 'chamado', 'dataPedido', 'preco'];
    campos.forEach(campo => {
        if (elementosIndividuais[campo]) {
            elementosIndividuais[campo].disabled = false;
        }
    });
    
    // Configurar UI
    if (elementosIndividuais.modalTitle) {
        elementosIndividuais.modalTitle.textContent = 'Nova Licença Individual';
    }
    if (elementosIndividuais.salvarBtn) {
        elementosIndividuais.salvarBtn.style.display = 'block';
    }
    if (elementosIndividuais.modal) {
        elementosIndividuais.modal.style.display = 'flex';
    }
    
    // Atualizar lista de softwares
    atualizarSelectSoftwares();
    
    setTimeout(() => {
        if (elementosIndividuais.software) {
            elementosIndividuais.software.focus();
        }
    }, 100);
}

function visualizarLicencaIndividual(index) {
    estadoIndividual.modoEdicao = false;
    estadoIndividual.modoAdicao = false;
    estadoIndividual.licencaSelecionada = index;
    
    const licenca = licencasIndividuais[index];
    
    // Preencher campos principais
    elementosIndividuais.software.value = licenca.software || '';
    elementosIndividuais.chaveAtivacao.value = licenca.chaveAtivacao || '';
    elementosIndividuais.usuario.value = licenca.usuario || '';
    elementosIndividuais.hostname.value = licenca.hostname || '';
    elementosIndividuais.patrimonio.value = licenca.patrimonio || '';
    elementosIndividuais.status.value = licenca.status || 'Ativa';
    
    // Preencher campos adicionais
    elementosIndividuais.numeroPedido.value = licenca.numeroPedido || '';
    elementosIndividuais.chamado.value = licenca.chamado || '';
    elementosIndividuais.dataPedido.value = licenca.dataPedido || '';
    elementosIndividuais.preco.value = licenca.preco || '';
    
    // Mostrar seção adicional
    if (elementosIndividuais.infoAdicionais) {
        elementosIndividuais.infoAdicionais.style.display = 'block';
    }
    
    // Desabilitar campos
    const campos = ['software', 'chaveAtivacao', 'usuario', 'hostname', 'patrimonio', 'status', 'numeroPedido', 'chamado', 'dataPedido', 'preco'];
    campos.forEach(campo => {
        if (elementosIndividuais[campo]) {
            elementosIndividuais[campo].disabled = true;
        }
    });
    
    // Configurar UI
    if (elementosIndividuais.modalTitle) {
        elementosIndividuais.modalTitle.textContent = 'Visualizar Licença Individual';
    }
    if (elementosIndividuais.salvarBtn) {
        elementosIndividuais.salvarBtn.style.display = 'none';
    }
    if (elementosIndividuais.modal) {
        elementosIndividuais.modal.style.display = 'flex';
    }
}

function editarLicencaIndividual(index) {
    estadoIndividual.modoEdicao = true;
    estadoIndividual.modoAdicao = false;
    estadoIndividual.licencaSelecionada = index;
    
    const licenca = licencasIndividuais[index];
    
    // Preencher campos
    elementosIndividuais.software.value = licenca.software || '';
    elementosIndividuais.chaveAtivacao.value = licenca.chaveAtivacao || '';
    elementosIndividuais.usuario.value = licenca.usuario || '';
    elementosIndividuais.hostname.value = licenca.hostname || '';
    elementosIndividuais.patrimonio.value = licenca.patrimonio || '';
    elementosIndividuais.status.value = licenca.status || 'Ativa';
    
    // Preencher campos adicionais
    elementosIndividuais.numeroPedido.value = licenca.numeroPedido || '';
    elementosIndividuais.chamado.value = licenca.chamado || '';
    elementosIndividuais.dataPedido.value = licenca.dataPedido || '';
    elementosIndividuais.preco.value = licenca.preco || '';
    
    // Mostrar seção adicional
    if (elementosIndividuais.infoAdicionais) {
        elementosIndividuais.infoAdicionais.style.display = 'block';
    }
    
    // Habilitar campos editáveis
    const camposEditaveis = ['chaveAtivacao', 'usuario', 'hostname', 'patrimonio', 'status', 'numeroPedido', 'chamado', 'dataPedido', 'preco'];
    camposEditaveis.forEach(campo => {
        if (elementosIndividuais[campo]) {
            elementosIndividuais[campo].disabled = false;
        }
    });
    
    // Software não pode ser editado - MAS MANTÉM O VALOR VISÍVEL
    if (elementosIndividuais.software) {
        elementosIndividuais.software.disabled = true;
        // Garantir que o valor permaneça visível
        elementosIndividuais.software.style.opacity = '1';
        elementosIndividuais.software.style.color = 'var(--text-dark)';
        elementosIndividuais.software.style.backgroundColor = '#f8f9fa';
        elementosIndividuais.software.style.cursor = 'not-allowed';
    }
    
    // Configurar UI
    if (elementosIndividuais.modalTitle) {
        elementosIndividuais.modalTitle.textContent = 'Editar Licença Individual';
    }
    if (elementosIndividuais.salvarBtn) {
        elementosIndividuais.salvarBtn.style.display = 'block';
    }
    if (elementosIndividuais.modal) {
        elementosIndividuais.modal.style.display = 'flex';
    }
    
    // Atualizar lista de softwares (para garantir que o software atual esteja na lista)
    atualizarSelectSoftwares();
    
    // Forçar a seleção do software atual
    if (elementosIndividuais.software) {
        elementosIndividuais.software.value = licenca.software || '';
    }
}

function fecharModalIndividual() {
    if (elementosIndividuais.modal) {
        elementosIndividuais.modal.style.display = 'none';
    }
    if (elementosIndividuais.form) {
        elementosIndividuais.form.reset();
    }
    estadoIndividual.licencaSelecionada = null;
    estadoIndividual.modoEdicao = false;
    estadoIndividual.modoAdicao = false;
}

async function salvarLicencaIndividual() {
    // Coletar dados
    const software = elementosIndividuais.software.value.trim();
    const chaveAtivacao = elementosIndividuais.chaveAtivacao.value.trim();
    const usuario = elementosIndividuais.usuario.value.trim();
    const hostname = elementosIndividuais.hostname.value.trim();
    const patrimonio = elementosIndividuais.patrimonio.value.trim();
    const status = elementosIndividuais.status.value;
    
    // Coletar dados adicionais
    const numeroPedido = elementosIndividuais.numeroPedido.value.trim();
    const chamado = elementosIndividuais.chamado.value.trim();
    const dataPedido = elementosIndividuais.dataPedido.value;
    const preco = parseFloat(elementosIndividuais.preco.value) || 0;
    
    // Validações
    if (!software || !chaveAtivacao || !usuario || !hostname) {
        mostrarNotificacao('Preencha todos os campos obrigatórios!', 'erro');
        return;
    }
    
    if (estadoIndividual.modoAdicao) {
        // Verificar duplicata de chave
        if (licencasIndividuais.find(lic => lic.chaveAtivacao === chaveAtivacao)) {
            mostrarNotificacao('Já existe uma licença com esta chave de ativação!', 'erro');
            return;
        }
        
        // Adicionar nova licença
        const novaLicenca = {
            software,
            chaveAtivacao,
            usuario,
            hostname,
            patrimonio,
            status,
            numeroPedido,
            chamado,
            dataPedido,
            preco,
            dataCadastro: new Date().toISOString()
        };
        
        licencasIndividuais.unshift(novaLicenca);
        mostrarNotificacao('Licença individual adicionada com sucesso!');
    } else if (estadoIndividual.modoEdicao && estadoIndividual.licencaSelecionada !== null) {
        // Editar licença existente
        licencasIndividuais[estadoIndividual.licencaSelecionada] = {
            ...licencasIndividuais[estadoIndividual.licencaSelecionada],
            chaveAtivacao,
            usuario,
            hostname,
            patrimonio,
            status,
            numeroPedido,
            chamado,
            dataPedido,
            preco
        };
        mostrarNotificacao('Licença individual atualizada com sucesso!');
    }
    
    // Salvar dados
    await salvarLicencasIndividuais();
    
    // SINCRONIZAR TABELA GERAL AUTOMATICAMENTE
    sincronizarTabelaGeral();
    await salvarLicencas();
    
    // Atualizar ambas as tabelas
    renderizarTabelaIndividuais();
    renderizarTabela();
    
    fecharModalIndividual();
}

async function excluirLicencaIndividual(index) {
    if (!confirm(`Tem certeza que deseja excluir a licença de ${licencasIndividuais[index].usuario}?`)) return;
    
    licencasIndividuais.splice(index, 1);
    await salvarLicencasIndividuais();
    
    // SINCRONIZAR TABELA GERAL APÓS EXCLUSÃO
    sincronizarTabelaGeral();
    await salvarLicencas();
    
    renderizarTabelaIndividuais();
    renderizarTabela();
    
    mostrarNotificacao('Licença individual excluída com sucesso!');
}

// ======= RENDERIZAÇÃO DAS TABELAS =======
function renderizarTabela(dados = licencas) {
    if (!elementos.tabela) return;
    
    elementos.tabela.innerHTML = "";
    
    if (dados.length === 0) {
        elementos.tabela.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 10px 0; font-weight: 500;">Nenhuma licença cadastrada</h3>
                    <p style="margin: 0; opacity: 0.7;">Adicione licenças individuais para ver os totais aqui</p>
                </td>
            </tr>
        `;
        return;
    }
    
    dados.forEach((licenca, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        // Calcular percentual de uso
        const percentualUso = licenca.licencas > 0 ? (licenca.emUso / licenca.licencas) * 100 : 0;
        const percentualSemUso = licenca.licencas > 0 ? (licenca.semUso / licenca.licencas) * 100 : 0;
        
        tr.innerHTML = `
            <td>
                <div class="software-info">
                    <strong class="software-name">${licenca.software}</strong>
                    ${licenca.versao && licenca.versao !== 'N/A' ? `<span class="software-version">${licenca.versao}</span>` : ''}
                </div>
            </td>
            <td class="total-licencas">${licenca.licencas}</td>
            <td>
                <div class="uso-badge uso-ativo">
                    <span class="uso-number">${licenca.emUso}</span>
                    <span class="uso-percent">${Math.round(percentualUso)}%</span>
                </div>
            </td>
            <td>
                <div class="uso-badge uso-inativo">
                    <span class="uso-number">${licenca.semUso}</span>
                    <span class="uso-percent">${Math.round(percentualSemUso)}%</span>
                </div>
            </td>
        `;
        elementos.tabela.appendChild(tr);
    });
}

function renderizarTabelaIndividuais(dados = licencasIndividuais) {
    if (!elementosIndividuais.tabela) return;
    
    elementosIndividuais.tabela.innerHTML = "";
    
    if (dados.length === 0) {
        elementosIndividuais.tabela.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-key" style="font-size: 3rem; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                    <h3 style="margin: 0 0 10px 0; font-weight: 500;">Nenhuma licença individual encontrada</h3>
                    <p style="margin: 0; opacity: 0.7;">Clique em "Nova Licença Individual" para adicionar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    dados.forEach((licenca, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-index", index);
        
        // Determinar classe do status
        let statusClass = 'status-ativo';
        if (licenca.status === 'Inativa' || licenca.status === 'Expirada') {
            statusClass = 'status-inativo';
        }
        
        tr.innerHTML = `
            <td>${licenca.software || 'N/A'}</td>
            <td>
                <span class="chave-ativacao-completa" title="Clique para copiar">
                    ${licenca.chaveAtivacao || 'N/A'}
                </span>
            </td>
            <td>${licenca.usuario || 'N/A'}</td>
            <td>${licenca.hostname || 'N/A'}</td>
            <td>${licenca.patrimonio || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${licenca.status || 'N/A'}</span></td>
            <td>
                <div class="actions">
                    <button class="action-btn visualizar-btn" title="Visualizar Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn editar-btn" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="action-btn excluir-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn copiar-chave-btn" title="Copiar Chave">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </td>
        `;
        elementosIndividuais.tabela.appendChild(tr);
    });
    
    configurarEventosBotoesIndividuais();
    configurarCopiarChave();
}

// ======= FUNÇÃO PARA COPIAR CHAVE DE ATIVAÇÃO =======
function configurarCopiarChave() {
    document.querySelectorAll('.copiar-chave-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const chaveElement = tr.querySelector('.chave-ativacao-completa');
            const chave = chaveElement.textContent;
            
            if (chave && chave !== 'N/A') {
                navigator.clipboard.writeText(chave).then(() => {
                    // Feedback visual
                    const originalText = chaveElement.textContent;
                    chaveElement.textContent = '✓ Copiada!';
                    chaveElement.style.color = '#28a745';
                    chaveElement.style.fontWeight = 'bold';
                    
                    setTimeout(() => {
                        chaveElement.textContent = originalText;
                        chaveElement.style.color = '';
                        chaveElement.style.fontWeight = '';
                    }, 1500);
                    
                    mostrarNotificacao('Chave copiada para a área de transferência! ✅');
                }).catch(err => {
                    console.error('Erro ao copiar chave:', err);
                    mostrarNotificacao('Erro ao copiar chave!', 'erro');
                });
            }
        });
    });
}

function configurarEventosBotoesIndividuais() {
    // Botões de visualizar
    document.querySelectorAll('#tableBodyIndividuais .visualizar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            visualizarLicencaIndividual(index);
        });
    });
    
    // Botões de editar
    document.querySelectorAll('#tableBodyIndividuais .editar-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            editarLicencaIndividual(index);
        });
    });
    
    // Botões de excluir
    document.querySelectorAll('#tableBodyIndividuais .excluir-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tr = e.target.closest('tr');
            const index = parseInt(tr.getAttribute('data-index'));
            excluirLicencaIndividual(index);
        });
    });
}

// ======= FILTROS E UTILITÁRIOS =======
function filtrarLicencasIndividuais() {
    const termo = elementosIndividuais.searchInput?.value.toLowerCase() || '';
    const software = elementosIndividuais.softwareFilter?.value || 'Todos';
    const statusFiltro = elementosIndividuais.statusFilter?.value || 'Todos';
    
    const dadosFiltrados = licencasIndividuais.filter(licenca => {
        const matchesSearch = licenca.software.toLowerCase().includes(termo) ||
                             licenca.usuario.toLowerCase().includes(termo) ||
                             licenca.hostname.toLowerCase().includes(termo) ||
                             licenca.patrimonio.toLowerCase().includes(termo) ||
                             licenca.chaveAtivacao.toLowerCase().includes(termo);
        
        const matchesSoftware = software === 'Todos' || licenca.software === software;
        
        // Filtro por status (incluindo "semUso")
        let matchesStatus = true;
        if (statusFiltro !== 'Todos') {
            if (statusFiltro === 'semUso') {
                // Filtro especial para "Licença Sem Uso" (Inativa ou Expirada)
                matchesStatus = licenca.status === 'Inativa' || licenca.status === 'Expirada';
            } else {
                matchesStatus = licenca.status === statusFiltro;
            }
        }
        
        return matchesSearch && matchesSoftware && matchesStatus;
    });
    
    renderizarTabelaIndividuais(dadosFiltrados);
}

function atualizarFiltroSoftwares() {
    if (!elementosIndividuais.softwareFilter) return;
    
    // Limpar opções
    elementosIndividuais.softwareFilter.innerHTML = '<option value="Todos">Todos os Softwares</option>';
    
    // Pegar softwares únicos
    const softwares = [...new Set(licencasIndividuais.map(lic => lic.software).filter(Boolean))];
    softwares.sort();
    
    // Adicionar ao filtro
    softwares.forEach(software => {
        const option = document.createElement('option');
        option.value = software;
        option.textContent = software;
        elementosIndividuais.softwareFilter.appendChild(option);
    });
}

function atualizarSelectSoftwares() {
    if (!elementosIndividuais.software) return;
    
    // Limpar opções
    elementosIndividuais.software.innerHTML = '<option value="">Selecione o software</option>';
    
    // Pegar softwares únicos das licenças principais
    const softwares = [...new Set(licencas.map(lic => lic.software).filter(Boolean))];
    softwares.sort();
    
    // Adicionar ao select
    softwares.forEach(software => {
        const option = document.createElement('option');
        option.value = software;
        option.textContent = software;
        elementosIndividuais.software.appendChild(option);
    });
}

// ======= FUNÇÕES UTILITÁRIAS =======
function formatarDataParaBR(dataISO) {
    if (!dataISO) return '';
    const date = new Date(dataISO);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const alerta = document.getElementById("alertaSucesso");
    if (!alerta) return;
    
    const texto = alerta.querySelector('span');
    const icone = alerta.querySelector('i');
    
    texto.textContent = mensagem;
    
    if (tipo === 'erro') {
        alerta.style.background = '#dc3545';
        icone.className = 'fas fa-exclamation-circle';
    } else {
        alerta.style.background = 'var(--primary-blue)';
        icone.className = 'fas fa-check-circle';
    }
    
    alerta.style.display = 'flex';
    
    setTimeout(() => {
        alerta.style.display = 'none';
    }, 3000);
}

// ======= RELATÓRIOS PARA LICENÇAS INDIVIDUAIS =======
function configurarRelatorioIndividuais() {
    const btnRelatorio = document.getElementById('gerarRelatorioIndividuais');
    const modalRelatorio = document.getElementById('modalRelatorioIndividuais');
    const btnVisualizar = document.getElementById('visualizarRelatorioIndividuais');
    const btnImprimir = document.getElementById('imprimirRelatorioIndividuais');
    const btnCancelar = document.getElementById('cancelarRelatorioIndividuais');
    const filtroRelatorio = document.getElementById('filtroRelatorioIndividuais');
    
    if (btnRelatorio) {
        btnRelatorio.addEventListener('click', abrirModalRelatorioIndividuais);
    }
    
    if (filtroRelatorio) {
        filtroRelatorio.addEventListener('change', configurarFiltroRelatorioIndividuais);
    }
    
    if (btnVisualizar) {
        btnVisualizar.addEventListener('click', gerarRelatorioIndividuais);
    }
    
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirRelatorioIndividuais);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModalRelatorioIndividuais);
    }
    
    // Fechar modal ao clicar fora
    if (modalRelatorio) {
        modalRelatorio.addEventListener('click', function(e) {
            if (e.target === modalRelatorio) {
                fecharModalRelatorioIndividuais();
            }
        });
        
        const closeBtn = modalRelatorio.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', fecharModalRelatorioIndividuais);
        }
    }
}

function abrirModalRelatorioIndividuais() {
    const modal = document.getElementById('modalRelatorioIndividuais');
    if (modal) {
        modal.style.display = 'flex';
        configurarFiltroRelatorioIndividuais();
    }
}

function fecharModalRelatorioIndividuais() {
    const modal = document.getElementById('modalRelatorioIndividuais');
    if (modal) modal.style.display = 'none';
}

function configurarFiltroRelatorioIndividuais() {
    const filtro = document.getElementById('filtroRelatorioIndividuais');
    const grupoFiltro = document.getElementById('grupoFiltroEspecificoIndividuais');
    const labelFiltro = document.getElementById('labelFiltroEspecificoIndividuais');
    const filtroEspecifico = document.getElementById('filtroEspecificoIndividuais');
    
    if (!filtro || !grupoFiltro || !labelFiltro || !filtroEspecifico) return;
    
    const tipoFiltro = filtro.value;
    
    // Mostrar/ocultar grupo de filtro específico
    grupoFiltro.style.display = tipoFiltro === 'todos' ? 'none' : 'block';
    
    // Configurar label
    switch(tipoFiltro) {
        case 'software':
            labelFiltro.textContent = 'Software:';
            break;
        case 'status':
            labelFiltro.textContent = 'Status:';
            break;
        case 'usuario':
            labelFiltro.textContent = 'Usuário:';
            break;
        default:
            labelFiltro.textContent = 'Filtro específico:';
    }
    
    // Limpar e preencher opções
    filtroEspecifico.innerHTML = '';
    
    if (tipoFiltro === 'software') {
        const softwares = [...new Set(licencasIndividuais.map(lic => lic.software).filter(Boolean))];
        softwares.sort();
        softwares.forEach(software => {
            const option = document.createElement('option');
            option.value = software;
            option.textContent = software;
            filtroEspecifico.appendChild(option);
        });
    } else if (tipoFiltro === 'status') {
        const status = ['Ativa', 'Inativa', 'Expirada'];
        status.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            filtroEspecifico.appendChild(option);
        });
    } else if (tipoFiltro === 'usuario') {
        const usuarios = [...new Set(licencasIndividuais.map(lic => lic.usuario).filter(Boolean))];
        usuarios.sort();
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario;
            option.textContent = usuario;
            filtroEspecifico.appendChild(option);
        });
    }
}

function gerarRelatorioIndividuais() {
    const filtro = document.getElementById('filtroRelatorioIndividuais')?.value || 'todos';
    const filtroEspecifico = document.getElementById('filtroEspecificoIndividuais')?.value || '';
    const ordenacao = document.getElementById('ordenacaoRelatorioIndividuais')?.value || 'software';
    
    let dadosRelatorio = [...licencasIndividuais];
    
    // Aplicar filtros
    if (filtro !== 'todos' && filtroEspecifico) {
        dadosRelatorio = dadosRelatorio.filter(licenca => licenca[filtro] === filtroEspecifico);
    }
    
    // Aplicar ordenação
    dadosRelatorio.sort((a, b) => {
        if (ordenacao === 'dataCadastro') {
            return new Date(b.dataCadastro) - new Date(a.dataCadastro);
        }
        return a[ordenacao].localeCompare(b[ordenacao]);
    });
    
    // Atualizar UI do relatório
    const agora = new Date();
    const dataRelatorio = document.getElementById('dataRelatorioIndividuais');
    const dataGeracao = document.getElementById('dataGeracaoIndividuais');
    const corpoRelatorio = document.getElementById('corpoRelatorioIndividuais');
    const resumoRelatorio = document.getElementById('resumoRelatorioIndividuais');
    
    if (dataRelatorio) dataRelatorio.textContent = `Data: ${agora.toLocaleDateString('pt-BR')}`;
    if (dataGeracao) dataGeracao.textContent = agora.toLocaleDateString('pt-BR');
    
    if (corpoRelatorio) {
        corpoRelatorio.innerHTML = '';
        
        if (dadosRelatorio.length === 0) {
            corpoRelatorio.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                        Nenhuma licença individual encontrada para o filtro selecionado
                    </td>
                </tr>
            `;
        } else {
            dadosRelatorio.forEach(licenca => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${licenca.software || 'N/A'}</td>
                    <td style="font-family: 'Courier New', monospace; font-size: 11px;">${licenca.chaveAtivacao || 'N/A'}</td>
                    <td>${licenca.usuario || 'N/A'}</td>
                    <td>${licenca.hostname || 'N/A'}</td>
                    <td>${licenca.patrimonio || 'N/A'}</td>
                    <td>${licenca.status || 'N/A'}</td>
                    <td>${licenca.numeroPedido || 'N/A'}</td>
                    <td>${licenca.dataCadastro ? formatarDataParaBR(licenca.dataCadastro) : 'N/A'}</td>
                `;
                corpoRelatorio.appendChild(tr);
            });
        }
    }
    
    // Atualizar resumo
    if (resumoRelatorio) {
        const total = dadosRelatorio.length;
        const ativas = dadosRelatorio.filter(l => l.status === 'Ativa').length;
        const inativas = dadosRelatorio.filter(l => l.status === 'Inativa').length;
        const expiradas = dadosRelatorio.filter(l => l.status === 'Expirada').length;
        
        resumoRelatorio.innerHTML = `
            <div class="resumo-stats">
                <div class="stat-item">
                    <span class="stat-number">${total}</span>
                    <span class="stat-label">Total de Licenças</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" style="color: #28a745;">${ativas}</span>
                    <span class="stat-label">Ativas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" style="color: #ffc107;">${inativas}</span>
                    <span class="stat-label">Inativas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" style="color: #dc3545;">${expiradas}</span>
                    <span class="stat-label">Expiradas</span>
                </div>
            </div>
        `;
    }
    
    // Mostrar relatório
    const areaRelatorio = document.getElementById('areaRelatorioIndividuais');
    const modal = document.getElementById('modalRelatorioIndividuais');
    
    if (areaRelatorio) areaRelatorio.style.display = 'block';
    if (modal) modal.style.display = 'none';
}

function imprimirRelatorioIndividuais() {
    window.print();
}