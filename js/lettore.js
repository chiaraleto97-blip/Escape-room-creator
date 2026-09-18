'use strict';
/*
  LETTORE DEI PERCORSI
  Legge percorsi/elenco.txt e i file dei percorsi, e li trasforma in dati
  per il gioco. Se un file o una riga è scritto male, lo salta e registra
  un avviso (file + numero di riga) invece di bloccare tutto.
*/
const Lettore = (() => {
  const CARTELLA = 'percorsi/';
  const ELENCO = CARTELLA + 'elenco.txt';
  const INTESTAZIONI = ['grado', 'disciplina', 'argomento', 'titolo', 'storia', 'finale', 'tempo'];

  function senzaAccenti(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Rende confrontabili le risposte: ignora maiuscole, accenti, spazi,
  // apostrofi e punteggiatura. "0,75" e "0.75" diventano uguali.
  function normalizza(s) {
    let t = senzaAccenti(String(s).toLowerCase());
    t = t.replace(/(\d)[.,](?=\d)/g, '$1');
    t = t.replace(/[\s'’‘`´"“”«».,;:!?¡¿()[\]{}\-–—_*…]/g, '');
    return t.replace(//g, '.');
  }

  // Divide le risposte accettate sulla "/". Una "/" tra due cifre (3/4)
  // fa parte di una frazione e non separa.
  function dividiRisposte(campo) {
    const parti = [];
    let corrente = '';
    for (let i = 0; i < campo.length; i++) {
      const c = campo[i];
      const frazione = /\d/.test(campo[i - 1] || '') && /\d/.test(campo[i + 1] || '');
      if (c === '/' && !frazione) {
        parti.push(corrente);
        corrente = '';
      } else {
        corrente += c;
      }
    }
    parti.push(corrente);
    return parti.map(r => r.trim()).filter(r => normalizza(r) !== '');
  }

  function leggiGrado(valore) {
    const t = normalizza(valore);
    if (t.includes('primo') || t === '1' || t === 'i') return 'primo';
    if (t.includes('secondo') || t === '2' || t === 'ii') return 'secondo';
    return '';
  }

  function righe(testo) {
    return testo.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  }

  function analizza(testo, id) {
    const file = CARTELLA + id;
    const avvisi = [];
    const avvisa = (riga, msg) => avvisi.push({ file, riga, msg });
    const p = {
      id, file, grado: '', disciplina: '', argomento: '', titolo: '',
      storia: [], finale: [], minuti: null, enigmi: []
    };

    righe(testo).forEach((originale, i) => {
      const n = i + 1;
      const riga = originale.trim();
      if (!riga || riga.startsWith('#')) return;

      const m = riga.match(/^([A-Za-zÀ-ÿ ]+?)\s*:\s*(.*)$/);
      const chiave = m ? senzaAccenti(m[1].toLowerCase()).trim() : '';

      if (m && INTESTAZIONI.includes(chiave)) {
        const valore = m[2].trim();
        if (!valore) { avvisa(n, `"${chiave}:" è vuoto: riga saltata.`); return; }
        if (chiave === 'storia' || chiave === 'finale') {
          p[chiave].push(valore);
        } else if (chiave === 'grado') {
          const g = leggiGrado(valore);
          if (g) p.grado = g;
          else avvisa(n, `grado "${valore}" non valido: scrivi "primo" oppure "secondo".`);
        } else if (chiave === 'tempo') {
          const minuti = parseInt(valore, 10);
          if (minuti > 0) p.minuti = minuti;
          else avvisa(n, `tempo "${valore}" non valido: scrivi solo il numero di minuti (es. 30).`);
        } else {
          if (p[chiave]) avvisa(n, `"${chiave}:" compare più di una volta: uso l'ultima.`);
          p[chiave] = valore;
        }
        return;
      }

      if (riga.includes('|')) {
        const parti = riga.split('|').map(s => s.trim());
        if (parti.length !== 4) {
          avvisa(n, `l'enigma ha ${parti.length} parti invece di 4 (enigma | risposte | indizio | frammento): riga saltata.`);
          return;
        }
        const [domanda, campoRisposte, indizio, frammento] = parti;
        const risposte = dividiRisposte(campoRisposte);
        if (!domanda) { avvisa(n, 'manca il testo dell\'enigma: riga saltata.'); return; }
        if (!risposte.length) { avvisa(n, 'mancano le risposte accettate: riga saltata.'); return; }
        if (!frammento) { avvisa(n, 'manca il frammento del codice: riga saltata.'); return; }
        p.enigmi.push({ domanda, risposte, accettate: risposte.map(normalizza), indizio, frammento, riga: n });
        return;
      }

      if (m) avvisa(n, `"${m[1].trim()}:" non è un'intestazione conosciuta (${INTESTAZIONI.join(', ')}): riga saltata.`);
      else avvisa(n, 'riga non riconosciuta (non è un\'intestazione e non contiene |): riga saltata.');
    });

    const mancanti = ['grado', 'disciplina', 'argomento'].filter(k => !p[k]);
    if (mancanti.length) {
      avvisa(null, `manca ${mancanti.map(k => `"${k}:"`).join(', ')}: percorso saltato.`);
      return { percorso: null, avvisi };
    }
    if (!p.enigmi.length) {
      avvisa(null, 'non contiene nessun enigma valido: percorso saltato.');
      return { percorso: null, avvisi };
    }
    if (!p.titolo) p.titolo = p.argomento;
    if (!p.storia.length) p.storia.push('La porta si è chiusa alle vostre spalle: risolvete gli enigmi per trovare il codice e uscire!');
    if (!p.finale.length) p.finale.push('Il lucchetto si apre: siete liberi!');
    return { percorso: p, avvisi };
  }

  async function leggiTesto(url) {
    const risposta = await fetch(url, { cache: 'no-cache' });
    if (!risposta.ok) throw new Error(risposta.status === 404 ? 'file non trovato' : 'errore ' + risposta.status);
    return risposta.text();
  }

  async function caricaTutti() {
    const avvisi = [];
    if (location.protocol === 'file:') {
      avvisi.push({
        file: 'index.html', riga: null,
        msg: 'è stato aperto con un doppio clic: così il browser non può leggere i percorsi. Avvia un piccolo server (vedi README) oppure usa il sito pubblicato su GitHub Pages.'
      });
      return { percorsi: [], avvisi };
    }

    let elenco;
    try {
      elenco = await leggiTesto(ELENCO);
    } catch (e) {
      avvisi.push({ file: ELENCO, riga: null, msg: `impossibile leggerlo (${e.message}).` });
      return { percorsi: [], avvisi };
    }

    const nomi = [];
    righe(elenco).forEach((r, i) => {
      const nome = r.trim();
      if (!nome || nome.startsWith('#')) return;
      if (nomi.includes(nome)) avvisi.push({ file: ELENCO, riga: i + 1, msg: `"${nome}" è scritto due volte: lo carico una volta sola.` });
      else nomi.push(nome);
    });

    const risultati = await Promise.all(nomi.map(async nome => {
      try {
        return analizza(await leggiTesto(CARTELLA + encodeURI(nome)), nome);
      } catch (e) {
        return {
          percorso: null,
          avvisi: [{ file: CARTELLA + nome, riga: null, msg: `impossibile leggerlo (${e.message}). Controlla che il nome in elenco.txt sia identico al nome del file.` }]
        };
      }
    }));

    const percorsi = [];
    risultati.forEach(r => {
      avvisi.push(...r.avvisi);
      if (r.percorso) percorsi.push(r.percorso);
    });
    return { percorsi, avvisi };
  }

  return { caricaTutti, normalizza };
})();
