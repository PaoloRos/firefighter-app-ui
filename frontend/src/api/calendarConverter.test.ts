import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CALENDAR_CONVERTER_ENDPOINT,
  CalendarConverterContractError,
  convertCalendar,
  type ConversionResponse,
} from "./calendarConverter";

const successResponse: ConversionResponse = {
  status: "success",
  total_count: 1,
  converted_count: 1,
  skipped_count: 0,
  invalid_events: [],
  calendar: {
    filename: "schedule.ics",
    mime_type: "text/calendar;charset=utf-8",
    ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calendar converter API client", () => {
  it("posts exactly one file field to the versioned conversion endpoint", async () => {
    let requestInput: RequestInfo | URL | undefined;
    let requestInit: RequestInit | undefined;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requestInput = input;
        requestInit = init;
        return jsonResponse(successResponse);
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["schedule"], "schedule.csv", {
      type: "text/csv",
    });

    const result = await convertCalendar(file);

    expect(result).toEqual({ ok: true, response: successResponse });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(requestInput).toBe(CALENDAR_CONVERTER_ENDPOINT);
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.headers).toBeUndefined();
    expect(requestInit?.body).toBeInstanceOf(FormData);

    const formData = requestInit?.body;
    if (!(formData instanceof FormData)) {
      throw new Error("Expected a FormData request body");
    }
    expect(Array.from(formData.keys())).toEqual(["file"]);
    expect(formData.get("file")).toBe(file);
  });

  it("accepts partial results with stable converter issue codes", async () => {
    const partialResponse: ConversionResponse = {
      status: "partial",
      total_count: 2,
      converted_count: 1,
      skipped_count: 1,
      invalid_events: [
        {
          source_position: {
            event_index: 2,
            row: 3,
            worksheet: null,
          },
          id: "",
          summary: "Invalid",
          issue_codes: ["empty_id"],
        },
      ],
      calendar: {
        filename: "schedule.ics",
        mime_type: "text/calendar;charset=utf-8",
        ics_text: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(partialResponse)),
    );

    const result = await convertCalendar(new File(["schedule"], "schedule.csv"));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected a successful API result");
    }
    expect(result.response.invalid_events[0]?.issue_codes).toEqual(["empty_id"]);
  });

  it("returns structured API errors without interpreting their messages", async () => {
    const backendMessage = "This wording may change without affecting the UI.";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            code: "oversized_upload",
            message: backendMessage,
          },
          413,
        ),
      ),
    );

    const result = await convertCalendar(new File(["schedule"], "schedule.csv"));

    expect(result).toEqual({
      ok: false,
      status: 413,
      error: {
        code: "oversized_upload",
        message: backendMessage,
      },
    });
  });

  it("accepts a normal all-invalid failure without a calendar", async () => {
    const failureResponse: ConversionResponse = {
      status: "failure",
      total_count: 1,
      converted_count: 0,
      skipped_count: 1,
      invalid_events: [
        {
          source_position: {
            event_index: 1,
            row: 2,
            worksheet: "Schedule",
          },
          id: "",
          summary: "Invalid",
          issue_codes: ["empty_id"],
        },
      ],
      calendar: null,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(failureResponse)),
    );

    await expect(
      convertCalendar(new File(["schedule"], "schedule.xlsx")),
    ).resolves.toEqual({
      ok: true,
      response: failureResponse,
    });
  });

  it("rejects contradictory conversion responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...successResponse,
          skipped_count: 1,
        }),
      ),
    );

    await expect(
      convertCalendar(new File(["schedule"], "schedule.csv")),
    ).rejects.toThrow(CalendarConverterContractError);
  });

  it("rejects unknown error and issue codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            code: "server_wording",
            message: "Unknown error code",
          },
          500,
        ),
      ),
    );

    await expect(
      convertCalendar(new File(["schedule"], "schedule.csv")),
    ).rejects.toThrow(CalendarConverterContractError);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "failure",
          total_count: 1,
          converted_count: 0,
          skipped_count: 1,
          invalid_events: [
            {
              source_position: {
                event_index: 1,
                row: 2,
                worksheet: null,
              },
              id: "",
              summary: "",
              issue_codes: ["unknown_issue"],
            },
          ],
          calendar: null,
        }),
      ),
    );

    await expect(
      convertCalendar(new File(["schedule"], "schedule.csv")),
    ).rejects.toThrow(CalendarConverterContractError);
  });

  it("rejects non-JSON responses as contract errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("<html>failure</html>", {
            status: 500,
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );

    await expect(
      convertCalendar(new File(["schedule"], "schedule.csv")),
    ).rejects.toThrow("non-JSON response");
  });

  it("forwards an abort signal without adding UI behavior", async () => {
    let requestSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal;
        return jsonResponse(successResponse);
      }),
    );
    const controller = new AbortController();

    await convertCalendar(new File(["schedule"], "schedule.csv"), {
      signal: controller.signal,
    });

    expect(requestSignal).toBe(controller.signal);
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
