import type {
  ApiErrorCode,
  ConverterIssueCode,
} from "../api/calendarConverter";

export const germanTranslations = {
  brand: "Feuerwehr Tools",
  brandHomeLabel: "Feuerwehr Tools Startseite",
  skipToContent: "Zum Hauptinhalt springen",
  navigationLabel: "Hauptnavigation",
  navigationOverview: "Übersicht",
  languageLabel: "Sprache",
  languageGerman: "Deutsch",
  languageItalian: "Italiano",
  footerLocal: "Lokal auf diesem Gerät",
  notFoundEyebrow: "Fehler 404",
  notFoundTitle: "Seite nicht gefunden",
  notFoundDescription: "Die angeforderte Seite ist nicht verfügbar.",
  backToDashboard: "Zurück zur Übersicht",
  dashboardEyebrow: "Einsatzbereit im Alltag",
  dashboardTitle: "Werkzeuge für die Feuerwehr",
  dashboardDescription:
    "Praktische Hilfsmittel für wiederkehrende Aufgaben – sicher und lokal auf diesem Gerät.",
  dashboardToolsTitle: "Verfügbare Werkzeuge",
  calendarEyebrow: "Kalender",
  calendarTitle: "Dienstplan konvertieren",
  calendarDescription:
    "CSV- oder XLSX-Dienstpläne für den Import in eine Kalender-App vorbereiten.",
  calendarAcceptedFormats: "Akzeptierte Formate",
  calendarOpen: "Werkzeug öffnen",
  calendarUploadIntro:
    "Wählen Sie einen Dienstplan aus und starten Sie die sichere lokale Konvertierung.",
  calendarHelpTitle: "So funktioniert die Konvertierung",
  calendarHelpStepSelect:
    "CSV- oder XLSX-Dienstplan auswählen oder hier ablegen.",
  calendarHelpStepConvert:
    "Konvertierung starten und übersprungene Ereignisse prüfen.",
  calendarHelpStepDownload:
    "ICS-Kalender herunterladen und in die Kalender-App importieren.",
  calendarHelpFormats: "Akzeptierte Formate: CSV und XLSX.",
  calendarHelpLimit: "Maximale Dateigröße: 10 MiB.",
  calendarHelpPartial:
    "Bei einer Teilkonvertierung enthält der Kalender nur gültige Ereignisse.",
  calendarHelpPrivacy:
    "Uploads und erzeugte Kalender werden von der Anwendung nicht gespeichert.",
  calendarExampleDownload: "XLSX-Beispieldienstplan herunterladen",
  calendarDropTitle: "Dienstplan hier ablegen",
  calendarDropHint: "Oder wählen Sie eine Datei auf diesem Gerät aus.",
  calendarChooseFile: "Datei auswählen",
  calendarChooseAnother: "Andere Datei auswählen",
  calendarFileRequirements: "Akzeptiert werden CSV- und XLSX-Dateien.",
  calendarSelectedFile: "Ausgewählte Datei",
  calendarSubmit: "Konvertierung starten",
  calendarConverting: "Wird konvertiert …",
  calendarReset: "Zurücksetzen",
  calendarStatusSuccess: "Vollständiges Ergebnis",
  calendarStatusPartial: "Teilergebnis",
  calendarStatusFailure: "Kein konvertierbares Ergebnis",
  calendarSuccessTitle: "Konvertierung erfolgreich",
  calendarSuccessDescription:
    "Alle Ereignisse wurden konvertiert und der Kalender wurde vorbereitet.",
  calendarPartialTitle: "Teilweise konvertiert",
  calendarPartialDescription:
    "Gültige Ereignisse wurden konvertiert. Ungültige Ereignisse wurden übersprungen.",
  calendarPartialValidOnly:
    "Die vorbereitete Kalenderdatei enthält ausschließlich gültige Ereignisse.",
  calendarFailureTitle: "Keine Ereignisse konvertiert",
  calendarFailureDescription:
    "Der Dienstplan wurde verarbeitet, aber alle Ereignisse waren ungültig.",
  calendarFailureNoCalendar:
    "Es wurde keine Kalenderdatei erstellt.",
  calendarFatalTitle: "Konvertierung nicht möglich",
  calendarTotalCount: "Ereignisse insgesamt",
  calendarConvertedCount: "Konvertierte Ereignisse",
  calendarSkippedCount: "Übersprungene Ereignisse",
  calendarResultFilename: "Vorbereitete Kalenderdatei",
  calendarDownload: "Kalender herunterladen",
  calendarInvalidEventsTitle: "Probleme im Dienstplan",
  calendarSkippedEventLabel: "Übersprungen",
  calendarEventIssuesLabel: "Probleme",
  calendarEventFallback: "Ereignis",
  calendarRowLabel: "Zeile",
  calendarWorksheetLabel: "Arbeitsblatt",
  errorMissingFilename: "Die hochgeladene Datei hat keinen Namen.",
  errorUnsupportedFileType: "Es werden nur CSV- und XLSX-Dateien unterstützt.",
  errorOversizedUpload: "Die Datei überschreitet die maximale Größe von 10 MiB.",
  errorMalformedCsv: "Die CSV-Datei ist nicht lesbar oder ungültig aufgebaut.",
  errorMalformedXlsx: "Die XLSX-Datei ist nicht lesbar oder ungültig aufgebaut.",
  errorInputRead: "Die hochgeladene Datei konnte nicht gelesen werden.",
  errorInternal: "Die Konvertierung ist unerwartet fehlgeschlagen.",
  issueEmptyId: "Die Ereignis-ID fehlt.",
  issueEmptySummary: "Die Zusammenfassung fehlt.",
  issueEndDateBeforeStartDate: "Das Enddatum liegt vor dem Startdatum.",
  issueEndTimeBeforeStartTime: "Die Endzeit liegt vor der Startzeit.",
  issueDuplicateId: "Die Ereignis-ID wurde mehrfach verwendet.",
} as const;

