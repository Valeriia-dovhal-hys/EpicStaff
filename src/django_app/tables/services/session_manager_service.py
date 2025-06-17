from tables.exceptions import GraphEntryPointException
from tables.models.graph_models import (
    ConditionalEdge,
    GraphSessionMessage,
    LLMNode,
    StartNode,
)
from tables.models.llm_models import LLMConfig
from tables.validators import validate_tool_configs
from utils.singleton_meta import SingletonMeta
from utils.logger import logger
from tables.services.converter_service import ConverterService
from tables.services.redis_service import RedisService

from tables.request_models import (
    ConditionalEdgeData,
    CrewNodeData,
    EdgeData,
    GraphData,
    GraphSessionMessageData,
    LLMNodeData,
    PythonNodeData,
    SessionData,
)

from tables.models import (
    CrewNode,
    Session,
    Edge,
    Graph,
    PythonNode,
)


class SessionManagerService(metaclass=SingletonMeta):

    def __init__(
        self,
        redis_service: RedisService,
        converter_service: ConverterService,
    ) -> None:
        self.redis_service = redis_service
        self.converter_service = converter_service

    def get_session(self, session_id: int) -> Session:
        return Session.objects.get(id=session_id)

    def stop_session(self, session_id: int) -> None:
        session: Session = self.get_session(session_id=session_id)
        # TODO: Send notify to redis channel to stop container

        session.status = Session.SessionStatus.END
        session.save()

    def get_session_status(self, session_id: int) -> Session.SessionStatus:
        session: Session = self.get_session(session_id=session_id)
        return session.status

    def create_session(
        self,
        graph_id: int,
        variables: dict | None = None,
    ) -> Session:

        start_node = StartNode.objects.filter(graph_id=graph_id).first()

        if variables is not None:
            pass
        elif start_node.variables is not None:
            variables = start_node.variables
        else:
            variables = dict()

        session = Session.objects.create(
            graph_id=graph_id,
            status=Session.SessionStatus.PENDING,
            variables=variables,
        )
        return session

    def create_session_data(
        self,
        session: Session,
    ) -> SessionData:
        graph: Graph = session.graph

        crew_node_list = CrewNode.objects.filter(graph=graph.pk)
        python_node_list = PythonNode.objects.filter(graph=graph.pk)
        edge_list = Edge.objects.filter(graph=graph.pk)
        conditional_edge_list = ConditionalEdge.objects.filter(graph=graph.pk)
        llm_node_list = LLMNode.objects.filter(graph=graph.pk)

        crew_node_data_list: list[CrewNodeData] = []

        for item in crew_node_list:

            crew_node_data_list.append(
                self.converter_service.convert_crew_node_to_pydantic(crew_node=item)
            )

        python_node_data_list: list[PythonNodeData] = []
        for item in python_node_list:
            python_node_data_list.append(
                self.converter_service.convert_python_node_to_pydantic(python_node=item)
            )

        llm_node_data_list: list[LLMNodeData] = []

        for item in llm_node_list:
            llm_node_data_list.append(
                self.converter_service.convert_llm_node_to_pydantic(llm_node=item)
            )

        edge_data_list: list[EdgeData] = []

        for item in edge_list:
            edge_data_list.append(
                EdgeData(start_key=item.start_key, end_key=item.end_key)
            )

        conditional_edge_data_list: list[ConditionalEdgeData] = []
        for item in conditional_edge_list:
            conditional_edge_data_list.append(
                self.converter_service.convert_conditional_edge_to_pydantic(item)
            )

        start_edge = Edge.objects.filter(start_key="__start__", graph=graph).first()

        if start_edge is None:
            raise GraphEntryPointException()

        entry_point = start_edge.end_key
        graph_data = GraphData(
            name=graph.name,
            crew_node_list=crew_node_data_list,
            python_node_list=python_node_data_list,
            llm_node_list=llm_node_data_list,
            edge_list=edge_data_list,
            conditional_edge_list=conditional_edge_data_list,
            entry_point=entry_point,
        )
        session_data = SessionData(
            id=session.pk, graph=graph_data, initial_state=session.variables
        )

        # TODO: rewrite validate_session for graphs

        return session_data

    def run_session(self, graph_id: int, variables: dict | None = None) -> int:
        session: Session = self.create_session(graph_id=graph_id, variables=variables)
        session_data: SessionData = self.create_session_data(session=session)

        session.graph_schema = session_data.graph.model_dump()
        session.save()

        # CheckStatus
        self.redis_service.publish_session_data(
            session_data=session_data,
        )
        logger.info(f"Session data published in Redis for session ID: {session.pk}.")
        
        return session.pk
    @staticmethod
    def register_message(data: dict) -> None:
        if data["message_data"]["message_type"] == "user":
            graph_session_message_data = GraphSessionMessageData.model_validate(data)
            session = Session.objects.get(id=graph_session_message_data.session_id)
            GraphSessionMessage.objects.create(
                session=session,
                name=graph_session_message_data.name,
                execution_order=graph_session_message_data.execution_order,
                message_data=graph_session_message_data.message_data,
            )

        else:
            raise ValueError(
                f"Unsupported message_type: {data["message_data"]["message_type"]}"
            )
