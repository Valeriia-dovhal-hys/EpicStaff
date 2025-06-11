FROM python:3.12.3

WORKDIR /home/user/root/app

RUN pip install --upgrade --no-cache-dir pip setuptools wheel

RUN pip install poetry

COPY ./pyproject.toml .
COPY ./poetry.lock .

ARG PIP_REQUIREMENTS

RUN poetry config virtualenvs.create false && poetry install && poetry add $PIP_REQUIREMENTS && rm -rf /root/.cache
ARG ALIAS_CALLABLE

RUN echo "ALIAS_CALLABLE=$ALIAS_CALLABLE" > ./.env


CMD ["python", "app.py"]

COPY . .

