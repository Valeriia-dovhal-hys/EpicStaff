from django.db import models


class Provider(models.Model):
    name = models.TextField(unique=True)

    def __str__(self):
        return self.name


class LLMModel(models.Model):
    name = models.TextField()
    comments = models.TextField(null=True, blank=True)
    context_size = models.IntegerField(default=0)
    llm_provider = models.ForeignKey(Provider, on_delete=models.PROTECT)
    base_url = models.URLField(null=True, blank=True)
    deployment = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class EmbeddingModel(models.Model):
    name = models.TextField()
    embedding_provider = models.ForeignKey(
        Provider, on_delete=models.SET_NULL, null=True
    )


class ManagerLLMModel(models.Model):
    llm_model = models.ForeignKey(LLMModel, on_delete=models.CASCADE)
    num_ctx = models.IntegerField()


class Tool(models.Model):
    name = models.TextField()
    description = models.TextField()
    requires_model = models.BooleanField()

    model = models.ForeignKey(LLMModel, on_delete=models.SET_NULL, null=True)
    embedding_model = models.ForeignKey(
        EmbeddingModel, on_delete=models.SET_NULL, null=True
    )

    def __str__(self):
        return self.description


class EnabledTools(models.Model):
    tools = models.ManyToManyField(Tool)


class Agent(models.Model):
    role = models.TextField()
    goal = models.TextField()
    backstory = models.TextField()
    tools = models.ManyToManyField(Tool)
    allow_delegation = models.BooleanField(default=False)
    verbose = models.BooleanField(default=False)
    memory = models.TextField(null=True, blank=True)
    max_iter = models.IntegerField()
    llm_model = models.ForeignKey(
        LLMModel, on_delete=models.SET_NULL, null=True, related_name="primary_agents"
    )
    temperature = models.FloatField()
    fcm_llm_model = models.ForeignKey(
        LLMModel, on_delete=models.SET_NULL, null=True, related_name="fcm_agents"
    )

    def __str__(self):
        return self.role


class Crew(models.Model):
    class Process(models.TextChoices):
        SEQUENTIAL = "sequential"
        HIERARCHICAL = "hierarchical"

    comments = models.TextField(null=True, blank=True)
    name = models.TextField()
    assignment = models.TextField()
    agents = models.ManyToManyField(Agent)
    process = models.CharField(
        max_length=255, choices=Process, default=Process.SEQUENTIAL
    )
    verbose = models.BooleanField(default=False)
    memory = models.BooleanField(default=False)
    embedding_model = models.ForeignKey(
        EmbeddingModel, on_delete=models.SET_NULL, null=True
    )
    manager_llm_model = models.ForeignKey(
        ManagerLLMModel, on_delete=models.SET_NULL, null=True
    )
    temperature = models.FloatField()

    def __str__(self):
        return self.name


class Task(models.Model):
    crew = models.ForeignKey(Crew, on_delete=models.SET_NULL, null=True)
    name = models.TextField()
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True)
    instructions = models.TextField()
    expected_output = models.TextField()
    order = models.IntegerField()

    def __str__(self):
        return self.name
