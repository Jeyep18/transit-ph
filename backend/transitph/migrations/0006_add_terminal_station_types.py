from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transitph', '0005_alter_graphedge_distance_km'),
    ]

    operations = [
        migrations.AlterField(
            model_name='station',
            name='station_type',
            field=models.CharField(
                choices=[
                    ('JEEPNEY_STOP', 'Jeepney Stop'),
                    ('TRICYCLE_TERMINAL', 'Tricycle Terminal'),
                    ('JEEPNEY_TERMINAL', 'Jeepney Terminal'),
                    ('BUS_TERMINAL', 'Bus Terminal'),
                    ('MIXED_TERMINAL', 'Mixed Public Transport Terminal'),
                ],
                default='JEEPNEY_STOP',
                max_length=20,
            ),
        ),
    ]