export type TranslationKey = keyof typeof germanTranslations;
export type TranslationDictionary = Record<TranslationKey, string>;

export const italianTranslations = {
  brand: "Feuerwehr Tools",
  brandHomeLabel: "Pagina iniziale di Feuerwehr Tools",
  skipToContent: "Vai al contenuto principale",
  navigationLabel: "Navigazione principale",
  navigationOverview: "Panoramica",
  languageLabel: "Lingua",
  languageGerman: "Deutsch",
  languageItalian: "Italiano",
  footerLocal: "In locale su questo dispositivo",
  notFoundEyebrow: "Errore 404",
  notFoundTitle: "Pagina non trovata",
  notFoundDescription: "La pagina richiesta non è disponibile.",
  backToDashboard: "Torna alla panoramica",
  dashboardEyebrow: "Pronti per il lavoro quotidiano",
  dashboardTitle: "Strumenti per i vigili del fuoco",
  dashboardDescription:
    "Strumenti pratici per le attività ricorrenti, sicuri e locali su questo dispositivo.",
  dashboardToolsTitle: "Strumenti disponibili",
  calendarEyebrow: "Calendario",
  calendarTitle: "Converti il piano dei turni",
  calendarDescription:
    "Prepara i piani dei turni CSV o XLSX per importarli in un'applicazione calendario.",
  calendarAcceptedFormats: "Formati accettati",
  calendarOpen: "Apri lo strumento",
  calendarUploadIntro:
    "Seleziona un piano dei turni e avvia la conversione locale sicura.",
  calendarHelpTitle: "Come funziona la conversione",
  calendarHelpStepSelect:
    "Seleziona o trascina qui un piano dei turni CSV o XLSX.",
  calendarHelpStepConvert:
    "Avvia la conversione e controlla gli eventi ignorati.",
  calendarHelpStepDownload:
    "Scarica il calendario ICS e importalo nell'applicazione calendario.",
  calendarHelpFormats: "Formati accettati: CSV e XLSX.",
  calendarHelpLimit: "Dimensione massima del file: 10 MiB.",
  calendarHelpPartial:
    "In una conversione parziale, il calendario contiene soltanto gli eventi validi.",
  calendarHelpPrivacy:
    "I caricamenti e i calendari generati non vengono salvati dall'applicazione.",
  calendarExampleDownload: "Scarica il piano dei turni XLSX di esempio",
  calendarDropTitle: "Trascina qui il piano dei turni",
  calendarDropHint: "Oppure scegli un file da questo dispositivo.",
  calendarChooseFile: "Scegli un file",
  calendarChooseAnother: "Scegli un altro file",
  calendarFileRequirements: "Sono accettati file CSV e XLSX.",
  calendarSelectedFile: "File selezionato",
  calendarSubmit: "Avvia la conversione",
  calendarConverting: "Conversione in corso …",
  calendarReset: "Reimposta",
  calendarStatusSuccess: "Risultato completo",
  calendarStatusPartial: "Risultato parziale",
  calendarStatusFailure: "Nessun risultato convertibile",
  calendarSuccessTitle: "Conversione completata",
  calendarSuccessDescription:
    "Tutti gli eventi sono stati convertiti e il calendario è stato preparato.",
  calendarPartialTitle: "Conversione parziale",
  calendarPartialDescription:
    "Gli eventi validi sono stati convertiti. Gli eventi non validi sono stati ignorati.",
  calendarPartialValidOnly:
    "Il file calendario preparato contiene esclusivamente gli eventi validi.",
  calendarFailureTitle: "Nessun evento convertito",
  calendarFailureDescription:
    "Il piano dei turni è stato elaborato, ma tutti gli eventi erano non validi.",
  calendarFailureNoCalendar:
    "Non è stato creato alcun file calendario.",
  calendarFatalTitle: "Conversione non disponibile",
  calendarTotalCount: "Eventi totali",
  calendarConvertedCount: "Eventi convertiti",
  calendarSkippedCount: "Eventi ignorati",
  calendarResultFilename: "File calendario preparato",
  calendarDownload: "Scarica il calendario",
  calendarInvalidEventsTitle: "Problemi nel piano dei turni",
  calendarSkippedEventLabel: "Ignorato",
  calendarEventIssuesLabel: "Problemi",
  calendarEventFallback: "Evento",
  calendarRowLabel: "Riga",
  calendarWorksheetLabel: "Foglio",
  errorMissingFilename: "Il file caricato non ha un nome.",
  errorUnsupportedFileType: "Sono supportati soltanto file CSV e XLSX.",
  errorOversizedUpload: "Il file supera la dimensione massima di 10 MiB.",
  errorMalformedCsv: "Il file CSV è illeggibile o ha una struttura non valida.",
  errorMalformedXlsx: "Il file XLSX è illeggibile o ha una struttura non valida.",
  errorInputRead: "Non è stato possibile leggere il file caricato.",
  errorInternal: "La conversione non è riuscita a causa di un errore imprevisto.",
  issueEmptyId: "Manca l'ID dell'evento.",
  issueEmptySummary: "Manca il riepilogo.",
  issueEndDateBeforeStartDate: "La data di fine precede la data di inizio.",
  issueEndTimeBeforeStartTime: "L'ora di fine precede l'ora di inizio.",
  issueDuplicateId: "L'ID dell'evento è stato usato più volte.",
} satisfies TranslationDictionary;

