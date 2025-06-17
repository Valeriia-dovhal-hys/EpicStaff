import json
import time
import pytest
from tables.models import Crew
from tables.models import Session
from tests.fixtures import *
from tables.management.commands.listen_redis import Command


