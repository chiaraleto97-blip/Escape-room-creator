'use strict';
/*
  IL GIOCO
  Menu a cascata, timer, enigmi concatenati, indizi, lucchetto finale,
  punteggio e classifica (salvata solo su questo dispositivo).
*/

/* ===== IMPOSTAZIONI: questi numeri si possono cambiare ===== */
const IMPOSTAZIONI = {
  punti_per_enigma: 100,          // punti per ogni enigma risolto
  costo_indizio_punti: 50,        // punti tolti per un indizio (se gli indizi costano punti)
  costo_indizio_secondi: 120,     // secondi tolti per un indizio (se gli indizi costano tempo)
  penalita_risposta_sbagliata: 5, // punti tolti per ogni risposta sbagliata
  penalita_codice_sbagliato: 20,  // punti tolti per ogni codice sbagliato al lucchetto
  secondi_per_punto_bonus: 5,     // 1 punto bonus ogni 5 secondi rimasti
  minuti_predefiniti: 30          // tempo se il percorso non ha "tempo:"
};

const GRADI = { primo: 'Secondaria di primo grado', secondo: 'Secondaria di secondo grado' };
const MESSAGGI_ERRORE = [
  'Non è la risposta giusta. Riprovate!',
  'Niente da fare, la serratura non si muove…',
  'Quasi? Rileggete bene l\'enigma.',
  'Risposta sbagliata. Ragionate insieme!'
];

const $ = sel => document.querySelector(sel);
let percorsi = [];
let stato = null;

/* ---------- utilità ---------- */

function mostra(nome) {
  document.querySelectorAll('.schermata').forEach(s => { s.hidden = s.id !== 'schermata-' + nome; });
  window.scrollTo(0, 0);
}

function testoConACapo(contenitore, testo) {
  contenitore.replaceChildren();
  testo.split('//').forEach((pezzo, i) => {
    if (i) contenitore.append(document.createElement('br'));
    contenitore.append(pezzo.trim());
  });
}

function paragrafi(contenitore, righe) {
  contenitore.replaceChildren(...righe.map(r => {
    const p = document.createElement('p');
    p.textContent = r;
    return p;
  }));
}

function formattaTempo(secondi) {
  const s = Math.abs(Math.round(secondi));
  const testo = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  return secondi < 0 ? '+' + testo : testo;
}

function descriviMinuti(secondi) {
  if (secondi % 60 === 0) return secondi / 60 === 1 ? '1 minuto' : secondi / 60 + ' minuti';
  return secondi + ' secondi';
}

function costoIndizio() {
  return stato.costo === 'tempo'
    ? descriviMinuti(IMPOSTAZIONI.costo_indizio_secondi)
    : IMPOSTAZIONI.costo_indizio_punti + ' punti';
}

let timerToast = null;
function toast(messaggio) {
  const t = $('#toast');
  t.textContent = messaggio;
  t.hidden = false;
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { t.hidden = true; }, 3500);
}

function scuoti(elemento) {
  elemento.classList.remove('scossa');
  void elemento.offsetWidth;
  elemento.classList.add('scossa');
}

function memoria(azione, chiave, valore) {
  try {
    if (azione === 'leggi') return JSON.parse(localStorage.getItem(chiave));
    if (azione === 'scrivi') localStorage.setItem(chiave, JSON.stringify(valore));
    if (azione === 'cancella') localStorage.removeItem(chiave);
  } catch (e) { /* memoria non disponibile: si gioca lo stesso */ }
  return null;
}

/* ---------- menu a cascata ---------- */

const selGrado = $('#sel-grado');
const selDisciplina = $('#sel-disciplina');
const selArgomento = $('#sel-argomento');
const chiave = s => Lettore.normalizza(s);

function riempi(select, voci, segnaposto) {
  select.replaceChildren(new Option(segnaposto, ''));
  voci.forEach(([valore, testo]) => select.add(new Option(testo, valore)));
  select.disabled = voci.length === 0;
  if (voci.length === 1) select.value = voci[0][0];
}

