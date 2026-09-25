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
  footerCredit: "Entwickelt von PaoloRos.",
  notFoundEyebrow: "Fehler 404",
  notFoundTitle: "Seite nicht gefunden",
  notFoundDescription: "Die angeforderte Seite ist nicht verfügbar.",
  backToDashboard: "Zurück zur Übersicht",
  dashboardEyebrow: "Einsatzbereit im Alltag",
  dashboardTitle: "Werkzeuge für die Feuerwehr",
  dashboardDescription:
    "Praktische Werkzeuge für alltägliche Aufgaben.",
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
    "Der hochgeladene Dienstplan bleibt lokal auf diesem Server; erzeugte Kalender werden nicht gespeichert.",
  calendarActiveScheduleTitle: "Aktueller Dienstplan",
  calendarActiveScheduleLoading: "Dienstplan wird geladen …",
  calendarActiveScheduleNone:
    "Es ist noch kein Dienstplan auf dem Server hinterlegt.",
  calendarActiveScheduleNoneHint:
    "Ein Super-User muss zuerst einen Dienstplan hochladen.",
  calendarActiveScheduleUnavailable:
    "Der aktuelle Dienstplan konnte nicht geladen werden.",
  calendarActiveScheduleRetry: "Erneut versuchen",
  calendarActiveScheduleFilename: "Datei",
  calendarActiveScheduleUploadedAt: "Hochgeladen am",
  calendarActiveScheduleUploadedBy: "Hochgeladen von",
  calendarActiveScheduleSize: "Größe",
  calendarConvertActive: "Kalender erstellen",
  calendarHelpPersonal:
    "Der Kalender enthält Ihre eigenen Termine und die Termine für alle.",
  calendarHelpParticipants:
    "Die optionale Spalte „participants“ legt fest, für wen ein Termin gilt: Personalnummern, getrennt durch ; oder , (z. B. 101;204). Eine leere Zelle bedeutet: für alle.",
  converterScopePersonal: "Nur meine Termine",
  converterScopeFullHint:
    "Ohne Häkchen wird der vollständige Dienstplan mit allen Problemen erstellt.",
  converterScopePersonalUnavailable:
    "Nicht verfügbar: Ihrem Konto ist keine Personalnummer zugeordnet.",
  calendarStatusNoEvents: "Keine Termine",
  calendarNoPersonalEventsTitle: "Keine Termine für Sie",
  calendarNoPersonalEventsDescription:
    "Im aktuellen Dienstplan gibt es keine Termine für Sie. Es wurde keine Kalenderdatei erstellt.",
  calendarUploadTitle: "Dienstplan bereitstellen",
  calendarUploadSubmit: "Dienstplan hochladen",
  calendarUploading: "Wird hochgeladen …",
  calendarUploadReplaceNotice:
    "Ein neuer Upload ersetzt den aktuellen Dienstplan für alle Konten.",
  calendarUploadSuccess: "Der Dienstplan wurde auf dem Server hinterlegt.",
  calendarHelpStepUpload:
    "Dienstplan hochladen; er ersetzt den bisherigen für alle Konten.",
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
  errorNoActiveSchedule:
    "Es ist kein Dienstplan hinterlegt. Bitte wenden Sie sich an einen Super-User.",
  errorMissingPersonnelNumber:
    "Ihrem Konto ist keine Personalnummer zugeordnet. Bitte wenden Sie sich an einen Super-User, damit Ihre persönlichen Termine erstellt werden können.",
  errorInternal: "Die Konvertierung ist unerwartet fehlgeschlagen.",
  issueEmptyId: "Die Ereignis-ID fehlt.",
  issueEmptySummary: "Die Zusammenfassung fehlt.",
  issueEndDateBeforeStartDate: "Das Enddatum liegt vor dem Startdatum.",
  issueEndTimeBeforeStartTime: "Die Endzeit liegt vor der Startzeit.",
  issueDuplicateId: "Die Ereignis-ID wurde mehrfach verwendet.",
  authCheckingSession: "Anmeldung wird geprüft …",
  authSignInEyebrow: "Zugang",
  authSignInTitle: "Bei Feuerwehr Tools anmelden",
  authSignInIntro:
    "Melden Sie sich mit Ihrem lokalen Konto an, um die Werkzeuge zu verwenden.",
  authUsername: "Benutzername",
  authPassword: "Passwort",
  authSignIn: "Anmelden",
  authSigningIn: "Anmeldung läuft …",
  authSignOut: "Abmelden",
  authSignedInAs: "Angemeldet als",
  authAccountMenuLabel: "Konto",
  authInvalidCredentials: "Benutzername oder Passwort ist falsch.",
  authSessionExpired:
    "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  authUnexpectedError: "Die Anmeldung ist unerwartet fehlgeschlagen.",
  roleSuperUser: "Super-User",
  roleUser: "Benutzer",
  identityHeading: "Wer bist du",
  identityProfileLabel: "Dienstprofil",
  identityRankLabel: "Dienstgrad",
  identityZugLabel: "Zug",
  identityGruppeLabel: "Gruppe",
  identityPersonnelNumberLabel: "Personalnummer",
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
  footerCredit: "Sviluppato da PaoloRos.",
  notFoundEyebrow: "Errore 404",
  notFoundTitle: "Pagina non trovata",
  notFoundDescription: "La pagina richiesta non è disponibile.",
  backToDashboard: "Torna alla panoramica",
  dashboardEyebrow: "Pronti per il lavoro quotidiano",
  dashboardTitle: "Strumenti per i vigili del fuoco",
  dashboardDescription:
    "Strumenti pratici per le attività ordinarie.",
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
    "Il piano dei turni caricato resta in locale su questo server; i calendari generati non vengono salvati.",
  calendarActiveScheduleTitle: "Piano dei turni attuale",
  calendarActiveScheduleLoading: "Caricamento del piano dei turni …",
  calendarActiveScheduleNone:
    "Sul server non è ancora presente alcun piano dei turni.",
  calendarActiveScheduleNoneHint:
    "Un super-utente deve prima caricare un piano dei turni.",
  calendarActiveScheduleUnavailable:
    "Non è stato possibile caricare il piano dei turni attuale.",
  calendarActiveScheduleRetry: "Riprova",
  calendarActiveScheduleFilename: "File",
  calendarActiveScheduleUploadedAt: "Caricato il",
  calendarActiveScheduleUploadedBy: "Caricato da",
  calendarActiveScheduleSize: "Dimensione",
  calendarConvertActive: "Crea il calendario",
  calendarHelpPersonal:
    "Il calendario contiene i tuoi impegni e quelli per tutti.",
  calendarHelpParticipants:
    "La colonna facoltativa «participants» indica per chi vale un impegno: numeri di matricola separati da ; o , (ad es. 101;204). Una cella vuota significa: per tutti.",
  converterScopePersonal: "Solo i miei impegni",
  converterScopeFullHint:
    "Senza la spunta viene creato il piano dei turni completo con tutti i problemi.",
  converterScopePersonalUnavailable:
    "Non disponibile: al tuo account non è assegnato un numero di matricola.",
  calendarStatusNoEvents: "Nessun impegno",
  calendarNoPersonalEventsTitle: "Nessun impegno per te",
  calendarNoPersonalEventsDescription:
    "Nel piano dei turni attuale non ci sono impegni per te. Non è stato creato alcun file calendario.",
  calendarUploadTitle: "Fornisci il piano dei turni",
  calendarUploadSubmit: "Carica il piano dei turni",
  calendarUploading: "Caricamento in corso …",
  calendarUploadReplaceNotice:
    "Un nuovo caricamento sostituisce il piano dei turni attuale per tutti gli account.",
  calendarUploadSuccess: "Il piano dei turni è stato salvato sul server.",
  calendarHelpStepUpload:
    "Carica il piano dei turni; sostituisce quello precedente per tutti gli account.",
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
  errorNoActiveSchedule:
    "Nessun piano dei turni disponibile. Rivolgiti a un super-utente.",
  errorMissingPersonnelNumber:
    "Al tuo account non è assegnato un numero di matricola. Rivolgiti a un super-utente per ricevere i tuoi impegni personali.",
  errorInternal: "La conversione non è riuscita a causa di un errore imprevisto.",
  issueEmptyId: "Manca l'ID dell'evento.",
  issueEmptySummary: "Manca il riepilogo.",
  issueEndDateBeforeStartDate: "La data di fine precede la data di inizio.",
  issueEndTimeBeforeStartTime: "L'ora di fine precede l'ora di inizio.",
  issueDuplicateId: "L'ID dell'evento è stato usato più volte.",
  authCheckingSession: "Verifica dell'accesso …",
  authSignInEyebrow: "Accesso",
  authSignInTitle: "Accedi a Feuerwehr Tools",
  authSignInIntro:
    "Accedi con il tuo account locale per utilizzare gli strumenti.",
  authUsername: "Nome utente",
  authPassword: "Password",
  authSignIn: "Accedi",
  authSigningIn: "Accesso in corso …",
  authSignOut: "Esci",
  authSignedInAs: "Connesso come",
  authAccountMenuLabel: "Account",
  authInvalidCredentials: "Nome utente o password non validi.",
  authSessionExpired: "La sessione è scaduta. Accedi di nuovo.",
  authUnexpectedError:
    "L'accesso non è riuscito a causa di un errore imprevisto.",
  roleSuperUser: "Super-utente",
  roleUser: "Utente",
  identityHeading: "Chi sei",
  identityProfileLabel: "Profilo di servizio",
  identityRankLabel: "Grado",
  identityZugLabel: "Zug",
  identityGruppeLabel: "Gruppe",
  identityPersonnelNumberLabel: "Matricola",
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
  no_active_schedule: "errorNoActiveSchedule",
  missing_personnel_number: "errorMissingPersonnelNumber",
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
