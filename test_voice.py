import pyttsx3

print("Starting voice test...")

engine = pyttsx3.init()
engine.setProperty("rate", 150)
engine.setProperty("volume", 1.0)

print("Speaking now...")

engine.say("Testing voice output")
engine.runAndWait()

print("Done")
