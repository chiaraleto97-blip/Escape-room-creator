# Escape Room Creator — regole del progetto

Piccolo sito pubblicato con GitHub Pages.
Repository pubblico: https://github.com/chiaraleto97-blip/Escape-room-creator

## Tecnologia
- Sito statico: solo HTML, CSS e JavaScript.
- Nessuna libreria esterna (niente CDN, framework o pacchetti npm).
- Nessun passaggio di build: i file si pubblicano così come sono.

## Struttura
- `index.html` sta nella cartella principale del repository.
- Usare solo percorsi relativi (es. `css/stile.css`, mai `/css/stile.css`),
  così il sito funziona su GitHub Pages dentro la sottocartella del repository.

## Contenuti
- I contenuti (testi, enigmi, indizi, ecc.) stanno in file di testo semplici,
  separati dal codice, che l'autrice può modificare senza saper programmare.
- Il formato di questi file deve essere facile da leggere e scrivere a mano,
  con istruzioni in italiano in cima al file quando serve.

## Percorsi del gioco
- Ogni percorso è un file `.txt` in `percorsi/`, elencato in `percorsi/elenco.txt`
  (GitHub Pages non permette di elencare le cartelle, quindi serve l'elenco).
- Formato descritto nel README e in cima a ogni file; `percorsi/modello-percorso.txt`
  è il modello da copiare (non è in elenco).
- Un file o una riga scritti male vanno saltati e segnalati (file + riga), mai bloccare il gioco.
- Prova in locale: `python -m http.server 8000` e poi http://localhost:8000

## Git
- Commit piccoli e frequenti, con messaggi in italiano che spiegano cosa è cambiato.
- Usare solo `git` da riga di comando, mai `gh` (GitHub CLI non è installata).
- Prima di ogni `git push` chiedere sempre conferma all'autrice.

## Comunicazione
- L'autrice non è una programmatrice: spiegare ogni passaggio con parole semplici,
  in italiano, evitando il gergo tecnico (o spiegandolo quando serve).

## Privacy
- Il repository è pubblico: mai inserire dati personali reali di studenti
  (nomi, cognomi, voti, foto, contatti). Usare solo nomi e dati inventati.
