"""
AI Chat — Amazon Bedrock integration for Contract Intelligence.
Uses Claude 3.5 Sonnet via Bedrock API.
Generates PostgreSQL SQL from natural language, executes it, and formats responses.
"""
import os
import json
import traceback
import boto3
from db import query, table_ref

# Bedrock configuration
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
BEDROCK_API_KEY = os.getenv("BEDROCK_API_KEY")
MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"

_client = None

def _get_bedrock_client():
    global _client
    if _client is not None:
        return _client
    
    # Parse the Bedrock API key format
    # Format: ABSKBedrockAPIKey-xxxx-at-accountid:base64credentials
    if BEDROCK_API_KEY and BEDROCK_API_KEY.startswith("ABSK"):
        try:
            # Extract credentials from the API key
            parts = BEDROCK_API_KEY.split(":", 1)
            if len(parts) == 2:
                import base64
                credentials = base64.b64decode(parts[1]).decode('utf-8')
                # The credentials format may vary, using as session token
                _client = boto3.client(
                    service_name='bedrock-runtime',
                    region_name=AWS_REGION,
                    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", ""),
                    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
                    aws_session_token=credentials if credentials else None
                )
            else:
                raise ValueError("Invalid Bedrock API key format")
        except Exception as e:
            print(f"[Chat] Error parsing Bedrock API key: {e}")
            # Fallback to default credentials
            _client = boto3.client(
                service_name='bedrock-runtime',
                region_name=AWS_REGION
            )
    else:
        # Use default AWS credentials (IAM role, environment variables, etc.)
        _client = boto3.client(
            service_name='bedrock-runtime',
            region_name=AWS_REGION
        )
    
    return _client


TABLE_NAME = None

def _table():
    global TABLE_NAME
    if TABLE_NAME is None:
        TABLE_NAME = table_ref()
    return TABLE_NAME


SYSTEM_PROMPT = """You are an AI analyst for the Government of Canada's Contract Intelligence platform.
You help users understand federal procurement data from 2015 to 2026.

The data is in a PostgreSQL table: {table}

Schema:
- reference_number (TEXT): Contract reference number
- vendor_name (TEXT): Vendor/supplier name
- vendor_postal_code (TEXT): Vendor postal code (first letter maps to province)
- contract_date (TEXT): Contract date (YYYY-MM-DD format)
- contract_value (TEXT): Total contract value in CAD (stored as text, cast to FLOAT for calculations)
- original_value (TEXT): Original contract value before amendments (NULL if no amendment)
- economic_object_code (TEXT): EOC code (e.g., "0433" = Computer Services)
- commodity_type (TEXT): Broad category (S=Services, G=Goods, C=Construction)
- description_en (TEXT): English description
- owner_org (TEXT): Department code
- owner_org_title (TEXT): Department name
- solicitation_procedure (TEXT): How the contract was awarded
- amendment_value (TEXT): Amendment value

EOC Labels: {eoc_labels}

IMPORTANT SQL RULES FOR POSTGRESQL:
1. When asked a question, generate a PostgreSQL SQL query to answer it.
2. ALL numeric columns are stored as TEXT, so you MUST use CAST(column AS FLOAT) for calculations
3. For date operations, use: EXTRACT(YEAR FROM contract_date::date)
4. Use COUNT(*) FILTER (WHERE condition) instead of COUNTIF
5. Use column / NULLIF(divisor, 0) instead of SAFE_DIVIDE
6. Use FLOAT instead of FLOAT64
7. Table name is just "contracts" (no backticks or schema prefix)
8. The SQL must be read-only (SELECT only). No INSERT, UPDATE, DELETE.
9. Keep queries efficient — use LIMIT when appropriate.
10. Use ROUND for numeric output.

Response format:
Return your response as JSON with two fields: "sql" and "explanation".
- "sql": The PostgreSQL query (or null if question cannot be answered)
- "explanation": A brief, professional summary of what the query finds

Example query structure:
SELECT 
  vendor_name,
  COUNT(*) as contracts,
  ROUND(SUM(CAST(contract_value AS FLOAT)), 0) as total_spend
FROM contracts
WHERE EXTRACT(YEAR FROM contract_date::date) = 2024
  AND CAST(contract_value AS FLOAT) > 0
GROUP BY vendor_name
ORDER BY total_spend DESC
LIMIT 10;

Format currency as CAD. Use fiscal year context (FY16 = 2016).
Be concise and data-driven in your explanations.
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
        client = _get_bedrock_client()
    except Exception as e:
        print(f"[Chat] Bedrock client error: {e}")
        traceback.print_exc()
        return {
            "answer": "AI assistant is currently unavailable. Please check AWS Bedrock configuration.",
            "sql": None,
            "data": None,
            "error": str(e)
        }

    system = SYSTEM_PROMPT.format(table=_table(), eoc_labels=EOC_LABELS_STR)

    # Build the prompt
    prompt = f"""{system}

User question: {user_message}

Respond with JSON only in this exact format:
{{"sql": "SELECT ...", "explanation": "..."}}

If the question cannot be answered from the data, set sql to null."""

    try:
        # Call Bedrock with Claude
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }

        response = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request_body)
        )

        response_body = json.loads(response['body'].read())
        text = response_body['content'][0]['text'].strip()

        # Parse JSON from response (handle markdown code blocks)
        if text.startswith("```"):
            # Remove markdown code block markers
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            text = text.replace("```json", "").replace("```", "").strip()

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
                print(f"[Chat] Query execution error: {e}")
                traceback.print_exc()
                return {
                    "answer": f"{explanation}\n\n⚠️ Query execution error: {str(e)}",
                    "sql": sql,
                    "data": None,
                    "error": str(e)
                }

            # Generate natural language summary with data
            if data:
                summary_prompt = f"""Based on this data from a federal procurement database query:

Question: {user_message}
SQL: {sql}
Results (first {min(len(data), 10)} rows): {json.dumps(data[:10], default=str)}

Provide a concise, professional natural language answer. Use specific numbers from the data.
Format currency in CAD (e.g., $1,234,567 CAD).
If relevant, mention trends, percentages, or notable findings.
Keep it under 200 words. Be direct and factual."""

                try:
                    summary_request = {
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 2048,
                        "messages": [
                            {
                                "role": "user",
                                "content": summary_prompt
                            }
                        ],
                        "temperature": 0.5
                    }

                    summary_response = client.invoke_model(
                        modelId=MODEL_ID,
                        body=json.dumps(summary_request)
                    )

                    summary_body = json.loads(summary_response['body'].read())
                    explanation = summary_body['content'][0]['text'].strip()
                except Exception as e:
                    print(f"[Chat] Summary generation error: {e}")
                    # Keep original explanation

        return {"answer": explanation, "sql": sql, "data": data, "error": None}

    except json.JSONDecodeError as e:
        print(f"[Chat] JSON decode error: {e}")
        print(f"[Chat] Response text: {text if 'text' in dir() else 'N/A'}")
        # Model didn't return valid JSON — treat full response as explanation
        return {
            "answer": text if 'text' in dir() else "I couldn't process that question. Please try rephrasing.",
            "sql": None,
            "data": None,
            "error": None
        }
    except Exception as e:
        print(f"[Chat] Unexpected error: {e}")
        traceback.print_exc()
        return {
            "answer": f"An error occurred while processing your question: {str(e)}",
            "sql": None,
            "data": None,
            "error": str(e)
        }
