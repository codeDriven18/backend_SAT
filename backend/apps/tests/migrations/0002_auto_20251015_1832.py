from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('tests', '0001_initial'),  # keep this as is
    ]

    operations = [
        migrations.AlterField(
            model_name='studentanswer',
            name='section_attempt',
            field=models.ForeignKey(
                'tests.SectionAttempt',
                null=True,
                blank=True,
                on_delete=models.CASCADE,
                related_name='answers',
            ),
        ),
    ]
