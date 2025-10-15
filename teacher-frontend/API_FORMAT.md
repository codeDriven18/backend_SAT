## Test Creation API Format

### Backend Expects:

```json
{
  "title": "string",
  "description": "string",
  "difficulty": "easy",
  "passing_marks": 2147483647,
  "is_active": true,
  "is_public": true,
  "sections": [
    {
      "name": "string",
      "description": "string",
      "time_limit": 2147483647,
      "order": 2147483647,
      "questions": [
        {
          "question_text": "string",
          "passage_text": "string",
          "image": "string",          // ← URL as string, not file
          "marks": 2147483647,
          "order": 2147483647,
          "question_type": "mcq",
          "choices": [
            {
              "choice_text": "string",
              "choice_label": "string",
              "is_correct": true
            }
          ],
          "correct_answers": "string",  // ← JSON string for math_free
          "section": 0                   // ← Section ID (optional on create)
        }
      ]
    }
  ]
}
```

### Our Implementation:

1. **MCQ Questions**:
   - `question_type`: "mcq"
   - `choices`: Array of choice objects
   - `correct_answers`: "" (empty string)
   - `image`: URL string from uploaded image

2. **Math Free Questions**:
   - `question_type`: "math_free"
   - `choices`: [] (empty array)
   - `correct_answers`: JSON string array (e.g., '["42", "0.5"]')
   - `image`: URL string from uploaded image

3. **Image Upload Flow**:
   - Step 1: Upload image → GET URL
   - Step 2: Store URL in `image_url` state
   - Step 3: On submit, send URL in `image` field
