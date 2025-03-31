from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI  # Updated import
import os
from dotenv import load_dotenv

# Load environment variables - try from .env file first, but environment variables will take precedence
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class CVEnhanceRequest(BaseModel):
    job_description: str
    cv: str

# Define response model
class CVEnhanceResponse(BaseModel):
    enhanced_cv: str

# Initialize OpenAI LLM
llm = ChatOpenAI(
    # Add any necessary parameters, e.g., model, temperature, API key
    model="gpt-3.5-turbo",  # Example model, adjust as needed
    temperature=0.5,         # Example temperature, adjust as needed
    openai_api_key=os.getenv("OPENAI_API_KEY")  # Ensure this is set in your .env
)

# Create prompt template
cv_enhancement_template = """
You are an expert CV/resume optimization assistant. Your task is to enhance the given CV 
to better match the job description by:

1. Identifying key skills, technologies, and qualifications from the job description
2. Highlighting relevant experience in the CV that matches these requirements
3. Adding appropriate keywords from the job description to the CV
4. Improving the formatting and structure to make the CV more readable
5. Making sure the enhanced CV maintains truthfulness and doesn't fabricate experience
6. Introdction paragraph is must
7. Please use some mixed color, and font for headers and contents.
8. Use bullet points for key skills which is matching with job description
9. Maximum 2 pages CV

Job Description:
{job_description}

Original CV:
{cv}

Please provide the enhanced CV in clean HTML format that's ready to be rendered and converted to PDF.
Focus on professional formatting with appropriate headers, bullet points, and emphasis on key skills.
"""

prompt = PromptTemplate(
    input_variables=["job_description", "cv"],
    template=cv_enhancement_template
)

# Create LangChain
cv_chain = prompt | llm

# Serve React build files
app.mount("/static", StaticFiles(directory="static/build/static"), name="static")

@app.get("/")
async def serve_react():
    return FileResponse("static/build/index.html")

@app.post("/enhance-cv", response_model=CVEnhanceResponse)
async def enhance_cv(request: CVEnhanceRequest):
    try:
        # Process the input using LangChain
        result = cv_chain.invoke({
                    "job_description": request.job_description,
                    "cv": request.cv
                })
        # Extract the string content from AIMessage
        enhanced_cv_text = result.content
        
        # Return the enhanced CV in HTML format
        return CVEnhanceResponse(enhanced_cv=enhanced_cv_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)