import os
import shutil
from glmocr import GlmOcr

async def parse_pdf_to_markdown(pdf_path: str) -> str:
    """
    Passes the PDF to the local vLLM server via the GLM-OCR SDK.
    Layout detection runs on CPU RAM to preserve GPU VRAM.
    """
    print(f"GLM-OCR SDK analyzing {pdf_path}...")
    
    try:
        # Initialize the parser. 
        # By default, this connects to localhost:8080 (our vLLM server)
        # layout_device="cpu" keeps the layout detection out of your 8GB VRAM!
        with GlmOcr(config_path="config.yaml", layout_device="cpu") as parser:
            
            # The SDK natively handles the PDF, slicing, layout, and calling vLLM
            result = parser.parse(pdf_path)
            
            # Create a temporary directory for this specific extraction
            temp_out_dir = f"{pdf_path}_parsed"
            result.save(output_dir=temp_out_dir)
            
            # Read the generated markdown
            md_file = os.path.join(temp_out_dir, "result.md")
            markdown_content = ""
            
            if os.path.exists(md_file):
                with open(md_file, "r", encoding="utf-8") as f:
                    markdown_content = f.read()
                    
            # Clean up the temporary folder the SDK created
            shutil.rmtree(temp_out_dir, ignore_errors=True)
            
            return markdown_content.strip()

    except Exception as e:
        print(f"GLM-OCR Pipeline failed: {e}")
        return ""