import cv2

print("🔥 RUNNING FILE NOW")
print("🚀 Script started")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Camera not opening")
    exit()
else:
    print("✅ Camera opened successfully")

# Create a resizable window (IMPORTANT)
cv2.namedWindow("Webcam", cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Frame not received")
        break

    cv2.imshow("Webcam", frame)

    # Better key handling
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q") or key == 27:  # 'q' or ESC
        print("🛑 Closing webcam...")
        break

# Proper cleanup (VERY IMPORTANT)
cap.release()
cv2.destroyAllWindows()
cv2.waitKey(1)
