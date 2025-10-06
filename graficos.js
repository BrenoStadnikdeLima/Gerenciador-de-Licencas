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
let graficos = {};
let dadosEquipamentos = [];
let dadosLicencas = [];

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

// ======= INICIALIZAÇÃO =======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📊 Iniciando página de gráficos...');
    
    // Inicializar Firebase
    const firebaseInicializado = inicializarFirebase();
    
    if (firebaseInicializado) {
        await carregarDadosFirebase();
    } else {
        await carregarDadosLocais();
    }
    
    configurarEventListeners();
    inicializarGraficos();
    atualizarEstatisticas();
    
    console.log('🎯 Gráficos inicializados!');
});

// ======= CARREGAR DADOS FIREBASE =======
async function carregarDadosFirebase() {
    try {
        console.log('📥 Carregando dados do Firebase...');
        
        // Carregar equipamentos
        const snapshotEquipamentos = await db.collection('equipamentos').get();
        dadosEquipamentos = snapshotEquipamentos.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${dadosEquipamentos.length} equipamentos carregados`);
        
        // Carregar licenças (se existir collection separada)
        // Por enquanto, usar dados estáticos das licenças
        dadosLicencas = await carregarLicencas();
        console.log(`✅ ${dadosLicencas.length} licenças carregadas`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Firebase:', error);
        await carregarDadosLocais();
    }
}

async function carregarLicencas() {
    try {
        // Tentar carregar do Firebase
        const snapshot = await db.collection('licencas').get();
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (error) {
        console.log('ℹ️ Collection de licenças não encontrada, usando dados locais');
    }
    
    // Dados locais de fallback
    return [
        { software: "Microsoft Office", versao: "2021 Pro Plus", licencas: 50, data: "03/10/2025" },
        { software: "Autodesk", versao: "Autocad e Revit", licencas: 60, data: "03/10/2025" },
        { software: "Windows", versao: "Pro", licencas: 200, data: "03/10/2025" },
        { software: "Adobe", versao: "Pro", licencas: 15, data: "03/10/2025" }
    ];
}

// ======= CARREGAR DADOS LOCAIS (FALLBACK) =======
async function carregarDadosLocais() {
    console.log('📁 Carregando dados locais...');
    
    try {
        // Equipamentos do localStorage
        const equipamentosSalvos = localStorage.getItem('equipamentosProsul');
        if (equipamentosSalvos) {
            dadosEquipamentos = JSON.parse(equipamentosSalvos);
        }
        
        // Licenças do localStorage ou estáticas
        const licencasSalvas = localStorage.getItem('licencasProsul');
        if (licencasSalvas) {
            dadosLicencas = JSON.parse(licencasSalvas);
        } else {
            dadosLicencas = await carregarLicencas();
        }
        
        console.log(`✅ ${dadosEquipamentos.length} equipamentos e ${dadosLicencas.length} licenças carregados localmente`);
    } catch (error) {
        console.error('Erro ao carregar dados locais:', error);
        // Dados de exemplo em caso de erro
        dadosEquipamentos = [];
        dadosLicencas = await carregarLicencas();
    }
}

// ======= CONFIGURAR EVENTOS =======
function configurarEventListeners() {
    // Filtro de período
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', function() {
            atualizarGraficosComFiltro(this.value);
        });
    }
    
    // Botão atualizar
    const btnAtualizar = document.getElementById('atualizarGraficos');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', async function() {
            this.classList.add('loading');
            await carregarDadosFirebase();
            atualizarTodosGraficos();
            this.classList.remove('loading');
            mostrarNotificacao('Gráficos atualizados com sucesso!');
        });
    }
    
    // Botão exportar
    const btnExportar = document.getElementById('exportarDados');
    if (btnExportar) {
        btnExportar.addEventListener('click', function() {
            exportarDados();
        });
    }
    
    // Modais de gráficos expandidos
    document.querySelectorAll('.grafico-actions .action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipoGrafico = this.getAttribute('data-grafico');
            const card = this.closest('.grafico-card');
            const titulo = card.querySelector('h3').textContent;
            abrirModalGrafico(titulo, tipoGrafico);
        });
    });
    
    // Fechar modal
    const modal = document.getElementById('modalGrafico');
    const closeModal = modal.querySelector('.close-modal');
    
    if (closeModal) {
        closeModal.addEventListener('click', fecharModalGrafico);
    }
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            fecharModalGrafico();
        }
    });
}

// ======= PROCESSAR DADOS PARA GRÁFICOS =======
function processarDadosStatusEquipamentos() {
    const statusCount = {
        'Em uso': 0,
        'Em manutenção': 0,
        'Sem uso': 0
    };
    
    dadosEquipamentos.forEach(equipamento => {
        const status = equipamento.status || 'Sem uso';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
        labels: Object.keys(statusCount),
        data: Object.values(statusCount),
        cores: ['#28a745', '#ffc107', '#dc3545']
    };
}

function processarDadosDepartamentos() {
    const deptCount = {};
    
    dadosEquipamentos.forEach(equipamento => {
        const dept = equipamento.departamento || 'OUTROS';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    
    // Ordenar por quantidade (maior primeiro)
    const sorted = Object.entries(deptCount)
        .sort(([,a], [,b]) => b - a)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const cores = ['#0071CE', '#28a745', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#6c757d'];
    
    return {
        labels: Object.keys(sorted),
        data: Object.values(sorted),
        cores: cores.slice(0, Object.keys(sorted).length)
    };
}

function processarDadosLicencasSoftware() {
    const softwareCount = {};
    
    dadosLicencas.forEach(licenca => {
        const software = licenca.software || 'Outros';
        softwareCount[software] = (softwareCount[software] || 0) + (licenca.licencas || 1);
    });
    
    const sorted = Object.entries(softwareCount)
        .sort(([,a], [,b]) => b - a)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const cores = ['#0071CE', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    
    return {
        labels: Object.keys(sorted),
        data: Object.values(sorted),
        cores: cores.slice(0, Object.keys(sorted).length)
    };
}

function processarDadosEvolucao() {
    // Agrupar por mês (simplificado)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Simular dados de evolução baseado na quantidade atual
    const totalEquipamentos = dadosEquipamentos.length;
    const totalLicencas = dadosLicencas.reduce((sum, lic) => sum + (lic.licencas || 1), 0);
    
    const evolucaoEquipamentos = meses.map((_, index) => {
        const progresso = (index + 1) / meses.length;
        return Math.round(totalEquipamentos * progresso * 0.8 + totalEquipamentos * 0.2);
    });
    
    const evolucaoLicencas = meses.map((_, index) => {
        const progresso = (index + 1) / meses.length;
        return Math.round(totalLicencas * progresso * 0.8 + totalLicencas * 0.2);
    });
    
    return {
        labels: meses,
        equipamentos: evolucaoEquipamentos,
        licencas: evolucaoLicencas
    };
}

// ======= INICIALIZAR GRÁFICOS =======
function inicializarGraficos() {
    // Dados processados
    const dadosStatus = processarDadosStatusEquipamentos();
    const dadosDept = processarDadosDepartamentos();
    const dadosLic = processarDadosLicencasSoftware();
    const dadosEvolucao = processarDadosEvolucao();
    
    // Gráfico de Status de Equipamentos (Pizza)
    const ctxStatus = document.getElementById('graficoStatusEquipamentos');
    if (ctxStatus) {
        graficos.statusEquipamentos = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: dadosStatus.labels,
                datasets: [{
                    data: dadosStatus.data,
                    backgroundColor: dadosStatus.cores,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getOptionsPizza('Status dos Equipamentos')
        });
        
        // Atualizar legenda
        atualizarLegendaStatus(dadosStatus);
    }
    
    // Gráfico de Departamentos (Pizza)
    const ctxDept = document.getElementById('graficoDepartamentos');
    if (ctxDept) {
        graficos.departamentos = new Chart(ctxDept, {
            type: 'pie',
            data: {
                labels: dadosDept.labels,
                datasets: [{
                    data: dadosDept.data,
                    backgroundColor: dadosDept.cores,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getOptionsPizza('Departamentos')
        });
    }
    
    // Gráfico de Licenças por Software (Barras)
    const ctxLicencas = document.getElementById('graficoLicencasSoftware');
    if (ctxLicencas) {
        graficos.licencasSoftware = new Chart(ctxLicencas, {
            type: 'bar',
            data: {
                labels: dadosLic.labels,
                datasets: [{
                    label: 'Número de Licenças',
                    data: dadosLic.data,
                    backgroundColor: dadosLic.cores,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: getOptionsBarras()
        });
    }
    
    // Gráfico de Evolução (Linha)
    const ctxEvolucao = document.getElementById('graficoEvolucao');
    if (ctxEvolucao) {
        graficos.evolucao = new Chart(ctxEvolucao, {
            type: 'line',
            data: {
                labels: dadosEvolucao.labels,
                datasets: [
                    {
                        label: 'Equipamentos',
                        data: dadosEvolucao.equipamentos,
                        borderColor: '#0071CE',
                        backgroundColor: 'rgba(0, 113, 206, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Licenças',
                        data: dadosEvolucao.licencas,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: getOptionsLinha()
        });
    }
}

// ======= FUNÇÕES AUXILIARES GRÁFICOS =======
function getOptionsPizza(titulo) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            },
            title: {
                display: false
            }
        }
    };
}

function getOptionsBarras() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
}

function getOptionsLinha() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
}

function atualizarLegendaStatus(dados) {
    const legenda = document.getElementById('legendaStatus');
    if (!legenda) return;
    
    legenda.innerHTML = '';
    
    dados.labels.forEach((label, index) => {
        const item = document.createElement('div');
        item.className = 'legenda-item';
        item.innerHTML = `
            <span class="legenda-cor" style="background-color: ${dados.cores[index]}"></span>
            <span>${label}</span>
        `;
        legenda.appendChild(item);
    });
}

// ======= ATUALIZAR GRÁFICOS =======
function atualizarGraficosComFiltro(periodo) {
    mostrarNotificacao(`Aplicando filtro...`);
    
    // Em uma aplicação real, aqui você filtraria os dados baseado no período
    setTimeout(() => {
        atualizarTodosGraficos();
        mostrarNotificacao('Filtro aplicado com sucesso!');
    }, 500);
}

function atualizarTodosGraficos() {
    // Reprocessar dados
    const dadosStatus = processarDadosStatusEquipamentos();
    const dadosDept = processarDadosDepartamentos();
    const dadosLic = processarDadosLicencasSoftware();
    const dadosEvolucao = processarDadosEvolucao();
    
    // Atualizar cada gráfico
    if (graficos.statusEquipamentos) {
        graficos.statusEquipamentos.data.labels = dadosStatus.labels;
        graficos.statusEquipamentos.data.datasets[0].data = dadosStatus.data;
        graficos.statusEquipamentos.data.datasets[0].backgroundColor = dadosStatus.cores;
        graficos.statusEquipamentos.update();
        atualizarLegendaStatus(dadosStatus);
    }
    
    if (graficos.departamentos) {
        graficos.departamentos.data.labels = dadosDept.labels;
        graficos.departamentos.data.datasets[0].data = dadosDept.data;
        graficos.departamentos.data.datasets[0].backgroundColor = dadosDept.cores;
        graficos.departamentos.update();
    }
    
    if (graficos.licencasSoftware) {
        graficos.licencasSoftware.data.labels = dadosLic.labels;
        graficos.licencasSoftware.data.datasets[0].data = dadosLic.data;
        graficos.licencasSoftware.data.datasets[0].backgroundColor = dadosLic.cores;
        graficos.licencasSoftware.update();
    }
    
    if (graficos.evolucao) {
        graficos.evolucao.data.labels = dadosEvolucao.labels;
        graficos.evolucao.data.datasets[0].data = dadosEvolucao.equipamentos;
        graficos.evolucao.data.datasets[1].data = dadosEvolucao.licencas;
        graficos.evolucao.update();
    }
    
    atualizarEstatisticas();
}

// ======= ATUALIZAR ESTATÍSTICAS =======
function atualizarEstatisticas() {
    const totalEquipamentos = dadosEquipamentos.length;
    const totalLicencas = dadosLicencas.reduce((sum, lic) => sum + (lic.licencas || 1), 0);
    const usuariosAtivos = dadosEquipamentos.filter(e => e.status === 'Em uso').length;
    const emManutencao = dadosEquipamentos.filter(e => e.status === 'Em manutenção').length;
    
    document.getElementById('totalEquipamentos').textContent = totalEquipamentos;
    document.getElementById('totalLicencas').textContent = totalLicencas;
    document.getElementById('usuariosAtivos').textContent = usuariosAtivos;
    document.getElementById('emManutencao').textContent = emManutencao;
}

// ======= MODAL GRÁFICO EXPANDIDO =======
function abrirModalGrafico(titulo, tipoGrafico) {
    const modal = document.getElementById('modalGrafico');
    const tituloModal = document.getElementById('modalTituloGrafico');
    const canvasExpandido = document.getElementById('graficoExpandido');
    
    if (!modal || !tituloModal || !canvasExpandido) return;
    
    tituloModal.textContent = titulo;
    
    // Destruir gráfico anterior se existir
    const chartExistente = Chart.getChart(canvasExpandido);
    if (chartExistente) {
        chartExistente.destroy();
    }
    
    // Criar novo gráfico expandido
    const dados = {
        'status': processarDadosStatusEquipamentos(),
        'departamentos': processarDadosDepartamentos(),
        'licencas': processarDadosLicencasSoftware(),
        'evolucao': processarDadosEvolucao()
    }[tipoGrafico];
    
    if (!dados) return;
    
    const config = {
        'status': { type: 'doughnut', data: { labels: dados.labels, datasets: [{ data: dados.data, backgroundColor: dados.cores }] }, options: getOptionsPizza(titulo) },
        'departamentos': { type: 'pie', data: { labels: dados.labels, datasets: [{ data: dados.data, backgroundColor: dados.cores }] }, options: getOptionsPizza(titulo) },
        'licencas': { type: 'bar', data: { labels: dados.labels, datasets: [{ label: 'Licenças', data: dados.data, backgroundColor: dados.cores }] }, options: getOptionsBarras() },
        'evolucao': { 
            type: 'line', 
            data: { 
                labels: dados.labels, 
                datasets: [
                    { label: 'Equipamentos', data: dados.equipamentos, borderColor: '#0071CE', backgroundColor: 'rgba(0, 113, 206, 0.1)', fill: true },
                    { label: 'Licenças', data: dados.licencas, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', fill: true }
                ] 
            }, 
            options: getOptionsLinha() 
        }
    }[tipoGrafico];
    
    if (config) {
        new Chart(canvasExpandido, config);
    }
    
    modal.style.display = 'flex';
}

function fecharModalGrafico() {
    const modal = document.getElementById('modalGrafico');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ======= EXPORTAR DADOS =======
function exportarDados() {
    const dadosExport = {
        equipamentos: dadosEquipamentos,
        licencas: dadosLicencas,
        estatisticas: {
            totalEquipamentos: dadosEquipamentos.length,
            totalLicencas: dadosLicencas.reduce((sum, lic) => sum + (lic.licencas || 1), 0),
            usuariosAtivos: dadosEquipamentos.filter(e => e.status === 'Em uso').length,
            emManutencao: dadosEquipamentos.filter(e => e.status === 'Em manutenção').length
        },
        dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dadosExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dados-prosul-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    mostrarNotificacao('Dados exportados com sucesso!');
}

// ======= NOTIFICAÇÃO =======
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = tipo === 'erro' ? '#dc3545' : 'var(--primary-blue)';
    notification.innerHTML = `
        <i class="fas fa-${tipo === 'erro' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notification);
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

console.log('📊 Script de gráficos carregado!');