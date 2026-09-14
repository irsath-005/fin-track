import os
import sys

# Ensure backend folder is in Python path for Vercel Serverless Function import
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