function aggiornaGradi() {
  const presenti = Object.keys(GRADI).filter(g => percorsi.some(p => p.grado === g));
  riempi(selGrado, presenti.map(g => [g, GRADI[g]]), 'Scegliete il grado…');
  aggiornaDiscipline();
}

function aggiornaDiscipline() {
  const nomi = new Map();
  percorsi.filter(p => p.grado === selGrado.value).forEach(p => {
    if (!nomi.has(chiave(p.disciplina))) nomi.set(chiave(p.disciplina), p.disciplina);
  });
  const voci = [...nomi].sort((a, b) => a[1].localeCompare(b[1], 'it'));
  riempi(selDisciplina, voci, selGrado.value ? 'Scegliete la disciplina…' : 'Prima il grado');
  aggiornaArgomenti();
}

function aggiornaArgomenti() {
  const lista = percorsi.filter(p => p.grado === selGrado.value && chiave(p.disciplina) === selDisciplina.value);
  const doppi = a => lista.filter(p => chiave(p.argomento) === chiave(a)).length > 1;
  const voci = lista
    .map(p => [p.id, doppi(p.argomento) ? `${p.argomento} – ${p.titolo}` : p.argomento])
    .sort((a, b) => a[1].localeCompare(b[1], 'it'));
  riempi(selArgomento, voci, selDisciplina.value ? 'Scegliete l\'argomento…' : 'Prima la disciplina');
  aggiornaAnteprima();
}

function percorsoScelto() {
  return percorsi.find(p => p.id === selArgomento.value) || null;
}

function minutiDi(p) {
  return p.minuti || IMPOSTAZIONI.minuti_predefiniti;
}

function quantiEnigmi(p) {
  return p.enigmi.length === 1 ? '1 enigma' : p.enigmi.length + ' enigmi';
}

function aggiornaAnteprima() {
  const p = percorsoScelto();
  $('#anteprima').hidden = !p;
  $('#btn-entra').disabled = !p;
  if (!p) return;
  $('#anteprima-titolo').textContent = p.titolo;
  $('#anteprima-dettagli').textContent = `${quantiEnigmi(p)} · ${minutiDi(p)} minuti`;
  $('#anteprima-link').href = '?percorso=' + encodeURIComponent(p.id);
}

selGrado.addEventListener('change', aggiornaDiscipline);
selDisciplina.addEventListener('change', aggiornaArgomenti);
selArgomento.addEventListener('change', aggiornaAnteprima);

function aggiornaEtichettaNome() {
  const squadra = document.querySelector('input[name="modalita"]:checked').value === 'squadra';
  const etichetta = $('#etichetta-nome');
  etichetta.firstChild.textContent = squadra ? 'Nome della squadra ' : 'Nome del giocatore ';
  etichetta.querySelector('small').textContent = squadra ? '(obbligatorio)' : '(facoltativo)';
  $('#nome').required = squadra;
  $('#nome').placeholder = squadra ? 'Es. I Cavalieri del Codice' : 'Un nome di fantasia';
}
document.querySelectorAll('input[name="modalita"]').forEach(r => r.addEventListener('change', aggiornaEtichettaNome));

$('#costo-tempo').textContent = 'tempo (−' + descriviMinuti(IMPOSTAZIONI.costo_indizio_secondi) + ')';
$('#costo-punti').textContent = 'punti (−' + IMPOSTAZIONI.costo_indizio_punti + ')';

function mostraAvvisi(avvisi) {
  const box = $('#avvisi');
  box.hidden = avvisi.length === 0;
  if (!avvisi.length) return;
  $('#avvisi-titolo').textContent = avvisi.length === 1
    ? '⚠ 1 avviso sui file dei percorsi'
    : `⚠ ${avvisi.length} avvisi sui file dei percorsi`;
  $('#avvisi-lista').replaceChildren(...avvisi.map(a => {
    const li = document.createElement('li');
    const dove = document.createElement('strong');
    dove.textContent = a.file + (a.riga ? `, riga ${a.riga}` : '') + ': ';
    li.append(dove, a.msg);
    return li;
  }));
  avvisi.forEach(a => console.warn(`[percorsi] ${a.file}${a.riga ? ' riga ' + a.riga : ''}: ${a.msg}`));
}

