import os
import logging
import signal

from rich.console import Console
from rich.logging import RichHandler
from config.config import AppConfig
import sentry_sdk

from utils.helpers import signal_handler, load_env
from utils.helpers import greetings_print
from utils.helpers import is_valid_google_sheets_url, get_sheet_url_from_user

from utils.cli_parser import get_parser


class Bootstrapper:
    console = Console()
    args = get_parser()


    @classmethod
    def set_logger(cls):

        logging.basicConfig(
            level="ERROR",
            format="%(message)s",
            datefmt="[%X]",
            handlers=[RichHandler(console=cls.console, rich_tracebacks=True)],
        )
        cls.logger = logging.getLogger("rich")

        release = f"{AppConfig.name}@{AppConfig.version}"
        if os.environ.get("CREWAI_SHEETS_SENRY") != "False":
            sentry_sdk.init(
                dsn="https://fc662aa323fcc1629fb9ea7713f63137@o4507186870157312.ingest.de.sentry.io/4507186878414928",
                traces_sample_rate=1.0,
                profiles_sample_rate=1.0,
                release=release,
            )


    @classmethod
    def set_envvars(cls):

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        os.environ['HAYSTACK_TELEMETRY_ENABLED'] = 'False'  # Attempt to turn off telemetry
        os.environ['ANONYMIZED_TELEMETRY'] = 'False'  # Disable interpreter telemetry
        os.environ['EC_TELEMETRY'] = 'False'  # Disable embedchain telemetry

        os.environ['MONITORING_MODE'] = os.environ.get("MONITORING_MODE", "local")
        os.environ['MONITORING_LOCAL_PATH'] = os.environ.get("MONITORING_LOCAL_PATH", os.path.join(os.getcwd(), "telemetry_log"))


    @classmethod
    def prepare_console(cls):

        greetings_print()
        load_env(cls.args.env_path, ["OPENAI_API_KEY"])

        if (
            hasattr(cls.args, "sheet_url")
            and cls.args.sheet_url
            and is_valid_google_sheets_url(cls.args.sheet_url)
        ):
            cls.sheet_url = cls.args.sheet_url
        else:
            cls.sheet_url = get_sheet_url_from_user()

        cls.terminal_width = max(cls.console.width, 120)