FROM python:3.12.3

WORKDIR /usr/src/app

RUN pip install --upgrade pip setuptools wheel

ARG PIP_REQUIREMENTS
#RUN if [ -n "$PIP_REQUIREMENTS" ]; then pip install $PIP_REQUIREMENTS; fi

RUN pip install $PIP_REQUIREMENTS


ARG ALIAS_CALLABLE

RUN echo "ALIAS_CALLABLE=$ALIAS_CALLABLE" > ./.env


CMD ["python", "app.py"]

COPY . .