export const translations = {
  de: germanTranslations,
  it: italianTranslations,
} satisfies Record<Language, TranslationDictionary>;

export type Language = "de" | "it";

const apiErrorTranslationKeys = {
  missing_filename: "errorMissingFilename",
  unsupported_file_type: "errorUnsupportedFileType",
  oversized_upload: "errorOversizedUpload",
  malformed_csv: "errorMalformedCsv",
  malformed_xlsx: "errorMalformedXlsx",
  input_read_error: "errorInputRead",
  internal_error: "errorInternal",
} satisfies Record<ApiErrorCode, TranslationKey>;

const issueTranslationKeys = {
  empty_id: "issueEmptyId",
  empty_summary: "issueEmptySummary",
  end_date_before_start_date: "issueEndDateBeforeStartDate",
  end_time_before_start_time: "issueEndTimeBeforeStartTime",
  duplicate_id: "issueDuplicateId",
} satisfies Record<ConverterIssueCode, TranslationKey>;

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key];
}

export function translateApiErrorCode(language: Language, code: ApiErrorCode): string {
  return translate(language, apiErrorTranslationKeys[code]);
}

export function translateConverterIssueCode(
  language: Language,
  code: ConverterIssueCode,
): string {
  return translate(language, issueTranslationKeys[code]);
}
