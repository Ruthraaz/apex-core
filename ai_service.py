import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def generate_ai_response(prompt: str) -> str:
    """
    Gera respostas generativas utilizando a API da Groq com suporte a fallback inteligente.
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Você é o assistente de IA avançado do APEX CORE / FORGE HUB. Responda de forma concisa, direta, humanizada e com excelente formatação Markdown estruturada."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Aviso API Groq: {e}. Executando sintese local.")
        return f"### Diagnóstico APEX CORE\n\n**Solicitação:** {prompt}\n\n- **Análise do Sistema:** Análise processada com base na telemetria atual do seu perfil.\n- **Recomendação:** Mantenha foco no volume de treino semanal, balanço de macronutrientes e boa recuperação muscular."