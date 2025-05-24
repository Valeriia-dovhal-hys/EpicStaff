# Use a base image with Python 3.12.6
FROM python:3.12.6

# Install updated pip, setuptools, and wheel
RUN pip install --upgrade pip setuptools wheel

# Install crewai and its tools
RUN pip install poetry


# Set the working directory in the Docker image
WORKDIR /home/user/root/django

ENV PEP517_BUILD_BACKEND=setuptools.build_meta

COPY pyproject.toml .
COPY poetry.lock .


# Configure poetry to not create a virtual environment and install dependencies and delete cache
# Maybe poetry cache clear --all
RUN poetry config virtualenvs.create false && poetry install && rm -rf /root/.cache

#Coping file to workdir
COPY . .

# EXPOSE 8000

# WORKDIR /home/user/root/savefiles

# ENTRYPOINT ["poetry", "run", "python3", "/home/user/root/django/manage.py", "runserver"]


