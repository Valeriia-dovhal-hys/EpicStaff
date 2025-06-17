import csv
import json
import pdfplumber
from docx import Document
from io import TextIOWrapper
from bs4 import BeautifulSoup


def extract_text_from_file(uploaded_file, file_type):
    """
    Universal dispatcher to extract text from different file types.
    Supports: txt, pdf, csv, json, docx, html, md.
    """
    file_type = file_type.lower()

    if file_type == "txt":
        return extract_text_from_txt(uploaded_file)

    elif file_type == "pdf":
        return extract_text_from_pdf(uploaded_file)

    elif file_type == "csv":
        return extract_text_from_csv(uploaded_file)

    elif file_type == "json":
        return extract_text_from_json(uploaded_file)

    elif file_type == "docx":
        return extract_text_from_docx(uploaded_file)

    elif file_type == "html":
        return extract_text_from_html(uploaded_file)

    elif file_type == "md":
        return extract_text_from_md(uploaded_file)

    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def extract_text_from_txt(uploaded_file):
    return uploaded_file.read().decode("utf-8")


def extract_text_from_pdf(uploaded_file):
    text = []
    with pdfplumber.open(uploaded_file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text.append(page_text.strip())
        return "\n".join(text)


def extract_text_from_csv(uploaded_file):
    wrapper = TextIOWrapper(uploaded_file, encoding="utf-8")
    delimeter = ","
    reader = csv.reader(wrapper, delimiter=delimeter)

    extracted_rows = []
    for row in reader:
        if len(row[0].replace(delimeter, "")) != 0:
            extracted_rows.append(",".join(row))

    extracted_text = "\n".join(extracted_rows)
    return extracted_text


def extract_text_from_json(uploaded_file) -> str:
    data = json.load(uploaded_file)
    return json.dumps(data, indent=4, ensure_ascii=False)


def extract_text_from_docx(uploaded_file):
    document = Document(uploaded_file)
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs)


def extract_text_from_html(uploaded_file) -> str:
    html_content = uploaded_file.read().decode("utf-8")

    soup = BeautifulSoup(html_content, "html.parser")

    # Remove all <img> tags
    for img in soup.find_all("img"):
        img.decompose()

    for tag in soup(["script", "style"]):
        tag.decompose()
    return str(soup)


def extract_text_from_md(uploaded_file) -> str:
    return uploaded_file.read().decode("utf-8")
