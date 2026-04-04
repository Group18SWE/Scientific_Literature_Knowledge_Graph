from google import genai
from core.config import settings

# Initialize the GenAI client using the key from our config
client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_arxiv_query(user_input: str) -> str:
    """
    Translates a natural language user query into a strict arXiv API boolean string.
    """
    prompt = f"""
    You are an expert research assistant. Convert the following user query into a strict arXiv API boolean search string.
    Return ONLY the search string without any quotes, markdown formatting, or extra conversational text.
    
    Examples:
    User: "Show me recent papers about graph neural networks"
    Output: all:"graph neural network"
    
    User: "LLMs used for healthcare and medicine"
    Output: all:"large language model" AND (all:"healthcare" OR all:"medicine")
    
    User: "{user_input}"
    Output:
    """
    
    try:
        # We use client.aio for asynchronous calls
        # Note: 'gemini-2.5-flash' is the standard model string for the Flash tier
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash', 
            contents=prompt
        )
        response_text = response.text
        if response_text is None:
            raise Exception("Empty response from Gemini")
        else:
            return response_text
    
    except Exception as e:
        print(f"⚠️ Error communicating with Gemini: {e}")
        return "ERROR"