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
      "parentPhone": "0521234567"
    },
    {
      "id": "rec456def",
      "arrived": true,
      "childName": "יהונתן אלבז",
      "parentName": "שרה אלבז",
      "parentPhone": "0527654321"
    },
    {
      "id": "rec789ghi",
      "arrived": false,
      "childName": "איתי אברהם",
      "parentName": "מיכל אברהם",
      "parentPhone": "0521112222"
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
  }
}
```

This will pre-populate the checkboxes based on the `attendance` object.

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
  "history": {
    "rec123abc": {
      "2025-10-27": true,
      "2025-10-26": true,
      "2025-10-25": false,
      "2025-10-24": true,
      // ... more dates
    },
    "rec456def": {
      "2025-10-27": true,
      "2025-10-26": false,
      "2025-10-25": true,
      "2025-10-24": true,
      // ... more dates
    }
    // ... more students
  }
}
```

---

## Key Points

1. **Sending**: Always send complete list with all student IDs
2. **Receiving**: Return simple map of `studentId -> attended (boolean)`
3. **New students**: Add them to the arrivals array and they'll be included in future fetches
4. **Overwrite**: Each save completely replaces the previous attendance for that date
5. **History**: Return all dates you have attendance for

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

