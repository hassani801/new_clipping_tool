import os
import sys

# Make the engine root importable so tests can import pipeline modules directly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
