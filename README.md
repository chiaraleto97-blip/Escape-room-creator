# Escape Room Didattica

Generatore di escape room didattiche a **enigmi concatenati** per la scuola
secondaria di primo e di secondo grado.

Si sceglie grado → disciplina → argomento e parte il percorso: gli enigmi si
sbloccano uno alla volta e ognuno consegna un **frammento del codice** (cifra,
lettera o parola). Alla fine il lucchetto si apre solo con il codice completo,
con i frammenti nell'ordine giusto.

Funziona su computer, tablet, telefono e LIM (pulsante **LIM** in alto per i
caratteri grandi, **Schermo intero** per la proiezione).

---

## Come si gioca

1. Scegliete **grado**, **disciplina** e **argomento** (il menu mostra solo i
   percorsi che esistono davvero).
2. Scegliete se giocare **da soli** o **a squadre** (con il nome della squadra).
3. Scegliete se gli **indizi** costano **tempo** (2 minuti) o **punti** (50).
4. Leggete la storia e fate partire il conto alla rovescia.

**Punteggio:** 100 punti per enigma, −5 per ogni risposta sbagliata, −20 per
ogni codice sbagliato al lucchetto, −50 per ogni indizio (se costano punti),
più 1 punto bonus ogni 5 secondi rimasti. Se il tempo scade si può continuare,
ma i secondi in più tolgono punti.

La classifica resta **solo sul dispositivo** su cui si gioca: non viene inviata
a nessuno.

Per dare agli studenti il link diretto a un percorso, usate il link
**"Link diretto a questo percorso"** che compare nel menu dopo la scelta.

---

## Come creare un nuovo percorso

Non serve saper programmare: basta un editor di testo (per esempio il
Blocco note di Windows).

1. Nella cartella `percorsi/` copia il file **`modello-percorso.txt`**.
2. Rinomina la copia, per esempio `primo-geografia-regioni.txt`
   (meglio senza spazi e senza accenti, deve finire con `.txt`).
3. Apri il file e sostituisci i testi con i tuoi (vedi sotto).
4. Apri **`percorsi/elenco.txt`** e aggiungi in fondo il nome del nuovo file,
   su una riga da solo, scritto esattamente uguale.
5. Salva, e il percorso compare nel menu.

### Come è fatto un file di percorso

In alto l'**intestazione**, un'informazione per riga:

```
grado: primo
disciplina: Geografia
argomento: Le regioni italiane
titolo: Il treno fantasma
tempo: 30
storia: Siete saliti su un treno misterioso che non si ferma mai...
storia: Per scendere dovete scoprire il codice del macchinista.
finale: Il treno frena e le porte si aprono. Siete arrivati!
```

| Riga | Cosa scrivere | Obbligatoria? |
|---|---|---|
| `grado:` | `primo` oppure `secondo` | sì |
| `disciplina:` | la materia | sì |
| `argomento:` | l'argomento | sì |
| `titolo:` | il titolo dell'escape room | no (se manca, si usa l'argomento) |
| `storia:` | l'introduzione. Più righe `storia:` = più paragrafi | consigliata |
| `finale:` | il messaggio di vittoria. Anche qui più righe | consigliata |
| `tempo:` | i minuti a disposizione | no (se manca: 30) |

Sotto, gli **enigmi**, uno per riga, con 4 parti separate dalla barra
verticale `|` (sulla tastiera italiana: Maiusc + il tasto `\` a sinistra
dell'1):

```
enigma | risposte accettate | indizio | frammento del codice
```

Esempio:

```
Qual è il capoluogo della Sicilia? | Palermo | Si trova sul mar Tirreno. | 7
```

Regole utili:

- **Risposte accettate**: se ce n'è più d'una, separale con `/`
  (es. `nove / 9`). Le frazioni come `3/4` vanno bene: una `/` tra due cifre
  non separa. Maiuscole, accenti, spazi e apostrofi **non contano**.
- **Indizio**: se non vuoi darlo, lascialo vuoto: `... | Palermo | | 7`
- **Frammento**: cifra, lettera o parola. Il codice del lucchetto finale è
  formato da tutti i frammenti uniti, **nell'ordine degli enigmi**.
- **Andare a capo** nel testo dell'enigma: scrivi `//`
- L'ordine delle righe è l'ordine in cui gli enigmi si sbloccano.
- Le righe che iniziano con `#` sono **commenti**: il gioco le ignora.
- Il carattere `|` non si può usare dentro i testi.

**Idee per enigmi vari:** calcoli, anagrammi ("riordina le lettere di…"),
parole mancanti ("completa…"), cronologie ("metti in ordine A, B, C" → la
risposta è una sequenza di lettere come `BCA`), collegamenti ("collega 1, 2, 3
con a, b, c" → risposta `CAB`), indovinelli.

### Se qualcosa è scritto male

Il gioco non si blocca: salta la riga (o il file) sbagliata e mostra nel menu
un riquadro rosso **"avvisi sui file dei percorsi"**, con il nome del file e
il numero della riga da correggere.

---

## Provare il sito sul proprio computer

Aprire `index.html` con un doppio clic **non funziona**: il browser, per
sicurezza, non permette di leggere i file dei percorsi. Serve un piccolo
"server" locale. Con Python installato, apri il terminale nella cartella del
progetto e scrivi:

```
python -m http.server 8000
```

Poi apri nel browser l'indirizzo **http://localhost:8000**.
Per fermarlo, premi `Ctrl + C` nel terminale.

## Pubblicare su GitHub Pages

1. Sul sito di GitHub apri il repository e vai su **Settings → Pages**.
2. In "Build and deployment", alla voce **Branch** scegli `main` e la
   cartella `/ (root)`, poi premi **Save**.
3. Dopo un paio di minuti il sito è online all'indirizzo
   `https://chiaraleto97-blip.github.io/Escape-room-creator/`

Ogni volta che si caricano modifiche su GitHub, il sito si aggiorna da solo
(di solito entro un paio di minuti).

---

## Com'è organizzata la cartella

```
index.html             la pagina del gioco
css/stile.css          la grafica (i colori sono in cima al file)
js/lettore.js          legge i file dei percorsi e segnala gli errori
js/gioco.js            il gioco (i punteggi si cambiano in cima al file)
percorsi/elenco.txt    l'elenco dei percorsi da caricare
percorsi/*.txt         i percorsi
```

## Privacy

Il repository è **pubblico**: nei percorsi non inserire mai dati personali
reali di studenti (nomi, voti, foto, contatti). Nel gioco usate nomi di
squadra di fantasia.
