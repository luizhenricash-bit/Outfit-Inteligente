from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from recommender import recomendar_look_completo, trocar_peca

# Inicializa o app FastAPI
app = FastAPI(
    title="Outfit Inteligente - ML Service",
    description="Serviço de Inteligência Artificial para Recomendação de Looks com K-Means",
    version="1.0.0"
)

# Definindo o formato dos dados que a API recebe (Schema Pydantic)
class RequisicaoLook(BaseModel):
    temperatura: float
    chovendo: bool
    ocasiao: str
    formalidade: Optional[int] = None
    descricao_usuario: Optional[str] = ""

class RequisicaoTroca(BaseModel):
    categoria: str
    peca_atual_id: int
    temperatura: float
    ocasiao: str
    formalidade: Optional[int] = None
    descricao_usuario: Optional[str]= ""


@app.get("/")
def home():
    """Rota de teste para saber se a API está online."""
    return {"status": "online", "mensagem": "Serviço de Machine Learning do Outfit Inteligente está rodando!"}


@app.post("/api/recommend")
def rota_recomendar(req: RequisicaoLook):
    """
    Recebe clima e ocasião, executa o K-Means e retorna o look completo.
    """
    try:
        resultado = recomendar_look_completo (
            temperatura=req.temperatura,
            chovendo=req.chovendo,
            ocasiao=req.ocasiao,
            formalidade=req.formalidade,
            descricao_usuario=req.descricao_usuario or ""
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/swap")
def rota_trocar(req: RequisicaoTroca):
    """
    Substitui uma peça específica do look por outra compatível do guarda-roupa.
    """
    try:
        resultado = trocar_peca(
            categoria=req.categoria,
            peca_atual_id=req.peca_atual_id,
            temperatura=req.temperatura,
            ocasiao=req.ocasiao,
            formalidade=req.formalidade,
            descricao_usuario=req.descricao_usuario or ""
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))