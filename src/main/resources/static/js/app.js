let idBlocoEmEdicao = null;
let roteiroAtual = null;

// --- INICIALIZAÇÃO ---
async function iniciar() {
    const urlParams = new URLSearchParams(window.location.search);
    const idRoteiro = urlParams.get('id');
    const caminho = window.location.pathname;

    // 1º: Verifica SE é a página de NOVO roteiro primeiro!
    if (caminho.includes('novo-roteiro.html')) {
        console.log("Tela de novo roteiro detectada!");
        configurarFormulario();
    }
    // 2º: Se não for novo, verifica se é a página de DETALHES
    else if (caminho.includes('roteiro.html')) {
        if (idRoteiro) {
            await carregarDetalhes(idRoteiro);
            await configurarFormularioBloco(idRoteiro);
        } else {
            console.warn("Atenção: A página foi aberta sem um ?id= na URL.");
        }
    }
    // 3º: Se não for nenhuma das duas, é a página PRINCIPAL (index)
    else {
        await carregarLista();
    }
}

// --- LÓGICA DA LISTAGEM (index.html) ---
async function carregarLista() {
    const container = document.getElementById('container-cards');
    if (!container) return;

    try {
        const resposta = await fetch('http://localhost:8080/api/roteiros/');
        const dados = await resposta.json();

        container.innerHTML = "";

        dados.forEach(roteiro => {
            const cardHtml = `
                <div class="script-card bg-dark-card p-6 rounded-xl border-l-4 border-pink-500 hover:scale-105 transition-transform cursor-pointer relative group" 
                    data-id="${roteiro.id}"> 
                    <h2 class="text-2xl font-black tracking-tighter uppercase text-slate-100 mb-2">${roteiro.titulo}</h2>
                    <p class="text-pink-400 font-mono text-sm">${roteiro.duracaoEstimada}</p>
                    
                    <button class="btn-delete absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all">
                        🗑️
                    </button>
                </div>
            `;
            container.innerHTML += cardHtml;
        });

        configurarCliques();
    } catch (erro) {
        console.error("Erro ao buscar lista:", erro);
    }
}

