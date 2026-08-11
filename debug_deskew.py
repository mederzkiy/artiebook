import cv2
import numpy as np
from backend.processing import deskew

img = cv2.imread('scratch/pipeline_test/0_orig.png')
print("Orig shape:", img.shape)
print("Orig unique colors:", len(np.unique(img.reshape(-1, 3), axis=0)))

# Let's run detect_paper_and_warp with prints
h, w = img.shape[:2]
max_width = 1000.0
scale_factor = max_width / w if w > max_width else 1.0

if w > max_width:
    resized = cv2.resize(img, (int(max_width), int(h * scale_factor)))
else:
    resized = img.copy()

paper_pts = deskew._find_paper_contour(resized, scale_factor)
print("paper_pts:", paper_pts)

if paper_pts is not None:
    pts = paper_pts / scale_factor
    rect = deskew.order_points(pts)
    print("rect:", rect)
    
    (tl, tr, br, bl) = rect
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    print("maxWidth:", maxWidth, "maxHeight:", maxHeight)
    
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")
    
    M = cv2.getPerspectiveTransform(rect, dst)
    print("M:", M)
    
    warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
    print("Warped shape:", warped.shape)
    print("Warped unique colors:", len(np.unique(warped.reshape(-1, 3), axis=0)))
