import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import List, Optional, Dict, Any
import joblib

app = FastAPI()

# Load Advanced Supervised Model
custom_classifier = None
try:
    custom_classifier = joblib.load("advanced_model.pkl")
    print("Advanced Local ML Model bound to memory!")
except Exception as e:
    print(f"Warning: Supervised model not loaded. Falling back to VADER heuristics. Error: {e}")

# Load models safely
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: spacy model 'en_core_web_sm' not found. Download it via: python -m spacy download en_core_web_sm")
    # Gracefully continue to let uvicorn boot, but requests will fail if not downloaded
    pass

analyzer = SentimentIntensityAnalyzer()

class ReviewRequest(BaseModel):
    text: str

def score_to_sentiment(compound: float) -> str:
    if compound >= 0.05: return "positive"
    elif compound <= -0.05: return "negative"
    else: return "neutral"

def normalize_feature(token_text: str) -> str:
    return token_text.lower().replace(" ", "_")

def extract_features(doc) -> List[Dict[str, Any]]:
    features = []
    
    # Simple aspect extraction rules using dependency parsing
    for token in doc:
        # If the token is a NOUN that acts as an nsubj (nominal subject) or pobj (object)
        if token.pos_ in ["NOUN", "PROPN"] and token.dep_ in ["nsubj", "pobj", "dobj"]:
            aspect = token.lemma_

            # Find connected adjectives (amod - adjectival modifier, acomp - adjectival complement)
            adjective_tokens = [child for child in token.head.children if child.pos_ == "ADJ" or child.dep_ == "acomp"]
            if token.pos_ == "NOUN" and token.dep_ == "nsubj":
                # if the head is a verb or aux that links to an adjective (e.g. "camera is amazing")
                if token.head.pos_ in ["AUX", "VERB"]:
                    for child in token.head.children:
                        if child.pos_ == "ADJ" or child.dep_ == "acomp":
                            adjective_tokens.append(child)
                            
            if adjective_tokens:
                # Group them up
                descriptor = " ".join([adj.text for adj in adjective_tokens])
                quote = f"{token.text} {token.head.text} {descriptor}".strip()
                
                # Analyze sentiment of the extracted context slice
                vs = analyzer.polarity_scores(quote)
                
                features.append({
                    "feature": normalize_feature(aspect),
                    "sentiment": score_to_sentiment(vs["compound"]),
                    "confidence": round(abs(vs["compound"]), 2) if abs(vs["compound"]) > 0 else 0.5,
                    "quote": quote
                })
                
    # Deduplicate extracted features slightly
    unique_features = {f["feature"]: f for f in features}
    return list(unique_features.values())

@app.post("/extract")
async def extract_nlp(payload: ReviewRequest):
    text = payload.text
    if not text:
        raise HTTPException(status_code=400, detail="Empty text provided")
        
    doc = nlp(text)
    
    # ML Prediction Override block
    ml_override = False
    if custom_classifier is not None:
        try:
            # Vectorize and Predict using .pkl model
            ml_pred = custom_classifier.predict([text])[0]
            ml_probas = custom_classifier.predict_proba([text])[0]
            ml_conf = max(ml_probas)
            
            # If the trained model is confident enough, override heuristic VADER completely
            if ml_conf > 0.55:
                overall_sentiment = ml_pred
                overall_confidence = round(ml_conf, 2)
                ml_override = True
        except Exception as e:
            pass
            
    if not ml_override:
        # Fallback to 1. Overall sentiment analysis across entire text using VADER Heuristics
        vs_overall = analyzer.polarity_scores(text)
        overall_sentiment = score_to_sentiment(vs_overall["compound"])
        overall_confidence = round((abs(vs_overall["compound"]) * 0.5) + (vs_overall["neu"] * 0.5), 2)
    
    # 2. Extract specific features (Dependency Parsing)
    extracted_features = extract_features(doc)
    
    # 3. Anomaly Heuristics
    sarcasm = False
    sarcasm_reason = None
    ambiguity = False
    ambiguity_reason = None
    
    # Sentence-level variance for Sarcasm check (e.g. one wildly positive + one wildly negative)
    sentences = list(doc.sents)
    if len(sentences) > 1:
        scores = [analyzer.polarity_scores(s.text)["compound"] for s in sentences]
        max_score = max(scores)
        min_score = min(scores)
        if max_score > 0.5 and min_score < -0.5:
            sarcasm = True
            sarcasm_reason = "High emotional polarity variance detected across sentences"
            
    # Ambiguity check
    if not ml_override and vs_overall["neu"] > 0.8:
        ambiguity = True
        ambiguity_reason = "Highly neutral syntax with conflicting passive descriptors"
        
        
    return {
        "overall_sentiment": overall_sentiment,
        "overall_confidence": overall_confidence if overall_confidence > 0 else 0.5,
        "is_sarcastic": sarcasm,
        "is_ambiguous": ambiguity,
        "language_detected": "en", # VADER/SpaCy model defaults
        "translated_text": None,
        "features": extracted_features,
        "sarcasm_reason": sarcasm_reason,
        "ambiguity_reason": ambiguity_reason
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
