import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from google import genai
from google.genai import types
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize the GenAI client using the key from our config
client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# SCHEMA DEFINITIONS (For strict JSON extraction)
# ---------------------------------------------------------------------------

class ExtractedModel(BaseModel):
    label: str = Field(description="The standard display name of the model (e.g., 'BERT', 'Gemma 7B')")
    framework: Optional[str] = Field(None, description="Software framework used, if mentioned (e.g., 'PyTorch', 'JAX')")
    task: Optional[str] = Field(None, description="Machine learning task performed (e.g., 'Text Classification')")
    paramCount: Optional[str] = Field(None, description="Number of parameters, if explicitly mentioned (e.g., '340M', '7B')")

class ExtractedDataset(BaseModel):
    label: str = Field(description="The standard display name of the dataset (e.g., 'ImageNet', 'SQuAD')")
    size: Optional[str] = Field(None, description="Size or number of samples in the dataset, if mentioned (e.g., '1.2M samples', '50GB')")
    task: Optional[str] = Field(None, description="The machine learning task the dataset is primarily used for")

class PaperExtraction(BaseModel):
    models: List[ExtractedModel]
    datasets: List[ExtractedDataset]


# ---------------------------------------------------------------------------
# CORE AI FUNCTIONS
# ---------------------------------------------------------------------------
async def generate_openalex_query(user_input: str) -> str:
    """
    Translates a natural language user query into an optimized OpenAlex search string.
    """
    prompt = f"""
    You are an expert academic research assistant. Convert the following user query into an optimized OpenAlex search query string.
    
    CRITICAL RULES FOR OPENALEX SEARCH:
    1. Return a concise keyword query optimized for OpenAlex full-text metadata search.
    2. Strip filler words like "latest", "recent", "papers", "show me", "about", "related to", "via", "using".
    3. Keep highly specific entities and acronyms (e.g., SIMCLR, BERT, ResNet) exactly as they are.
    4. Prefer clear key terms over boolean syntax (no all:, no AND/OR operators).
    5. Return ONLY the final query string with no markdown, labels, or explanation.
    
    Examples:
    User: "latest research papers on handwriting detection via image processing"
    Output: handwriting detection image vision
    
    User: "Show me recent papers about graph neural networks"
    Output: graph neural networks
    
    User: "LLMs used for healthcare and medicine"
    Output: large language models healthcare medicine
    
    User: "{user_input}"
    Output:
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.1-flash-lite-preview', 
            contents=prompt
        )
        response_text = response.text
        if response_text is None:
            raise Exception("Empty response from Gemini")
        else:
            return response_text.strip()
    
    except Exception as e:
        logger.error(f"⚠️ Error communicating with Gemini for query translation: {e}")
        logger.warning("Falling back to raw user query for OpenAlex search.")
        return user_input.strip()


async def generate_arxiv_query(user_input: str) -> str:
    """
    Backward-compatible alias for older imports.
    """
    return await generate_openalex_query(user_input)

async def extract_entities(parsed_text: str) -> dict:
    """
    Passes the raw paper text to the GenAI API to extract models and datasets.
    Forces the output into a strict JSON format based on the PaperExtraction schema.
    """
    logger.info("🧠 Passing text to GenAI for deep entity extraction...")
    
    prompt = f"""
    You are an expert AI research assistant. Read the following academic paper text 
    and extract the explicit Machine Learning Models and Datasets used or evaluated by the authors.
    
    Rules:
    - Do not guess or hallucinate. If a field like 'paramCount' or 'framework' is not stated, leave it null.
    - Normalize the 'label' (e.g., if they say "we used the PyTorch implementation of ResNet-50", label is "ResNet-50", framework is "PyTorch").
    - Only extract models/datasets directly relevant to the paper's core experiments.
    
    PAPER TEXT:
    {parsed_text}
    """
    
    try:
        # Using a standard flash model here as it is highly reliable for complex schema extraction
        response = await client.aio.models.generate_content(
            model='gemma-4-26b-a4b-it',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PaperExtraction,
                temperature=0.0 # Strict 0.0 for factual extraction
            )
        )
        
        response_text = response.text
        if response_text is None:
             raise Exception("Empty response from Gemini")
             
        # Parse the guaranteed JSON string into a Python dictionary
        extracted_data = json.loads(response_text)
        return extracted_data

    except Exception as e:
        logger.error(f"🔴 Entity Extraction failed: {e}")
        # Return empty lists so the pipeline doesn't crash on failure
        return {"models": [], "datasets": []}
