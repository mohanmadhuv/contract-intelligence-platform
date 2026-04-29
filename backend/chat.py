"""
AI Chat — Vertex AI Gemini integration for Contract Intelligence.
Uses ADC for authentication. Generates BigQuery SQL from natural language,
executes it, and formats a natural language response.
"""
import os
import json
import traceback
from db import query, table_ref

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "agency2026ot-v-sync-0429")
LOCATION = os.getenv("GCP_REGION", "northamerica-northeast1")

# Try Gemini 2.5 Flash first, fall back to 2.0 Flash
MODEL_ID = os.getenv("VERTEX_MODEL", "gemini-2.5-flash-preview-05-20")
FALLBACK_MODEL_ID = "gemini-2.0-flash-001"

_model = None

def _get_model():
    global _model
    if _model is not None:
        return _model

    import vertexai
    from vertexai.generative_models import GenerativeModel

    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # Try primary model, fall back
    for mid in [MODEL_ID, FALLBACK_MODEL_ID]:
        try:
            _model = GenerativeModel(mid)
            print(f"[Chat] Using model: {mid}")
            return _model
        except Exception as e:
            print(f"[Chat] Model {mid} unavailable: {e}")
            continue

    raise RuntimeError("No Vertex AI model available")


TABLE_NAME = None

def _table():
    global TABLE_NAME
    if TABLE_NAME is None:
        TABLE_NAME = table_ref()
    return TABLE_NAME


SYSTEM_PROMPT = """You are an AI analyst for the Government of Canada's Contract Intelligence platform.
You help users understand federal procurement data from 2015 to 2026.

The data is in a BigQuery table: {table}

Schema:
- reference_number (STRING): Contract reference number
- vendor_name (STRING): Vendor/supplier name
- vendor_postal_code (STRING): Vendor postal code (first letter maps to province)
- contract_date (DATE): Contract date
- contract_value (FLOAT64): Total contract value in CAD
- original_value (FLOAT64): Original contract value before amendments (NULL if no amendment)
- economic_object_code (STRING): EOC code (e.g., "0433" = Computer Services)
- commodity_type (STRING): Broad category (S=Services, G=Goods, C=Construction)
- description_en (STRING): English description
- owner_org (STRING): Department code
- owner_org_title (STRING): Department name
- solicitation_procedure (STRING): How the contract was awarded
- amendment_value (FLOAT64): Amendment value

EOC Labels: {eoc_labels}

RULES:
1. When asked a question, generate a BigQuery SQL query to answer it.
2. Return your response as JSON with two fields: "sql" and "explanation".
3. The SQL must be read-only (SELECT only). No INSERT, UPDATE, DELETE.
4. Keep queries efficient — use LIMIT when appropriate.
5. Use SAFE_DIVIDE for divisions. Use ROUND for numeric output.
6. The "explanation" should be a brief, professional summary of what the query finds.
7. If the question cannot be answered from this data, say so in the explanation and set sql to null.
8. Format currency as CAD. Use fiscal year context (FY16 = 2016).
9. Be concise and data-driven in your explanations.
"""

EOC_LABELS_STR = json.dumps({
    "0432":"IT Equipment Rentals","0433":"Computer Services","0491":"Management Consulting",
    "0499":"Other Professional Services","0321":"Computing Equipment","0322":"Office Equipment",
    "0399":"Other Goods","0381":"Construction Services","0319":"Construction Materials",
    "1221":"Telecom Equipment","1222":"Telecom Services","0811":"Air Travel",
    "0812":"Ground Transport","0822":"Accommodations","0251":"Research & Development",
    "0312":"Clothing & Uniforms","0341":"Fuel & Energy","0711":"Land & Buildings Purchase",
    "1228":"Building Rentals","0494":"Translation Services","0496":"Advertising",
})


def chat(user_message: str, conversation_history: list = None) -> dict:
    """
    Process a user chat message.
    Returns: {"answer": str, "sql": str|None, "data": list|None, "error": str|None}
    """
    try:
        model = _get_model()
    except Exception as e:
        return {"answer": "AI assistant is currently unavailable. Please try again later.", "sql": None, "data": None, "error": str(e)}

    system = SYSTEM_PROMPT.format(table=_table(), eoc_labels=EOC_LABELS_STR)

    # Build conversation
    messages = [{"role": "user", "parts": [system + "\n\nUser question: " + user_message + "\n\nRespond with JSON only: {\"sql\": \"...\", \"explanation\": \"...\"}"]}]

    try:
        response = model.generate_content(messages)
        text = response.text.strip()

        # Parse JSON from response (handle markdown code blocks)
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        parsed = json.loads(text)
        sql = parsed.get("sql")
        explanation = parsed.get("explanation", "")

        # Execute SQL if provided
        data = None
        if sql and sql.strip().upper().startswith("SELECT"):
            try:
                data = query(sql)
                # Limit data size for response
                if len(data) > 50:
                    data = data[:50]
                # Convert any non-serializable types
                for row in data:
                    for k, v in row.items():
                        if hasattr(v, 'isoformat'):
                            row[k] = v.isoformat()
                        elif v is not None and not isinstance(v, (str, int, float, bool)):
                            row[k] = str(v)
            except Exception as e:
                return {"answer": f"{explanation}\n\n⚠️ Query execution error: {str(e)}", "sql": sql, "data": None, "error": str(e)}

            # Generate natural language summary with data
            if data:
                summary_prompt = f"""Based on this data from a federal procurement database query:
Question: {user_message}
SQL: {sql}
Results (first {min(len(data), 10)} rows): {json.dumps(data[:10], default=str)}

Provide a concise, professional natural language answer. Use specific numbers. Format currency in CAD.
If relevant, mention trends, percentages, or notable findings. Keep it under 200 words."""

                try:
                    summary_response = model.generate_content([{"role": "user", "parts": [summary_prompt]}])
                    explanation = summary_response.text.strip()
                except Exception:
                    pass  # Keep original explanation

        return {"answer": explanation, "sql": sql, "data": data, "error": None}

    except json.JSONDecodeError:
        # Model didn't return valid JSON — treat full response as explanation
        return {"answer": text if 'text' in dir() else "I couldn't process that question.", "sql": None, "data": None, "error": None}
    except Exception as e:
        traceback.print_exc()
        return {"answer": f"An error occurred: {str(e)}", "sql": None, "data": None, "error": str(e)}
