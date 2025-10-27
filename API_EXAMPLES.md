# Attendance API Examples

## Overview

This document shows the JSON structure for the attendance system API.

---

## 1. Sending Attendance Data (POST to webhook)

When saving attendance for a date, send:

```json
POST https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai

{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "date": "2025-10-27",
  "arrivals": [
    {
      "id": "rec123abc",
      "arrived": true,
      "childName": "ניקו ליבוביץ",
      "parentName": "דני ליבוביץ",
      "parentPhone": "0521234567",
      "note": "הגיע מאוחר ב-10 דקות"
    },
    {
      "id": "rec456def",
      "arrived": true,
      "childName": "יהונתן אלבז",
      "parentName": "שרה אלבז",
      "parentPhone": "0527654321",
      "note": ""
    },
    {
      "id": "rec789ghi",
      "arrived": false,
      "childName": "איתי אברהם",
      "parentName": "מיכל אברהם",
      "parentPhone": "0521112222",
      "note": "הודיע שלא יגיע"
    }
  ]
}
```

---

## 2. Receiving Existing Attendance (GET from API)

When user reopens the form for a specific date, your API should return:

```json
GET /api/attendance/{cohortId}/{date}

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

This will pre-populate:

- The checkboxes based on the `attendance` object
- The notes based on the `notes` object

---

## 3. Scenario: New Student Joins Mid-Lesson

### Step 1: Mark initial attendance (10 students present)

```json
POST https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai

{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "date": "2025-10-27",
  "arrivals": [
    { "id": "rec123abc", "arrived": true },
    { "id": "rec456def", "arrived": true },
    { "id": "rec789ghi", "arrived": false },
    // ... 7 more students
  ]
}
```

### Step 2: New student arrives, add them to attendance

```json
POST https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai

{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "date": "2025-10-27",
  "arrivals": [
    { "id": "rec123abc", "arrived": true },
    { "id": "rec456def", "arrived": true },
    { "id": "rec789ghi", "arrived": false },
    // ... original students ...
    {
      "id": "rec999NEW",
      "arrived": true,
      "childName": "עוד ילד חדש",
      "parentName": "הורה",
      "parentPhone": "0501234567"
    }
  ]
}
```

### Step 3: Next time opening that date

```json
GET /api/attendance/{cohortId}/2025-10-27

{
  "date": "2025-10-27",
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "attendance": {
    "rec123abc": true,
    "rec456def": true,
    "rec789ghi": false,
    // ... all original students ...
    "rec999NEW": true  // New student now included
  }
}
```

---

## 4. History View Data Structure

For the history matrix view, return:

```json
GET /api/attendance-history/{cohortId}?startDate=2025-10-14&endDate=2025-10-27

{
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "dates": ["2025-10-14", "2025-10-15", "2025-10-17", "2025-10-20", "2025-10-22", "2025-10-24", "2025-10-27"], // All dates to show in columns
  "history": {
    "rec123abc": {
      "2025-10-14": true,
      "2025-10-15": false,
      "2025-10-17": true,
      "2025-10-20": true,
      "2025-10-22": false,
      "2025-10-24": true,
      "2025-10-27": true
    },
    "rec456def": {
      "2025-10-14": true,
      "2025-10-15": true,
      "2025-10-17": false,
      "2025-10-20": true,
      "2025-10-22": false,
      "2025-10-24": true,
      "2025-10-27": true
    }
    // ... more students
  },
  "notes": {
    "rec123abc": {
      "2025-10-14": "",
      "2025-10-15": "לא הודיע מראש",
      "2025-10-17": "",
      "2025-10-20": "",
      "2025-10-22": "",
      "2025-10-24": "",
      "2025-10-27": ""
    },
    "rec456def": {
      "2025-10-14": "",
      "2025-10-15": "",
      "2025-10-17": "",
      "2025-10-20": "",
      "2025-10-22": "היה חולה",
      "2025-10-24": "",
      "2025-10-27": ""
    }
    // ... more students
  }
}
```

**Important**:

- The `dates` array should contain ALL dates you want to display as columns in the matrix
- EVERY student must have an entry for EVERY date in the `dates` array
- Use `true` for present, `false` for absent, or omit the key if not marked yet
- The UI will automatically fill in missing dates with `false` (unmarked)

---

## Key Points

1. **Sending**: Always send complete list with all student IDs and their notes
2. **Receiving**: Return simple map of `studentId -> attended (boolean)` and `studentId -> note text`
3. **Notes**: Store and retrieve notes for each student on each date
4. **New students**: Add them to the arrivals array and they'll be included in future fetches
5. **Overwrite**: Each save completely replaces the previous attendance for that date
6. **History**: Return all dates you have attendance for, including notes for each date

---

## Error Response

If no attendance found for a date, return:

```json
{
  "date": "2025-10-27",
  "cohortId": "גורדון - שח מט - א-ב - - שני - 16:30",
  "attendance": {},
  "message": "לא נמצאו נתוני הגעה לתאריך זה"
}
```