function preselezionaDaIndirizzo() {
  const id = new URLSearchParams(location.search).get('percorso');
  const p = id && percorsi.find(x => x.id === id);
  if (!p) return;
  selGrado.value = p.grado;
  aggiornaDiscipline();
  selDisciplina.value = chiave(p.disciplina);
  aggiornaArgomenti();
  selArgomento.value = p.id;
  aggiornaAnteprima();
}

async function avvio() {
  const risultato = await Lettore.caricaTutti();
  percorsi = risultato.percorsi;
  $('#caricamento').hidden = true;
  mostraAvvisi(risultato.avvisi);
  if (!percorsi.length) {
    $('#nessun-percorso').hidden = false;
    $('#avvisi').open = true;
    return;
  }
  $('#form-scelta').hidden = false;
  aggiornaGradi();
  preselezionaDaIndirizzo();
}

/* ---------- inizio partita ---------- */

$('#form-scelta').addEventListener('submit', e => {
  e.preventDefault();
  const p = percorsoScelto();
  if (!p) return;
  const modalita = document.querySelector('input[name="modalita"]:checked').value;
  const nome = $('#nome').value.trim();
  if (modalita === 'squadra' && !nome) { $('#nome').focus(); return; }
  preparaPartita(p, modalita, nome, document.querySelector('input[name="costo"]:checked').value);
});

function preparaPartita(p, modalita, nome, costo) {
  fermaTimer();
  stato = {
    p, modalita, nome, costo,
    indice: 0,
    trovati: [],
    indizi: new Set(),
    errori: 0,
    erroriCodice: 0,
    penalitaSecondi: 0,
    durata: minutiDi(p) * 60,
    inizio: null,
    fine: null,
    scadutoAvvisato: false,
    timer: null
  };
  $('#storia-etichetta').textContent = `${GRADI[p.grado]} · ${p.disciplina} · ${p.argomento}`;
  $('#storia-titolo').textContent = p.titolo;
  paragrafi($('#storia-testo'), p.storia);
  $('#storia-regole').replaceChildren(...[
    `${quantiEnigmi(p)}, da risolvere uno dopo l'altro: ogni enigma risolto sblocca il successivo e vi consegna un frammento del codice.`,
    'Alla fine, il lucchetto si apre solo con il codice completo, con i frammenti nell\'ordine giusto.',
    `Avete ${minutiDi(p)} minuti. Ogni indizio costa ${costoIndizio()}.`,
    'Maiuscole, accenti e spazi nelle risposte non contano.'
  ].map(testo => {
    const li = document.createElement('li');
    li.textContent = testo;
    return li;
  }));
  mostra('storia');
}

$('#btn-indietro').addEventListener('click', () => { stato = null; mostra('menu'); });

$('#btn-inizia').addEventListener('click', () => {
  stato.inizio = Date.now();
  $('#hud-titolo').textContent = stato.p.titolo;
  $('#hud-nome').textContent = stato.nome ? (stato.modalita === 'squadra' ? 'Squadra ' : '') + stato.nome : '';
  $('#pannello-enigma').hidden = false;
  $('#pannello-lucchetto').hidden = true;
  $('#lucchetto').classList.remove('aperto');
  disegnaFrammenti();
  mostraEnigma();
  mostra('gioco');
  stato.timer = setInterval(aggiornaCruscotto, 250);
  aggiornaCruscotto();
  $('#risposta').focus();
});

/* ---------- tempo e punteggio ---------- */

function fermaTimer() {
  if (stato && stato.timer) clearInterval(stato.timer);
}

function secondiRimasti() {
  const trascorsi = ((stato.fine || Date.now()) - stato.inizio) / 1000;
  return stato.durata - stato.penalitaSecondi - trascorsi;
}

