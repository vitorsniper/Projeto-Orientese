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
        const resposta = await fetch('https://api-orientese-xyz.onrender.com/api/roteiros/', {
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
        const resposta = await fetch('https://api-orientese-xyz.onrender.com/api/login', {
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
            alert("Login falhou. Verifique suas credenciais.");
        }
    } catch (erro) {
        console.error("Erro na comunicação com o servidor:", erro);
        alert("Erro de conexão com o servidor.");
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
        const resposta = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${id}`, {
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
                <tr data-id="${bloco.id}" class="border-b border-white/5 hover:bg-white/5 transition-colors text-slate-100 group cursor-move break-inside-avoid">
                    <td class="py-4 px-2 font-mono text-pink-500 text-xs align-middle">${bloco.ordem}</td>
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

            onEnd: async function (evento) {
                const linhas = containerBlocos.children;
                const novaOrdemIds = Array.from(linhas).map(linha => Number(linha.getAttribute('data-id')));

                try {
                    const res = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${id}/blocos/reordenar`, {
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
                res = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${idRoteiro}/blocos/${idBlocoEmEdicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                    body: JSON.stringify(novoBloco)
                });

                verificarSessaoExpirada(res);
            } else {
                res = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${idRoteiro}`, {
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
    const urlParams = new URLSearchParams(window.location.search);
    const idRoteiro = urlParams.get('id');

    if (!idRoteiro) return;

    const token = sessionStorage.getItem('token');

    if(confirm("Tem certeza que deseja excluir este bloco?")) {
        try {
            const res = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${idRoteiro}/blocos/${idBloco}`, {
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
        const res = await fetch('https://api-orientese-xyz.onrender.com/api/roteiros/', {
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
    const token = sessionStorage.getItem('token');
    try {
        const res = await fetch(`https://api-orientese-xyz.onrender.com/api/roteiros/${id}`, {
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
        filename:     `Oriente-se_${titulo.replace(/\s+/g, '_')}.pdf`,
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
            const resposta = await fetch('https://api-orientese-xyz.onrender.com/api/roteiros/', {
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

iniciar();