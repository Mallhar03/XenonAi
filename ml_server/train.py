import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import os

def train_model():
    print("Loading synthetic training memory...")
    try:
        with open("training_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("training_data.json not found! Cannot train model.")
        return

    X = [item["text"] for item in data]
    y = [item["sentiment"] for item in data]

    print(f"Loaded {len(X)} records. Initializing Scikit-Learn SVM Pipeline...")

    # We build a Pipeline so the mathematical feature extraction + logic network are bundled into one .pkl file
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=2000, max_df=0.9, min_df=1, ngram_range=(1, 2))),
        ('classifier', LogisticRegression(C=1.0, max_iter=200, random_state=42))
    ])

    print("Executing Neural Fit...")
    pipeline.fit(X, y)

    # Validate prediction internally
    score = pipeline.score(X, y)
    print(f"Training completed successfully! Internal confidence mapping accuracy: {score * 100:.2f}%")

    print("Compiling network bindings into static .pkl payload...")
    joblib.dump(pipeline, "advanced_model.pkl")
    print("Successfully exported 'advanced_model.pkl' to runtime!")

if __name__ == "__main__":
    train_model()
