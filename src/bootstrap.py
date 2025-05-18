import os
import logging

from rich.console import Console
from rich.logging import RichHandler

import signal
from utils.helpers import signal_handler


console = Console()
logging.basicConfig(
    level="ERROR",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(console=console, rich_tracebacks=True)],
)
logger = logging.getLogger("rich")


def prepare_environment():

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    os.environ['HAYSTACK_TELEMETRY_ENABLED'] = 'False'  # Attmpt to turn off telemetry
    os.environ['ANONYMIZED_TELEMETRY'] = 'False'  # Disable interpreter telemetry
    os.environ['EC_TELEMETRY'] = 'False'  # Disable embedchain telemetry

    os.environ['MONITORING_MODE'] = os.environ.get("MONITORING_MODE", "local")
    os.environ['MONITORING_LOCAL_PATH'] = os.environ.get("MONITORING_LOCAL_PATH", os.path.join(os.getcwd(), "telemetry_log"))