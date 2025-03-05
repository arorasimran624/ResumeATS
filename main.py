import os
import json
import logging
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google.api_core import retry
import re
from typing import List
# Initialize FastAPI
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust allowed origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Constants
STUDENT_FILE_PATH = "C:/Users/Simran Arora/Downloads/Admin_Ment_AI/Admin_Ment_AI/backend/data.json"
API_KEY = "AIzaSyBNQqAiQYC2LTdERt1yaAtMk8eq9EoVL4U"

# Load student data
try:
    with open(STUDENT_FILE_PATH, "r") as file:
        STUDENT_DATA = json.load(file)
except Exception as e:
    logging.error(f"Failed to load student data: {e}")
    STUDENT_DATA = {}

# Configure Gemini AI
try:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    logging.info("Gemini AI model initialized successfully.")
except Exception as e:
    logging.error(f"Failed to initialize Gemini AI: {e}")
    model = None

# Pydantic Model for Validation
class ResumeInput(BaseModel):
    specialization: str = Field(..., title="Specialization")
    dob: str = Field(..., title="Date of Birth (YYYY-MM-DD)")
    gender: str = Field(..., title="Gender (Male/Female)")
    bio: str = Field(..., title="Short Bio (min 50 characters)")

class CertificateInput(BaseModel):
    certificate_name: str
    provider: str
    valid_date: str
    skills: str
    description: str

class ProjectInput(BaseModel):
     project_name: str
     description: str
     project_link: str
     start_date: str
     end_date: str
     key_skills: str
     team_size: int
     
class SkillInput(BaseModel):
    hard_skills:List[str]
    soft_skills:List[str]

class LocationDetails(BaseModel):
    city: str
    state: str
    pincode: str
    country: str

class ExperienceInput(BaseModel):
    intership_or_job: str
    company_name: str
    job_type: str
    industry_sector: str
    designation: str
    start_date: str
    end_date: str
    location_details: LocationDetails  # Fixed: Using a BaseModel instead of {}
    mentor_name: str
    mentor_designation: str
    key_responsibilities: str
    currently_working_status: bool  # Fixed: Changed 'true' to 'bool'

# Validate user input
def validate_input(data: ResumeInput):
    errors = {}

    if not data.specialization.strip():
        errors["specialization"] = "Specialization cannot be empty."
    
    if not re.match(r"\d{4}-\d{2}-\d{2}", data.dob):
        errors["dob"] = "Invalid format. Use YYYY-MM-DD."
    
    if data.gender.lower() not in ["male", "female"]:
        errors["gender"] = "Gender must be 'Male' or 'Female'."
    
    if len(data.bio) < 50:
        errors["bio"] = "Bio must be at least 50 characters long."
    
    return errors


def extract_json(text: str):
    """Extracts and cleans JSON content from AI responses."""
    match = re.search(r'\{.*\}', text, re.DOTALL)  # Extract JSON block
    if match:
        try:
            cleaned_json = json.loads(match.group())  # Convert string to JSON
            return cleaned_json
        except json.JSONDecodeError:
            return None  # Return None if JSON parsing fails
    return None  # Return None if no JSON is found

def correct_specialization(text: str):
    """Returns a concise corrected specialization title without multiple options."""
    if not model:
        return text  # Return original if AI is unavailable

    try:
        response = model.generate_content(
            f"Correct any grammar or ATS optimization issues in this job title: '{text}'.\n"
            f"Return ONLY a valid JSON object with a single corrected title.\n"
            f"STRICT FORMAT (NO EXPLANATIONS, NO MULTIPLE VERSIONS):\n"
            f'{{"specialization": "<corrected specialization>"}}'
        )

        corrected_json = extract_json(response.text)
        return corrected_json.get("specialization", text) if corrected_json else text
    except Exception as e:
        logging.error(f"Error calling Gemini AI for specialization: {e}")
        return text  # Return original on failure


def correct_bio(text: str):
    """Returns a concise corrected bio in a single sentence."""
    if not model:
        return text  # Return original if AI is unavailable

    try:
        response = model.generate_content(
            f"Rewrite the following professional bio to be grammatically correct, ATS-friendly, \n\n"
            f"Input: {text}\n\n"
            f"Return ONLY a valid JSON object (DO NOT ADD EXPLANATIONS OR MULTIPLE VERSIONS):\n"
            f'{{"bio": "<corrected bio>"}}'
        )

        corrected_json = extract_json(response.text)
        return corrected_json.get("bio", text) if corrected_json else text
    except Exception as e:
        logging.error(f"Error calling Gemini AI for bio: {e}")
        return text  # Return original on failure



