from django_app.tables.models import Session


class SessionManagerService:

    def __init__(self) -> None:
        pass

    def get_session(self, session_id: int) -> Session:
        return Session.objects.get(id=session_id)

    def stop_session(self, session_id: int) -> None:
        session: Session = self.get_session(session_id=session_id)
        session.status = Session.SessionStatus.END
        session.save()

    def get_session_status(self, session_id: int) -> Session.SessionStatus:
        return self.get_session(session_id=session_id)

    def create_session(self, crew_id: int) -> Session:
        return Session.objects.create(crew_id=crew_id, status=Session.SessionStatus.RUN)
