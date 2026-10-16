/* =========================================================
   Fernanda T. Sanches — Psicóloga | script.js
   1 cabeçalho e link ativo · 2 menu mobile · 3 animação de entrada
   4 caixa de mensagem · 5 envio para o WhatsApp · 6 convite após a leitura
   ========================================================= */

// Número no formato internacional, só dígitos: 55 (Brasil) + 11 (DDD) + número
const WHATSAPP_NUMERO = '5511912715777';

/* ---------- 1. CABEÇALHO E LINK ATIVO DO MENU ---------- */
const cabecalho = document.querySelector('.cabecalho');
const linksMenu = document.querySelectorAll('.menu a');
const secoes = document.querySelectorAll('main section[id], footer[id]');

function atualizarCabecalho() {
  // depois de 40px de rolagem o cabeçalho ganha fundo
  cabecalho.classList.toggle('rolou', window.scrollY > 40);
}

function atualizarLinkAtivo() {
  const chegouAoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let idAtual = secoes[0].id;

  if (chegouAoFim) {
    idAtual = secoes[secoes.length - 1].id;   // no fim da página, "Contato"
  } else {
    // a última seção cujo topo já passou de 40% da tela é a "atual"
    secoes.forEach((secao) => {
      if (secao.getBoundingClientRect().top <= window.innerHeight * 0.4) idAtual = secao.id;
    });
  }

  linksMenu.forEach((link) => {
    const ativo = link.getAttribute('href') === `#${idAtual}`;
    link.classList.toggle('ativo', ativo);
    if (ativo) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

// requestAnimationFrame: atualiza no máximo 1x por quadro, sem pesar a rolagem
let quadroAgendado = false;
window.addEventListener('scroll', () => {
  if (quadroAgendado) return;
  quadroAgendado = true;
  requestAnimationFrame(() => {
    atualizarCabecalho();
    atualizarLinkAtivo();
    quadroAgendado = false;
  });
}, { passive: true });

atualizarCabecalho();
atualizarLinkAtivo();

/* ---------- 2. MENU MOBILE ---------- */
const menuBotao = document.querySelector('.menu-botao');
const menu = document.querySelector('#menu');

function alternarMenu(abrir = !menu.classList.contains('aberto')) {
  menu.classList.toggle('aberto', abrir);
  cabecalho.classList.toggle('menu-aberto', abrir);
  menuBotao.setAttribute('aria-expanded', String(abrir));
  menuBotao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
}

menuBotao.addEventListener('click', () => alternarMenu());
// ao escolher uma seção, o menu fecha sozinho
linksMenu.forEach((link) => link.addEventListener('click', () => alternarMenu(false)));

/* ---------- 3. ANIMAÇÃO DE ENTRADA (.revelar) ---------- */
const elementosRevelar = document.querySelectorAll('.revelar');

if ('IntersectionObserver' in window) {
  const observadorRevelar = new IntersectionObserver((entradas, observador) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);   // anima uma vez só
    });
  }, { threshold: 0.15 });

  elementosRevelar.forEach((elemento) => observadorRevelar.observe(elemento));
} else {
  // navegador antigo: mostra tudo de uma vez
  elementosRevelar.forEach((elemento) => elemento.classList.add('visivel'));
}

/* ---------- 4. CAIXA DE MENSAGEM (abrir / fechar) ---------- */
const chat = document.querySelector('#chat');
const botaoFlutuante = document.querySelector('.whats-flutuante');
const balao = document.querySelector('.whats-balao');
const botaoFechar = chat.querySelector('.chat__fechar');
const form = document.querySelector('#form-whats');
const campoNome = form.elements.nome;
const campoAssunto = form.elements.assunto;
const campoMensagem = form.elements.mensagem;
const textoErro = form.querySelector('.chat__erro');

let elementoAntesDoChat = null;   // para devolver o foco ao fechar (acessibilidade)

function chatEstaAberto() {
  return chat.classList.contains('aberto');
}

