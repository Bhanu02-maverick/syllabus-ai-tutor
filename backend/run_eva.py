"""
run_evaluation.py
-------------------
Produces REAL numbers for Table II by exercising your live backend. Now
that the guardrail commit added `top_similarity` to AskResponse, this
script reads it directly instead of estimating anything client-side.

BEFORE RUNNING
--------------
1. Pull the latest main.py (with the guardrail commit) and restart uvicorn.
2. Upload at least one PDF as a faculty account.
3. Create a student account enrolled under that faculty.
4. Take a handful of quizzes as the student first, so /faculty/analytics
   has real attempts to report instead of zeros.

USAGE
-----
Edit the CONFIG block, then:  python run_evaluation.py
"""

import requests
import time
import statistics
import csv

API = "http://localhost:8000"

# ---------------- CONFIG: EDIT THESE ----------------
FACULTY_USER = {"name": "sai", "password": "4321"}
STUDENT_USER = {"name": "bhanu", "password": "bhanu123"}

# Questions you KNOW are covered by your indexed PDF content.
# IN_SYLLABUS_QUERIES = [
#     "Explain the working of Round Robin CPU scheduling.",
#     # add 10-20 real questions drawn from your own uploaded PDF
# ]
IN_SYLLABUS_QUERIES = [
    # Unit 2 - NLP
    "What is natural language processing?",
    "Explain the major applications of natural language processing.",
    "What are the different levels of natural language processing?",
    "Explain lexical analysis in NLP.",
    "What is syntactic analysis?",
    "What is semantic analysis?",
    "Explain discourse processing.",
    "What is pragmatics in natural language processing?",
    
    # Unit 4 - Data Mining
    "What is data mining?",
    "Explain the major steps involved in data mining.",
    "What is data preprocessing?",
    "Explain data cleaning.",
    "What is data integration?",
    "What is data transformation?",
    "Explain data reduction.",
    "What is association rule mining?",
    "Explain support and confidence.",
    "What is classification in data mining?",
]

# Questions you KNOW are NOT covered by any indexed material.
# OUT_OF_SYLLABUS_QUERIES = [
#     "What is the capital of France?",
#     "Explain the offside rule in football.",
#     # add 10-20 clearly unrelated questions
# ]
OUT_OF_SYLLABUS_QUERIES = [
    "What is the capital of France?",
    "Explain how photosynthesis works.",
    "How does a diesel engine work?",
    "What are the rules of cricket?",
    "Who invented the telephone?",
    "Explain the water cycle.",
    "What is the speed of light?",
    "How does a refrigerator work?",
    "Explain the structure of the human heart.",
    "What is the tallest mountain in the world?",
    "How does a solar panel generate electricity?",
    "What is the chemical formula of water?",
    "Explain how earthquakes occur.",
    "What is black hole evaporation?",
    "How does an internal combustion engine work?",
]

REFUSAL_PHRASE = "outside the uploaded syllabus boundaries"
# -----------------------------------------------------


def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds)
    r.raise_for_status()
    return r.json()["token"]


def ask(token, query, mode="exam"):
    started = time.time()
    r = requests.post(
        f"{API}/ask",
        json={"query": query, "mode": mode},
        headers={"Authorization": f"Bearer {token}"},
    )
    latency_ms = (time.time() - started) * 1000
    r.raise_for_status()
    return r.json(), latency_ms


def get_analytics(token):
    r = requests.get(f"{API}/faculty/analytics", headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    return r.json()


def main():
    print("Logging in...")
    student_token = login(STUDENT_USER)
    faculty_token = login(FACULTY_USER)

    correct = 0
    total = 0
    latencies = []
    similarities = []
    csv_rows = []

    print(f"\nSending {len(IN_SYLLABUS_QUERIES)} in-syllabus + "
          f"{len(OUT_OF_SYLLABUS_QUERIES)} out-of-syllabus queries...\n")

    for q in IN_SYLLABUS_QUERIES:
        result, latency = ask(student_token, q)
        latencies.append(latency)
        if result.get("top_similarity") is not None:
            similarities.append(result["top_similarity"])
        total += 1
        declined = REFUSAL_PHRASE in result["answer"]
        if not declined:
            correct += 1
        else:
            print(f"  [MISCLASSIFIED as out-of-syllabus, score={result.get('top_similarity')}] {q}")
        for c in result.get("citations", []):
            csv_rows.append([q, c["source"], c["page"], c["unit"], result.get("top_similarity"), ""])

    for q in OUT_OF_SYLLABUS_QUERIES:
        result, latency = ask(student_token, q)
        latencies.append(latency)
        if result.get("top_similarity") is not None:
            similarities.append(result["top_similarity"])
        total += 1
        declined = REFUSAL_PHRASE in result["answer"]
        if declined:
            correct += 1
        else:
            print(f"  [MISCLASSIFIED as in-syllabus, score={result.get('top_similarity')}] {q}")

    guardrail_accuracy = round(100 * correct / total, 1) if total else 0.0
    avg_latency = round(statistics.mean(latencies), 1) if latencies else 0.0
    ordered = sorted(latencies)
    p95_latency = round(ordered[min(len(ordered) - 1, int(0.95 * len(ordered)))], 1) if ordered else 0.0
    avg_similarity = round(statistics.mean(similarities), 4) if similarities else None

    print(f"\nGuardrail classification accuracy: {guardrail_accuracy}% ({correct}/{total})")
    print(f"Average top-match similarity: {avg_similarity}")
    print(f"Average latency: {avg_latency} ms   P95 latency: {p95_latency} ms")

    print("\nFetching /faculty/analytics for quiz accuracy...")
    analytics = get_analytics(faculty_token)
    overall_correct_pct = round(statistics.mean(u["average_score_percent"] for u in analytics), 1) if analytics else None
    print(f"Per-unit analytics: {analytics}")
    print(f"Mean quiz accuracy across units: {overall_correct_pct}")

    print("\nExporting citations for manual relevance labeling -> relevance_labeling.csv")
    with open("relevance_labeling.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["query", "cited_source_file", "cited_page", "unit", "top_similarity", "relevant_1_or_0"])
        writer.writerows(csv_rows)
    print("Open the cited page in the source PDF for each row and judge relevance (1/0).")

    print("\n" + "=" * 60)
    print("PASTE THIS OVER TABLE II IN main.tex:")
    print("=" * 60)
    print(r"""
\begin{table}[htbp]
\caption{Measured Evaluation Results}
\label{tab:results}
\centering
\begin{tabular}{p{4.8cm}p{2.4cm}}
\toprule
\textbf{Metric} & \textbf{Value} \\
\midrule
Guardrail classification accuracy & """ + f"{guardrail_accuracy}" + r""" \% \\
Retrieval relevance (citations judged relevant) & [[fill from relevance_labeling.csv]] \% \\
Quiz validity (unambiguous, supported questions) & [[fill after manual review]] \% \\
Average top-match similarity & """ + f"{avg_similarity}" + r""" \\
Average response latency & """ + f"{avg_latency}" + r""" ms \\
95th-percentile response latency & """ + f"{p95_latency}" + r""" ms \\
Overall quiz accuracy (from faculty analytics) & """ + f"{overall_correct_pct}" + r""" \% \\
\bottomrule
\end{tabular}
\end{table}
""")


if __name__ == "__main__":
    main()
