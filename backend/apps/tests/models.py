from django.db import models
from django.conf import settings

DIFFICULTY_LEVELS = [
    ("easy", "Easy"),
    ("medium", "Medium"),
    ("hard", "Hard"),
]


class TestGroup(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    difficulty = models.CharField(max_length=50, choices=DIFFICULTY_LEVELS, default="medium")
    total_marks = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_preview = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    passing_marks = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.title


class TestSection(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    time_limit = models.IntegerField(null=True, blank=True, help_text="Time limit in minutes")
    order = models.PositiveIntegerField(default=0)
    test_group = models.ForeignKey(
        "TestGroup",
        on_delete=models.CASCADE,
        related_name="sections",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} ({self.test_group.title if self.test_group else 'No Group'})"


class Question(models.Model):
    QUESTION_TYPES = [
        ("mcq", "Multiple Choice"),
        ("math_free", "Math Free Answer"),
    ]

    # canonical question fields
    question_text = models.TextField(blank=True, null=True)
    passage_text = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="uploads/questions/", null=True, blank=True)
    test_group = models.ForeignKey("TestGroup", on_delete=models.CASCADE, null=True, blank=True)
    section = models.ForeignKey(
        "TestSection", on_delete=models.CASCADE, related_name="questions", null=True, blank=True
    )
    marks = models.IntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default="mcq")
    correct_answers = models.JSONField(default=list, blank=True)  # for math_free expected answers

    # NOTE: legacy fields removed (text, options, answer). Re-add only if you need DB compatibility.

    def __str__(self):
        q = self.question_text or ""
        return (q[:50] + "...") if q else "Untitled Question"


class Choice(models.Model):
    LABEL_CHOICES = [("A", "A"), ("B", "B"), ("C", "C"), ("D", "D")]

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    choice_text = models.TextField()
    choice_label = models.CharField(max_length=1, choices=LABEL_CHOICES)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["choice_label"]

    def __str__(self):
        return f"{self.choice_label}. {self.choice_text}"


class StudentGroup(models.Model):
    """Groups for organizing students"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_groups"
    )
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="student_groups", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["name", "teacher"]

    def __str__(self):
        return f"{self.teacher.username}'s Group: {self.name}"

    @property
    def student_count(self):
        return self.students.count()


class TestAssignment(models.Model):
    """Assignment of tests to student groups"""
    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name="assignments")
    student_group = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name="test_assignments")
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assigned_tests")
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["test_group", "student_group"]

    def __str__(self):
        return f"{self.test_group.title} → {self.student_group.name}"


class StudentTestAttempt(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("timeout", "Timeout"),
    ]

    test_group = models.ForeignKey(TestGroup, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="test_attempts")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    current_section = models.ForeignKey(TestSection, on_delete=models.SET_NULL, null=True, blank=True)
    total_score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)

    class Meta:
        unique_together = ["test_group", "student"]

    def __str__(self):
        return f"{self.student.username} - {self.test_group.title} ({self.status})"


class SectionAttempt(models.Model):
    """Track individual section attempts within a test"""
    test_attempt = models.ForeignKey(StudentTestAttempt, on_delete=models.CASCADE, related_name="section_attempts")
    section = models.ForeignKey(TestSection, on_delete=models.CASCADE)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(default=0, help_text="Time taken in seconds")
    score = models.IntegerField(default=0)
    total_marks = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=StudentTestAttempt.STATUS_CHOICES, default="not_started")

    class Meta:
        unique_together = ["test_attempt", "section"]

    def __str__(self):
        return f"{self.test_attempt.student.username} - {self.section.name}"


class StudentAnswer(models.Model):
    test_attempt = models.ForeignKey(StudentTestAttempt, on_delete=models.CASCADE, related_name="answers")
    section_attempt = models.ForeignKey(
        SectionAttempt,
        on_delete=models.CASCADE,
        related_name="answers",
        null=True,   # ✅ allow empty
        blank=True,  # ✅ allow empty in forms
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    text_answer = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        q_text = (self.question.question_text or "")[:30]
        return f"{self.test_attempt.student.username} - {q_text}..."

    def save(self, *args, **kwargs):
        """
        Determine correctness:
        - If a choice is selected, use that choice's is_correct.
        - Else for math_free, compare against question.correct_answers (try numeric compare first).
        """
        try:
            if self.selected_choice:
                self.is_correct = bool(self.selected_choice.is_correct)
                # clear text_answer to avoid ambiguity (optional)
                # self.text_answer = None
            else:
                q = self.question
                if q.question_type == "math_free" and self.text_answer not in (None, ""):
                    ta = str(self.text_answer).strip()
                    correct = False
                    for cand in q.correct_answers or []:
                        try:
                            # numeric compare (allow integers/floats)
                            if float(str(cand).strip()) == float(ta):
                                correct = True
                                break
                        except Exception:
                            # fallback to normalized string compare
                            if str(cand).strip().lower() == ta.lower():
                                correct = True
                                break
                    self.is_correct = correct
        except Exception:
            # don't raise here; preserve current is_correct if something unexpected happens
            pass

        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["test_attempt", "question"], name="uniq_attempt_question")
        ]
