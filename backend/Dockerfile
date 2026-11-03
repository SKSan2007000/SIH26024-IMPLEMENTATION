FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Support build context from either repository root or backend directory
COPY requirements.txt* backend/requirements.txt* ./
RUN if [ -f requirements.txt ]; then python -m pip install --no-cache-dir -r requirements.txt; elif [ -f backend/requirements.txt ]; then python -m pip install --no-cache-dir -r backend/requirements.txt; fi

COPY . .

# Ensure upload and artifact directories exist
RUN mkdir -p uploads ml/artifacts backend/uploads backend/ml/artifacts

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend:/app:$PYTHONPATH

CMD ["python", "-c", "import os,sys,uvicorn; (os.chdir('backend'), sys.path.insert(0, '.')) if os.path.exists('backend') else None; uvicorn.run('app.main:app', host='0.0.0.0', port=int(os.environ.get('PORT','8000')))"]
