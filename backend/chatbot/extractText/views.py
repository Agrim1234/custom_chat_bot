from django.shortcuts import render
from flask import Flask, request, jsonify
from openai import OpenAI
from cassandra.cluster import Cluster
from django.http import HttpResponse
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
import pdfplumber
import uuid
import os

app = Flask(__name__)

cluster = Cluster(['172.19.0.2'])
session = cluster.connect('pdf_chat')
pdf_path = 'pdfdata.pdf'
pdf_id = uuid.uuid4()

@csrf_exempt
def extractText(request):

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            paragraphs = text.split('\n')

            for para_num, paragraph in enumerate(paragraphs):
                session.execute(
                    """
                    INSERT INTO pdf_data (id, pdf_id, page_number, paragraph_number, text_content)
                    VALUES (uuid(), %s, %s, %s, %s)
                    """,
                    (pdf_id, page_num, para_num, paragraph)
                )

    print(request)
    data = json.loads(request.body)
    print(data)
    question = data['question']
    
    rows = session.execute('SELECT text_content FROM pdf_data')
    retrieved_text = " ".join([row.text_content for row in rows])

    client = Groq(
        api_key=os.environ.get("GROQ_API_KEY"),
    )

    response = client.chat.completions.create(
        temperature = 0,
        max_tokens = 150,
        n = 1,
        messages=[
            {
                "role": "system", 
                "content": f"Context: {retrieved_text}"  
            },
            {
                "role": "user",
                "content": f"Question: {question}\nAnswer:",
            }
        ],
        model="llama3-8b-8192",
    )

    print(response)
    answer = response.choices[0].message.content.strip()
    print(answer)

    return JsonResponse({
        'answer': answer
    })

def home(request):
    return HttpResponse("<h1>Hello, world. You're at the extractText index.</h1>")

def contact(request):
    return render(request, 'contact.html')