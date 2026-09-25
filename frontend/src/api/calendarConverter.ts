export const CALENDAR_CONVERTER_ENDPOINT =
  "/api/v1/tools/calendar-converter/convert";
export const ACTIVE_SCHEDULE_ENDPOINT =
  "/api/v1/tools/calendar-converter/schedule";
export const ACTIVE_SCHEDULE_CONVERT_ENDPOINT =
  "/api/v1/tools/calendar-converter/schedule/convert";

export type ActiveSchedule = {
  filename: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by: string;
};

export type ActiveScheduleResponse = {
  schedule: ActiveSchedule | null;
};

export type ActiveScheduleResult =
  | { ok: true; response: ActiveScheduleResponse }
  | { ok: false; status: number; error: FatalErrorResponse };

export type ConversionStatus = "success" | "partial" | "failure";

export type ApiErrorCode =
  | "missing_filename"
  | "unsupported_file_type"
  | "oversized_upload"
  | "malformed_csv"
  | "malformed_xlsx"
  | "input_read_error"
  | "no_active_schedule"
  | "missing_personnel_number"
  | "internal_error";

/**
 * Which events a conversion of the active schedule returns: `personal` keeps
 * the signed-in account's events plus the events for everyone, `full` returns
 * the whole schedule and is reserved for a super-user.
 */
export type ConversionScope = "personal" | "full";

export type ConverterIssueCode =
  | "empty_id"
  | "empty_summary"
  | "end_date_before_start_date"
  | "end_time_before_start_time"
  | "duplicate_id";

export type SourcePosition = {
  event_index: number;
  row: number;
  worksheet: string | null;
};

export type InvalidEvent = {
  source_position: SourcePosition;
  id: string;
  summary: string;
  issue_codes: ConverterIssueCode[];
};

export type Calendar = {
  filename: string;
  mime_type: "text/calendar;charset=utf-8";
  ics_text: string;
};

export type ConversionResponse = {
  status: ConversionStatus;
  total_count: number;
  converted_count: number;
  skipped_count: number;
  invalid_events: InvalidEvent[];
  calendar: Calendar | null;
};

export type FatalErrorResponse = {
  code: ApiErrorCode;
  message: string;
};

export type CalendarConverterResult =
  | {
      ok: true;
      response: ConversionResponse;
    }
  | {
      ok: false;
      status: number;
      error: FatalErrorResponse;
    };

export class CalendarConverterContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarConverterContractError";
  }
}

type ConvertCalendarOptions = {
  signal?: AbortSignal;
};

const conversionStatuses = new Set<ConversionStatus>([
  "success",
  "partial",
  "failure",
]);

const apiErrorCodes = new Set<ApiErrorCode>([
  "missing_filename",
  "unsupported_file_type",
  "oversized_upload",
  "malformed_csv",
  "malformed_xlsx",
  "input_read_error",
  "no_active_schedule",
  "missing_personnel_number",
  "internal_error",
]);

const converterIssueCodes = new Set<ConverterIssueCode>([
  "empty_id",
  "empty_summary",
  "end_date_before_start_date",
  "end_time_before_start_time",
  "duplicate_id",
]);

export async function convertCalendar(
  file: File,
  options: ConvertCalendarOptions = {},
): Promise<CalendarConverterResult> {
  const formData = new FormData();
  formData.append("file", file);

  const httpResponse = await fetch(CALENDAR_CONVERTER_ENDPOINT, {
    method: "POST",
    body: formData,
    signal: options.signal,
  });
  const payload: unknown = await readJson(httpResponse);

  if (httpResponse.ok) {
    if (!isConversionResponse(payload)) {
      throw new CalendarConverterContractError(
        "The calendar converter returned an invalid success response.",
      );
    }

    return {
      ok: true,
      response: payload,
    };
  }

  if (!isFatalErrorResponse(payload)) {
    throw new CalendarConverterContractError(
      "The calendar converter returned an invalid error response.",
    );
  }

  return {
    ok: false,
    status: httpResponse.status,
    error: payload,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new CalendarConverterContractError(
      "The calendar converter returned a non-JSON response.",
    );
  }
}

