let idBlocoEmEdicao = null;
let roteiroAtual = null;
let quill;
let cronometroInatividade;

// --- INICIALIZAÇÃO ---
async function iniciar() {
    const token = sessionStorage.getItem('token');
    const caminho = window.location.pathname;

    if (!token && !caminho.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    configurarLogoutAutomatico();

    const urlParams = new URLSearchParams(window.location.search);
    const idRoteiro = urlParams.get('id');

    if (caminho.includes('novo-roteiro.html')) {
        configurarFormulario();
    } else if (caminho.includes('roteiro.html')) {
        if (idRoteiro) {
            await carregarDetalhes(idRoteiro);
            await configurarFormularioBloco(idRoteiro);
            inicializarQuill();
        }
    } else if (caminho.includes('index.html') || caminho === '/') {
        await carregarGaleria();
    }
}

function inicializarQuill() {
    const container = document.getElementById('editor-quill');
    if (container) {
        quill = new Quill('#editor-quill', {
            theme: 'snow',
            placeholder: 'Escreva a locução aqui. Selecione um trecho e clique no ícone de Link para atrelar um asset...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    ['link'],
                    ['clean']
                ]
            }
        });
    }
}

function fazerLogout() {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

function verificarSessaoExpirada(resposta) {
    if (resposta.status === 401 || resposta.status === 403) {
        alert("A sua sessão expirou por segurança. Por favor, entre novamente.");

        throw new Error("Sessão expirada");
    }
}

function resetarCronometro() {
    clearTimeout(cronometroInatividade);
    cronometroInatividade = setTimeout(fazerLogout, 600000);
}

function configurarLogoutAutomatico() {
    if (!window.location.pathname.includes('login.html')) {
        window.onload = resetarCronometro;
        document.onmousemove = resetarCronometro;
        document.onkeypress = resetarCronometro;
        document.onclick = resetarCronometro;
        document.onscroll = resetarCronometro;
        resetarCronometro();
    }
}

async function carregarGaleria() {
    const container = document.getElementById('container-cards');
    if (!container) return;

    const token = sessionStorage.getItem('token');

    try {
        const resposta = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        verificarSessaoExpirada(resposta);

        if (!resposta.ok) throw new Error("Erro ao buscar roteiros");

        const roteiros = await resposta.json();
        container.innerHTML = '';

        if (roteiros.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-slate-500 italic mb-4">Nenhum roteiro encontrado.</p>
                    <a href="novo-roteiro.html" class="text-pink-500 hover:text-pink-400 font-bold uppercase tracking-widest text-sm transition-colors">
                        + Criar o primeiro roteiro
                    </a>
                </div>`;
            return;
        }

        roteiros.forEach(roteiro => {
            const totalSegundos = (roteiro.blocos || []).reduce((soma, b) => soma + (b.duracaoEmSegundos || 0), 0);
            const tempoFormatado = segundosParaTempo(totalSegundos);

            const card = `
                <div onclick="window.location.href='roteiro.html?id=${roteiro.id}'" 
                     class="relative block bg-[#161b2a] border border-white/5 rounded-2xl p-6 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all group cursor-pointer">
                    
                    <button onclick="event.stopPropagation(); deletarRoteiro(${roteiro.id})" 
                            class="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all p-2"
                            title="Excluir Roteiro">
                        🗑️
                    </button>

                    <h3 class="text-xl font-bold text-white group-hover:text-pink-500 transition-colors mb-6 line-clamp-2">
                        ${roteiro.titulo}
                    </h3>
                    
                    <div class="flex items-center gap-6 pt-6 border-t border-white/5">
                        <div>
                            <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Duração</p>
                            <p class="text-lg font-mono text-slate-300 font-bold flex items-center gap-2">
                                <svg xmlns="https://www.w3.org/2000/svg" class="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ${tempoFormatado}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Cenas</p>
                            <p class="text-lg font-mono text-slate-300 font-bold">${(roteiro.blocos || []).length}</p>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (erro) {
        console.error("Erro na galeria:", erro);
        container.innerHTML = '<p class="text-red-500 col-span-full">Erro ao conectar com o servidor.</p>';
    }
}

async function efetuarLogin(evento){
    evento.preventDefault();
    const inputLogin = document.getElementById('input-login').value;
    const inputSenha = document.getElementById('input-senha').value;

    try {
        const resposta = await fetch(`${window.CONFIG.API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({login: inputLogin, senha: inputSenha})
        });

        verificarSessaoExpirada(resposta);

        if (resposta.ok) {
            const dados = await resposta.json();
            sessionStorage.setItem('token', dados.token);
            alert("Login bem-sucedido!");
            window.location.href = 'index.html';
        } else {
            const erroDados = await resposta.json().catch(() => ({}));
            alert(`Login falhou: ${erroDados.error || 'Verifique suas credenciais'}`);
        }
    } catch (erro) {
        console.error("Erro na comunicação com o servidor:", erro);
        alert("Erro de conexão com o servidor: " + erro.message);
    }
}

// --- LÓGICA DOS DETALHES (roteiro.html) ---
async function carregarDetalhes(id) {
    const campoTitulo = document.getElementById('titulo-roteiro');
    const campoDuracao = document.getElementById('duracao-roteiro');
    const containerBlocos = document.getElementById('container-blocos');

    if (!campoTitulo || !containerBlocos) return;

    const token = sessionStorage.getItem('token');

    try {
        const resposta = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        verificarSessaoExpirada(resposta);

        if (!resposta.ok) throw new Error("Roteiro não encontrado");

        const roteiro = await resposta.json();
        roteiroAtual = roteiro;

        campoTitulo.innerText = roteiro.titulo;

        if (!roteiro.blocos || roteiro.blocos.length === 0) {
            containerBlocos.innerHTML = '';
            if (campoDuracao) campoDuracao.innerText = "00:00";
        } else {
            roteiro.blocos.sort((a, b) => a.ordem - b.ordem);

            containerBlocos.innerHTML = "";
            let tempoAcumulado = 0;

            roteiro.blocos.forEach(bloco => {
            const inicioFormatado = segundosParaTempo(tempoAcumulado);
            tempoAcumulado += (bloco.duracaoEmSegundos || 0);
            const fimFormatado = segundosParaTempo(tempoAcumulado);

            const linha = `
                <tr data-id="${bloco.id}" class="border-b border-white/5 hover:bg-white/5 transition-colors text-slate-100 group break-inside-avoid">
                    <td class="py-4 px-2 font-mono text-pink-500 text-xs align-middle drag-handle cursor-move" title="Arraste para reordenar">
                        <span class="text-slate-600 mr-2 text-lg leading-none">⠿</span>${bloco.ordem}
                    </td>
                    <td class="py-4 px-2 text-sm">
                        <span class="font-bold uppercase block">${bloco.tituloBloco || ''}</span>
                        <span class="text-xs text-slate-500">${bloco.direcaoVisual || ''}</span>
                    </td>
                    <td class="py-4 px-2 text-slate-400 text-sm leading-relaxed conteudo-quill">${bloco.conteudo}</td>
                    
                    <td class="py-4 px-2 text-right font-mono text-xs text-pink-500 font-bold">
                        ${inicioFormatado} - ${fimFormatado}
                    </td>
                    
                    <td class="py-4 px-2 text-right w-24 align-middle coluna-acoes">
                        <div class="flex justify-end items-center gap-3">
                            <button onclick="abrirModalEdicao(${bloco.id})" 
                                     class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-500 transition-all p-1 flex items-center gap-1" 
                                     title="Editar Bloco">
                                <svg xmlns="https://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span class="text-xs font-bold">Editar</span>
                            </button>
                            <button onclick="excluirBloco(${bloco.id})" 
                                    class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all p-1 flex items-center gap-1"
                                    title="Excluir Bloco">
                                <svg xmlns="https://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span class="text-xs font-bold">Excluir</span>
                            </button>
                            <button onclick="abrirPainelDecupagem(${bloco.id}, '${bloco.tituloBloco || 'Bloco sem título'}')" 
                                    class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-purple-500 transition-all p-1 flex items-center gap-1"
                                    title="Decupar Bloco">
                                <svg xmlns="https://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span class="text-xs font-bold">Decupar</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            containerBlocos.innerHTML += linha;
        });

        if (campoDuracao) {
            campoDuracao.innerText = segundosParaTempo(tempoAcumulado);
        }

        new Sortable(containerBlocos, {
            animation: 150,
            ghostClass: 'bg-white/10',
            handle: '.drag-handle',

            onEnd: async function (evento) {
                const linhas = containerBlocos.children;
                const novaOrdemIds = Array.from(linhas).map(linha => Number(linha.getAttribute('data-id')));

                try {
                    const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${id}/blocos/reordenar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                        body: JSON.stringify(novaOrdemIds)
                    });

                    verificarSessaoExpirada(res);

                    if (res.ok) {
                        await carregarDetalhes(id);
                    } else {
                        throw new Error("Falha ao salvar a nova ordem");
                    }
                } catch (erro) {
                    console.error("Erro ao reordenar:", erro);
                    alert("Erro ao salvar a nova ordem. A página será recarregada.");
                    await carregarDetalhes(id);
                }
            }
        });
        }

    } catch (erro) {
        console.error("Erro ao carregar detalhes:", erro);
        campoTitulo.innerText = "Erro ao carregar dados";
    }
}

