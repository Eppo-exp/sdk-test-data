FROM python:3.12

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the source code
COPY src/ ./src/

CMD ["python", "/app/src/server.py"]