function isConversionResponse(value: unknown): value is ConversionResponse {
  if (!isRecord(value)) {
    return false;
  }

  const status = value.status;
  const totalCount = value.total_count;
  const convertedCount = value.converted_count;
  const skippedCount = value.skipped_count;
  const invalidEvents = value.invalid_events;
  const calendar = value.calendar;

  if (
    typeof status !== "string" ||
    !conversionStatuses.has(status as ConversionStatus) ||
    !isNonNegativeInteger(totalCount) ||
    !isNonNegativeInteger(convertedCount) ||
    !isNonNegativeInteger(skippedCount) ||
    !Array.isArray(invalidEvents) ||
    !invalidEvents.every(isInvalidEvent) ||
    !(calendar === null || isCalendar(calendar)) ||
    totalCount !== convertedCount + skippedCount ||
    skippedCount !== invalidEvents.length
  ) {
    return false;
  }

  if (status === "success") {
    return skippedCount === 0 && calendar !== null;
  }
  if (status === "partial") {
    return convertedCount > 0 && skippedCount > 0 && calendar !== null;
  }
  return convertedCount === 0 && calendar === null;
}

function isInvalidEvent(value: unknown): value is InvalidEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isSourcePosition(value.source_position) &&
    typeof value.id === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.issue_codes) &&
    value.issue_codes.length > 0 &&
    value.issue_codes.every(
      (code) =>
        typeof code === "string" &&
        converterIssueCodes.has(code as ConverterIssueCode),
    )
  );
}

function isSourcePosition(value: unknown): value is SourcePosition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.event_index) &&
    isPositiveInteger(value.row) &&
    (value.worksheet === null || typeof value.worksheet === "string")
  );
}

function isCalendar(value: unknown): value is Calendar {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.filename === "string" &&
    value.filename.length > 0 &&
    value.mime_type === "text/calendar;charset=utf-8" &&
    typeof value.ics_text === "string"
  );
}

function isFatalErrorResponse(value: unknown): value is FatalErrorResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.code === "string" &&
    apiErrorCodes.has(value.code as ApiErrorCode) &&
    typeof value.message === "string" &&
    value.message.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

export async function fetchActiveSchedule(
  options: ConvertCalendarOptions = {},
): Promise<ActiveScheduleResult> {
  const httpResponse = await fetch(ACTIVE_SCHEDULE_ENDPOINT, {
    signal: options.signal,
  });
  return activeScheduleResult(httpResponse);
}

export async function uploadActiveSchedule(
  file: File,
  options: ConvertCalendarOptions = {},
): Promise<ActiveScheduleResult> {
  const formData = new FormData();
  formData.append("file", file);

  const httpResponse = await fetch(ACTIVE_SCHEDULE_ENDPOINT, {
    method: "PUT",
    body: formData,
    signal: options.signal,
  });
  return activeScheduleResult(httpResponse);
}

export async function convertActiveSchedule(
  options: ConvertCalendarOptions & { scope?: ConversionScope } = {},
): Promise<CalendarConverterResult> {
  const scope = options.scope ?? "personal";
  const endpoint = `${ACTIVE_SCHEDULE_CONVERT_ENDPOINT}?scope=${scope}`;
  const httpResponse = await fetch(endpoint, {
    method: "POST",
    signal: options.signal,
  });
  const payload: unknown = await readJson(httpResponse);

  if (httpResponse.ok) {
    if (!isConversionResponse(payload)) {
      throw new CalendarConverterContractError(
        "The calendar converter returned an invalid success response.",
      );
    }

    return { ok: true, response: payload };
  }

  if (!isFatalErrorResponse(payload)) {
    throw new CalendarConverterContractError(
      "The calendar converter returned an invalid error response.",
    );
  }

  return { ok: false, status: httpResponse.status, error: payload };
}

async function activeScheduleResult(
  httpResponse: Response,
): Promise<ActiveScheduleResult> {
  const payload: unknown = await readJson(httpResponse);

  if (httpResponse.ok) {
    if (!isActiveScheduleResponse(payload)) {
      throw new CalendarConverterContractError(
        "The calendar converter returned an invalid schedule response.",
      );
    }

    return { ok: true, response: payload };
  }

  if (!isFatalErrorResponse(payload)) {
    throw new CalendarConverterContractError(
      "The calendar converter returned an invalid error response.",
    );
  }

  return { ok: false, status: httpResponse.status, error: payload };
}

function isActiveScheduleResponse(
  value: unknown,
): value is ActiveScheduleResponse {
  if (!isRecord(value)) {
    return false;
  }

  const { schedule } = value;
  return schedule === null || isActiveSchedule(schedule);
}

function isActiveSchedule(value: unknown): value is ActiveSchedule {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.filename === "string" &&
    value.filename.length > 0 &&
    isNonNegativeInteger(value.size_bytes) &&
    typeof value.uploaded_by === "string" &&
    value.uploaded_by.length > 0 &&
    typeof value.uploaded_at === "string" &&
    Number.isFinite(Date.parse(value.uploaded_at))
  );
}