def validate_project_input(data:ProjectInput):
    """"Validates and enhances project details using Gemini AI"""
    prompt=f"""
    Improve and validate the following project details for ATS optimization and grammmatical correctness only 5 skills and description in 30 words:
    Project Name:{data.project_name}
    Description:{data.description}
    Project Link:{data.project_link}
    Start Date:{data.start_date}
    End Date:{data.end_date}
    Key Skills:{data.key_skills}
    Team Size:{data.team_size}

    Ensure the descriptionis grammatically correect and enhances ATS score.Add relevant skills if needed.
    {{
        "project_name":"corrected name"
        "description":"enhanced description"
        "project_link":"corrected project link"
        "start_date":"corrected valid date"
        "end_date":"corrected valid date"
        "key_skills":"enhanced skills"
        "team_size":"corrected team size"
         "fields_to_update": ["list of incorrect fields"]
    }}

    """
    try:    
        response = model.generate_content(prompt)
        return extract_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")
    
def validate_skills_input(data: SkillInput):
    """Validates and enhances skill details using Gemini AI"""
    prompt = f"""
Improve and validate the following skills for ATS optimization:
Hard Skills: {data.hard_skills}
Soft Skills: {data.soft_skills}

Ensure:
- Hard skills are relevant and correctly formatted.
- Soft skills are appropriate for professional settings.
- Return "fields_to_update" listing only modified fields.

Response format:
{{
    "hard_skills": ["corrected skills"],
    "soft_skills": ["corrected skills"],
    "fields_to_update": ["list of modified fields"]
}}
"""
    try:
        response = model.generate_content(prompt)
        return extract_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")
    
def validate_experience_input(data: ExperienceInput):
    """Validates and enhances experience details using Gemini AI"""
    prompt = f"""
    Improve and validate the following experience details for ATS optimization and grammatical correctness:
    
    Internship/Job: {data.intership_or_job}
    Company Name: {data.company_name}
    Job Type: {data.job_type}
    Industry Sector: {data.industry_sector}
    Designation: {data.designation}
    Start Date: {data.start_date}
    End Date: {data.end_date}
    Location: {data.location_details.city}, {data.location_details.state}, {data.location_details.pincode}, {data.location_details.country}
    Mentor Name: {data.mentor_name}
    Mentor Designation: {data.mentor_designation}
    Key Responsibilities: {data.key_responsibilities}
    Currently Working: {data.currently_working_status}

    Ensure the job title, responsibilities, and skills are ATS-friendly and grammatically correct. If necessary, enhance them for clarity and impact.
    
    Return a corrected JSON object:
    {{
        "intership_or_job": "corrected internship/job type",
        "company_name": "corrected company name",
        "job_type": "corrected job type",
        "industry_sector": "corrected industry sector",
        "designation": "corrected designation",
        "start_date": "corrected start date",
        "end_date": "corrected end date",
        "location_details": {{
            "city": "corrected city",
            "state": "corrected state",
            "pincode": "corrected pincode",
            "country": "corrected country"
        }},
        "mentor_name": "corrected mentor name",
        "mentor_designation": "corrected mentor designation",
        "key_responsibilities": "enhanced key responsibilities",
        "currently_working_status": true,
        "fields_to_update": ["list of incorrect fields"]
    }}
    """

    try:
        response = model.generate_content(prompt)
        extracted_json = extract_json(response.text)
        return extracted_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")

def validate_certificate_input(data: CertificateInput):
    """Validates and enhances certificate details using Gemini AI."""
    prompt = f"""
    Improve and validate the following certificate details for ATS optimization and grammatical correctness only 5 skills and description in 30 words:
    Certificate Name: {data.certificate_name}
    Issuing Organization: {data.provider}
    Valid Till: {data.valid_date}
    Key Skills: {data.skills}
    Description: {data.description}
    
    Ensure the description is grammatically correct and enhances ATS score. Add relevant skills if needed.
    Respond with corrected values in this JSON format:
    {{
        "certificate_name": "corrected name",
        "provider": "corrected provider",
        "valid_date": "corrected valid date",
        "skills": "enhanced skills",
        "description": "ATS-optimized description",
        "fields_to_update": ["list of incorrect fields"]
    }}
    """
    try:
        response = model.generate_content(prompt)
        return extract_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")

@app.post("/validate")
async def validate_resume(data: ResumeInput):
    logging.info(f"Received data: {data}")
    errors = validate_input(data)
    
    if errors:
        return {"success": False, "errors": errors}
    
    corrected_data = {
        "specialization": correct_specialization(data.specialization),
        "dob": data.dob,
        "gender": data.gender.capitalize(),
        "bio": correct_bio(data.bio),
    }
    
    return JSONResponse(
        content={
            "success": True,
            "validated_data": corrected_data  # Now returns a clean JSON object
        }
    )
@app.post("/validate-project")
async def validate_project(data: ProjectInput):
    corrected_data = validate_project_input(data)
    return corrected_data
 
@app.post("/validate-experience")
async def validate_experience(data: ExperienceInput):
    corrected_data = validate_experience_input(data)
    return corrected_data

@app.post("/validate-skills")
async def validate_skills(data: SkillInput):
    corrected_data = validate_skills_input(data)
    return corrected_data
@app.post("/validate-certificate")
async def validate_certificate(data: CertificateInput):
    corrected_data = validate_certificate_input(data)
    return corrected_data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