async function configurarFormularioBloco(idRoteiro) {
    const containerNovaBloco = document.getElementById('form-bloco');
    if (!containerNovaBloco) return;

    const token = sessionStorage.getItem('token');

    containerNovaBloco.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const duracaoString = document.getElementById('input-duracao').value;
        const duracaoEmSegundos = tempoParaSegundos(duracaoString);
        const direcaoVisual = document.getElementById('input-direcao').value;
        const tituloBloco = document.getElementById('input-titulo-bloco').value;
        const conteudo = quill.root.innerHTML;

        const novoBloco = {
            direcaoVisual: direcaoVisual,
            tituloBloco: tituloBloco,
            conteudo: conteudo,
            duracaoEmSegundos: duracaoEmSegundos
        };

        if (idRoteiro) {
            let res;

            if (idBlocoEmEdicao) {
                res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${idRoteiro}/blocos/${idBlocoEmEdicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                    body: JSON.stringify(novoBloco)
                });

                verificarSessaoExpirada(res);
            } else {
                res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${idRoteiro}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                    body: JSON.stringify(novoBloco)
                });

                verificarSessaoExpirada(res);
            }
            if (res.ok) {
                alert(idBlocoEmEdicao ? "Bloco atualizado com sucesso!" : "Bloco incluído com sucesso!");
                fecharModalBloco();
                await carregarDetalhes(idRoteiro);
            } else if (res.status === 404) {
                alert("Erro: Não encontrado no sistema.");
            } else if (res.status === 400) {
                alert("Erro: Verifique se todos os campos foram preenchidos corretamente.");
            }
        } else {
            console.warn("Atenção: A página foi aberta sem um ?id= na URL.");
        }

    });
}