function calcolaPunti() {
  const I = IMPOSTAZIONI;
  const voci = {
    enigmi: stato.trovati.length * I.punti_per_enigma,
    indizi: stato.costo === 'punti' ? -stato.indizi.size * I.costo_indizio_punti : 0,
    errori: -stato.errori * I.penalita_risposta_sbagliata,
    codice: -stato.erroriCodice * I.penalita_codice_sbagliato,
    tempo: 0
  };
  if (stato.fine) {
    const r = secondiRimasti();
    voci.tempo = Math.sign(r) * Math.floor(Math.abs(r) / I.secondi_per_punto_bonus);
  }
  const totale = Math.max(0, Object.values(voci).reduce((a, b) => a + b, 0));
  return { voci, totale };
}

function aggiornaCruscotto() {
  if (!stato || !stato.inizio) return;
  const r = secondiRimasti();
  const timer = $('#hud-tempo');
  timer.textContent = formattaTempo(r);
  timer.classList.toggle('allarme', r >= 0 && r < 60);
  timer.classList.toggle('scaduto', r < 0);
  if (r < 0 && !stato.scadutoAvvisato && !stato.fine) {
    stato.scadutoAvvisato = true;
    toast('Tempo scaduto! Potete continuare, ma ogni secondo in più toglie punti.');
  }
  $('#hud-punti').textContent = calcolaPunti().totale;
}

/* ---------- frammenti e barra di avanzamento ---------- */

function disegnaFrammenti() {
  const n = stato.p.enigmi.length;
  const lista = $('#frammenti');
  lista.replaceChildren(...stato.p.enigmi.map((e, i) => {
    const li = document.createElement('li');
    const trovato = i < stato.trovati.length;
    li.className = 'frammento' + (trovato ? ' trovato' : '') + (i === stato.indice && !trovato ? ' attuale' : '');
    li.textContent = trovato ? stato.trovati[i] : '?';
    li.title = trovato ? `Frammento ${i + 1}: ${stato.trovati[i]}` : `Frammento ${i + 1}: non ancora trovato`;
    return li;
  }));
  $('#barra-riempimento').style.width = (stato.trovati.length / n * 100) + '%';
}

/* ---------- enigmi ---------- */

let attesaConferma = null;

function mostraEnigma() {
  const e = stato.p.enigmi[stato.indice];
  $('#enigma-numero').textContent = `Enigma ${stato.indice + 1} di ${stato.p.enigmi.length}`;
  testoConACapo($('#enigma-testo'), e.domanda);
  $('#risposta').value = '';
  $('#enigma-esito').textContent = '';
  $('#enigma-esito').className = 'esito';
  $('#form-risposta').hidden = false;
  $('#enigma-risolto').hidden = true;
  $('#zona-indizio').hidden = !e.indizio;
  const usato = stato.indizi.has(stato.indice);
  $('#indizio-testo').hidden = !usato;
  $('#indizio-testo').textContent = e.indizio;
  $('#btn-indizio').hidden = usato;
  reimpostaBottoneIndizio();
  const carta = $('#pannello-enigma');
  carta.classList.remove('entrata');
  void carta.offsetWidth;
  carta.classList.add('entrata');
}

function reimpostaBottoneIndizio() {
  clearTimeout(attesaConferma);
  attesaConferma = null;
  const b = $('#btn-indizio');
  b.classList.remove('conferma');
  b.textContent = `💡 Indizio (costa ${costoIndizio()})`;
}

$('#btn-indizio').addEventListener('click', () => {
  if (!attesaConferma) {
    const b = $('#btn-indizio');
    b.classList.add('conferma');
    b.textContent = `Sicuri? Toccate di nuovo per usarlo (−${costoIndizio()})`;
    attesaConferma = setTimeout(reimpostaBottoneIndizio, 4000);
    return;
  }
  reimpostaBottoneIndizio();
  stato.indizi.add(stato.indice);
  if (stato.costo === 'tempo') stato.penalitaSecondi += IMPOSTAZIONI.costo_indizio_secondi;
  $('#btn-indizio').hidden = true;
  $('#indizio-testo').hidden = false;
  toast(`Indizio usato: −${costoIndizio()}`);
  aggiornaCruscotto();
});

