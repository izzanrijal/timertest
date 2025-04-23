import json
from fpdf import FPDF

# Load JSON
with open("pretestcoass.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract only questions
questions = []
for item in data:
    if item.get("type") == "table" and item.get("name") == "q":
        questions = item["data"]
        break

# Create PDF
pdf = FPDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()
pdf.set_font("Arial", size=12)

for q in questions:
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(200, 10, f"Question No. {q['question_number']}", ln=True)

    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, f"Skenario: {q['scenario']}")
    pdf.multi_cell(0, 10, f"Pertanyaan: {q['question']}")
    pdf.cell(0, 10, f"A. {q['option_a']}", ln=True)
    pdf.cell(0, 10, f"B. {q['option_b']}", ln=True)
    pdf.cell(0, 10, f"C. {q['option_c']}", ln=True)
    pdf.cell(0, 10, f"D. {q['option_d']}", ln=True)
    pdf.cell(0, 10, f"E. {q['option_e']}", ln=True)
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, f"Jawaban benar: {q['correct_answer']}", ln=True)
    pdf.ln(5)

# Save PDF
pdf.output("pretestcoass_output.pdf")
