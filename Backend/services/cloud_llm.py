import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
import asyncio
import time
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
async def generate_core_query(user_input: str) -> str:
    """
    Translates a natural language user query into an optimized CORE API query string.
    """
    prompt = f"""
    You are an expert academic research assistant. Convert the following user query into an optimized CORE API query string.
    
    CRITICAL RULES FOR CORE API QUERY:
    1. Use boolean operators AND/OR with parentheses for grouping.
    2. Avoid field-specific prefixes unless required. Prefer general keyword queries.
    3. STRIP FILLER: Completely ignore conversational words like "latest", "recent", "papers", "show me", "about", "via", "using".
    4. Use exact quotes only for specific named entities or stable multi-word concepts.
    5. Return ONLY the search string without any quotes, markdown formatting, or conversational text.
    
    Examples:
    User: "latest research papers on handwriting detection via image processing"
    Output: (handwriting OR handwritten) AND detection AND (image OR vision)
    
    User: "Show me recent papers about graph neural networks"
    Output: graph AND neural AND network
    
    User: "LLMs used for healthcare and medicine"
    Output: (LLM OR "large language model") AND (healthcare OR medicine)
    
    User: "{user_input}"
    Output:
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemma-4-26b-a4b-it',
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

async def generate_arxiv_query(user_input: str) -> str:
    """
    Deprecated backward-compatible alias. Use generate_core_query instead.
    """
    return await generate_core_query(user_input)


async def extract_entities(parsed_text: str) -> dict:
    print("🧠 [extract_entities] START")

    start_time = time.time()

    prompt = f"""
    You are an expert AI research assistant. Read the following academic paper text 
    and extract the explicit Machine Learning Models and Datasets used or evaluated by the authors.
    
    Rules:
    - Do not guess or hallucinate. If a field like 'paramCount' or 'framework' is not stated, leave it null.
    - Normalize the 'label' (e.g., if they say "we used the PyTorch implementation of ResNet-50", label is "ResNet-50", framework is "PyTorch").
    - Only extract models/datasets directly relevant to the paper's core experiments.
    
    PAPER TEXT (length={len(parsed_text)}):
    {parsed_text[:1000]}  # truncate for logging sanity
    """

    try:
        print("📡 [extract_entities] Sending request to GenAI...")

        # 🔥 Add timeout wrapper here
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model='gemma-4-26b-a4b-it',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PaperExtraction,
                    temperature=0.0
                )
            ),
            timeout=40  # <- critical
        )

        print("📥 [extract_entities] Response received from GenAI")

        response_text = response.text
        print(f"🧾 [extract_entities] Raw response length: {len(response_text) if response_text else 'None'}")

        if response_text is None:
            raise Exception("Empty response from GenAI")

        print("🔍 [extract_entities] Parsing JSON...")
        extracted_data = json.loads(response_text)

        print("✅ [extract_entities] JSON parsed successfully")

        print(f"📊 Models: {len(extracted_data.get('models', []))}, "
              f"Datasets: {len(extracted_data.get('datasets', []))}")

        print(f"⏱️ [extract_entities] Completed in {time.time() - start_time:.2f}s")

        return extracted_data

    except asyncio.TimeoutError:
        print("⏱️❌ [extract_entities] TIMEOUT (GenAI call hung)")
        return {"models": [], "datasets": []}

    except json.JSONDecodeError as e:
        print(f"🧨 [extract_entities] JSON PARSE ERROR: {e}")
        print(f"📄 Raw response was: {response_text[:500] if response_text else 'None'}")
        return {"models": [], "datasets": []}

    except Exception as e:
        print(f"🔴 [extract_entities] FAILED: {type(e).__name__}: {e}")
        return {"models": [], "datasets": []}

    finally:
        print("🧵 [extract_entities] END")