# Image Upload API Documentation

## Endpoint: POST `/api/teacher/questions/upload-image/`

### Purpose
Upload images for test questions (MCQ or Math Free Response). This endpoint handles image upload and returns the image URL.

### Request Format

**Content-Type:** `multipart/form-data`

**Required Fields:**
```javascript
{
  image: File,              // Image file (PNG, JPG, GIF, max 5MB)
  question_text: string,    // Question text
  passage_text: string,     // Passage text (can be empty)
  question_type: string,    // "mcq" or "math_free"
  marks: number,            // Question marks
  order: number,            // Question order
  test_group: number,       // Test group ID (use 0 for new questions)
  section: number,          // Section ID (use 0 for new questions)
  correct_answers: string   // For MCQ: "", For math_free: JSON array string
}
```

### Example Usage

#### For MCQ Question:
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('question_text', 'What is 2+2?');
formData.append('passage_text', '');
formData.append('question_type', 'mcq');
formData.append('marks', 1);
formData.append('order', 1);
formData.append('test_group', 0);
formData.append('section', 0);
formData.append('correct_answers', '');  // Empty for MCQ

const response = await teacherAPI.uploadQuestionImage(formData);
// Response: { image_url: "/media/question_images/file.jpg" }
```

#### For Math Free Response:
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('question_text', 'Solve the equation');
formData.append('passage_text', '');
formData.append('question_type', 'math_free');
formData.append('marks', 2);
formData.append('order', 1);
formData.append('test_group', 0);
formData.append('section', 0);
formData.append('correct_answers', '["42", "0.5"]');  // JSON string array

const response = await teacherAPI.uploadQuestionImage(formData);
// Response: { image_url: "/media/question_images/file.jpg" }
```

### Response Format

**Success (200):**
```json
{
  "image_url": "/media/question_images/filename.jpg",
  "image": "/media/question_images/filename.jpg",
  "question_text": "...",
  "question_type": "mcq",
  ...
}
```

**Error (400/401/500):**
```json
{
  "detail": "Error message",
  "error": "Error description"
}
```

### Flow in Application

1. **User selects image** → File input onChange
2. **Validate file** → Size (5MB) and type (image/*)
3. **Upload to API** → POST `/api/teacher/questions/upload-image/`
4. **Get URL from response** → Extract `image_url` or `image`
5. **Construct full URL** → Add base URL if relative path
6. **Store in state** → Save to `question.image_url`
7. **On test submit** → Send URL in `image` field

### Implementation in CreateTestModal

```javascript
// Upload image
const response = await teacherAPI.uploadQuestionImage(formData);
const imageUrl = response.data.image_url || response.data.image;

// Store full URL
const fullUrl = imageUrl.startsWith('http') 
  ? imageUrl 
  : VITE_API_BASE_URL + imageUrl;

// Save to question
question.image_url = fullUrl;

// Later, on test submit
const testData = {
  ...
  questions: [{
    ...
    image: question.image_url || '',  // Send as 'image' field
    ...
  }]
};
```

### Error Handling

Common errors and solutions:

1. **401 Unauthorized** → User not logged in or token expired
2. **400 Bad Request** → Missing required fields or invalid data
3. **413 Payload Too Large** → Image file exceeds 5MB
4. **500 Server Error** → Backend issue, contact admin

### Notes

- Images are stored in `/media/question_images/` directory
- Temporary `test_group` and `section` values (0) are used during upload
- Actual IDs are assigned when test is created
- Image URLs are stored as strings in database
- Both MCQ and Math Free questions support images
