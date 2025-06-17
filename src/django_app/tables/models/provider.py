from django.db import models


class Provider(models.Model):
    name = models.TextField(unique=True)

    def __str__(self):
        return self.name
