# Stage 1: Build React App
FROM node:18 as frontend
WORKDIR /app-frontend
COPY Frontend/ .
RUN npm install && npm run build

# Stage 2: FastAPI App
FROM python:3.12
WORKDIR /app
COPY Backend/ .  
COPY --from=frontend /app-frontend/build /app/static/build 

RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