// --- FUNÇÃO DE EXCLUIR BLOCO ---

async function excluirBloco(idBloco){
    const confirmacao = confirm("Tem certeza que deseja excluir este bloco? Todos os trechos decupados nele também serão perdidos.");

    if (!confirmacao) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idRoteiro = urlParams.get('id');

    if (!idRoteiro) return;

    const token = sessionStorage.getItem('token');

    if(confirm("Tem certeza que deseja excluir este bloco?")) {
        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${idRoteiro}/blocos/${idBloco}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            verificarSessaoExpirada(res);

            if(res.ok){
                alert("Bloco excluído com sucesso!");
                await carregarDetalhes(idRoteiro);
            } else {
                alert("Erro ao excluir bloco.")
            }
        } catch (erro) {
            console.error("Erro na requisicao: ", erro);
            alert("Não foi possível conectar ao servidor.");
        }
    }
}

async function criarRoteiro(evento) {
    evento.preventDefault();
    const titulo = document.getElementById('input-titulo').value;
    const token = sessionStorage.getItem('token');

    try {
        const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ titulo: titulo })
        });

        verificarSessaoExpirada(res);

        if (res.ok) {
            const roteiroCriado = await res.json();
            window.location.href = `roteiro.html?id=${roteiroCriado.id}`;
        } else {
            alert("Erro ao criar roteiro. Tente novamente.");
        }
    } catch (erro) {
        console.error("Erro na criação:", erro);
        alert("Erro de conexão com o servidor.");
    }
}