$('#form-risposta').addEventListener('submit', ev => {
  ev.preventDefault();
  const e = stato.p.enigmi[stato.indice];
  const valore = $('#risposta').value;
  const esito = $('#enigma-esito');
  if (!Lettore.normalizza(valore)) {
    esito.textContent = 'Scrivete una risposta prima di verificare.';
    esito.className = 'esito';
    return;
  }
  if (e.accettate.includes(Lettore.normalizza(valore))) {
    risolvi(e);
  } else {
    stato.errori++;
    esito.textContent = MESSAGGI_ERRORE[stato.errori % MESSAGGI_ERRORE.length];
    esito.className = 'esito sbagliato';
    scuoti($('#form-risposta'));
    $('#risposta').select();
    aggiornaCruscotto();
  }
});

function risolvi(e) {
  stato.trovati.push(e.frammento);
  const ultimo = stato.trovati.length === stato.p.enigmi.length;
  $('#form-risposta').hidden = true;
  $('#zona-indizio').hidden = true;
  $('#enigma-esito').textContent = '';
  $('#risolto-frammento').textContent = e.frammento;
  $('#btn-avanti').textContent = ultimo ? 'Andate al lucchetto finale →' : 'Prossimo enigma →';
  $('#enigma-risolto').hidden = false;
  disegnaFrammenti();
  const slot = $('#frammenti').children[stato.trovati.length - 1];
  if (slot) slot.classList.add('appena');
  aggiornaCruscotto();
  $('#btn-avanti').focus();
}

$('#btn-avanti').addEventListener('click', () => {
  stato.indice++;
  if (stato.indice < stato.p.enigmi.length) {
    disegnaFrammenti();
    mostraEnigma();
    $('#risposta').focus();
  } else {
    mostraLucchetto();
  }
});

/* ---------- lucchetto finale ---------- */

function mostraLucchetto() {
  disegnaFrammenti();
  $('#pannello-enigma').hidden = true;
  $('#pannello-lucchetto').hidden = false;
  $('#codice').value = '';
  $('#codice-esito').textContent = '';
  $('#codice-esito').className = 'esito';
  $('#codice').focus();
}

$('#form-codice').addEventListener('submit', ev => {
  ev.preventDefault();
  const esito = $('#codice-esito');
  const scritto = Lettore.normalizza($('#codice').value);
  if (!scritto) return;
  if (scritto === Lettore.normalizza(stato.trovati.join(''))) {
    stato.fine = Date.now();
    fermaTimer();
    aggiornaCruscotto();
    $('#lucchetto').classList.add('aperto');
    esito.textContent = 'Clic! Il lucchetto si apre…';
    esito.className = 'esito giusto';
    setTimeout(mostraFinale, 1400);
  } else {
    stato.erroriCodice++;
    esito.textContent = 'Il lucchetto non si apre. Controllate l\'ordine dei frammenti!';
    esito.className = 'esito sbagliato';
    scuoti($('#lucchetto'));
    $('#codice').select();
    aggiornaCruscotto();
  }
});

/* ---------- finale e classifica ---------- */

function chiaveClassifica() {
  return 'escape-classifica:' + stato.p.id;
}

