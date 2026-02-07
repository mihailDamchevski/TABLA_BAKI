FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 4444

# Run the application (PORT env var will be set by docker-compose)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-4444}
