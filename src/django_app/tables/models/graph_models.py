from django.db import models


class Graph(models.Model):
    tags = models.ManyToManyField(to="GraphTag", blank=True, default=[])

    name = models.CharField(max_length=255, blank=False)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)


class BaseNode(models.Model):
    graph = models.ForeignKey("Graph", on_delete=models.CASCADE)
    node_name = models.CharField(max_length=255, blank=True)
    input_map = models.JSONField(default=dict)
    output_variable_path = models.CharField(
        max_length=255, blank=True, null=True, default=None
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.node_name:
            super().save(*args, **kwargs)
            self.node_name = f"{self.__class__.__name__.lower()}_{self.pk}"
            kwargs.pop("force_insert", None)  # Remove `force_insert` if present
            kwargs["force_update"] = True  # Ensure only update happens
        super().save(*args, **kwargs)


class CrewNode(BaseNode):
    graph = models.ForeignKey(
        "Graph", on_delete=models.CASCADE, related_name="crew_node_list"
    )
    crew = models.ForeignKey("Crew", on_delete=models.PROTECT)


class PythonNode(BaseNode):
    graph = models.ForeignKey(
        "Graph", on_delete=models.CASCADE, related_name="python_node_list"
    )
    python_code = models.ForeignKey("PythonCode", on_delete=models.PROTECT)


class LLMNode(BaseNode):
    graph = models.ForeignKey(
        "Graph", on_delete=models.CASCADE, related_name="llm_node_list"
    )
    llm_config = models.ForeignKey("LLMConfig", blank=False, on_delete=models.PROTECT)


class Edge(models.Model):

    graph = models.ForeignKey(
        "Graph", on_delete=models.CASCADE, related_name="edge_list"
    )
    start_key = models.CharField(max_length=255, blank=False)
    end_key = models.CharField(max_length=255, blank=False)


class ConditionalEdge(models.Model):

    graph = models.ForeignKey(
        "Graph", on_delete=models.CASCADE, related_name="conditional_edge_list"
    )
    source = models.CharField(max_length=255, blank=False)
    python_code = models.ForeignKey("PythonCode", on_delete=models.CASCADE)
    then = models.CharField(max_length=255, null=True, default=None)
    input_map = models.JSONField(default=dict)


class GraphSessionMessage(models.Model):
    session = models.ForeignKey("Session", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(default="")
    execution_order = models.IntegerField(default=0)
    message_data = models.JSONField()

class StartNode(models.Model):
    graph = models.ForeignKey("Graph", on_delete=models.CASCADE)
    variables = models.JSONField(default=dict)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["graph"], name="unique_startnode_per_graph")
        ]