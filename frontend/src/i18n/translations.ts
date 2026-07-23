import type {
  ApiErrorCode,
  ConverterIssueCode,
} from "../api/calendarConverter";

export const germanTranslations = {
  brand: "Feuerwehr Tools",
  brandHomeLabel: "Feuerwehr Tools Startseite",
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
  calendarPlaceholder:
    "Der Kalender-Konverter wird in einem der nächsten Schritte eingerichtet.",
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
  calendarPlaceholder:
    "Il convertitore di calendari sarà configurato in uno dei prossimi passaggi.",
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
