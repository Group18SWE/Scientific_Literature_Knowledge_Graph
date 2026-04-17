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
async def generate_arxiv_query(user_input: str) -> str:
    """
    Translates a natural language user query into an optimized arXiv API boolean string.
    """
    prompt = f"""
    You are an expert academic research assistant. Convert the following user query into an optimized arXiv API boolean search string.
    
    CRITICAL RULES FOR ARXIV API:
    1. NO EXACT PHRASES: Never put long phrases in quotes (e.g., avoid "handwriting detection"). Break them into individual AND keywords (e.g., all:handwriting AND all:detection).
    2. USE SYNONYMS: Use OR statements grouped in parentheses for common synonyms to avoid missing papers (e.g., (all:handwriting OR all:handwritten)).
    3. STRIP FILLER: Completely ignore conversational words like "latest", "recent", "papers", "show me", "about", "via", "using".
    4. Use exact quotes ONLY for highly specific, unique named entities like "SIMCLR" or "ResNet".
    5. Return ONLY the search string without any quotes, markdown formatting, or conversational text.
    
    Examples:
    User: "latest research papers on handwriting detection via image processing"
    Output: (all:handwriting OR all:handwritten) AND all:detection AND (all:image OR all:vision)
    
    User: "Show me recent papers about graph neural networks"
    Output: all:graph AND all:neural AND all:network
    
    User: "LLMs used for healthcare and medicine"
    Output: (all:LLM OR all:"large language model") AND (all:healthcare OR all:medicine)
    
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
        return "ERROR"

async def generate_semantic_scholar_query(user_input: str) -> str:
    """
    Translates a natural language user query into an optimized Semantic Scholar
    keyword query string.
    """
    prompt = f"""
    You are an expert academic research assistant. Convert the following user query
    into an optimized Semantic Scholar keyword search query.

    CRITICAL RULES FOR SEMANTIC SCHOLAR QUERY:
    1. OUTPUT KEYWORDS ONLY: Return a compact keyword phrase, not boolean operators.
    2. STRIP FILLER: Remove conversational words like "latest", "recent", "papers",
       "show me", "about", "via", "using".
    3. KEEP CORE TERMS: Preserve the important research concepts and named entities.
    4. INCLUDE HIGH-VALUE SYNONYMS: If useful, include one short synonym variant.
    5. Return ONLY the query string without markdown or extra commentary.

    Examples:
    User: "latest research papers on handwriting detection via image processing"
    Output: handwriting detection image processing computer vision

    User: "Show me recent papers about graph neural networks"
    Output: graph neural networks GNN

    User: "LLMs used for healthcare and medicine"
    Output: large language models healthcare medicine clinical

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
        return response_text.strip()

    except Exception as e:
        logger.error(f"⚠️ Error communicating with Gemini for Semantic Scholar query translation: {e}")
        return "ERROR"

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