function abrirChat(assunto) {
  elementoAntesDoChat = document.activeElement;
  if (assunto) campoAssunto.value = assunto;   // pré-seleciona o serviço clicado

  chat.classList.add('aberto');
  botaoFlutuante.setAttribute('aria-expanded', 'true');
  esconderBalao();
  alternarMenu(false);
  // espera a caixa ficar visível: elemento escondido não recebe foco
  setTimeout(() => campoNome.focus({ preventScroll: true }), 80);
}

function fecharChat() {
  chat.classList.remove('aberto');
  botaoFlutuante.setAttribute('aria-expanded', 'false');
  if (elementoAntesDoChat) elementoAntesDoChat.focus({ preventScroll: true });
}

// todo elemento com data-whats abre a caixa em vez de sair direto para o WhatsApp
document.querySelectorAll('[data-whats]').forEach((gatilho) => {
  gatilho.addEventListener('click', (evento) => {
    evento.preventDefault();
    abrirChat(gatilho.dataset.assunto);
  });
});

botaoFlutuante.addEventListener('click', () => (chatEstaAberto() ? fecharChat() : abrirChat()));
botaoFechar.addEventListener('click', fecharChat);

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && chatEstaAberto()) fecharChat();
});

/* ---------- 5. ENVIO PARA O WHATSAPP ---------- */
function mostrarErro(mensagem) {
  textoErro.textContent = mensagem;
  campoNome.closest('.campo').classList.add('campo--erro');
  campoNome.setAttribute('aria-invalid', 'true');
  campoNome.focus();
}

function limparErro() {
  textoErro.textContent = '';
  campoNome.closest('.campo').classList.remove('campo--erro');
  campoNome.removeAttribute('aria-invalid');
}

function montarTexto({ nome, assunto, modalidade, mensagem }) {
  // *texto* fica em negrito no WhatsApp
  const linhas = [
    `Olá, Fernanda! Meu nome é ${nome}.`,
    '',
    `*Assunto:* ${assunto}`,
    `*Atendimento:* ${modalidade}`,
  ];
  if (mensagem) linhas.push('', mensagem);
  return linhas.join('\n');
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();   // impede o recarregamento da página

  const nome = campoNome.value.trim();
  if (nome.length < 2) {
    mostrarErro('Por favor, informe seu nome para continuarmos.');
    return;
  }
  limparErro();

  const texto = montarTexto({
    nome,
    assunto: campoAssunto.value,
    modalidade: form.elements.modalidade.value,
    mensagem: campoMensagem.value.trim(),
  });

  // encodeURIComponent converte acentos, espaços e quebras de linha para a URL
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank', 'noopener');

  form.reset();
  fecharChat();
});

campoNome.addEventListener('input', limparErro);

/* ---------- 6. CONVITE APÓS A LEITURA ---------- */
// Quando a pessoa chega à chamada final (CTA), o balão aparece uma única vez.
let temporizadorBalao = null;

function mostrarBalao() {
  if (chatEstaAberto()) return;
  balao.classList.add('visivel');
  botaoFlutuante.classList.add('pulsar');
  temporizadorBalao = setTimeout(esconderBalao, 9000);   // some sozinho depois de 9s
}

function esconderBalao() {
  clearTimeout(temporizadorBalao);
  balao.classList.remove('visivel');
  botaoFlutuante.classList.remove('pulsar');
}

balao.addEventListener('click', () => abrirChat());

const secaoCta = document.querySelector('#cta');
if (secaoCta && 'IntersectionObserver' in window) {
  const observadorFim = new IntersectionObserver((entradas, observador) => {
    if (!entradas.some((entrada) => entrada.isIntersecting)) return;
    observador.disconnect();          // só uma vez por visita
    setTimeout(mostrarBalao, 800);    // pequena pausa para não ser invasivo
  }, { threshold: 0.6 });

  observadorFim.observe(secaoCta);
}
