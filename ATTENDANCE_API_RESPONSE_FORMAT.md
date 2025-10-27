# Attendance API Response Formats

This document describes the exact JSON response formats your Make.com webhooks should return for the attendance system.

---

## 1. Single Date Attendance Response

**When requested:** When the frontend asks for attendance data for a specific cohort and date.

**Expected Response Format:**

```json
{
  "date": "2025-10-27",
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "attendance": {
    "rec123abc": true,
    "rec456def": true,
    "rec789ghi": false
  },
  "notes": {
    "rec123abc": "הגיע מאוחר ב-10 דקות",
    "rec789ghi": "הודיע שלא יגיע"
  }
}
```

### Field Descriptions:

- **`date`** (required): The date in YYYY-MM-DD format
- **`cohortId`** (required): The cohort identifier
- **`attendance`** (required): Object mapping student IDs to boolean values
  - Key: Student ID (Airtable record ID)
  - Value: `true` if present, `false` if absent
- **`notes`** (optional): Object mapping student IDs to note text
  - Key: Student ID (Airtable record ID)
  - Value: Note text string (can be empty string `""` for no note)

---

## 2. Full History Response

**When requested:** When the frontend asks for full attendance history (without date range).

**Expected Response Format:**

```json
{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "dates": ["2025-09-30", "2025-10-13", "2025-10-22", "2025-10-27", "2025-10-29", "2025-11-01"],
  "history": {
    "rec123abc": {
      "2025-09-30": true,
      "2025-10-13": true,
      "2025-10-22": true,
      "2025-10-27": true,
      "2025-10-29": false,
      "2025-11-01": false
    },
    "rec456def": {
      "2025-09-30": true,
      "2025-10-13": false,
      "2025-10-22": false,
      "2025-10-27": true,
      "2025-10-29": true,
      "2025-11-01": true
    },
    "rec789ghi": {
      "2025-09-30": false,
      "2025-10-13": true,
      "2025-10-22": true,
      "2025-10-27": false,
      "2025-10-29": true,
      "2025-11-01": false
    }
  },
  "notes": {
    "rec123abc": {
      "2025-09-30": "",
      "2025-10-13": "",
      "2025-10-22": "",
      "2025-10-27": "",
      "2025-10-29": "לא הודיע מראש",
      "2025-11-01": ""
    },
    "rec456def": {
      "2025-09-30": "",
      "2025-10-13": "היה חולה",
      "2025-10-22": "",
      "2025-10-27": "",
      "2025-10-29": "",
      "2025-11-01": ""
    },
    "rec789ghi": {
      "2025-09-30": "",
      "2025-10-13": "",
      "2025-10-22": "",
      "2025-10-27": "הודיע שהשיעור",
      "2025-10-29": "",
      "2025-11-01": ""
    }
  }
}
```

### Field Descriptions:

- **`cohortId`** (required): The cohort identifier
- **`dates`** (optional but recommended): Array of all dates that have attendance data
  - Format: YYYY-MM-DD strings
  - Should be sorted (ascending or descending)
  - If not provided, dates will be extracted from the history object
- **`history`** (required): Nested object mapping students to their attendance records
  - First level key: Student ID (Airtable record ID)
  - Second level key: Date in YYYY-MM-DD format
  - Value: `true` if present, `false` if absent
- **`notes`** (optional): Nested object mapping students to their notes by date
  - First level key: Student ID (Airtable record ID)
  - Second level key: Date in YYYY-MM-DD format
  - Value: Note text string (can be empty string `""` for no note)

---

## 3. Empty/No Data Response

When no attendance data exists for the requested date:

**Single Date:**

```json
{
  "date": "2025-10-27",
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "attendance": {},
  "notes": {}
}
```

**Full History:**

```json
{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "dates": [],
  "history": {},
  "notes": {}
}
```

---

## 4. Important Notes

1. **Consistency**: All dates should be in `YYYY-MM-DD` format (ISO 8601 date format)
2. **Student IDs**: Use the exact Airtable record IDs (e.g., `"rec123abc"`)
3. **Dates in history**: Every student should have an entry for every date in the `dates` array
4. **Missing data**: If a student doesn't have data for a date, use `false` for attendance and `""` for notes
5. **Notes are optional**: You can omit the `notes` field entirely if there are no notes, or include it with empty strings
6. **Empty notes**: Use empty string `""` for dates with no note, not `null` or omitted

---

## 5. Request Parameters

**Single Date Request:**

```json
{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "date": "2025-10-27"
}
```

**Full History Request:**

```json
{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "fullHistory": true
}
```

---

## 6. Example Implementation Flow

1. Receive request with `cohortId` and optional `date` or `fullHistory` flag
2. Query your database/storage for attendance records
3. Format the response according to the structures above
4. Return the JSON response

The frontend will automatically handle displaying this data in the UI.