// --- LÓGICA DOS DETALHES (roteiro.html) ---
async function carregarDetalhes(id) {
    const campoTitulo = document.getElementById('titulo-roteiro');
    const campoDuracao = document.getElementById('duracao-roteiro');
    const containerBlocos = document.getElementById('container-blocos');

    if (!campoTitulo || !containerBlocos) return;

    try {
        const resposta = await fetch(`http://localhost:8080/api/roteiros/${id}`);

        if (!resposta.ok) throw new Error("Roteiro não encontrado");

        const roteiro = await resposta.json();
        roteiroAtual = roteiro;

        campoTitulo.innerText = roteiro.titulo;

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
                    <td class="py-4 px-2 text-slate-400 text-sm leading-relaxed">${bloco.conteudo}</td>
                    
                    <td class="py-4 px-2 text-right font-mono text-xs text-pink-500 font-bold">
                        ${inicioFormatado} - ${fimFormatado}
                    </td>
                    
                    <td class="py-4 px-2 text-right w-24 align-middle coluna-acoes">
                        <div class="flex justify-end items-center gap-3">
                            <button onclick="abrirModalEdicao(${bloco.id})" 
                                     class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-500 transition-all p-1 flex items-center gap-1" 
                                     title="Editar Bloco">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span class="text-xs font-bold">Editar</span>
                            </button>
                            <button onclick="excluirBloco(${bloco.id})" 
                                    class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all p-1 flex items-center gap-1"
                                    title="Excluir Bloco">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    const res = await fetch(`http://localhost:8080/api/roteiros/${id}/blocos/reordenar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novaOrdemIds)
                    });

                    if (res.ok) {
                        await carregarDetalhes(id); // O recarregamento vai re-calcular todos os tempos magicamente! ✨
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

    } catch (erro) {
        console.error("Erro ao carregar detalhes:", erro);
        campoTitulo.innerText = "Erro ao carregar dados";
    }
}

async function configurarFormularioBloco(idRoteiro) {
    const containerNovaBloco = document.getElementById('form-bloco');
    if (!containerNovaBloco) return;

    containerNovaBloco.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const duracaoString = document.getElementById('input-duracao').value;
        const duracaoEmSegundos = tempoParaSegundos(duracaoString);
        const direcaoVisual = document.getElementById('input-direcao').value;
        const tituloBloco = document.getElementById('input-titulo-bloco').value;
        const conteudo = document.getElementById('input-conteudo').value;

        const novoBloco = {
            direcaoVisual: direcaoVisual,
            tituloBloco: tituloBloco,
            conteudo: conteudo,
            duracaoEmSegundos: duracaoEmSegundos
        };

        if (idRoteiro) {
            let res;

            if (idBlocoEmEdicao) {
                res = await fetch(`http://localhost:8080/api/roteiros/${idRoteiro}/blocos/${idBlocoEmEdicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoBloco)
                });
            } else {
                res = await fetch(`http://localhost:8080/api/roteiros/${idRoteiro}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoBloco)
                });
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

    if(confirm("Tem certeza que deseja excluir este bloco?")) {
        try {
            const res = await fetch(`http://localhost:8080/api/roteiros/${idRoteiro}/blocos/${idBloco}`, { method: 'DELETE' });

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

async function carregarRoteiros() {
    const containerCards = document.getElementById('container-cards');
    if (!containerCards) return;

    try {
        const resposta = await fetch('http://localhost:8080/api/roteiros/');

        if (!resposta.ok) throw new Error("Erro ao buscar roteiros");

        const roteiros = await resposta.json();

        containerCards.innerHTML = '';

        if (roteiros.length === 0) {
            containerCards.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-slate-500 italic mb-4">Nenhum roteiro encontrado.</p>
                    <a href="novo-roteiro.html" class="text-pink-500 hover:text-pink-400 font-bold uppercase tracking-widest text-sm transition-colors">
                        + Criar o primeiro roteiro
                    </a>
                </div>`;
            return;
        }

        roteiros.forEach(roteiro => {
            let totalSegundos = 0;
            let quantidadeBlocos = 0;

            if (roteiro.blocos && roteiro.blocos.length > 0) {
                quantidadeBlocos = roteiro.blocos.length;

                totalSegundos = roteiro.blocos.reduce((soma, bloco) => {
                    return soma + (bloco.duracaoEmSegundos || 0);
                }, 0);
            }

            const tempoFormatado = segundosParaTempo(totalSegundos);

            const card = `
                <a href="roteiro.html?id=${roteiro.id}" class="block bg-[#161b2a] border border-white/5 rounded-2xl p-6 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] transition-all group">
                    <h3 class="text-xl font-bold text-white group-hover:text-pink-500 transition-colors mb-6 line-clamp-2">
                        ${roteiro.titulo}
                    </h3>
                    
                    <div class="flex items-center gap-6 pt-6 border-t border-white/5">
                        <div>
                            <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Duração</p>
                            <p class="text-lg font-mono text-slate-300 font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ${tempoFormatado}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">Cenas</p>
                            <p class="text-lg font-mono text-slate-300 font-bold">${quantidadeBlocos}</p>
                        </div>
                    </div>
                </a>
            `;
            containerCards.innerHTML += card;
        });

    } catch (erro) {
        console.error("Erro ao carregar a galeria:", erro);
        containerCards.innerHTML = '<p class="text-red-500 col-span-full">Erro ao conectar com o servidor. Verifique se o backend está rodando.</p>';
    }
}

// Inicializador automático: Quando o HTML terminar de carregar, ele roda a função sozinho
document.addEventListener('DOMContentLoaded', () => {
    carregarRoteiros();
});

async function criarRoteiro(evento) {
    evento.preventDefault();
    const titulo = document.getElementById('input-titulo').value;

    try {
        const res = await fetch('http://localhost:8080/api/roteiros/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo: titulo })
        });

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
    document.getElementById('input-conteudo').value = bloco.conteudo || '';

    document.getElementById('input-duracao').value = segundosParaTempo(bloco.duracaoEmSegundos);

    document.querySelector('#modal-bloco h3').innerHTML = 'Editar <span class="text-pink-500">Bloco</span>';

    document.getElementById('modal-bloco').classList.remove('hidden');
}



// --- FUNÇÕES AUXILIARES ---

function configurarCliques() {
    // Clique no Card para abrir detalhes
    document.querySelectorAll('.script-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            window.location.href = `roteiro.html?id=${id}`;
        });
    });

    // Clique na lixeira para deletar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Impede de abrir o roteiro ao clicar na lixeira
            const id = btn.closest('.script-card').getAttribute('data-id');
            if (confirm("Deseja excluir este roteiro?")) {
                await deletarRoteiro(id);
            }
        });
    });
}

async function deletarRoteiro(id) {
    try {
        const res = await fetch(`http://localhost:8080/api/roteiros/${id}`, { method: 'DELETE' });
        if (res.ok) carregarLista();
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

    form.addEventListener('submit', async (evento) => {
        // IMPORTANTE: Impede que a página recarregue ao clicar em enviar
        evento.preventDefault();

        // Captura os valores digitados
        const tituloDigitado = document.getElementById('input-titulo').value;
        const duracaoDigitada = document.getElementById('input-duracao').value;

        // Monta o "pacote" JSON exatamente como o Spring Boot espera
        const novoRoteiro = {
            titulo: tituloDigitado,
            subtitulo: "",
            duracaoEstimada: duracaoDigitada,
            roteirista: "",
            locutor: "",
            editorVideo: "",
            diretorArte: "",
            blocos: [] // Começamos com a lista de blocos vazia
        };

        try {
            // Dispara o POST
            const resposta = await fetch('http://localhost:8080/api/roteiros/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoRoteiro)
            });

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
    document.getElementById('modal-bloco').classList.remove('hidden');
}

function fecharModalBloco() {
    document.getElementById('modal-bloco').classList.add('hidden');
    document.getElementById('form-bloco').reset();
    idBlocoEmEdicao = null;
    document.getElementById('form-bloco').reset();
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