// --- FUNÇÃO PARA EDIÇÃO DOS BLOCOS ---
function abrirModalEdicao(idBloco) {
    if (!roteiroAtual) return;

    const bloco = roteiroAtual.blocos.find(b => b.id === idBloco);
    if (!bloco) return;

    idBlocoEmEdicao = idBloco;

    document.getElementById('input-titulo-bloco').value = bloco.tituloBloco || '';
    document.getElementById('input-direcao').value = bloco.direcaoVisual || '';
    quill.root.innerHTML = bloco.conteudo || '';

    document.getElementById('input-duracao').value = segundosParaTempo(bloco.duracaoEmSegundos);

    document.querySelector('#modal-bloco h3').innerHTML = 'Editar <span class="text-pink-500">Bloco</span>';

    document.getElementById('modal-bloco').classList.remove('hidden');
}

async function deletarRoteiro(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.");
    if (!confirmacao) {
        return;
    }
    const token = sessionStorage.getItem('token');
    try {
        const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        verificarSessaoExpirada(res);

        if (res.ok) await carregarGaleria();
    } catch (err) { console.error("Erro ao deletar:", err); }
}

async function gerarPDF() {
    const elemento = document.getElementById('conteudo-roteiro');
    const titulo = document.getElementById('titulo-roteiro').innerText || 'Roteiro';

    if (!elemento) return;

    const colunasAcoes = document.querySelectorAll('.coluna-acoes');
    colunasAcoes.forEach(col => col.style.display = 'none');

    const opcoes = {
        margin:       [15, 15, 15, 15],
        filename:     `Oriente.se_${titulo.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#161b2a' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'css', avoid: 'tr' }
    };

    try {
        const btnPDF = document.querySelector('button[onclick="gerarPDF()"]');
        const textoOriginal = btnPDF.innerHTML;
        btnPDF.innerHTML = '⏳ Gerando...';

        await html2pdf().set(opcoes).from(elemento).save();

        btnPDF.innerHTML = textoOriginal;
    } catch (erro) {
        console.error("Erro ao gerar PDF:", erro);
        alert("Ocorreu um erro ao exportar o documento.");
    } finally {
        colunasAcoes.forEach(col => col.style.display = '');
    }
}

// --- LÓGICA DO FORMULÁRIO (novo-roteiro.html) ---
function configurarFormulario() {
    const form = document.getElementById('form-roteiro');
    if (!form) return;

    const token = sessionStorage.getItem('token');

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const tituloDigitado = document.getElementById('input-titulo').value;
        const duracaoDigitada = document.getElementById('input-duracao').value;

        const novoRoteiro = {
            titulo: tituloDigitado,
            subtitulo: "",
            duracaoEstimada: duracaoDigitada,
            roteirista: "",
            locutor: "",
            editorVideo: "",
            diretorArte: "",
            blocos: []
        };

        try {
            const resposta = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(novoRoteiro)
            });

            verificarSessaoExpirada(resposta);

            if (resposta.ok) {
                alert("Roteiro salvo com sucesso! 🎬");
                window.location.href = 'index.html';
            } else {
                alert("Erro ao salvar. Verifique se os dados estão corretos.");
            }
        } catch (erro) {
            console.error("Erro na comunicação com o servidor:", erro);
        }
    });
}

function abrirModalBloco() {
    document.getElementById('form-bloco').reset();
    idBlocoEmEdicao = null;
    document.querySelector('#modal-bloco h3').innerHTML = 'Novo <span class="text-pink-500">Bloco</span>';
    document.getElementById('modal-bloco').classList.remove('hidden');
}

function fecharModalBloco() {
    document.getElementById('modal-bloco').classList.add('hidden');
    document.getElementById('form-bloco').reset();
    if (quill) quill.root.innerHTML = '';
    idBlocoEmEdicao = null;
}

function tempoParaSegundos(tempoString) {
    if (!tempoString || !tempoString.includes(':')) return 0;
    const partes = tempoString.split(':');
    const minutos = parseInt(partes[0], 10) || 0;
    const segundos = parseInt(partes[1], 10) || 0;
    return (minutos * 60) + segundos;
}

function segundosParaTempo(totalSegundos) {
    if (isNaN(totalSegundos) || totalSegundos === null) return "00:00";
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// --- LÓGICA DO PAINEL DE DECUPAGEM ---

let idBlocoAtivoParaDecupagem = null;

function abrirPainelDecupagem(idBlocoPrincipal, tituloBloco) {
    idBlocoAtivoParaDecupagem = idBlocoPrincipal;
    document.getElementById('titulo-painel-decupagem').textContent = tituloBloco;

    const colunaRoteiro = document.getElementById('coluna-roteiro');
    const painelDecupagem = document.getElementById('painel-decupagem');

    painelDecupagem.classList.remove('hidden');

    setTimeout(() => {
        colunaRoteiro.classList.replace('w-full', 'w-1/2');
        painelDecupagem.classList.remove('w-0', 'opacity-0', 'translate-x-10');
        painelDecupagem.classList.add('w-1/2', 'opacity-100', 'translate-x-0');
    }, 50);

    renderizarMiniBlocosSalvos(idBlocoPrincipal);
}

function fecharPainelDecupagem() {
    const colunaRoteiro = document.getElementById('coluna-roteiro');
    const painelDecupagem = document.getElementById('painel-decupagem');

    // Se estiver expandida, reverte o layout do Roteiro primeiro
    if (decupagemExpandida) {
        colunaRoteiro.classList.remove('w-0', 'p-0', 'opacity-0', 'overflow-hidden', 'border-0');
        colunaRoteiro.classList.add('p-8');
        decupagemExpandida = false;

        const btnExpandir = document.getElementById('btn-expandir-decupagem');
        if (btnExpandir) {
            btnExpandir.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>`;
        }
    }

    // Recolhe a largura e esconde
    painelDecupagem.classList.remove('w-1/2', 'w-full', 'opacity-100', 'translate-x-0');
    painelDecupagem.classList.add('w-0', 'opacity-0', 'translate-x-10');

    // Devolve o Roteiro para largura total
    colunaRoteiro.classList.remove('w-1/2');
    colunaRoteiro.classList.add('w-full');

    setTimeout(() => {
        painelDecupagem.classList.add('hidden');
        idBlocoAtivoParaDecupagem = null;
    }, 500);
}