function mostraFinale() {
  const { voci, totale } = calcolaPunti();
  const I = IMPOSTAZIONI;
  const massimo = stato.p.enigmi.length * I.punti_per_enigma + Math.floor(stato.durata / I.secondi_per_punto_bonus);
  const quota = totale / massimo;
  const [giudizio, chiavi] =
    quota >= 0.8 ? ['Maestri dell\'evasione', 3] :
    quota >= 0.5 ? ['Fuggitivi esperti', 2] :
    ['Evasi per un soffio', 1];

  $('#finale-giudizio').textContent = giudizio;
  $('#finale-chiavi').textContent = '🗝️'.repeat(chiavi);
  paragrafi($('#finale-testo'), stato.p.finale);
  $('#finale-punti').textContent = totale;

  const impiegati = (stato.fine - stato.inizio) / 1000;
  const righe = [
    ['Tempo impiegato', formattaTempo(impiegati)],
    [`Enigmi risolti (${stato.trovati.length})`, '+' + voci.enigmi],
    [`Indizi usati (${stato.indizi.size})`, stato.costo === 'punti' ? voci.indizi : `−${descriviMinuti(stato.indizi.size * I.costo_indizio_secondi)} di tempo`],
    [`Risposte sbagliate (${stato.errori})`, voci.errori],
    [`Codici sbagliati (${stato.erroriCodice})`, voci.codice],
    [voci.tempo >= 0 ? 'Bonus tempo rimasto' : 'Penalità tempo scaduto', (voci.tempo >= 0 ? '+' : '') + voci.tempo]
  ];
  $('#finale-dettaglio').replaceChildren(...righe.map(([a, b]) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const td = document.createElement('td');
    th.textContent = a;
    td.textContent = String(b).replace('-', '−');
    tr.append(th, td);
    return tr;
  }));

  const voce = {
    nome: stato.nome || (stato.modalita === 'squadra' ? 'Squadra senza nome' : 'Giocatore anonimo'),
    punti: totale,
    secondi: Math.round(impiegati),
    quando: Date.now()
  };
  const classifica = (memoria('leggi', chiaveClassifica()) || []).concat(voce)
    .sort((a, b) => b.punti - a.punti || a.secondi - b.secondi)
    .slice(0, 10);
  memoria('scrivi', chiaveClassifica(), classifica);
  disegnaClassifica(classifica, voce.quando);
  mostra('finale');
}

function disegnaClassifica(classifica, evidenzia) {
  const lista = $('#classifica');
  if (!classifica.length) {
    const li = document.createElement('li');
    li.className = 'vuota';
    li.textContent = 'Ancora nessuna partita registrata.';
    lista.replaceChildren(li);
    return;
  }
  lista.replaceChildren(...classifica.map(v => {
    const li = document.createElement('li');
    if (v.quando === evidenzia) li.className = 'voi';
    const nome = document.createElement('span');
    const dati = document.createElement('span');
    nome.textContent = v.nome;
    dati.textContent = `${v.punti} punti · ${formattaTempo(v.secondi)}`;
    li.append(nome, dati);
    return li;
  }));
}

$('#btn-azzera').addEventListener('click', () => {
  if (!confirm('Cancellare la classifica di questo percorso su questo dispositivo?')) return;
  memoria('cancella', chiaveClassifica());
  disegnaClassifica([], null);
});

$('#btn-rigioca').addEventListener('click', () => {
  preparaPartita(stato.p, stato.modalita, stato.nome, stato.costo);
});

$('#btn-menu').addEventListener('click', () => { stato = null; mostra('menu'); });

$('#btn-esci').addEventListener('click', () => {
  if (!confirm('Uscire dalla partita? I progressi andranno persi.')) return;
  fermaTimer();
  stato = null;
  mostra('menu');
});

window.addEventListener('beforeunload', e => {
  if (stato && stato.inizio && !stato.fine) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ---------- LIM e schermo intero ---------- */

function impostaLim(attiva) {
  document.documentElement.classList.toggle('lim', attiva);
  $('#btn-lim').setAttribute('aria-pressed', String(attiva));
  memoria('scrivi', 'escape-lim', attiva);
}
$('#btn-lim').addEventListener('click', () => impostaLim(!document.documentElement.classList.contains('lim')));
impostaLim(memoria('leggi', 'escape-lim') === true);

const btnSchermo = $('#btn-schermo');
if (!document.documentElement.requestFullscreen) {
  btnSchermo.hidden = true;
} else {
  btnSchermo.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
}

avvio();