// --- LÓGICA DOS MINI-BLOCOS (DECUPAGEM) ---

let contadorMiniBlocos = 0;

async function carregarMiniBlocos(idBloco) {
    const listaMiniBlocos = document.getElementById('lista-mini-blocos');
    listaMiniBlocos.innerHTML = '';
    contadorMiniBlocos = 0;

    try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${id}/blocos/${idBloco}/decupagem`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        verificarSessaoExpirada(res);

        if (!res.ok) {
            listaMiniBlocos.innerHTML = '<p class="italic text-slate-400 py-4">Nenhum trecho adicionado ainda. Clique em "+ Adicionar Trecho" para começar.</p>';
            return;
        }

        const bloco = await res.json();

        if (bloco.trechos && bloco.trechos.length > 0) {
            bloco.trechos.forEach(trecho => {
                renderizarMiniBlocosSalvos(trecho);
            });
        } else {
            // Se não há trechos, mostra mensagem inicial
            listaMiniBlocos.innerHTML = '<p class="italic text-slate-400 py-4">Nenhum trecho adicionado ainda. Clique em "+ Adicionar Trecho" para começar.</p>';
        }
    } catch (erro) {
        console.error('Erro ao carregar trechos:', erro);
        listaMiniBlocos.innerHTML = '<p class="italic text-red-400 py-4">Erro ao carregar trechos. Verifique a conexão.</p>';
    }
}

function renderizarMiniBlocosSalvos(idBloco) {
    const lista = document.getElementById('lista-mini-blocos');
    lista.innerHTML = ''; // Limpa o painel anterior

    // GARANTIA: Converter idBloco para número para evitar erro de comparação
    const idProcurado = Number(idBloco);

    // Procura o bloco na memória (roteiroAtual)
    const blocoSelecionado = roteiroAtual.blocos.find(b => Number(b.id) === idProcurado);

    if (!blocoSelecionado) {
        console.error("Bloco não encontrado na memória local.");
        return;
    }

    // Se não houver trechos, mostra a mensagem de vazio
    if (!blocoSelecionado.trechos || blocoSelecionado.trechos.length === 0) {
        lista.innerHTML = '<p class="text-slate-500 text-sm text-center italic mt-10">Clique em "+ Novo Trecho" para começar a decupar este bloco.</p>';
        return;
    }

    // Renderiza cada trecho
    blocoSelecionado.trechos.forEach(trecho => {
        contadorMiniBlocos++;
        const div = document.createElement('div');
        const corBorda = obterCorBordaStatus(trecho.status);
        div.className = `bg-[#1e2436] p-4 rounded-xl border-2 ${corBorda} transition-colors duration-500 relative group mb-4`;
        div.id = `mini-bloco-${contadorMiniBlocos}`;

        // Lógica dos Assets
        let assetsHTML = '';
        if (trecho.assets && trecho.assets.length > 0) {
            trecho.assets.forEach(asset => {
                assetsHTML += `
                    <div class="flex gap-2 asset-item mt-2">
                        <input type="text" placeholder="URL do link..." value="${asset.url || ''}" class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                        <input type="text" placeholder="Observação..." value="${asset.observacao || ''}" class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                        <button onclick="this.parentElement.remove()" class="text-slate-600 hover:text-red-500 px-1">✕</button>
                    </div>`;
            });
        } else {
            assetsHTML = `
                <div class="flex gap-2 asset-item mt-2">
                    <input type="text" placeholder="URL do link..." class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                    <input type="text" placeholder="Observação..." class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                    <button onclick="this.parentElement.remove()" class="text-slate-600 hover:text-red-500 px-1">✕</button>
                </div>`;
        }

        const selectStatus = `
            <select onchange="atualizarCorStatus(this)" class="bg-[#0b0f19] border border-white/10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 outline-none focus:border-pink-500 cursor-pointer">
                <option value="A_INICIAR" ${trecho.status === 'A_INICIAR' ? 'selected' : ''}>⚪ A iniciar</option>
                <option value="REVISADO" ${trecho.status === 'REVISADO' ? 'selected' : ''}>🔵 Revisado</option>
                <option value="ATENCAO" ${trecho.status === 'ATENCAO' ? 'selected' : ''}>🟡 Atenção</option>
                <option value="UTILIZADO" ${trecho.status === 'UTILIZADO' ? 'selected' : ''}>🟢 Utilizado</option>
            </select>`;

        div.innerHTML = `
            <div class="flex justify-between items-start mb-3 gap-4">
                <div class="flex-1">
                    <span class="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1 block">Trecho da Locução</span>
                    <textarea class="w-full bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none resize-y min-h-[80px]">${trecho.texto || ''}</textarea>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <button onclick="removerElemento('${div.id}')" class="text-slate-500 hover:text-red-500 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    ${selectStatus}
                </div>
            </div>
            <div class="mt-2 pt-3 border-t border-white/5">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold tracking-widest uppercase text-slate-400">Assets / Links</span>
                    <button onclick="adicionarLinkAsset(this)" class="text-pink-500 hover:text-pink-400 text-xs font-bold">+ Adicionar Link</button>
                </div>
                <div class="container-links space-y-2">${assetsHTML}</div>
            </div>`;

        lista.appendChild(div);
    });
}

function adicionarMiniBloco() {
    contadorMiniBlocos++;
    const lista = document.getElementById('lista-mini-blocos');

    const mensagemInicial = lista.querySelector('p.italic');
    if (mensagemInicial) {
        mensagemInicial.remove();
    }

    const div = document.createElement('div');
    const corBorda = obterCorBordaStatus('A_INICIAR');
    div.className = `bg-[#1e2436] p-4 rounded-xl border ${corBorda} transition-colors duration-500 relative group mb-4`;
    div.id = `mini-bloco-${contadorMiniBlocos}`;

    div.innerHTML = `
        <div class="flex justify-between items-start mb-3 gap-4">
            <div class="flex-1">
                <span class="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1 block">Trecho da Locução</span>
                <textarea class="w-full bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-pink-500 outline-none resize-y min-h-[80px]" placeholder="Cole o pedaço do roteiro aqui..."></textarea>
            </div>
            
            <div class="flex flex-col items-end gap-2">
                <button onclick="removerElemento('mini-bloco-${contadorMiniBlocos}')" class="text-slate-500 hover:text-red-500 transition-colors p-1" title="Remover Trecho">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                
                <select onchange="atualizarCorStatus(this)" class="bg-[#0b0f19] border border-white/10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 outline-none focus:border-pink-500 cursor-pointer">
                    <option value="A_INICIAR">⚪ A iniciar</option>
                    <option value="REVISADO">🔵 Revisado</option>
                    <option value="ATENCAO">🟡 Atenção</option>
                    <option value="UTILIZADO">🟢 Utilizado</option>
                </select>
            </div>
        </div>

        <div class="mt-2 pt-3 border-t border-white/5">
            <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] font-bold tracking-widest uppercase text-slate-400">Assets / Links</span>
                <button onclick="adicionarLinkAsset(this)" class="text-pink-500 hover:text-pink-400 text-xs font-bold transition-colors">
                    + Adicionar Link
                </button>
            </div>
            <div class="container-links space-y-2">
                <div class="flex gap-2 asset-item">
                    <input type="text" placeholder="URL do link..." class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                    <input type="text" placeholder="Observação (Ex: motoboy de noite)" class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
                    <button onclick="this.parentElement.remove()" class="text-slate-600 hover:text-red-500 px-1" title="Remover Link">✕</button>
                </div>
            </div>
        </div>
    `;

    lista.appendChild(div);
}

function adicionarLinkAsset(botao) {
    const containerLinks = botao.parentElement.nextElementSibling;
    const div = document.createElement('div');
    div.className = 'flex gap-2 asset-item mt-2';
    div.innerHTML = `
        <input type="text" placeholder="URL do link..." class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
        <input type="text" placeholder="Observação..." class="w-1/2 bg-[#0b0f19] border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-pink-500">
        <button onclick="this.parentElement.remove()" class="text-slate-600 hover:text-red-500 px-1" title="Remover Link">✕</button>
    `;
    containerLinks.appendChild(div);
}

function removerElemento(id) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.remove();
    }
}

async function salvarDecupagem() {
    if (!idBlocoAtivoParaDecupagem) return;

    const btnSalvar = event.currentTarget;
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '⏳ Salvando...';
    btnSalvar.disabled = true;

    const miniBlocosDOM = document.querySelectorAll('[id^="mini-bloco-"]');
    const trechosPayload = [];

    miniBlocosDOM.forEach(blocoDOM => {
        const texto = blocoDOM.querySelector('textarea').value;
        const status = blocoDOM.querySelector('select').value;

        const assetsDOM = blocoDOM.querySelectorAll('.asset-item');
        const assetsPayload = [];

        assetsDOM.forEach(assetDOM => {
            const inputs = assetDOM.querySelectorAll('input');
            const url = inputs[0].value.trim();
            const obs = inputs[1].value.trim();

            if (url !== "" || obs !== "") {
                assetsPayload.push({ url: url, observacao: obs });
            }
        });

        trechosPayload.push({
            texto: texto,
            status: status,
            assets: assetsPayload
        });
    });

    const idRoteiro = new URLSearchParams(window.location.search).get('id');
    const token = sessionStorage.getItem('token');

    try {
        const resposta = await fetch(`${window.CONFIG.API_BASE_URL}/api/roteiros/${idRoteiro}/blocos/${idBlocoAtivoParaDecupagem}/decupagem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(trechosPayload)
        });

        verificarSessaoExpirada(resposta);

        if (resposta.ok) {
            await carregarDetalhes(idRoteiro);

            btnSalvar.innerHTML = '✅ Salvo!';
            setTimeout(() => { btnSalvar.innerHTML = textoOriginal; btnSalvar.disabled = false; }, 2000);
        } else {
            throw new Error("Falha ao salvar");
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar decupagem. Verifique a conexão.");
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
    }
}

function obterCorBordaStatus(status) {
    switch(status) {
        case 'REVISADO': return 'border-blue-500';
        case 'ATENCAO': return 'border-yellow-500';
        case 'UTILIZADO': return 'border-green-500';
        case 'A_INICIAR':
        default: return 'border-white/5';
    }
}

function atualizarCorStatus(selectElement) {
    const miniBloco = selectElement.closest('div[id^="mini-bloco-"]');
    if (miniBloco) {
        miniBloco.classList.remove('border-white/5', 'border-blue-500', 'border-yellow-500', 'border-green-500');
        miniBloco.classList.add(obterCorBordaStatus(selectElement.value));
    }
}

let decupagemExpandida = false;

function alternarTelaCheiaDecupagem() {
    const colunaRoteiro = document.getElementById('coluna-roteiro');
    const painelDecupagem = document.getElementById('painel-decupagem');
    const btnExpandir = document.getElementById('btn-expandir-decupagem');

    if (!decupagemExpandida) {
        // 1. Esconde a Coluna do Roteiro
        colunaRoteiro.classList.replace('w-1/2', 'w-0');
        colunaRoteiro.classList.replace('p-8', 'p-0');
        colunaRoteiro.classList.add('opacity-0', 'overflow-hidden', 'border-0');

        // 2. Expande a Decupagem para Tela Cheia
        painelDecupagem.classList.replace('w-1/2', 'w-full');

        // 3. Muda o ícone para "Restaurar"
        btnExpandir.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 14h4v4m0-4l-6 6m17-6h-4v4m0-4l6 6M3 10h4V6m0 4l-6-6m17 6h-4V6m0 4l6-6"></path></svg>`;
        btnExpandir.title = "Restaurar Tela";

        decupagemExpandida = true;
    } else {
        // 1. Traz a Coluna do Roteiro de volta
        colunaRoteiro.classList.replace('w-0', 'w-1/2');
        colunaRoteiro.classList.replace('p-0', 'p-8');
        colunaRoteiro.classList.remove('opacity-0', 'overflow-hidden', 'border-0');

        // 2. Devolve a Decupagem para metade da tela
        painelDecupagem.classList.replace('w-full', 'w-1/2');

        // 3. Muda o ícone de volta para "Expandir"
        btnExpandir.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>`;
        btnExpandir.title = "Expandir Tela";

        decupagemExpandida = false;
    }
}

iniciar();